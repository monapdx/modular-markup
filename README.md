# Modular Markup

A collection of editable, offline-friendly HTML browser tools designed for experimentation, organization, tracking, and personal workflows.

[![Download](https://img.shields.io/badge/%E2%AC%87%EF%B8%8F%20Download-111111?style=for-the-badge)](https://ashpdx.gumroad.com/l/tmuklu)

These are not static mockups or screenshots.

Each template functions like a lightweight browser app:

- editable directly in the browser
- automatically saves changes locally
- works offline
- no signup required
- export your customized version as a standalone HTML file

Built for indie builders, tinkerers, writers, students, researchers, and non-coders experimenting with AI tools.


---

## Features

### Local-First Persistence

Changes are automatically saved in your browser using LocalStorage.

Close the file and reopen it later — your edits remain intact.
     

### Editable Structure

<img src="https://raw.githubusercontent.com/monapdx/modular-markup/refs/heads/main/assets/gif/add-delete-rows.gif" width="576">

Most templates support:

- editable table cells
- editable headers
- adding rows
- deleting rows
- customizable categories and labels

These templates are designed to be remixed and adapted into your own systems.

### Export Your Customized Version

Every template includes:

- Export This Version
- Restore Default

Export allows you to download your modified version as a standalone HTML file with your edits preserved. Shared template behavior lives in `docs/mm-template-runtime.js` so storage, export/reset, toolbar status, and editable table headers can be reused across templates instead of copied into each file.

### Offline-Friendly

- No backend.
- No accounts.
- No subscriptions.
- No installation required.

Simply open the HTML file in your browser and use it.


---

## Philosophy

This project was built around a simple idea:

> Useful software should allow people to experiment meaningfully before asking for money.

The free version is intentionally functional, portable, and customizable.

- No artificial lockouts.
- No fake “free” tier.
- No forced accounts.

Just editable browser tools you can actually use.

--- 

## Included Files

The download is organized as a **Builder pack** with the **Starter pack included inside it as `STARTER.zip`**. Each pack has its own `index.html` for browsing the included tools.

### Builder Pack — `BUILDER/`

| File / Folder | Description |
|---|---|
| `index.html` | Builder Pack landing page / template index. |
| `calendar.html` | Editable calendar template. |
| `kanban.html` | Kanban project board. |
| `mindmap.html` | Interactive mind map. |
| `newsletter-builder.html` | Newsletter / email layout builder. |
| `offline-GPT.html` | Local viewer for exported ChatGPT conversation data. |
| `worksheet.html` | Editable worksheet / checklist template. |
| `activity-tracker/` | Daily activity and habit tracker with bundled animated icons. |
| `dashboard/` | Customizable dashboard system with optional widgets. |
| `mbox-viewer/` | Multi-file MBOX email viewer (`index.html`, `app.js`, `styles.css`). |
| `sticker-sheet/` | GIF/PNG sticker-sheet generator and demo files. |
| `STARTER.zip` | Complete Starter Pack bundled with the Builder Pack. |
| `neo-brutalist.css` | Shared neo-brutalist stylesheet. |
| `neo-brutal-overrides.css` | Shared style overrides. |
| `build-index.py` | Utility for rebuilding the pack index. |
| `_patch_export_snapshot.py` | Utility used to patch/export self-contained template snapshots. |

#### Builder Dashboard Widgets — `BUILDER/dashboard/widgets/`

The Builder dashboard includes the full widget collection below:

| Widget | File |
|---|---|
| Alt Text Generator | `alt-text-generator.html` |
| Animated Notes | `animated-notes/` |
| Card Sorting | `card-sorting.html` |
| Comic Panels Generator | `comic-panels-generator.html` |
| CSV to SQL | `csv-to-sql.html` |
| Fake Data Generator | `fake-data-generator.html` |
| FAQ Generator | `faq-generator.html` |
| File Naming Generator | `file-naming-generator.html` |
| HTML List Generator | `html-list-generator.html` |
| JSON Schema to TypeScript | `json-schema-to-typescript.html` |
| Masonry Gallery | `masonry-gallery.html` |
| Pixel Art Draw | `pixel-art-draw.html` |
| Progress Bar Generator | `progress-bar-generator.html` |
| Quiz Builder | `quiz-builder.html` |
| Quote Image Generator | `quote-image-generator.html` |
| Regex Explainer | `regex-explainer.html` |
| Rhymes | `rhymes.html` |
| Scratch-It Generator | `scratch-it-generator.html` |
| Swatch | `swatch.html` |
| Table Generator | `table-generator.html` |

The dashboard folder also includes `dashboard.html`, `with-widgets.html`, `dashboard.css`, `script.js`, its own `index.html`, and supporting build/style files.

### Starter Pack — bundled as `BUILDER/STARTER.zip`

When extracted, the Starter Pack contains:

| File / Folder | Description |
|---|---|
| `index.html` | Starter Pack landing page / template index. |
| `blank-tables.html` | Blank editable tables for custom trackers. |
| `episode-template.html` | Podcast / show episode tracker. |
| `expenses.html` | Expense log with totals. |
| `important-documents.html` | Important-document / vital-record tracker. |
| `knowledge-map.html` | Tabular knowledge-map template. |
| `log.html` | Flexible log template. |
| `progress.html` | Multi-item progress tracker. |
| `project.html` | Project hub with tasks, table, and progress tracking. |
| `quote-log.html` | Quote and research-snippet collection. |
| `README.html` | Editable README template. |
| `README.md` | Starter Pack documentation. |
| `symptoms.html` | Symptom tracker. |
| `tasks.html` | Task list and notes template. |
| `topic-cluster.html` | Topic-cluster / radial mapping template. |
| `writing-tracker.html` | Writing progress tracker. |
| `activity-tracker/` | Daily activity and habit tracker with bundled animated icons. |
| `widgets/` | Starter widget collection. |
| `neo-brutalist.css` | Shared neo-brutalist stylesheet. |
| `neo-brutal-overrides.css` | Shared style overrides. |
| `build-index.py` | Utility for rebuilding the Starter Pack index. |
| `_patch_export_snapshot.py` | Utility used to patch/export self-contained template snapshots. |

#### Starter Widgets — `STARTER/widgets/`

| Widget | File |
|---|---|
| Alt Text Generator | `alt-text-generator.html` |
| Animated Notes | `animated-notes/` |
| CSV to SQL | `csv-to-sql.html` |
| Fake Data Generator | `fake-data-generator.html` |
| FAQ Generator | `faq-generator.html` |
| File Naming Generator | `file-naming-generator.html` |
| HTML List Generator | `html-list-generator.html` |
| JSON Schema to TypeScript | `json-schema-to-typescript.html` |
| Pixel Art Draw | `pixel-art-draw.html` |
| Progress Bar Generator | `progress-bar-generator.html` |
| Regex Explainer | `regex-explainer.html` |
| Swatch | `swatch.html` |
| Table Generator | `table-generator.html` |

### Builder-Only Additions

Compared with the bundled Starter Pack, the Builder Pack adds the main interactive templates `calendar.html`, `kanban.html`, `mindmap.html`, `newsletter-builder.html`, `offline-GPT.html`, and `worksheet.html`, plus the full `dashboard/`, `mbox-viewer/`, and `sticker-sheet/` tools. Its dashboard widget collection also adds Card Sorting, Comic Panels Generator, Masonry Gallery, Quiz Builder, Quote Image Generator, Rhymes, and Scratch-It Generator.

