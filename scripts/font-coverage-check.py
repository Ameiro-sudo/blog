# -*- coding: utf-8 -*-
"""Title-font subset coverage check (ZCOOL KuaiLe woff2).

The title font is used by whichever CSS rules declare
``font-family: var(--font-title)`` (or name ZCOOL directly). This script finds
those rules, resolves the elements they target, harvests the text those elements
actually render -- from the built site (.output/public) when present, otherwise
from the source tree -- and tests every character against the woff2 cmap.

A character missing from the subset silently falls back to a system font, which
is exactly the "one character looks wrong in a heading" bug this guards against.

Usage:  python scripts/font-coverage-check.py
Exit:   0 = covered (or nothing found), 1 = missing characters, 2 = setup error
"""
import glob
import os
import re
import sys

from fontTools.ttLib import TTFont

try:  # keep emoji / CJK printable when the console codepage is not UTF-8
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "assets", "vendor", "fonts", "files", "ZCOOL_KuaiLe.woff2")
OUTPUT = os.path.join(ROOT, ".output", "public")

SOURCE_GLOBS = ["*.vue", "pages/**/*.vue", "components/**/*.vue", "index.html", "nuxt.config.ts"]
CSS_DIR = os.path.join(ROOT, "assets", "css")

CSS_DECL = re.compile(r"font-family\s*:\s*[^;}]*var\(\s*--font-title\s*\)", re.I)
CSS_INLINE = re.compile(r"font-family\s*:\s*\"?'?ZCOOL", re.I)
CSS_BLOCK = re.compile(r"([^{}]+)\{([^{}]*)\}", re.S)
OPEN_TAG = re.compile(r"<([a-zA-Z][\w-]*)([^>]*)>")
VOID_TAGS = {"br", "hr", "img", "input", "meta", "link", "path", "source", "use", "circle"}


EMOJI_RANGES = (
    (0x1F300, 0x1FAFF),   # symbols / pictographs / emoticons
    (0x1F000, 0x1F2FF),   # mahjong, enclosed, transport extras
    (0x2600, 0x27BF),     # misc symbols + dingbats
    (0xFE0F, 0xFE0F),     # variation selector-16
    (0x200D, 0x200D),     # zero width joiner
    (0x2B00, 0x2BFF),     # arrows / shapes
)


def is_emoji(cp):
    """Glyphs no text font can carry; they come from the emoji font by design."""
    return any(lo <= cp <= hi for lo, hi in EMOJI_RANGES)


def split_selectors(block):
    """Split a CSS selector list on top-level commas."""
    parts, depth, cur = [], 0, ""
    for ch in block:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    parts.append(cur)
    return [" ".join(p.split()) for p in parts if p.strip()]


def selectors_using_title_font(css):
    out = []
    for selector, body in CSS_BLOCK.findall(css):
        if CSS_DECL.search(body) or CSS_INLINE.search(body):
            out.extend(split_selectors(selector))
    return out


def target_of(selector):
    """Return (tag, classes) for the last compound selector (the element itself)."""
    compounds = re.split(r"[ >+~]+", selector.strip())
    last = compounds[-1] if compounds else selector
    tag = re.match(r"^([a-zA-Z][\w-]*)", last)
    classes = set(re.findall(r"\.([A-Za-z0-9_-]+)", last))
    return (tag.group(1).lower() if tag else None), classes


def iter_tags(markup):
    for m in OPEN_TAG.finditer(markup):
        tag = m.group(1).lower()
        attrs = m.group(2)
        cls = re.search(r'class\s*=\s*"([^"]*)"', attrs) or re.search(r"class\s*=\s*'([^']*)'", attrs)
        yield tag, set(cls.group(1).split()) if cls else set(), m.end()


def text_of_element(markup, tag, start):
    if tag in VOID_TAGS:
        return ""
    tail = markup[start:]
    close = re.search(r"</%s\s*>" % re.escape(tag), tail)
    body = tail[: close.start()] if close else tail[:400]
    body = re.sub(r"<[^>]+>", " ", body)
    body = re.sub(r"&[a-zA-Z#0-9]+;", " ", body)
    return " ".join(body.split())


def collect(files, targets):
    """files: markup paths; targets: list of (tag, classes) as returned by target_of."""
    hits = []
    for path in files:
        try:
            with open(path, "r", encoding="utf-8") as fh:
                markup = fh.read()
        except (UnicodeDecodeError, OSError):
            continue
        rel = os.path.relpath(path, ROOT)
        for tag, classes, start in iter_tags(markup):
            for want_tag, want_classes in targets:
                if want_classes and not (classes & want_classes):
                    continue
                if not want_classes and want_tag and tag != want_tag:
                    continue
                if not want_classes and not want_tag:
                    continue
                text = text_of_element(markup, tag, start)
                if text:
                    hits.append((rel, text))
                break
    return hits


def main():
    if not os.path.exists(FONT):
        print("[font-check] font file not found: " + FONT)
        return 2

    css_consumers = []
    for path in glob.glob(os.path.join(CSS_DIR, "*.css")):
        with open(path, "r", encoding="utf-8") as fh:
            for sel in selectors_using_title_font(fh.read()):
                css_consumers.append((sel, os.path.relpath(path, ROOT)))

    print("[font-check] title-font CSS rules in assets/css:")
    targets = []
    for sel, where in css_consumers:
        targets.append(target_of(sel))
        print("  %-34s (%s)" % (sel, where))

    # inline rules inside nuxt.config.ts may name the font directly
    nuxt_cfg = os.path.join(ROOT, "nuxt.config.ts")
    if os.path.exists(nuxt_cfg):
        with open(nuxt_cfg, "r", encoding="utf-8") as fh:
            for sel in selectors_using_title_font(fh.read()):
                print("  %-34s (nuxt.config.ts)" % sel)
                targets.append(target_of(sel))

    if not css_consumers and not targets:
        print("[font-check] nothing uses the title font; nothing to check")
        return 0

    # prefer the built site: it holds the text real users see (post titles, 404 copy, ...)
    if os.path.isdir(OUTPUT):
        files = [p for p in glob.glob(os.path.join(OUTPUT, "**", "*.html"), recursive=True)]
        origin = ".output/public"
    else:
        files = []
        for pat in SOURCE_GLOBS:
            files.extend(glob.glob(os.path.join(ROOT, pat.replace("/", os.sep)), recursive=True))
        files = [p for p in sorted(set(files)) if "node_modules" not in p]
        origin = "source tree"
    print("[font-check] scanning %d file(s) from %s" % (len(files), origin))

    samples = collect(files, targets)
    if not samples:
        print("[font-check] no rendered title-font text found; nothing to verify")
        return 0

    cmap = set(TTFont(FONT).getBestCmap().keys())
    missing = {}
    for where, line in samples:
        for ch in line:
            if ord(ch) not in cmap and not is_emoji(ord(ch)):
                missing.setdefault(ch, set()).add(where)

    print("[font-check] %d title-font text sample(s), %d unique character(s) checked"
          % (len(samples), len({c for _, line in samples for c in line})))

    if not missing:
        print("[font-check] PASS - every title-font character is inside the subset (%d glyphs)" % len(cmap))
        return 0

    print("[font-check] FAIL - %d character(s) missing from the subset:" % len(missing))
    for ch in sorted(missing, key=lambda c: -len(missing[c])):
        where = ", ".join(sorted(missing[ch])[:3])
        print("  %s  U+%04X  <- %s" % (ch, ord(ch), where))
    print("")
    print("Fix: re-subset assets/vendor/fonts/files/ZCOOL_KuaiLe.woff2 so that it covers")
    print("every character listed above (see handoff doc section 8).")
    return 1


if __name__ == "__main__":
    sys.exit(main())