#!/usr/bin/env bash
# contest-app SQL 파일을 dev 프로젝트에 적용 (프로드 적용 전 필수 검증).
# 사용: ./scripts/db-apply-dev.sh supabase/008_xxx.sql
# 프로드 적용은 검증 후 Supabase 대시보드 SQL Editor(프로드)에서 실행.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f "${1:?사용법: db-apply-dev.sh <sql파일>}" ] || { echo "파일 없음: $1"; exit 1; }
PW=$(cat .env.dev-db-password)
docker run --rm -i postgres:16-alpine psql \
  "postgresql://postgres.mqprgrvlyrqtuctzglxs:${PW}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" \
  -v ON_ERROR_STOP=1 -f - < "$1"
