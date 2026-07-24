-- ─────────────────────────────────────────────────────────────
-- 2026-07-24 사용자(운영자) 요청: 파일럿 유저·랭킹 데이터 전체 초기화.
-- "아무도 가입하지 않은 초기 상태"로 — 프로필/점수/지갑/인벤/원장/출석/업로드 아바타 삭제.
-- 유지: game_config(설정)·game_item_catalog(가격)·game_banned_words(금칙어) — 유저 데이터 아님.
-- ─────────────────────────────────────────────────────────────

delete from game_scores;
delete from game_profiles;
delete from game_wallet;
delete from game_inventory;
delete from game_point_ledger;
delete from game_daily_claim;
delete from game_admin_log;

-- (업로드 아바타 원본은 Storage API로 별도 제거 — storage 테이블 직삭제는 Supabase가 금지)

-- 초기화 사실을 감사 로그에 1건 기록
insert into game_admin_log (action, detail)
values ('full_reset', '{"scope":"profiles/scores/wallet/inventory/ledger/daily/avatars","requested_by":"owner"}'::jsonb);
