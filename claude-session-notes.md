# Session notes: Full Project & Gig List + Archive (18 Oct 2026)

Context for resuming work with Claude. Project basics (structure, build commands, archive format) are in `CLAUDE.md`.

## The Google Sheet

- "Owen Full Project & Gig List": https://docs.google.com/spreadsheets/d/1SppFSEXBxUx8odS3aHorjMaNMsTAoBmdSGhm0eTxSXo/edit
- Private. Claude reads and writes it through the Google Sheets connector (claude.ai Settings → Connectors). A connector added mid-session only appears after restarting the session.
- Layout: `Sheet1`, header in row 2, data from row 3, columns B–H: Date, Show Title, Artist, Festival / Event, Role, Notes, Category. Column A is blank.
- Dates are real date values. Rows with a known month use format `mmmm yyyy`; year-only rows are stored as 1 January with format `yyyy`. The list is sorted newest first; re-sort B3:H by column B descending after adding rows.
- Category (column H) has a dropdown: Exhibition, Live Performance, Lecture, Teaching, Installation, Project.

## How the list was built

1. **Website** (owenhindley.co.uk): every article, plus the archive pages. Separate rows for each festival or showing (Fallax festivals, MOTET shows, Kassinn performances, and so on).
2. **CV** (a Google Doc): added extra showings (Horizons VR, The Moon Seat), months, roles and awards. Grants, employment and education were not added. The CV doc is publicly readable and contains a personal ID number and address; Owen may want to restrict its sharing.
3. **Talks & education**: every talk, lecture, workshop and course Owen led, combined from the site and the CV. The University of Surrey degree was not added.
4. **Invoices** (`invoices-for-processing/invoices`, PSUR-1001 to 1066, Aug 2024 to Oct 2026): gigs added where Owen confirmed the details. Left out: office rent, expenses, credit notes, and the invoices Owen said to ignore (1008 Tjarnarbíó March 2025, Grasrótin, the marvaða projection installation, the Listahátíð installation for Hafnarhaus, Breadcrumbs, Karin Sander, Kuldukast/Rili, Sæskrímslabúrið).
5. **Categories**: Kassinn and Parallel People count as Live Performance (live actor). Festival showings of Horizons and Lambchild count as Exhibition, like Fallax screenings. Courses and workshops are Teaching; one-off talks are Lecture.

## Open items

- **Four rows disappeared from the sheet** around the time the Sæskrímslabúrið row was deleted: Lava Show installation (Oct 2026), Hitavættur maintenance (Sep 2026), STRÓKUR (Nov 2025), Baby Rave / Kærleiks gjörð (Nov 2025). Not confirmed whether Owen removed them on purpose. They are not on the site either.
- **Sheet and archive in sync (20 Oct 2026)**: 202 rows; a dry run of `import-archive.js` against the live sheet creates and deletes nothing. How to keep them in step is in `CLAUDE.md`.
- **Blank cells** that could be filled: artist for Dance World Class, The Hangmen, Rhinestone Cowboy, Nowhere; venue for Miami Towers, ViiV Progress Made Personal and the two consulting jobs.
- **Year to check**: "Industry Expert Introduction" (Hyper Island) is listed under 2020, but the site's file is named `hyper-island-2022.html`.
- **VRTO & VRUK, London** (Horizons VR, 2017) is one row as the CV lists it; VRTO is a Toronto event, so it may need splitting.
- **The 0.5 EP's year** (2024) is inferred from the single Tek Tek Tek.
- **Committed**: the archive work, and the 19–20 Oct redesign (commit `bfa88c9`). Later changes (light colour scheme, nav weight and opacity, Surveyor press and exhibition, Parallel People XR filter, About/Contact heading spacing, Fallax logos) are not committed yet.

## Website changes made

- `site-source/archive/` holds one file per sheet row (177 at the time of writing). 166 were generated; the 11 older archive pages kept their article text and gained the table fields plus `sheetTitle` (the sheet's title, used for matching).
- The Archive section of `index.html` is a table of all entries. Rows with a full write-up link through (100 of them); the rest are plain.
- `scripts/import-archive.js` syncs the archive from a CSV download of the sheet. It adds new rows, deletes removed ones, never deletes pages with article text, and needs `--force` for more than 10 deletions. Usage is in `commands.txt` and `CLAUDE.md`.
- New rows added via the script get a link automatically when the title matches an existing archive entry or article. Otherwise, set `link` in the file by hand.
