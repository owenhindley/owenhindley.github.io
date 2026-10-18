# CLAUDE.md

Owen Hindley's portfolio website, built with [Eleventy](https://www.11ty.dev/) and hosted on GitHub Pages.

## Structure

- `site-source/` — Eleventy input. Articles for individual projects live here (`articles/`, plus `blogposts/`, `performances/`, `talks/`, `archive/`), with layouts in `_includes/` and assets in `static/`.
- `scss/` — Sass source, compiled to `docs/css/main.css`.
- `docs/` — compiled output, served by GitHub Pages. Don't edit it by hand.
- `eleventy.config.js` — Eleventy configuration.

## Archive (full project & gig list)

Each file in `site-source/archive/` is one row of the "Full Project & Gig List" Google Sheet, shown as a table in the Archive section of `index.html`. Front matter fields: `when` (display date), `title`, `artist`, `event`, `role`, `notes`, `category` (Exhibition, Live Performance, Lecture, Teaching, Installation or Project), `link` and `sortKey`.

- `link` is the URL of the full write-up (e.g. `/fallax/`), or `""` for a plain, non-clickable row.
- Rows without their own page set `permalink: false`. The older archive pages (Beatles, Hitachi, etc.) keep their article text and link to themselves.
- The table sorts by `sortKey` descending: `"YYYY-MM-DD"`, optionally with a `-NNN` suffix to order rows that share a date.
- To add new rows from the sheet: download it as CSV into `archive-list/` and run `node scripts/import-archive.js` (`--dry-run` to preview). It matches existing entries on date + title + festival / event (older pages match on `sheetTitle`), creates files for new rows and deletes entries no longer in the sheet. It never edits existing entries, never deletes pages with their own article text (it lists them instead), and won't delete more than 10 entries in one run without `--force`. New rows get a `link` when their title matches an existing archive entry or article.

## Build

The site is compiled with the two commands in `commands.txt`:

```
npx @11ty/eleventy --serve --input=site-source/ --output=docs/
sass -w scss/main.scss docs/css/main.css
```

The first builds and serves the site with Eleventy. The second compiles and watches the Sass (node-sass). Alternative Sass syntax: `sass --watch scss/main.scss:docs/css/main.css`.
