-- 027: 점수 위조 방어 Step 2a — 입력 로그 수집 기반(섀도우 준비). 점수 계산·거부 변경 없음(additive).
--   moves: 클라이언트 입력 로그(스왑·아이템·이어하기 + 상대 타이밍). client_score: 대조용 클라 제출 점수.
--   추후 서버 리플레이 엔진이 이 로그로 점수를 재계산해 대조(shadow) 후 권위 전환.
alter table game_match add column if not exists moves jsonb;
alter table game_match add column if not exists client_score int;
