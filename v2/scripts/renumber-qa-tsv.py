#!/usr/bin/env python3
"""QA TSV TC ID 중앙 재채번 + 무결성 검증.

보강 에이전트가 행을 추가/분할하면서 TC ID 컬럼은 prefix만 맞춰두고 번호는 중복/임의로 둔다.
이 스크립트가 각 파일을 행 순서대로 순차 재채번(prefix 유지, 4자리 zero-pad)하고,
모든 행이 정확히 8필드인지 검증한다. 헤더(1행)는 보존.

사용: python3 v2/scripts/renumber-qa-tsv.py
"""
import re
import sys
from pathlib import Path

QA_DIR = Path(__file__).resolve().parent.parent / "qa"
TC_RE = re.compile(r"^(TC_[A-Z]+)_(\d+)$")


def process(path: Path) -> tuple[int, int, list[str]]:
    """반환: (데이터 행 수, 재채번 수, 오류 목록)"""
    raw = path.read_text(encoding="utf-8")
    had_trailing_nl = raw.endswith("\n")
    lines = raw.split("\n")
    if had_trailing_nl:
        lines = lines[:-1]  # split로 생긴 마지막 빈 요소 제거

    errors: list[str] = []
    if not lines:
        return 0, 0, [f"{path.name}: 빈 파일"]

    header = lines[0]
    if header.count("\t") != 7:
        errors.append(f"{path.name}: 헤더 필드 수 {header.count(chr(9))+1} (8 아님)")

    prefix = None
    out = [header]
    n = 0
    for i, ln in enumerate(lines[1:], start=2):
        if ln == "":  # 파일 중간 빈 줄은 오류 신호
            errors.append(f"{path.name} line {i}: 빈 줄")
            continue
        cols = ln.split("\t")
        if len(cols) != 8:
            errors.append(f"{path.name} line {i}: {len(cols)} 필드 (8 아님)")
            out.append(ln)
            continue
        m = TC_RE.match(cols[0])
        if not m:
            errors.append(f"{path.name} line {i}: TC ID 형식 위반 '{cols[0]}'")
            out.append(ln)
            continue
        if prefix is None:
            prefix = m.group(1)
        elif m.group(1) != prefix:
            errors.append(f"{path.name} line {i}: prefix 불일치 '{m.group(1)}' (기대 '{prefix}')")
        n += 1
        cols[0] = f"{prefix}_{n:04d}"
        out.append("\t".join(cols))

    new_text = "\n".join(out) + ("\n" if had_trailing_nl else "")
    path.write_text(new_text, encoding="utf-8")
    return n, n, errors


def main() -> int:
    files = sorted(QA_DIR.glob("*.tsv"))
    if not files:
        print("QA TSV 없음", file=sys.stderr)
        return 1
    total_tc = 0
    all_errors: list[str] = []
    print(f"{'파일':<22} {'TC수':>5}")
    print("-" * 30)
    for f in files:
        n, _, errs = process(f)
        total_tc += n
        all_errors.extend(errs)
        print(f"{f.name:<22} {n:>5}")
    print("-" * 30)
    print(f"{'합계':<22} {total_tc:>5}  ({len(files)}개 시트)")
    if all_errors:
        print("\n⚠️ 오류:")
        for e in all_errors:
            print("  " + e)
        return 2
    print("\n✅ 전 파일 8필드·TC ID 순차 정상")
    return 0


if __name__ == "__main__":
    sys.exit(main())
