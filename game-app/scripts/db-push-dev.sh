#!/usr/bin/env bash
# 마이그레이션을 dev 프로젝트(celeb-match-dev)에 먼저 적용 — 프로드 push 전 필수 검증 단계.
# 프로드 적용은 기존대로: supabase db push  (CLI 링크 = 프로드)
set -euo pipefail
cd "$(dirname "$0")/.."
PW=$(cat .env.dev-db-password)
exec supabase db push --db-url "postgresql://postgres.mqprgrvlyrqtuctzglxs:${PW}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" "$@"
