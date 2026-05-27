#!/usr/bin/env bash
#
# multi-team-doc-check.sh — 다팀 협업용 기획문서 룰 자동 검증
#
# 사용법:
#   v2/scripts/multi-team-doc-check.sh CEB-BO-ART-401
#   v2/scripts/multi-team-doc-check.sh ART/401
#   v2/scripts/multi-team-doc-check.sh "v2/BO/ART/[CEB-BO-ART-401] 덕력 관리.md"
#
# 검출 패턴 (본문 위반 — 변경 이력 §7 영역은 skip):
#   - 영문 컴포넌트명 (PascalCase + Modal/Form/Tab/Page/Card/Section/Button)
#   - 버전 메타 본문 표기 (v1.0·v2.0 등 — 변경 이력 표 외)
#   - git hash (7자리 이상 hex 단어)
#   - 작업 메타 키워드 ("사용자 요구·정정 요구·이번 사이클·직전 사이클·우리·우리둘·작업로드")
#   - 개발 용어 (useState·useMemo·useEffect·sentinel·placeholder·fallback·debounce·readonly·render)
#
# 제외 영역:
#   - 코드 블록 ``` ``` 안
#   - 인라인 코드 `...` 안
#   - Page Properties 표
#   - §7 변경 이력 표 영역 (## 7. 변경 이력 헤더 이후)
#
# 메모리 룰: [[feedback-multi-team-planner-doc]] CRITICAL
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

# 명세 파일 위치 식별 (planner-language-check.sh와 동일 로직)
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

# 검출 패턴 (위반)
VIOLATION_PATTERNS = [
    # 영문 컴포넌트명 (PascalCase + suffix)
    (r'\b[A-Z][a-zA-Z0-9]+(Modal|Form|Tab|Card|Section|Button|Provider|Context|Hook|Component|Page|Bar|Header|Footer|Item|List|Container|Wrapper)\b',
     '영문 컴포넌트명 (한국어 화면명으로 치환)'),
    # 버전 메타 본문 (v1.0 v2.0 등) — 변경 이력 표는 제외 영역
    (r'\bv\d+\.\d+\b', '버전 메타 본문 표기 (정책 자체로 기술 — 변경 이력 §7에만 허용)'),
    # git hash (7자리 이상 hex만, 영숫자 혼합)
    (r'\b[0-9a-f]{7,40}\b', 'git hash 본문 인용 (이력 컨텍스트는 변경 이력 §7에만)'),
    # 작업 메타 키워드 (사이클·우리·작업로드 등)
    (r'(사용자\s*(정정\s*)?요구|이번\s*사이클|직전\s*사이클|우리\s*(둘)?\s*(만의)?|작업로드|본\s*사이클)',
     '작업 메타 키워드 (다팀 협업 문서에 부적합)'),
    # 개발 용어
    (r'\b(useState|useMemo|useEffect|useRef|useCallback|onClick|onChange|onBlur|render|sentinel|placeholder|fallback|debounce|readonly)\b',
     '개발 용어 (한국어 표현으로 치환 — 안내 문구·표시·수정 불가 등)'),
]

# 제외 영역 계산
excluded_lines = set()
in_code_block = False
in_props = False
in_changelog = False

for i, line in enumerate(lines):
    stripped = line.strip()

    # 코드 블록
    if stripped.startswith('```'):
        in_code_block = not in_code_block
        excluded_lines.add(i)
        continue
    if in_code_block:
        excluded_lines.add(i)
        continue

    # Page Properties 표 (## Page Properties ~ 다음 구분선/헤더)
    # 빈 줄은 표 전후로 발생하므로 종료 조건 아님
    if '## Page Properties' in line:
        in_props = True
        excluded_lines.add(i)
        continue
    if in_props:
        if stripped == '---' or stripped.startswith('## '):
            in_props = False
            # 종료 라인 자체는 다른 분기 (아래 변경 이력 등)로 평가
        else:
            excluded_lines.add(i)

    # 변경 이력 표 (## 7. 변경 이력 또는 ## 변경 이력 이후 EOF까지 또는 다음 ## 헤더까지)
    if re.match(r'^##\s+(\d+\.\s*)?변경\s*이력', line):
        in_changelog = True
        excluded_lines.add(i)
        continue
    if in_changelog:
        # 다음 ## 헤더면 종료
        if re.match(r'^##\s', line) and not re.match(r'^##\s+(\d+\.\s*)?변경', line):
            in_changelog = False
        else:
            excluded_lines.add(i)

# 검사
violations = []
for i, line in enumerate(lines):
    if i in excluded_lines:
        continue
    # 인라인 코드 `...` 마스킹
    masked = re.sub(r'`[^`]*`', lambda m: ' ' * len(m.group(0)), line)
    # URL 마스킹
    masked = re.sub(r'https?://[^\s)]+', lambda m: ' ' * len(m.group(0)), masked)
    # 경로 마스킹
    masked = re.sub(r'/[a-zA-Z0-9_\-/{}\[\]?=&.]+', lambda m: ' ' * len(m.group(0)), masked)
    # 파일명 마스킹
    masked = re.sub(r'[a-zA-Z0-9_\-./\[\]]+\.(md|html|tsx?|jsx?|sh|json|env|ya?ml|css|svg|png|jpe?g|pdf)\b',
                    lambda m: ' ' * len(m.group(0)), masked)
    # 색상 hex (#000·#FFF) 마스킹
    masked = re.sub(r'#[0-9a-fA-F]{3,8}\b', lambda m: ' ' * len(m.group(0)), masked)

    for pattern, label in VIOLATION_PATTERNS:
        for m in re.finditer(pattern, masked):
            matched = m.group(0)
            # git hash 화이트리스트 — 짧은 한국어 단어와 충돌 회피용
            # (이미 영숫자 7자 이상으로 제한했으므로 충돌 가능성 낮음)
            violations.append({
                'line': i + 1,
                'pattern': label,
                'match': matched,
                'context': line.strip()[:120]
            })

print("═══════════════════════════════════════════")
print("다팀 협업 기획문서 룰 자가 검증 결과")
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
print("   - 영문 컴포넌트명 → 한국어 화면명 (예: SeasonFormModal → '시즌 생성·수정 모달')")
print("   - 버전 메타 → 정책 자체로 기술 (이력은 §7 변경 이력 표에만)")
print("   - git hash·사이클 인용 → 본문에서 전면 삭제")
print("   - 작업 메타 키워드 → 정책·동작·규칙 표현으로 대체")
print("   - 개발 용어 → 누구나 이해할 한국어 (안내 문구·표시·수정 불가 등)")
print("   - 메모리 룰: [[feedback-multi-team-planner-doc]] 참조")

sys.exit(1)
PYEOF
