#!/usr/bin/env bash
# 공식영상 일괄 등록(재사용) — dev/프로드 공용.
# seed-data/manifest.tsv 의 각 리스트(오래된순 URL)를 지정 카테고리로 30개씩 배치 등록한다.
# 등록 순서 = 파일의 위→아래(오래된순) → 앱에서 최신이 맨앞에 노출.
#
# 사용:
#   ./scripts/seed-official.sh <base_url> <stage_id> [admin_pw]
# 예)
#   dev : ./scripts/seed-official.sh http://localhost:3300 <dev_official_stage_id>
#   prod: ./scripts/seed-official.sh https://<prod-app-domain> <prod_official_stage_id> <prod_admin_pw>
#
# admin_pw 미지정 시: 환경변수 $ADMIN_PW → .env.local 의 ADMIN_PASSWORD 순으로 사용.
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${1:?사용법: seed-official.sh <base_url> <stage_id> [admin_pw]}"
STAGE_ID="${2:?stage_id 필요}"
ADMIN_PW="${3:-${ADMIN_PW:-}}"
if [ -z "$ADMIN_PW" ] && [ -f .env.local ]; then
  ADMIN_PW=$(grep -E '^ADMIN_PASSWORD=' .env.local | head -1 | sed 's/^ADMIN_PASSWORD=//' | tr -d '"')
fi
[ -n "$ADMIN_PW" ] || { echo "❌ admin 비밀번호 없음 — 인자/\$ADMIN_PW/.env.local 중 하나로 제공하세요."; exit 1; }

DATA_DIR="scripts/seed-data"
MANIFEST="$DATA_DIR/manifest.tsv"
[ -f "$MANIFEST" ] || { echo "❌ manifest 없음: $MANIFEST"; exit 1; }

echo "▶ 대상: $BASE_URL  stage=$STAGE_ID"
ACC=$(mktemp)   # 배치별 "added total" 누적

while IFS=$'\t' read -r FILE CATEGORY || [ -n "${FILE:-}" ]; do
  FILE="${FILE%%$'\r'}"; CATEGORY="${CATEGORY%%$'\r'}"
  [ -n "${FILE:-}" ] || continue
  LIST="$DATA_DIR/$FILE"
  [ -f "$LIST" ] || { echo "  ⚠ 리스트 없음: $LIST (건너뜀)"; continue; }
  COUNT=$(grep -c . "$LIST" || true)
  echo "── [$CATEGORY] $FILE (${COUNT}건)"
  TMP=$(mktemp -d)
  split -l 30 "$LIST" "$TMP/b_"
  for b in "$TMP"/b_*; do
    BODY=$(FILE_B="$b" STAGE_ID="$STAGE_ID" CATEGORY="$CATEGORY" python3 -c "
import json,os
urls=[l.strip() for l in open(os.environ['FILE_B']) if l.strip()]
print(json.dumps({'stage_id':os.environ['STAGE_ID'],'urls':urls,'category':os.environ['CATEGORY']}))
")
    RESP=$(curl -s -X POST "$BASE_URL/api/stage/admin/seed" \
      -H "Authorization: Bearer $ADMIN_PW" -H "Content-Type: application/json" -d "$BODY")
    echo "$RESP" | RESP_ENV="$RESP" python3 -c "
import sys,json,os
try:
  d=json.loads(os.environ['RESP_ENV'])
  a,t=d.get('added',0) or 0,d.get('total',0) or 0
  fail=[(r['url'].split('=')[-1], r.get('code')) for r in d.get('results',[]) if not r.get('ok')]
  print(f'   added={a} total={t}' + (f'  실패:{fail}' if fail else ''))
  open('$ACC','a').write(f'{a} {t}\n')
except Exception as e:
  print('   ERR', str(e)[:150]); open('$ACC','a').write('0 0\n')
"
  done
  rm -rf "$TMP"
done < "$MANIFEST"

read -r GA GT < <(awk '{a+=$1;t+=$2} END{print a+0, t+0}' "$ACC")
rm -f "$ACC"
echo "✅ 완료: 등록 $GA / 시도 $GT"
