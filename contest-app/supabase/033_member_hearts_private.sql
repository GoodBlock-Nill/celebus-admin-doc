-- 033: 멤버 하트 비공개화 — 팬은 멤버 하트(누가·몇 개)를 볼 수 없다.
-- (ix 피드백: 멤버가 특정 팬 영상에 좋아요를 눌렀다는 사실이 공개되면 편애 논란 소지)
-- 업로더 본인 익명 집계 + 멤버 본인 토글 상태는 인증 라우트(/api/stage/mine, service_role)로만 제공.
-- 멤버 하트 데이터/토글(member_toggle_heart RPC)은 유지 — 표시만 비공개로 전환.

revoke select on member_hearts_public from anon, authenticated;
