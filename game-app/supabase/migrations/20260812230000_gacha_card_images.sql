-- ─────────────────────────────────────────────────────────────
-- 042: 럭키드로우 결과 카드 이미지 버킷 (사용자 요청 2026-08-12)
--   관리자가 풀 아이템별 카드 앞면 이미지를 업로드 — 카드 전체를 이미지로 채우고
--   보상명은 카드 하단(밖)에 표기. notice-images 버킷 패턴 (공개 읽기, 3MB, 이미지 한정).
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gacha-cards', 'gacha-cards', true, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
