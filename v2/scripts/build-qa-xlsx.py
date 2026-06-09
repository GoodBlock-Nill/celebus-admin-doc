#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CELEBUS BO 단위테스트(QA) 엑셀 생성기 — 순수 표준 라이브러리(외부 의존성 0).

v2/qa/*.tsv 를 읽어 시트별로 합쳐 하나의 .xlsx 로 출력한다.
- TSV 1행 = 헤더(8컬럼), 이후 = TC 데이터 행
- 셀 안 줄바꿈은 리터럴 `\\n`(역슬래시+n) 토큰으로 표기 → 실제 줄바꿈으로 변환
- 시트명/순서는 SHEETS 매핑으로 제어(미등록 파일은 파일명 stem 사용)
- 헤더 굵게 + 틀 고정(1행) + 본문 줄바꿈 + 컬럼 폭 적용

사용법:  python3 v2/scripts/build-qa-xlsx.py
"""
import os, csv, zipfile, html

QA_DIR = os.path.join(os.path.dirname(__file__), "..", "qa")
OUT = os.path.join(os.path.dirname(__file__), "..", "BO", "00-Common",
                   "CELEBUS BO 단위테스트 v1.0.xlsx")

# 파일명(stem) -> (정렬 순서, 시트명). 영역 확장 시 여기에 추가.
SHEETS = {
    "dly": (10, "일일미션"),
    "groups": (20, "그룹 리스트"),
    "members": (30, "멤버 리스트"),
    "feed": (40, "소식·일정"),
    "fandom": (50, "팬덤레벨"),
    "duk": (60, "덕력관리"),
}

# 컬럼 폭 (Excel 문자 단위)
COL_WIDTHS = [14, 12, 14, 14, 18, 16, 50, 50]  # A..H


def col_ref(idx0):
    """0-based 열 인덱스 -> 'A','B',... 'AA'"""
    s = ""
    n = idx0 + 1
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def esc(text):
    return html.escape(str(text), quote=False)


def load_tsv(path):
    rows = []
    with open(path, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if not row or all(c.strip() == "" for c in row):
                continue
            # 8컬럼으로 정규화
            row = (row + [""] * 8)[:8]
            rows.append([c.replace("\\n", "\n") for c in row])
    return rows


def cell_xml(ref, value, style):
    if value == "":
        return f'<c r="{ref}" s="{style}"/>'
    v = esc(value)
    return (f'<c r="{ref}" s="{style}" t="inlineStr">'
            f'<is><t xml:space="preserve">{v}</t></is></c>')


def sheet_xml(rows):
    # 1행 헤더(style 1), 이후 본문(style 2)
    out = []
    ncols = 8
    last = f"{col_ref(ncols-1)}{len(rows)}"
    out.append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    out.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
    out.append(f'<dimension ref="A1:{last}"/>')
    # 틀 고정: 1행 freeze
    out.append('<sheetViews><sheetView workbookViewId="0">'
               '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
               '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>'
               '</sheetView></sheetViews>')
    out.append('<sheetFormatPr defaultRowHeight="15"/>')
    # 컬럼 폭
    out.append("<cols>")
    for i, w in enumerate(COL_WIDTHS):
        out.append(f'<col min="{i+1}" max="{i+1}" width="{w}" customWidth="1"/>')
    out.append("</cols>")
    out.append("<sheetData>")
    for r_i, row in enumerate(rows):
        rn = r_i + 1
        style = 1 if r_i == 0 else 2
        out.append(f'<row r="{rn}">')
        for c_i, val in enumerate(row):
            out.append(cell_xml(f"{col_ref(c_i)}{rn}", val, style))
        out.append("</row>")
    out.append("</sheetData>")
    out.append('<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>')
    out.append("</worksheet>")
    return "".join(out)


STYLES_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="10"/><name val="Malgun Gothic"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Malgun Gothic"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF4F46E5"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD0D0D0"/></left><right style="thin"><color rgb="FFD0D0D0"/></right><top style="thin"><color rgb="FFD0D0D0"/></top><bottom style="thin"><color rgb="FFD0D0D0"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>"""


def build():
    qa = os.path.abspath(QA_DIR)
    files = [f for f in os.listdir(qa) if f.endswith(".tsv")]
    def key(f):
        stem = f[:-4]
        return SHEETS.get(stem, (999, stem))[0]
    files.sort(key=key)

    sheets = []  # (name, rows)
    for f in files:
        stem = f[:-4]
        name = SHEETS.get(stem, (999, stem))[1]
        rows = load_tsv(os.path.join(qa, f))
        sheets.append((name, rows))
        print(f"  + 시트 '{name}'  ({len(rows)-1} TC)  <- {f}")

    # workbook.xml
    sheet_tags = "".join(
        f'<sheet name="{esc(n)}" sheetId="{i+1}" r:id="rId{i+1}"/>'
        for i, (n, _) in enumerate(sheets))
    workbook = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
                ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                f'<sheets>{sheet_tags}</sheets></workbook>')

    # workbook rels (sheets + styles)
    rel_items = "".join(
        f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>'
        for i in range(len(sheets)))
    styles_rid = len(sheets) + 1
    rel_items += (f'<Relationship Id="rId{styles_rid}" '
                  'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
                  'Target="styles.xml"/>')
    wb_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
               '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
               f'{rel_items}</Relationships>')

    # content types
    overrides = "".join(
        f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for i in range(len(sheets)))
    content_types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                     '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                     '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                     '<Default Extension="xml" ContentType="application/xml"/>'
                     '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                     '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                     f'{overrides}</Types>')

    root_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                 '</Relationships>')

    os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
    with zipfile.ZipFile(os.path.abspath(OUT), "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", root_rels)
        z.writestr("xl/workbook.xml", workbook)
        z.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        z.writestr("xl/styles.xml", STYLES_XML)
        for i, (_, rows) in enumerate(sheets):
            z.writestr(f"xl/worksheets/sheet{i+1}.xml", sheet_xml(rows))

    print(f"\n✅ 생성 완료: {os.path.abspath(OUT)}")


if __name__ == "__main__":
    build()
