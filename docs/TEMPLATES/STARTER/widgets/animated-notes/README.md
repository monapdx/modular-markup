# Animated Notes

A small, browser-based note-taking app with animated icon selection and automatic local storage.

## Use it

1. Place animated image files in the `icons` folder.
2. Add their filenames to `icons/icons.js`.
3. Open `index.html` in a modern browser.

Notes save automatically in that browser's `localStorage`. Use **Export** to make a JSON backup and **Import** to restore one. Clearing browser site data may remove locally stored notes.

## Files

- `index.html` — interface
- `app.js` — note creation, editing, search, import/export, and local storage
- `notes.css` — app-specific layout and styling
- `neo-brutalist.css` and `neo-brutal-overrides.css` — supplied visual foundation
- `icons/icons.js` — animated icon manifest
