#!/usr/bin/env bash
#
# changelog-sync-check.sh — 명세 §7 변경 이력 ↔ §2 본문 자가 검증
#
# 사용법:
#   v2/scripts/changelog-sync-check.sh CEB-BO-GZ-202
#   v2/scripts/changelog-sync-check.sh GZ/202
#   v2/scripts/changelog-sync-check.sh "v2/BO/GAM/[CEB-BO-GZ-202] 게임 상세.md"
#
# 동작:
#   1) §7 변경 이력 표에서 최신 entry(첫 `| **v...` 행) 추출
#   2) entry에서 약속 키워드 추출 (강조/따옴표 → 코어 명사구)
#   3) §2·§3·§5 본문에서 코어 명사구 grep
#   4) 누락 후보 리포트 + 종료 코드
#
# 종료 코드:
#   0 = 정합 / 1 = 누락 검출 / 2 = 입력·탐색 오류

set -uo pipefail
export LC_ALL=en_US.UTF-8 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

SCREEN=""
for arg in "$@"; do
  case "$arg" in
    -h|--help) sed -n '3,18p' "$0"; exit 0 ;;
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

# Python에 위임 — escape 문제 회피
python3 - "$SPEC_PATH" << 'PYEOF'
import re
import sys

SPEC_PATH = sys.argv[1]

with open(SPEC_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# §7 변경 이력 최신 entry 추출 (첫 "| **v..." 행)
in_section = False
latest_entry = None
for line in lines:
    if re.match(r'^## 7', line) or re.match(r'^## 변경 이력', line):
        in_section = True
        continue
    if in_section and re.match(r'^\| \*\*v', line):
        latest_entry = line
        break

if not latest_entry:
    print("⚠️  §7 변경 이력 최신 entry를 찾을 수 없음 (`| **v...` 패턴 미발견)")
    sys.exit(2)

print("📋 최신 변경 이력 entry 발견")

# 정정/통일 전용 entry는 약속 추출 skip (Before/After 인용이 본문 약속으로 오인되는 false positive 차단)
# - "정정", "통일", "환원", "철회", "표기" 메타 동사 포함
# - + "신규", "추가" 동사 미포함
HAS_FIX_VERB = any(v in latest_entry for v in ['정정', '통일', '환원', '철회', '표기', '폐기'])
HAS_NEW_VERB = any(v in latest_entry for v in ['신규', '추가', '신설'])
if HAS_FIX_VERB and not HAS_NEW_VERB:
    print("✅ 정정/통일 전용 entry — 약속 추출 skip (검증 통과)")
    sys.exit(0)

# 메타 정합/일반 동사 (entry 제목 또는 정정 인용에 주로 등장)
META_VERBS = ['통일', '정정', '정합', '환원', '철회', '제거', '삭제', '폐기',
              '본문 보강', '본문 누락', '약속', '미반영', '재발', '차단', '검증', '추적']

GENERIC_WORDS = ['신규', '추가', '보강', '정정', '변경', '갱신', '수정', '폐기', '제거', '도입', '확장']

def is_meta(text):
    if '→' in text:
        return True
    for v in META_VERBS:
        if v in text:
            return True
    if text in GENERIC_WORDS:
        return True
    # 순수 계산식 (Before/After 인용)
    if re.match(r'^[N\d{][^가-힣]*[=×]', text):
        return True
    return False

def core_label(text):
    """라벨에서 코어 명사구 추출"""
    # 첫 괄호 이전까지
    core = re.split(r'[\(\[]', text)[0].strip()
    # 끝 placeholder + 단위 제거: " N장", " {N}장", " 100 DUK"
    core = re.sub(r'\s+[N\d{][^가-힣]*$', '', core).strip()
    # 끝 단위만 단독 ("응모권 N장" → "응모권")
    core = re.sub(r'\s+(N|\{[^}]+\}|장|점|개|건|회)$', '', core).strip()
    # "응모권·덕력 보상" 같은 복합어는 첫 단어만 (false negative 회피)
    return core if len(core) >= 3 else text

candidates = set()

# 1) "..." 따옴표 안
for m in re.findall(r'"([^"]{3,})"', latest_entry):
    text = m.strip()
    if not re.search(r'[가-힣]', text):
        continue
    if is_meta(text):
        continue
    cl = core_label(text)
    if cl and len(cl) >= 3:
        candidates.add(cl)

# 2) **...** 강조 라벨
for m in re.findall(r'\*\*([^*]{3,})\*\*', latest_entry):
    text = m.strip()
    if not re.search(r'[가-힣]', text):
        continue
    if re.match(r'^v\d', text) or re.match(r'^\d{4}', text) or text.startswith('@'):
        continue
    if is_meta(text):
        continue
    cl = core_label(text)
    if cl and len(cl) >= 3:
        candidates.add(cl)

if not candidates:
    print("✅ 약속 키워드 0건 추출 (메타 정합 entry로 보임) — 검증 통과")
    sys.exit(0)

total = len(candidates)
print(f"🔍 약속 코어 키워드 추출: {total}건")

# §2·§3·§5 본문 추출
body_lines = []
in_target = False
for line in lines:
    if re.match(r'^## (2|3|5)\.', line) or re.match(r'^## 2 ', line) or re.match(r'^## 3 ', line) or re.match(r'^## 5 ', line):
        in_target = True
        continue
    if re.match(r'^## [4-9]\.', line) or re.match(r'^## (변경 이력|연관 화면|상태별)', line):
        if not re.match(r'^## 5', line):
            in_target = False
    if in_target:
        body_lines.append(line)

body = '\n'.join(body_lines)

match = 0
miss = []
for keyword in sorted(candidates):
    if keyword in body:
        match += 1
    else:
        miss.append(keyword)

print("═══════════════════════════════════════════")
print("변경 이력 ↔ 본문 자가 검증 결과")
print("═══════════════════════════════════════════")
print(f"약속 키워드: {total}건")
print(f"✅ 본문 매칭: {match}건")

if not miss:
    print("✅ 누락: 0건 — 정합")
    sys.exit(0)
else:
    print(f"⚠️  누락 후보: {len(miss)}건")
    print()
    for kw in miss:
        print(f'  - "{kw}"')
    print()
    print("💡 권장 조치:")
    print("   - 누락 키워드가 §2·§3·§5 본문에 실제 항목으로 반영되었는지 확인")
    print("   - 메타 표현이면 변경 이력 entry에서 강조/따옴표 제거 권장")
    sys.exit(1)
PYEOF
