#!/usr/bin/env bash
#
# sync-check.sh — 기획서 ↔ 프로토타입 정합 1차 검증 스크립트
#
# 사용법:
#   v2/scripts/sync-check.sh CEB-BO-APP-201
#   v2/scripts/sync-check.sh APP/201
#   v2/scripts/sync-check.sh APP/201 --fuzzy   # 부분 일치 허용
#
# 동작:
#   1) 매트릭스 파일 v2/sync-matrix/<화면 ID>.md 에서 (명세 파일, 프로토타입 파일) 매핑 조회
#   2) 매트릭스 없으면 v2/BO/<영역>/ 안에서 <화면 ID> 명세 파일 자동 탐색
#   3) 명세 표에서 한국어 라벨 추출 (heuristic: 첫 컬럼이 한국어 단어인 표 행)
#   4) 프로토타입 파일(매트릭스 기재 또는 휴리스틱)에서 라벨 grep
#   5) 매칭 N건 / 누락 N건 출력
#
# 종료 코드: 0 = 누락 0건, 1 = 누락 검출, 2 = 입력/탐색 오류

set -uo pipefail
export LC_ALL=en_US.UTF-8 2>/dev/null || true

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

FUZZY=0
SCREEN=""

for arg in "$@"; do
  case "$arg" in
    --fuzzy) FUZZY=1 ;;
    -h|--help)
      sed -n '3,18p' "$0"
      exit 0 ;;
    *) SCREEN="$arg" ;;
  esac
done

if [[ -z "$SCREEN" ]]; then
  echo "사용법: $0 <화면 ID 또는 영역/번호> [--fuzzy]"
  echo "예시: $0 CEB-BO-APP-201"
  echo "예시: $0 APP/201"
  exit 2
fi

# 입력 정규화: "APP/201" → "CEB-BO-APP-201"
if [[ "$SCREEN" =~ ^([A-Z]+)/([0-9]+(-[A-Z]+)?)$ ]]; then
  AREA="${BASH_REMATCH[1]}"
  NUM="${BASH_REMATCH[2]}"
  SCREEN="CEB-BO-${AREA}-${NUM}"
fi

# 화면 ID에서 영역 추출
if [[ "$SCREEN" =~ ^CEB-BO-([A-Z]+)- ]]; then
  AREA="${BASH_REMATCH[1]}"
else
  echo "❌ 화면 ID 형식 오류: $SCREEN (CEB-BO-{영역}-{번호} 형식 필요)"
  exit 2
fi

# 1) 매트릭스 조회
MATRIX_FILE="$ROOT/sync-matrix/${SCREEN}.md"
SPEC_FILE=""
PROTO_FILE=""

PROTO_FILES=()

if [[ -f "$MATRIX_FILE" ]]; then
  # 첫 번째 백틱 쌍만 추출 (두 번째 백틱 그룹은 타입명 등 보조 정보)
  SPEC_FILE=$(grep -E "^\| 명세 파일" "$MATRIX_FILE" | head -1 | sed -E 's/[^`]*`([^`]+)`.*/\1/')
  # 프로토타입 관련 행 모두 수집 (페이지·파일·폼·컴포넌트·데이터 모델·보조 파일)
  while IFS= read -r line; do
    path=$(echo "$line" | sed -E 's/[^`]*`([^`]+)`.*/\1/')
    # path가 실제 경로처럼 보일 때만 (슬래시 또는 .확장자 포함)
    if [[ -n "$path" && "$path" != "—" && ( "$path" == */* || "$path" == *.* ) ]]; then
      PROTO_FILES+=("$path")
    fi
  done < <(grep -E "^\| 프로토타입 (페이지|파일|폼|컴포넌트|데이터|신규|보조)" "$MATRIX_FILE")
  echo "📋 매트릭스: $MATRIX_FILE"
fi

# 2) 매트릭스가 없거나 명세 파일이 비어 있으면 자동 탐색
if [[ -z "${SPEC_FILE:-}" || ! -f "$REPO_ROOT/$SPEC_FILE" ]]; then
  CANDIDATE=$(find "$ROOT/BO/$AREA" -maxdepth 1 -name "[${SCREEN}]*.md" 2>/dev/null | head -1)
  if [[ -z "$CANDIDATE" ]]; then
    CANDIDATE=$(find "$ROOT/BO/$AREA" -maxdepth 1 -name "*${SCREEN}*.md" 2>/dev/null | head -1)
  fi
  if [[ -n "$CANDIDATE" ]]; then
    SPEC_FILE="${CANDIDATE#$REPO_ROOT/}"
  fi
fi

if [[ -z "${SPEC_FILE:-}" ]]; then
  echo "❌ 명세 파일을 찾을 수 없음: $SCREEN (탐색 경로 v2/BO/$AREA/)"
  exit 2
fi

SPEC_PATH="$REPO_ROOT/$SPEC_FILE"
if [[ ! -f "$SPEC_PATH" ]]; then
  echo "❌ 명세 파일 존재하지 않음: $SPEC_PATH"
  exit 2
fi

echo "📄 명세: $SPEC_FILE"

if [[ ${#PROTO_FILES[@]} -eq 0 ]]; then
  echo "⚠️  프로토타입 파일이 매트릭스에 기재되지 않음."
  echo "    매트릭스 ($MATRIX_FILE)에 '| 프로토타입 페이지 | — | \`경로/파일.tsx\` |' 형식 행을 추가하세요."
  exit 2
fi

# 존재하지 않는 파일 제외
VALID_PROTO_FILES=()
for pf in "${PROTO_FILES[@]}"; do
  if [[ -f "$REPO_ROOT/$pf" ]]; then
    VALID_PROTO_FILES+=("$pf")
  else
    echo "⚠️  프로토타입 파일 누락(매트릭스 기재됨): $pf"
  fi
done

if [[ ${#VALID_PROTO_FILES[@]} -eq 0 ]]; then
  echo "❌ 유효한 프로토타입 파일이 없음"
  exit 2
fi

echo "🧩 프로토타입 ${#VALID_PROTO_FILES[@]}개 파일:"
for pf in "${VALID_PROTO_FILES[@]}"; do
  echo "    - $pf"
done
echo ""

# 3) 명세 §2 입력 폼 섹션에서만 한국어 라벨 추출
# - §2 (## 2.) 헤더 ~ §3 (## 3.) 직전까지의 표만 처리
# - 페이지 properties(상단)와 변경 이력(하단)은 제외
LABELS=$(awk -F'|' '
  /^## 2\./ { in_section = 1; next }
  /^## [3-9]\./ { in_section = 0 }
  in_section && /^\|/ && NF >= 3 {
    label = $2
    gsub(/^[ \t]+|[ \t]+$/, "", label)
    if (label ~ /^-+$/ || label == "") next
    gsub(/[`*_]/, "", label)
    # 한글 포함된 행만 추출
    if (label ~ /[가-힣]/) {
      print label
    }
  }
' "$SPEC_PATH" | sort -u)

TOTAL=$(echo "$LABELS" | grep -c .)
MATCH=0
MISS_LIST=""

while IFS= read -r label; do
  [[ -z "$label" ]] && continue
  # 라벨 본체에서 괄호 보조 제거 ("타이틀 (KO/EN/JP)" → "타이틀")
  core=$(echo "$label" | sed -E 's/[ ]*\(.+\)[ ]*$//')
  # core가 너무 짧으면(2자 미만) 스킵 (false positive 감소)
  if [[ ${#core} -lt 2 ]]; then continue; fi

  # 매트릭스의 모든 프로토타입 파일 중 하나라도 매칭하면 OK
  FOUND=0
  for pf in "${VALID_PROTO_FILES[@]}"; do
    PROTO_PATH="$REPO_ROOT/$pf"
    if [[ $FUZZY -eq 1 ]]; then
      if grep -qF "$core" "$PROTO_PATH"; then
        FOUND=1; break
      fi
    else
      if grep -qF "$label" "$PROTO_PATH" || grep -qF "$core" "$PROTO_PATH"; then
        FOUND=1; break
      fi
    fi
  done

  if [[ $FOUND -eq 1 ]]; then
    MATCH=$((MATCH+1))
  else
    MISS_LIST+="  - \"$label\""$'\n'
  fi
done <<< "$LABELS"

MISS=$((TOTAL - MATCH))

echo "═══════════════════════════════════════════"
echo "검증 결과 — $SCREEN"
echo "═══════════════════════════════════════════"
echo "추출된 라벨: ${TOTAL}건"
echo "✅ 매칭: ${MATCH}건"

if [[ ${MISS} -eq 0 ]]; then
  echo "✅ 누락: 0건 — 정합"
  echo ""
  echo "💡 본 결과는 1차 자동 필터입니다. 의미 정합은 L3 위임 검증과 L4 매트릭스로 보강하세요."
  exit 0
else
  echo "⚠️  누락 후보: ${MISS}건"
  echo ""
  echo "$MISS_LIST"
  echo "💡 false positive 가능 — 라벨 표기 차이일 수 있습니다. --fuzzy 옵션으로 부분 일치 재시도 또는"
  echo "   L3 위임 검증으로 객관 재확인하세요."
  exit 1
fi
