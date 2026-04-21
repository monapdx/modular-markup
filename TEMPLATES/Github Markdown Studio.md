
| Product            | Description                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ![[github-markdown-studio.png]] | A desktop app for writing, editing, and previewing GitHub Markdown and YAML files — built specifically for creating clean, polished repos. |

---

## ✨ Overview

GitHub Markdown Studio is a lightweight desktop editor designed for people who live in GitHub.

Instead of juggling multiple tools, you can write, preview, and manage:

* README files
* GitHub Actions workflows
* Issue forms (`.yml`)
* General Markdown and YAML files

—all in one place, with a live preview that closely matches how GitHub renders content.

---

## 🚀 Features

* 📝 **Markdown Editor** with live preview (GitHub-style rendering)
* ⚙️ **YAML Editor** with structured preview for issue forms
* 🧩 **Built-in Templates** for common GitHub files:

  * README.md
  * CONTRIBUTING.md
  * Issue Forms
  * Workflows
* 📂 **Open & Save Files** directly from your system
* ⚡ **Monaco Editor** (VS Code–like editing experience)
* 🎯 Focused specifically on **GitHub workflows and formatting**

---

## 🖥️ Tech Stack

* Electron
* React + Vite
* TypeScript
* Monaco Editor
* Markdown-it
* Highlight.js

---

## 📦 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/monapdx/github-markdown-studio.git
cd github-markdown-studio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app

```bash
npm run dev
```

---

## 📁 Project Structure

```
github-markdown-studio/
├── electron/        # Electron main + preload
├── src/
│   ├── components/  # UI components (if expanded later)
│   ├── lib/         # utilities (YAML parsing, etc.)
│   ├── App.tsx      # main UI
│   └── styles/      # styling
├── dist/            # build output
```

---

## 🎯 Use Cases

* Writing clean, professional **README files**
* Building and testing **GitHub issue forms**
* Editing **GitHub Actions workflows**
* Creating documentation without relying on browser previews
* Offline-first GitHub content creation

---

## 🧠 Why this exists

Most Markdown editors are generic.

Most YAML editors are generic.

GitHub isn’t.

This tool is built specifically around how GitHub actually works — its Markdown quirks, its YAML formats, and its real-world workflows.

---

## 🔮 Roadmap

* [ ] Multiple tabs / file management
* [ ] Visual issue form builder
* [ ] Drag-and-drop templates
* [ ] Export/share presets
* [ ] Windows `.exe` packaging

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome.

If you have suggestions for:

* new templates
* UI improvements
* GitHub-specific features

open an issue or submit a PR.

---

## 📄 License

MIT

---

## 💡 Related Ideas

This project is part of a broader focus on:

* offline-first tools
* reducing dependency on web platforms
* making exported or local data more useful

---

## ⭐ Support

If you find this useful, consider starring the repo — it helps more people discover it.
