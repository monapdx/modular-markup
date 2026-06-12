from pathlib import Path
import re

FOLDER = Path(__file__).parent
INDEX_FILE = FOLDER / "index.html"


def pretty_name(path):
    name = path.stem if path.is_file() else path.name
    return name.replace("-", " ").replace("_", " ").title()


html_files = sorted(
    f for f in FOLDER.glob("*.html")
    if f.name.lower() != "index.html"
)

folders = sorted(
    d for d in FOLDER.iterdir()
    if d.is_dir() and not d.name.startswith(".")
)

html_cards = "\n".join(
    f'''    <a class="card orange" href="{f.name}"><div class="title">{pretty_name(f)}</div><div class="desc">{pretty_name(f)} template.</div></a>'''
    for f in html_files
)

folder_cards = "\n".join(
    f'''    <a class="card purple" href="{d.name}/"><div class="title">{pretty_name(d)}</div><div class="desc">{pretty_name(d)} folder.</div></a>'''
    for d in folders
)

content = INDEX_FILE.read_text(encoding="utf-8")

content = re.sub(
    r'(<h2 class="folder">HTML</h2>\s*<div class="grid">\s*)(.*?)(\s*</div>)',
    lambda m: m.group(1) + "\n" + html_cards + m.group(3),
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'(<h2 class="folder">Folders</h2>\s*<div class="grid">\s*)(.*?)(\s*</div>)',
    lambda m: m.group(1) + "\n" + folder_cards + m.group(3),
    content,
    flags=re.DOTALL
)

INDEX_FILE.write_text(content, encoding="utf-8")

print(f"Updated index.html with {len(html_files)} HTML files and {len(folders)} folders.")