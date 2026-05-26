#!/usr/bin/env bash
#
# planner-language-check.sh — 기획자 언어 룰 자동 검증
#
# 사용법:
#   v2/scripts/planner-language-check.sh CEB-BO-GZ-202
#   v2/scripts/planner-language-check.sh GZ/202
#   v2/scripts/planner-language-check.sh "v2/BO/GAM/[CEB-BO-GZ-202] 게임 상세.md"
#
# 검출 패턴 (위반):
#   - SCREAMING_SNAKE_CASE enum (예: PM_PARTICIPATION, GAME_REWARD)
#   - camelCase 변수명 (예: ticketReward, dukReward)
#   - 영문 prefix + 숫자 (예: Tx 100001, Quest #44)
#   - HTML/CSS 속성 (target=_blank, disabled=, data-)
#   - 내부 작업 추적 용어 (Phase N, Track A, 사이클 #N)
#   - 단위 표기 위반 (덕력 N점)
#
# 화이트리스트 (허용):
#   화면 ID / 영역 약자 / PM/ST/NFT / 아티스트 / GP/CELB/DUK / KO/EN/JP / vN.N
#
# 제외 영역:
#   - 코드 블록 ``` ``` 안
#   - 인라인 코드 `...` 안
#   - Page Properties 표
#
# 종료 코드: 0 = 정합 / 1 = 위반 / 2 = 오류

set -uo pipefail
export LC_ALL=en_US.UTF-8 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

SCREEN=""
for arg in "$@"; do
  case "$arg" in
    -h|--help) sed -n '3,28p' "$0"; exit 0 ;;
    *) SCREEN="$arg" ;;
  esac
done

if [[ -z "$SCREEN" ]]; then
  echo "사용법: $0 <화면 ID 또는 영역/번호 또는 파일 경로>"
  exit 2
fi

# 명세 파일 위치 식별
SPEC_PATH=""
if [[ -f "$SCREEN" ]]; then
  SPEC_PATH="$(cd "$(dirname "$SCREEN")" && pwd)/$(basename "$SCREEN")"
elif [[ -f "$REPO_ROOT/$SCREEN" ]]; then
  SPEC_PATH="$REPO_ROOT/$SCREEN"
else
  if [[ "$SCREEN" =~ ^([A-Z]+)/([0-9]+(-[A-Z]+)?)$ ]]; then
    AREA="${BASH_REMATCH[1]}"
    NUM="${BASH_REMATCH[2]}"
    SCREEN="CEB-BO-${AREA}-${NUM}"
  fi
  if [[ "$SCREEN" =~ ^CEB-BO-([A-Z]+)- ]]; then
    AREA="${BASH_REMATCH[1]}"
    case "$AREA" in
      GZ) FOLDER="GAM" ;;
      *)  FOLDER="$AREA" ;;
    esac
    CANDIDATE=$(find "$ROOT/BO/$FOLDER" -maxdepth 1 -name "*${SCREEN}*.md" 2>/dev/null | head -1)
    if [[ -z "$CANDIDATE" ]]; then
      CANDIDATE=$(find "$ROOT/BO" -maxdepth 2 -name "*${SCREEN}*.md" 2>/dev/null | head -1)
    fi
    if [[ -n "$CANDIDATE" ]]; then
      SPEC_PATH="$CANDIDATE"
    fi
  fi
fi

if [[ -z "$SPEC_PATH" || ! -f "$SPEC_PATH" ]]; then
  echo "❌ 명세 파일을 찾을 수 없음: $SCREEN"
  exit 2
fi

REL_PATH="${SPEC_PATH#$REPO_ROOT/}"
echo "📄 명세: $REL_PATH"

python3 - "$SPEC_PATH" << 'PYEOF'
import re
import sys

SPEC_PATH = sys.argv[1]

with open(SPEC_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# 화이트리스트 패턴 (정상 — 위반 아님)
WHITELIST_PATTERNS = [
    r'^CEB-BO-[A-Z]+-\d+(-[A-Z\-]+)?$',
    r'^v\d+\.\d+(\.\d+)?$',
    r'^(V01D|iKON|CELEBUS|MADEIN|UNDER:LIGHT)$',
    r'^(GP|CELB|DUK)$',
    r'^(KO|EN|JP)$',
    r'^(PM|ST|NFT)$',
    r'^(GAM|FQ|RFT|DUK|BIVE|EVT|SYS|USR|ART|SUP|INF|MEM|COL|APP|SQ|HOM|GZ|RFL)$',
    r'^(ID|UID|URL|API|SSOT|MCP|CDN|TBD|TODO|FAQ|FYI)$',
    r'^(MD|HTML|CSS|JSON|PDF|TSX|TS|JS|JSX)$',
    r'^N/A$',
    r'^h[1-6]$',
    r'^CRITICAL$',
    r'^DEPRECATED$',
]

# 검출 패턴 (위반)
VIOLATION_PATTERNS = [
    (r'\b[A-Z]{2,}_[A-Z][A-Z0-9_]+\b', 'enum 식별자'),
    (r'\b[a-z]+[A-Z][a-zA-Z0-9]+\b', 'camelCase 변수명'),
    (r'\b(Tx|Quest|Game|Season|Raffle)\s+#?\d{2,}\b', '영문 prefix'),
    (r'\btarget=["\']?_blank["\']?', 'HTML 속성 (target=_blank)'),
    (r'\bdisabled=["\']?(true|false)?["\']?', 'HTML 속성 (disabled=)'),
    (r'\bPhase \d+(-[A-Z]+)?\b', '내부 작업 추적 용어 (Phase N)'),
    (r'\bTrack [A-Z]\b', '내부 작업 추적 용어 (Track X)'),
    (r'\b사이클 #\d+\b', '내부 작업 추적 용어 (사이클 #N)'),
    (r'덕력\s*[{]?[a-zA-Z0-9가-힣_]*[}]?\s*점\b', '단위 표기 위반 (덕력 N점 → N DUK)'),
]

# 제외 영역 계산
excluded_lines = set()
in_code_block = False
in_props = False

for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith('```'):
        in_code_block = not in_code_block
        excluded_lines.add(i)
        continue
    if in_code_block:
        excluded_lines.add(i)
        continue
    if '## Page Properties' in line:
        in_props = True
        continue
    if in_props:
        if stripped == '' or stripped == '---':
            in_props = False
        else:
            excluded_lines.add(i)

# 검사
violations = []
for i, line in enumerate(lines):
    if i in excluded_lines:
        continue
    # 인라인 코드 ` ... ` 마스킹
    masked = re.sub(r'`[^`]*`', lambda m: ' ' * len(m.group(0)), line)
    # URL 마스킹
    masked = re.sub(r'https?://[^\s)]+', lambda m: ' ' * len(m.group(0)), masked)
    # 경로 마스킹 (/path/...)
    masked = re.sub(r'/[a-zA-Z0-9_\-/{}\[\]?=&.]+', lambda m: ' ' * len(m.group(0)), masked)
    # 파일명 마스킹
    masked = re.sub(r'[a-zA-Z0-9_\-./\[\]]+\.(md|html|tsx?|jsx?|sh|json|env|ya?ml|css|svg|png|jpe?g|pdf)\b',
                    lambda m: ' ' * len(m.group(0)), masked)

    for pattern, label in VIOLATION_PATTERNS:
        for m in re.finditer(pattern, masked):
            matched = m.group(0)
            # 화이트리스트 매칭 시 제외
            is_whitelisted = False
            for wp in WHITELIST_PATTERNS:
                if re.fullmatch(wp, matched):
                    is_whitelisted = True
                    break
            if is_whitelisted:
                continue
            violations.append({
                'line': i + 1,
                'pattern': label,
                'match': matched,
                'context': line.strip()[:120]
            })

print("═══════════════════════════════════════════")
print("기획자 언어 룰 자가 검증 결과")
print("═══════════════════════════════════════════")

if not violations:
    print("✅ 검사 완료 — 위반 0건")
    sys.exit(0)

by_type = {}
for v in violations:
    by_type.setdefault(v['pattern'], []).append(v)

print(f"⚠️  위반 후보: {len(violations)}건 (유형 {len(by_type)}종)")
print()

for ptype, items in sorted(by_type.items()):
    print(f"### {ptype} — {len(items)}건")
    for v in items[:5]:
        print(f"  L{v['line']}: \"{v['match']}\"")
        print(f"     | {v['context']}")
    if len(items) > 5:
        print(f"  ... 외 {len(items)-5}건")
    print()

print("💡 권장 조치:")
print("   - enum/변수명 → 한국어 도메인 용어로 치환")
print("   - 영문 prefix → 한국어 prefix (예: Tx N → 구매-N, Quest #N → 퀘스트-N)")
print("   - HTML 속성 → 동작 설명 (예: target=_blank → '새 탭으로 진입')")
print("   - Phase N → 변경 자체만 기술 (메타 문서 외 사용 금지)")
print("   - 덕력 N점 → 덕력 N DUK (DUK 단위 SSOT 정합)")
print("   - false positive면 백틱(`...`)으로 식별자 인용 처리")

sys.exit(1)
PYEOF
