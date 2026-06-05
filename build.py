import json, os, re
from pathlib import Path

POSTS_DIR = Path(__file__).parent / "posts"
INDEX_FILE = POSTS_DIR / "index.json"

def parse_md(filepath):
    text = filepath.read_text(encoding="utf-8")
    lines = text.splitlines()
    title = ""
    meta = {}
    content_start = 0

    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip()
        content_start = 1

    i = 1
    while i < len(lines):
        line = lines[i]
        if line.strip() == "---":
            content_start = i + 1
            break
        m = re.match(r"^(\w+)\s*:\s*(.+)$", line)
        if m:
            meta[m.group(1)] = m.group(2).strip()
        i += 1

    content = "\n".join(lines[content_start:]).strip()
    stem = filepath.stem
    tags = [t.strip() for t in meta.get("tags", "").split(",") if t.strip()]

    return {
        "id": stem,
        "title": title or stem,
        "date": meta.get("date", ""),
        "time": meta.get("time", ""),
        "readTime": meta.get("readTime", ""),
        "tags": tags,
        "file": filepath.name
    }

posts = []
for f in sorted(POSTS_DIR.glob("*.md")):
    if f.name == "index.json":
        continue
    posts.append(parse_md(f))

INDEX_FILE.write_text(json.dumps(posts, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Generated {INDEX_FILE} with {len(posts)} posts")
