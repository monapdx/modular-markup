
# Easy Email Newsletters

> Build table-based email newsletter layouts you can copy and paste directly into Gmail.

| Logo             | Description                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![[easy-email-newsletters.png]] | **Easy Email Newsletters** is a React + Vite tool for creating email-safe newsletter layouts using table structures that work reliably across email clients. The editor allows you to visually build a newsletter and then copy Gmail-ready HTML. |

## Screenshots

<img src="https://raw.githubusercontent.com/monapdx/easy-email-newsletters/refs/heads/main/screenshot.png">

---
## Features

- Table-based email templates
- Gmail-friendly layout structure
- Click-to-edit text cells
- Stable inline text editing
- Background color controls
- Image insertion
- Image upload support
- Highlight text and add hyperlinks
- Add CTA buttons with links
- Copy Gmail-ready HTML
- Copy raw HTML source
- Nested tables for more advanced layouts

---
## Templates Included

- Classic Newsletter
- Docs Split Banner
- Blank Canvas

---
## Built With

- React
- Vite
- HTML / CSS
- GitHub Pages (for live demo)

---
## Live Demo

Once GitHub Pages is enabled, the live demo will be available at:

https://monapdx.github.io/easy-email-newsletters/

---
## Local Development

Clone the repo and install dependencies:
npm install

Run the development server:
npm run dev 

Build the production version:
npm run build

Preview the production build locally:
npm run preview

---
## How It Works

Email clients like Gmail still rely heavily on **table layouts and inline styles** rather than modern CSS layout systems like Flexbox or Grid.

This tool generates safe HTML using:

- table layouts
- inline styles
- simple fonts
- predictable spacing

The result can be **copied directly into Gmail's compose window**.

---
## Typical Workflow

1. Choose a template
2. Click inside any text cell to edit
3. Insert images
4. Highlight text and add links
5. Add button-style CTAs
6. Copy the generated HTML
7. Paste it into Gmail

---
## Example Exported Newsletter HTML

For an example of what the exported HTML looks like, see [example-exported-newsletter.html](example-exported-newsletter.html).

---
## Project Structure

src/
components/
data/
utils/

public/

---
## Roadmap

Planned improvements:

- More starter templates
- Button style controls
- Image resizing/compression
- Add/remove rows
- Drag-and-drop layout blocks
- Template saving
- Import/export newsletter templates
- Draft saving

---
## Notes

- Web fonts are intentionally avoided for better email compatibility.
- The generated HTML is optimized for **copy/paste workflows**, especially Gmail.
- Uploaded images may increase HTML size because they are embedded.

---
## License

MIT
