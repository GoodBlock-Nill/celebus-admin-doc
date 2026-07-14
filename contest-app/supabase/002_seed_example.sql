-- ============================================================
-- FanStage 002 (선택): 개발용 예시 콘테스트 seed
-- 관리자 UI로 생성해도 됨 — 로컬 개발 편의를 위한 예시.
-- ============================================================

insert into contests (slug, artist, contest_type, title, description, rules, prize_summary, prizes, status,
                      submit_start_at, submit_end_at, vote_end_at, announce_at)
values (
  'v01d-fancam-2026',
  'V01D',
  'video',
  'V01D 팬캠·커버 영상 콘테스트',
  'V01D를 향한 마음을 영상으로 보여주세요. 팬캠, 커버 댄스, 커버 보컬, 편집 영상 모두 환영해요 💜',
  E'1. 본인이 직접 만든(참여한) 작품만 출품할 수 있어요.\n2. 타인의 저작물·초상권을 침해하는 작품은 실격 처리돼요.\n3. 동일 작품의 중복 출품은 불가해요.\n4. 수상 시 입력한 SNS 핸들로 본인 확인을 진행해요.',
  '1위 V01D 전원 친필 싸인 앨범',
  '[
    {"rank_label":"인기상 1위","name":"V01D 전원 친필 싸인 앨범","award_type":"popular","count":1},
    {"rank_label":"인기상 2위","name":"V01D 공식 포토카드 세트","award_type":"popular","count":1},
    {"rank_label":"심사상","name":"V01D 미공개 디지털 포토카드","award_type":"judge","count":3}
  ]'::jsonb,
  'open',
  now(),
  now() + interval '14 days',
  now() + interval '17 days',
  now() + interval '21 days'
);
