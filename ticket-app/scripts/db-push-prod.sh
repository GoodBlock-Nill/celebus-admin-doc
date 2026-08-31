#!/usr/bin/env bash
# 예매 웹 마이그레이션을 프로덕션 프로젝트(CELEBUS-Feedback)에 적용.
# 사내 규약: dev(./scripts/db-push-dev.sh) 선검증을 마친 파일만 적용한다.
#
# ⚠️ 시드 파일(*_ticket_seed.sql)은 기본 제외 — 테스트 공연·계좌가 들어 있어
#    프로덕션 투입 금지. 꼭 필요하면 파일명을 명시 인자로 넘겨야만 적용된다.
# ⚠️ psql 기반 사유는 db-push-dev.sh 주석 참조 (공용 프로젝트 이력 충돌 회피).
#
# 사용법:
#   ./scripts/db-push-prod.sh              # 시드 제외 전체 적용
#   ./scripts/db-push-prod.sh 20260831140000_ticket_schema.sql   # 특정 파일만
set -euo pipefail
cd "$(dirname "$0")/.."

PSQL="${PSQL_BIN:-/opt/homebrew/opt/libpq/bin/psql}"
[[ -x "$PSQL" ]] || PSQL="$(command -v psql || true)"
if [[ -z "$PSQL" ]]; then
  echo "psql을 찾을 수 없습니다. PSQL_BIN 환경변수로 경로를 지정하세요." >&2
  exit 1
fi

URL_FILE=".env.prod-db-url"
if [[ ! -f "$URL_FILE" ]]; then
  echo "프로덕션 DB 접속 파일(.env.prod-db-url)이 없습니다." >&2
  exit 1
fi
DB_URL=$(tr -d '\r\n' < "$URL_FILE")

if [[ $# -gt 0 ]]; then
  FILES=()
  for arg in "$@"; do FILES+=("supabase/migrations/$(basename "$arg")"); done
else
  FILES=()
  while IFS= read -r f; do
    [[ "$f" == *_ticket_seed.sql ]] && { echo "⏭  시드 제외: $(basename "$f")"; continue; }
    FILES+=("$f")
  done < <(ls -1 supabase/migrations/*.sql | sort)
fi

echo "⚠️  프로덕션(CELEBUS-Feedback)에 ${#FILES[@]}개 파일을 적용합니다."
for f in "${FILES[@]}"; do
  version="$(basename "$f" | cut -d_ -f1)"
  name="$(basename "$f" .sql | cut -d_ -f2-)"
  echo "▶ 적용: $(basename "$f")"
  "$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 --single-transaction -q -f "$f"
  "$PSQL" "$DB_URL" -v ON_ERROR_STOP=1 -q -c \
    "insert into supabase_migrations.schema_migrations (version, name)
     values ('${version}', '${name}') on conflict (version) do nothing;"
  echo "  완료"
done

echo "프로덕션 적용 완료 (${#FILES[@]}건)"
