-- ─────────────────────────────────────────────────────────────
-- 036: 홈 팝업 공지 이미지 업로드 버킷 (사용자 요청 — URL 붙여넣기 → 파일 업로드 전환)
--   member-avatars 버킷 패턴. 공개 읽기, 3MB, 이미지 mime 한정. 업로드는 관리자 라우트(service_role) 경유.
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notice-images', 'notice-images', true, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
