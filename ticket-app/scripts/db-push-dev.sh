#!/usr/bin/env bash
# 예매 웹 마이그레이션을 dev 프로젝트(celeb-match-dev)에 적용 — 프로드 push 전 필수 검증 단계.
# 사내 규약(2026-07-28): dev 선검증 → 프로드 push. 프로드 적용은 별도 판단·별도 명령으로만.
#
# ⚠️ game-app/scripts/db-push-dev.sh와 달리 `supabase db push`를 쓰지 않는다.
#    dev 프로젝트는 위성 앱 공용이라 원격 마이그레이션 이력에 game-app 항목이 다수 존재하고,
#    ticket-app 폴더에는 그 파일들이 없어 CLI가 "Remote migration versions not found in
#    local migrations directory"로 중단한다(이력 repair는 game-app 이력을 훼손하므로 금지).
#    대신 psql로 파일을 순서대로 적용하고, 적용 이력을 표준 이력 테이블에 함께 기록한다.
#    마이그레이션 파일은 모두 멱등(create if not exists / or replace / on conflict)이라 재실행 안전.
#
# 사용법:
#   ./scripts/db-push-dev.sh              # supabase/migrations/*.sql 전체 적용
#   ./scripts/db-push-dev.sh 20260831140000_ticket_schema.sql   # 특정 파일만 적용
set -euo pipefail
cd "$(dirname "$0")/.."

PSQL="${PSQL_BIN:-/opt/homebrew/opt/libpq/bin/psql}"
[[ -x "$PSQL" ]] || PSQL="$(command -v psql || true)"
if [[ -z "$PSQL" ]]; then
  echo "psql을 찾을 수 없습니다. PSQL_BIN 환경변수로 경로를 지정하세요." >&2
  exit 1
fi

PW_FILE=".env.dev-db-password"
[[ -f "$PW_FILE" ]] || PW_FILE="../game-app/.env.dev-db-password"
if [[ ! -f "$PW_FILE" ]]; then
  echo "dev DB 비밀번호 파일(.env.dev-db-password)을 찾을 수 없습니다." >&2
  exit 1
fi

PW=$(tr -d '\r\n' < "$PW_FILE")
DB_URL="postgresql://postgres.mqprgrvlyrqtuctzglxs:${PW}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

if [[ $# -gt 0 ]]; then
  FILES=()
  for arg in "$@"; do FILES+=("supabase/migrations/$(basename "$arg")"); done
else
  FILES=()
  while IFS= read -r f; do FILES+=("$f"); done < <(ls -1 supabase/migrations/*.sql | sort)
fi

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

echo "dev 적용 완료 (${#FILES[@]}건)"
