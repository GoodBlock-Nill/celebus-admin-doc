-- 034: 아티스트인기상(멤버 픽) 비공개화 — 팬은 어느 영상을 어느 멤버가 픽했는지 볼 수 없다.
-- (ix 편애 논란 차단: 멤버 하트[033]와 동일 취지. 멤버 픽 비교 데이터 공개 차단)
-- 아티스트인기상 수상작(단일)은 발표 결과에 익명으로 표시 — computeAwards가 base 테이블을
-- service_role로 집계하므로 이 회수의 영향 없음. 멤버 본인 픽 설정/조회는 인증 라우트 경유.

revoke select on member_event_picks_public from anon, authenticated;
