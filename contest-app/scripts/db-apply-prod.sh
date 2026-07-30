#!/usr/bin/env bash
# contest-app SQL 파일을 프로드 프로젝트에 적용.
# ⚠️ 반드시 db-apply-dev.sh 로 dev 선검증 후에만 실행.
# 사용: ./scripts/db-apply-prod.sh supabase/013_xxx.sql [supabase/014_xxx.sql ...]
#
# 접속: 프로드 전체 접속 URL을 .env.prod-db-url 파일에 저장(gitignore).
#   Supabase 대시보드 → 프로드 프로젝트 → Connect → Session pooler URI 복사.
#   예) postgresql://postgres.kvnareycturmavnyaqws:<PW>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
set -euo pipefail
cd "$(dirname "$0")/.."

[ $# -ge 1 ] || { echo "사용법: db-apply-prod.sh <sql파일> [sql파일 ...]"; exit 1; }
[ -f .env.prod-db-url ] || { echo "❌ .env.prod-db-url 없음 — 프로드 접속 URL을 이 파일에 저장하세요(Supabase Connect)."; exit 1; }
DB_URL=$(cat .env.prod-db-url)

# 존재 검증
for f in "$@"; do [ -f "$f" ] || { echo "파일 없음: $f"; exit 1; }; done

echo "▶ 프로드에 적용할 파일 ($#개):"
for f in "$@"; do echo "   - $f"; done
read -r -p "정말 프로드에 적용할까요? 'yes' 입력: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "취소됨."; exit 1; }

for f in "$@"; do
  echo "── 적용: $f"
  docker run --rm -i postgres:16-alpine psql "$DB_URL" -v ON_ERROR_STOP=1 -f - < "$f"
done
echo "✅ 프로드 적용 완료 ($#개)"
