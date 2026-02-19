#!/usr/bin/env python3
"""
Confluence 복사-붙여넣기 호환을 위해 HTML 파일에 inline style 속성을 추가하는 스크립트.

Confluence는 <style> 블록을 무시하고 inline style=""만 인식하므로,
모든 테이블/코드블록/인용문 등에 inline style을 주입한다.

Usage:
    python3 scripts/confluence-inline-styles.py
"""

import re
import glob
import os

CONFLUENCE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "confluence-html")

INLINE_STYLES = {
    "table": "border-collapse: collapse; width: 100%; margin: 12px 0;",
    "th": (
        "border: 1px solid #dfe1e6; padding: 8px 12px; "
        "text-align: left; vertical-align: top; "
        "background-color: #f4f5f7; font-weight: 600;"
    ),
    "td": (
        "border: 1px solid #dfe1e6; padding: 8px 12px; "
        "text-align: left; vertical-align: top;"
    ),
    "pre": (
        "background-color: #f4f5f7; border: 1px solid #dfe1e6; "
        "border-radius: 3px; padding: 12px; overflow-x: auto; "
        "font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; "
        "font-size: 12px; line-height: 1.4; white-space: pre;"
    ),
    "code": (
        "background-color: #f4f5f7; border-radius: 3px; padding: 2px 4px; "
        "font-family: SFMono-Regular, Consolas, monospace; font-size: 0.9em;"
    ),
    "blockquote": (
        "border-left: 3px solid #dfe1e6; margin: 12px 0; "
        "padding: 8px 16px; color: #6b778c; background-color: #f9fafb;"
    ),
}

HR_STYLE = "border: none; border-top: 1px solid #dfe1e6; margin: 24px 0;"


def add_inline_styles(html_content: str) -> str:
    result = html_content

    for tag, style in INLINE_STYLES.items():
        # <tag> 또는 <tag attr="..."> 형태에 style 속성이 없는 경우만 매칭
        pattern = rf"<{tag}(?=[\s>])(?![^>]*style=)([^>]*)>"
        replacement = rf'<{tag} style="{style}"\1>'
        result = re.sub(pattern, replacement, result)

    # <hr>, <hr/>, <hr /> 처리 (self-closing)
    result = re.sub(
        r"<hr\s*/?>",
        f'<hr style="{HR_STYLE}">',
        result,
    )

    # GAM 파일: <html> → <html lang="ko">
    result = re.sub(r"<html>", '<html lang="ko">', result)

    return result


def process_file(filepath: str) -> bool:
    with open(filepath, "r", encoding="utf-8") as f:
        original = f.read()

    transformed = add_inline_styles(original)

    if transformed == original:
        return False

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(transformed)

    return True


def main():
    pattern = os.path.join(CONFLUENCE_DIR, "*.html")
    files = sorted(glob.glob(pattern))

    if not files:
        print(f"No HTML files found in {CONFLUENCE_DIR}")
        return

    print(f"Processing {len(files)} HTML files in {CONFLUENCE_DIR}\n")

    modified_count = 0
    for filepath in files:
        filename = os.path.basename(filepath)
        changed = process_file(filepath)
        status = "UPDATED" if changed else "no change"
        print(f"  [{status}] {filename}")
        if changed:
            modified_count += 1

    print(f"\nDone: {modified_count}/{len(files)} files updated.")


if __name__ == "__main__":
    main()
