// Adds rows from the "Full Project & Gig List" sheet (downloaded as CSV) to site-source/archive.
//
//   node scripts/import-archive.js [path/to/sheet.csv] [--dry-run] [--force]
//
// With no path, the most recently modified .csv in archive-list/ is used.
// A row already exists when an archive entry has the same date, title and festival / event
// (older pages that keep their own title match on `sheetTitle`). Existing entries are never
// changed. Entries no longer in the sheet are deleted, except:
//   - pages with their own article text, which are listed for you to remove by hand
//   - more than MAX_DELETIONS at once, which needs --force (guards against a wrong or partial CSV)

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ARCHIVE_DIR = path.join(ROOT, "site-source", "archive");
const ARTICLES_DIR = path.join(ROOT, "site-source", "articles");
const CSV_DIR = path.join(ROOT, "archive-list");

const MAX_DELETIONS = 10;
const CATEGORIES = ["Exhibition", "Live Performance", "Lecture", "Teaching", "Installation", "Project"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july",
	"august", "september", "october", "november", "december"];

// RFC 4180: quoted fields may contain commas, newlines and doubled quotes
function parseCsv(text) {
	const rows = [];
	let row = [], field = "", quoted = false;
	text = text.replace(/^﻿/, "");
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
			else if (c === '"') quoted = false;
			else field += c;
		} else if (c === '"') quoted = true;
		else if (c === ",") { row.push(field); field = ""; }
		else if (c === "\n" || c === "\r") {
			if (c === "\r" && text[i + 1] === "\n") i++;
			row.push(field); rows.push(row); row = []; field = "";
		} else field += c;
	}
	if (field !== "" || row.length) { row.push(field); rows.push(row); }
	return rows;
}

// true when the file has content after its front matter, i.e. a written article page
function hasBody(file) {
	return fs.readFileSync(file, "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---/, "").trim() !== "";
}

// front matter values are either JSON-quoted strings or plain YAML scalars
function readFrontMatter(file) {
	const match = fs.readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const data = {};
	if (!match) return data;
	for (const line of match[1].split(/\r?\n/)) {
		const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
		if (!m) continue;
		let value = m[2].trim();
		if (value.startsWith('"')) {
			try { value = JSON.parse(value); } catch (e) { /* keep raw */ }
		}
		data[m[1]] = value;
	}
	return data;
}

const normalise = (s) => String(s || "").normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
const keyOf = (when, title, event) => [when, title, event].map(normalise).join("|");

function slugify(text) {
	const translit = { "þ": "th", "Þ": "th", "ð": "d", "Ð": "d", "æ": "ae", "Æ": "ae", "ø": "o", "Ø": "o", "&": " and " };
	return text.replace(/[þÞðÐæÆøØ&]/g, (c) => translit[c])
		.normalize("NFKD").replace(/[^\x00-\x7F]/g, "")
		.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// "4 June 2025", "June 2025" or "2025" -> "2025-06-04", "2025-06-01", "2025-01-01"
function isoDate(when) {
	const pad = (n) => String(n).padStart(2, "0");
	let m = when.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
	if (m && MONTHS.includes(m[2].toLowerCase())) return `${m[3]}-${pad(MONTHS.indexOf(m[2].toLowerCase()) + 1)}-${pad(m[1])}`;
	m = when.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
	if (m && MONTHS.includes(m[1].toLowerCase())) return `${m[2]}-${pad(MONTHS.indexOf(m[1].toLowerCase()) + 1)}-01`;
	m = when.match(/\b(\d{4})\b/);
	return m ? `${m[1]}-01-01` : null;
}

function findCsv(arg) {
	if (arg) return path.resolve(arg);
	const csvs = fs.existsSync(CSV_DIR)
		? fs.readdirSync(CSV_DIR).filter((f) => f.toLowerCase().endsWith(".csv"))
			.map((f) => path.join(CSV_DIR, f))
			.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
		: [];
	if (!csvs.length) throw new Error(`No .csv file found in ${CSV_DIR}`);
	return csvs[0];
}

function readSheet(file) {
	const rows = parseCsv(fs.readFileSync(file, "utf8"));
	const headerIndex = rows.findIndex((r) => r.some((c) => normalise(c) === "show title"));
	if (headerIndex < 0) throw new Error(`No "Show Title" header row in ${file}`);
	const header = rows[headerIndex].map(normalise);
	const col = (name) => {
		const i = header.indexOf(name);
		if (i < 0) throw new Error(`Missing "${name}" column in ${file}`);
		return i;
	};
	const cols = {
		when: col("date"), title: col("show title"), artist: col("artist"), event: col("festival / event"),
		role: col("role"), notes: col("notes"), category: col("category"),
	};
	return rows.slice(headerIndex + 1)
		.map((r) => Object.fromEntries(Object.entries(cols).map(([k, i]) => [k, (r[i] || "").trim().replace(/\s+/g, " ")])))
		.filter((r) => r.title);
}

function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const force = args.includes("--force");
	const csvFile = findCsv(args.find((a) => !a.startsWith("--")));
	const sheet = readSheet(csvFile);
	if (!sheet.length) throw new Error(`No rows found in ${csvFile}; nothing changed`);

	// existing archive entries, counted per key so repeated rows are matched one-for-one
	const existing = new Map();
	const linksByTitle = new Map();
	const archiveFiles = fs.readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith(".html"));
	for (const f of archiveFiles) {
		const d = readFrontMatter(path.join(ARCHIVE_DIR, f));
		const title = d.sheetTitle || d.title;
		const key = keyOf(d.when, title, d.event);
		if (!existing.has(key)) existing.set(key, []);
		existing.get(key).push(f);
		if (d.link) linksByTitle.set(normalise(title), d.link);
	}

	// full write-ups, so new rows for a known project link through
	const articlesByTitle = new Map();
	for (const f of fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".html"))) {
		const d = readFrontMatter(path.join(ARTICLES_DIR, f));
		if (d.title) articlesByTitle.set(normalise(d.title), `/${path.basename(f, ".html")}/`);
	}

	const taken = new Set(archiveFiles.map((f) => path.basename(f, ".html")));
	const unmatched = new Map([...existing].map(([k, files]) => [k, [...files]]));
	const created = [];

	sheet.forEach((row, index) => {
		const key = keyOf(row.when, row.title, row.event);
		if (unmatched.get(key)?.length) { unmatched.get(key).shift(); return; }

		const iso = isoDate(row.when);
		if (!iso) { console.warn(`! Skipped "${row.title}": can't read the date "${row.when}"`); return; }
		if (row.category && !CATEGORIES.includes(row.category)) console.warn(`! "${row.title}": unknown category "${row.category}"`);

		const link = linksByTitle.get(normalise(row.title)) || articlesByTitle.get(normalise(row.title)) || "";
		const base = `${iso.slice(0, 4)}-${slugify(row.title)}`;
		let slug = base;
		if (taken.has(slug)) slug = `${base}-${slugify(row.event).slice(0, 40).replace(/-+$/, "")}`;
		for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
		taken.add(slug);

		// descending sort on sortKey keeps the sheet order for rows that share a date
		const fields = { ...row, link, sortKey: `${iso}-${String(999 - index).padStart(3, "0")}` };
		const lines = ["tags: archive", `id: ${slug}`,
			...["when", "title", "artist", "event", "role", "notes", "category", "link", "sortKey"]
				.map((k) => `${k}: ${JSON.stringify(fields[k])}`),
			"class: archive", "permalink: false"];
		if (!dryRun) fs.writeFileSync(path.join(ARCHIVE_DIR, `${slug}.html`), `---\n${lines.join("\n")}\n---\n`, "utf8");
		created.push(`${slug}.html${link ? `  -> ${link}` : ""}`);
	});

	console.log(`Read ${sheet.length} rows from ${path.relative(ROOT, csvFile)}`);
	console.log(`${sheet.length - created.length} already in the archive, ${created.length} ${dryRun ? "would be created" : "created"}:`);
	created.forEach((c) => console.log(`  + ${c}`));

	const notInSheet = [...unmatched.values()].flat();
	const pages = notInSheet.filter((f) => hasBody(path.join(ARCHIVE_DIR, f)));
	const toDelete = notInSheet.filter((f) => !pages.includes(f));

	if (toDelete.length > MAX_DELETIONS && !force && !dryRun) {
		console.log(`${toDelete.length} archive entries are not in the sheet. That's more than ${MAX_DELETIONS}, so none were deleted;`);
		console.log(`check the CSV is complete, then re-run with --force to delete them:`);
		toDelete.forEach((f) => console.log(`  ? ${f}`));
	} else if (toDelete.length) {
		console.log(`${toDelete.length} not in the sheet, ${dryRun ? "would be deleted" : "deleted"}:`);
		toDelete.forEach((f) => {
			if (!dryRun) fs.unlinkSync(path.join(ARCHIVE_DIR, f));
			console.log(`  - ${f}`);
		});
	}
	if (pages.length) {
		console.log(`${pages.length} not in the sheet but have their own article text, so were kept (delete by hand if intended):`);
		pages.forEach((f) => console.log(`  ? ${f}`));
	}
}

main();
