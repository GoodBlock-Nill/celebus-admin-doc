#!/bin/bash
# update-progress.sh — v2 마이그레이션 진행상태·Notepad 자동 갱신 헬퍼
#
# Usage:
#   update-progress.sh --phase N --status [start|done|blocked] [--note "메모"]
#   update-progress.sh --note "Working Memory에 추가만"
#
# 동작:
#   1) v2_migration_progress.md "현재 Phase" 섹션 갱신 (--status start/done)
#   2) Phase 별 체크리스트 행을 🟡 진행 / 🟢 완료 / 🔴 차단 으로 변경
#   3) .omc/notepad.md Working Memory 섹션에 timestamped 항목 추가
#
# 사용 예:
#   update-progress.sh --phase 1 --status start --note "SessionStart hook 작성 시작"
#   update-progress.sh --phase 1 --status done --note "Phase 1 완료: 모든 산출물 5종 검증"

set -euo pipefail

# 인자 파싱
PHASE=""
STATUS=""
NOTE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase) PHASE="$2"; shift 2 ;;
    --status) STATUS="$2"; shift 2 ;;
    --note) NOTE="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

PROGRESS="$HOME/.claude/projects/-Users-goodblock-Projects-celebus-admin/memory/v2_migration_progress.md"
NOTEPAD="$(cd "$(dirname "$0")/../.." && pwd)/.omc/notepad.md"
TS=$(date +"%Y-%m-%d %H:%M")

if [[ ! -f "$PROGRESS" ]]; then
  echo "ERROR: progress file not found: $PROGRESS" >&2
  exit 1
fi
if [[ ! -f "$NOTEPAD" ]]; then
  echo "ERROR: notepad file not found: $NOTEPAD" >&2
  exit 1
fi

# 1) Working Memory에 timestamped 항목 추가 (--note 가 있을 때만)
if [[ -n "$NOTE" ]]; then
  # ## Working Memory 섹션 다음 줄에 항목 추가
  python3 - "$NOTEPAD" "$TS" "$PHASE" "$STATUS" "$NOTE" <<'PY'
import sys, pathlib, re
p, ts, phase, status, note = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
path = pathlib.Path(p)
text = path.read_text(encoding='utf-8')
prefix = f"- [{ts}]"
if phase:
    prefix += f" Phase {phase}"
    if status:
        prefix += f" ({status})"
    prefix += " —"
entry = f"{prefix} {note}"
# Working Memory 헤더 다음에 삽입
m = re.search(r"^## Working Memory[^\n]*\n", text, re.M)
if not m:
    print("WARN: Working Memory section not found, appending at end", file=sys.stderr)
    new = text + f"\n## Working Memory\n\n{entry}\n"
else:
    insert_at = m.end()
    new = text[:insert_at] + f"\n{entry}\n" + text[insert_at:]
path.write_text(new, encoding='utf-8')
print(f"Notepad updated: {entry}")
PY
fi

# 2) v2_migration_progress.md 의 Phase 상태 갱신 (--phase + --status 둘 다 있을 때)
if [[ -n "$PHASE" && -n "$STATUS" ]]; then
  python3 - "$PROGRESS" "$PHASE" "$STATUS" "$TS" "$NOTE" <<'PY'
import sys, pathlib, re
p, phase, status, ts, note = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
path = pathlib.Path(p)
text = path.read_text(encoding='utf-8')

# 상태 → 이모지 매핑
emoji_map = {"start": "🟡 진행 중", "done": "🟢 완료", "blocked": "🔴 차단"}
new_status = emoji_map.get(status, status)

# 표 행에서 "| **N** |" 또는 "| N |" 으로 시작하는 행을 찾아 상태 컬럼 갱신
# Phase 행 패턴: | **N** | 명칭 | 상태 | 진입일 | 완료일 | ... |
def repl(m):
    line = m.group(0)
    # 컬럼 분리
    parts = line.split('|')
    # 첫번째 빈, 두번째 phase, 세번째 명칭, 네번째 상태, 다섯번째 진입일, 여섯번째 완료일
    if len(parts) < 7:
        return line
    parts[3] = f" {new_status} "
    if status == "start":
        parts[4] = f" {ts.split()[0]} "
    elif status == "done":
        parts[5] = f" {ts.split()[0]} "
    return '|'.join(parts)

# Track A는 ` | **N** | ` , Track B는 ` | N | ` 형태. 두 패턴 모두 매칭.
# 행 단위로 검사하여 첫 셀이 phase 번호(또는 **phase**)인 행만 갱신.
new_lines = []
hit = False
for ln in text.split('\n'):
    if not hit and ln.startswith('|'):
        cells = ln.split('|')
        if len(cells) >= 7:
            first = cells[1].strip().strip('*').strip()
            if first == str(phase):
                ln = repl(re.match(r'.*', ln))
                hit = True
    new_lines.append(ln)
if not hit:
    print(f"WARN: Phase {phase} row not found in progress table", file=sys.stderr)
text = '\n'.join(new_lines)

# "## 현재 Phase" 섹션 갱신 — start 일 때만
if status == "start":
    cur_pat = re.compile(r"^## 현재 Phase\s*\n\n.*?(?=\n## )", re.S | re.M)
    new_block = f"## 현재 Phase\n\n**Phase {phase}** (진입: {ts.split()[0]}{' — ' + note if note else ''})\n\n"
    if cur_pat.search(text):
        text = cur_pat.sub(new_block, text, count=1)

path.write_text(text, encoding='utf-8')
print(f"Progress updated: Phase {phase} → {new_status}")
PY
fi

echo "Done."
