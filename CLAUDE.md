# CLAUDE.md

Owen Hindley's portfolio website, built with [Eleventy](https://www.11ty.dev/) and hosted on GitHub Pages.

## Structure

- `site-source/` — Eleventy input. Articles for individual projects live here (`articles/`, plus `blogposts/`, `performances/`, `talks/`, `archive/`), with layouts in `_includes/` and assets in `static/`.
- `scss/` — Sass source, compiled to `docs/css/main.css`.
- `docs/` — compiled output, served by GitHub Pages. Don't edit it by hand.
- `.eleventy.js` — Eleventy configuration (Eleventy 1.x only loads this name, not `eleventy.config.js`). Defines the `awards` collection behind the About page's Awards & Nominations list, gathered from every article's `awards` front matter.

## Archive (full project & gig list)

Each file in `site-source/archive/` is one row of the "Full Project & Gig List" Google Sheet, shown as a table in the Archive section of `index.html`. Front matter fields: `when` (display date), `title`, `artist`, `event`, `role`, `notes`, `category` (Exhibition, Live Performance, Lecture, Teaching, Installation or Project), `link` and `sortKey`.

- `link` is the URL of the full write-up (e.g. `/fallax/`), or `""` for a plain, non-clickable row.
- Rows without their own page set `permalink: false`. The older archive pages (Beatles, Hitachi, etc.) keep their article text and link to themselves.
- The table sorts by `sortKey` descending: `"YYYY-MM-DD"`, optionally with a `-NNN` suffix to order rows that share a date.
- To add new rows from the sheet: download it as CSV into `archive-list/` and run `node scripts/import-archive.js` (`--dry-run` to preview). It matches existing entries on date + title + festival / event (older pages match on `sheetTitle`), creates files for new rows and deletes entries no longer in the sheet. It never edits existing entries, never deletes pages with their own article text (it lists them instead), and won't delete more than 10 entries in one run without `--force`. New rows get a `link` when their title matches an existing archive entry or article.

### Keeping the sheet and the archive in step

The sheet is the source of truth, so **an archive file added or edited by hand must also go into the sheet**, or the next import deletes it (or re-creates the old version). The match key is the sheet's *displayed* Date text + Show Title + Festival / Event, so `when`, `title` and `event` must match the sheet exactly.

- Sheet: "Owen Full Project & Gig List", https://docs.google.com/spreadsheets/d/1SppFSEXBxUx8odS3aHorjMaNMsTAoBmdSGhm0eTxSXo/edit (private; edit it through the Google Sheets connector). Tab `Sheet1` (sheetId 0), header in row 2, data from row 3 in columns B–H: Date, Show Title, Artist, Festival / Event, Role, Notes, Category. Column A is blank.
- Dates are real date values: a known month is shown with format `mmmm yyyy` (e.g. "October 2025"); a year-only row is 1 January with format `yyyy`. Each Category cell has its own dropdown.
- To add rows: insert blank rows below row 3 with `inheritFromBefore: true` (copies formatting and the dropdown), write the values (dates as `YYYY-MM-DD` strings), set the `yyyy` format on year-only rows, then sort B3:H by column B descending.
- To check: read the sheet's displayed values, write them out as a CSV, and run `node scripts/import-archive.js <that.csv> --dry-run`. In sync means "N already in the archive, 0 would be created" and nothing listed for deletion.
- `claude-session-notes.md` has the history of how the sheet was first built (CV, invoices, categories).

## Huldufugl

Owen co-runs Huldufugl (site source in `C:\PROJECTS-SSD\huldufugl-site-2023`, with its own CLAUDE.md). For shared projects (Fallax, Kassinn, Parallel People, The Hidden People) **the Huldufugl site is the source of truth** for credits, screenings/performances, awards and press. Every Huldufugl talk should also be in this site's archive (artist "Huldufugl", category Lecture) and in `site-source/talks/`.

## Project pages (articles)

Layout (`_includes/article.njk`, styles in `scss/single-article.scss`): an opening full-width image or video, then `<div class="with-sidebar">` holding `<div class="main-column">` (text and images, 2/3 width, itself two columns) and `<div class="side-column">` with `{% include "project-lists.liquid" %}` (1/3 width). Pages are centred at 84vw (90vw on mobile).

- The first section is `class="full-width"` and sits above `with-sidebar` when it holds an image or video. A YouTube embed there keeps its fixed 610px height; YouTube embeds inside the columns are 16:9.
- The side column (`_includes/project-lists.liquid`, styles in `scss/archive-list.scss`) shows a **Credits** list with a fixed heading, then a tabbed list of **Screenings/Performances/Exhibitions**, **Awards** and **Press**. Empty groups are left out. Front matter:
  - `credits:` list of `{ role, name, url }` (url optional)
  - `awards:` list of `{ when, title, event, url }`. Titles start "Winner, …", "Nominated, …" or "Finalist, …"
  - `press:` list of `{ when, title, outlet, url }`
  - `screeningsLabel:` turns on the archive-driven tab and names it (Fallax "Screenings"; Kassinn, Parallel People, The Hidden People, MOTET "Performances"; Horizons VR, The Surveyor "Exhibitions"). It lists the archive entries whose `link` is this page, excluding Lecture, Teaching and Project rows. Pages without it get no such tab, even if archive entries link to them.
- Keep credits, awards and press in front matter, not as lists in the page text. Links that aren't press (project homepage, GitHub, Huldufugl project page) stay in the text.
- `filter` (space-separated `xr`, `stage`, `screens`, `spaces`) drives the nav's "For XR / Stage / Screens / Spaces" subfilters.
- The About page (`site-source/static/about.html`) has the bio in 2/3 and a tabbed Awards / Nominations list in 1/3, built from every article's `awards` (the `awards` collection in `.eleventy.js`). An award goes under Nominations when its title mentions "Nominated" or "Nomination". Don't hand-edit awards there.

## Landing page and nav

- Desktop nav is a centred horizontal bar fixed to the top (`scss/nav-layout.scss`); mobile keeps the hamburger menu. "All" and "Talks & Education" are commented out in `index.html` (temporarily hidden).
- Project tiles form a regular 2-column grid with 16:9 thumbnails (`scss/article.scss`). Featured projects are ordered by each article's `endDate` (hand-set numbers, decimals used as tie-breakers), highest first; `featured: true` puts a project in Featured.
- Tile titles and the nav are scaled by `$landing-scale` (0.75) in `scss/typography.scss`.

## Colours

All colours are variables in `scss/colours.scss`. Each text colour is chosen for a **contrast ratio against `$backgroundColor`** (noted beside it: body 7:1, taglines 9:1, links 8.6:1, footer 4.7:1, etc.); if the background changes, recalculate the text colours to keep those ratios rather than eyeballing them.

- The site currently uses the **light scheme** (`#f5f5f5` background). The dark scheme it replaced (`#0a0a0a`) is kept as a commented block; swapping the two blocks switches back.
- `$inkColor` (black on light, white on dark) is used at low opacity for lines, borders and tints, so they follow the scheme. Highlight blocks (`.inverted`) swap the text and background colours, so they follow too.
- `$invertLogos` flips white supporter logos (Fallax's logo strip) to black with `filter: invert(1) hue-rotate(180deg)` on the light scheme.

## Tools

- Git isn't on the shell's PATH. Use the copy bundled with Fork: `C:\Users\owenh\AppData\Local\Fork\gitInstance\2.50.1\cmd\git.exe`.
- `design/fonts/` (117 MB of font downloads) is deliberately not committed.
- To screenshot a page: build, serve `docs/` (`python -m http.server --directory docs`), then headless Edge (`msedge --headless=new --screenshot=... --window-size=1400,1200 <url>`). The About and Contact sections only show after a nav click, so screenshot a temporary copy of `docs/index.html` with `<main class="about">` instead.

## Build

The site is compiled with the two commands in `commands.txt`:

```
npx @11ty/eleventy --serve --input=site-source/ --output=docs/
sass -w scss/main.scss docs/css/main.css
```

The first builds and serves the site with Eleventy. The second compiles and watches the Sass (node-sass). Alternative Sass syntax: `sass --watch scss/main.scss:docs/css/main.css`.

One-off builds without watching: `npx @11ty/eleventy --input=site-source/ --output=docs/` and `npx sass --no-source-map scss/main.scss docs/css/main.css`. Dart Sass prints `@import`/`darken()` deprecation warnings; they're harmless (add `--quiet` to hide them).
