#!/usr/bin/env python3

from pathlib import Path

TITLE = "📚 Template Library"

INDEX_TEMPLATE = """<!DOCTYPE html>
<html lang="en" class="page-index neo-dark-doc">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="neo-brutalist.css" />
  <link rel="stylesheet" href="neo-brutal-overrides.css" />
  <title>{title}</title>
</head>
<body>

  <h1>{title}</h1>

  <h2 class="folder">HTML</h2>

  <p class="intro">
    <code>.html</code> files in this folder, excluding this index.
  </p>

  <div class="grid">
{html_cards}
  </div>

  <h2 class="folder">Folders</h2>

  <div class="grid">
{folder_cards}
  </div>

</body>
</html>
"""


def prettify_name(name):
    stem = Path(name).stem
    stem = stem.replace("-", " ")
    stem = stem.replace("_", " ")
    return stem.title()


def html_card(filename):
    title = prettify_name(filename)

    return (
        f'    <a class="card orange" href="{filename}">'
        f'<div class="title">{title}</div>'
        f'<div class="desc">{title} template.</div>'
        f'</a>'
    )


def folder_card(folder):
    title = prettify_name(folder)

    return (
        f'    <a class="card purple" href="{folder}/">'
        f'<div class="title">{title}</div>'
        f'<div class="desc">{title} folder.</div>'
        f'</a>'
    )


def main():
    current = Path.cwd()

    html_files = sorted(
        [
            f.name
            for f in current.glob("*.html")
            if f.name.lower() != "index.html"
        ],
        key=str.lower,
    )

    folders = sorted(
        [
            d.name
            for d in current.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        ],
        key=str.lower,
    )

    html_cards = "\n".join(html_card(f) for f in html_files)
    folder_cards = "\n".join(folder_card(d) for d in folders)

    output = INDEX_TEMPLATE.format(
        title=TITLE,
        html_cards=html_cards,
        folder_cards=folder_cards,
    )

    (current / "index.html").write_text(
        output,
        encoding="utf-8"
    )

    print(f"Generated index.html")
    print(f"Found {len(html_files)} HTML files")
    print(f"Found {len(folders)} folders")


if __name__ == "__main__":
    main()