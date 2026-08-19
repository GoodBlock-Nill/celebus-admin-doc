-- 045: 스케치 AI 검수 v2 (P0~P2 개선, 2026-08-19)
--   P0: 자동 반려(rejected) 감사 가능화는 API 레벨 — 스키마 변경 없음
--   P2: 판정용 렌더 PNG 재사용 — 썸네일 버킷 + thumb_url (관리자 큐·향후 공유 카드)

alter table game_sketch_drawing add column if not exists thumb_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sketch-thumbs', 'sketch-thumbs', true, 1048576, array['image/png'])
on conflict (id) do nothing;
