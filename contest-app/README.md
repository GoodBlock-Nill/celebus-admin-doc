# CELEBUS FanStage — 콘테스트 파일럿 PWA

V01D 팬 콘테스트 파일럿. FanVoice(feedback-app)의 자매 서비스로, 같은 Supabase 프로젝트를 공유한다(`contest_*` 테이블).

- 출품: 직접 업로드 없이 **YouTube · TikTok · X · Instagram · Threads 링크 임베드**
- 순위: 무로그인 디바이스 투표(인기상) + 관리자 심사상
- 보상: 실물 굿즈 — 당첨자가 비밀번호 검증 후 배송정보 입력(claim)
- 콘테스트 유형: 영상(video) / 이미지(image)

## 셋업

1. `npm install`
2. `.env.local` — FanVoice와 같은 Supabase 값 사용 가능 (`.env.local.example` 참조). `ADMIN_PASSWORD`는 FanVoice와 **다른 값** 권장
3. Supabase SQL Editor에서 `supabase/001_contest_schema.sql` 실행 (필요 시 `002_seed_example.sql`)
4. `npm run dev` → http://localhost:3300 (관리자: `/admin`)

## 구조 요약

- 보안: 기반 테이블 RLS 전면차단 → 읽기는 `*_public` 뷰, 쓰기는 SECURITY DEFINER RPC(service_role)만 — FanVoice 001 패턴
- 임베드: `src/lib/embed/` — URL 파서(단축링크 resolve 포함) + 무토큰 oEmbed + 플랫폼별 렌더러. 리스트는 항상 썸네일 카드, 상세만 실제 임베드, 실패 시 폴백 카드
- 상태 머신: draft → open(접수+투표) → voting → judging(인기상 finalize + 심사상) → announced(클레임) → closed — 관리자 수동 전환 + RPC 시간 이중검증
- 투표 어뷰징: 디바이스 해시 dedup + 콘테스트당 일일 5표 + 시간당 20표 제한 (`contest_vote` RPC 파라미터)
- 계정연동 대비: `contest_entries.linked_user_id` 예약 컬럼

## 운영 체크리스트

- [ ] 콘테스트 발표(announced) 후 클레임 접수 → 발송 완료 → **개인정보 파기** 버튼 실행
- [ ] finalize(인기상 확정)는 judging 상태에서 1회만 — 실행 전 이상 득표(단시간 급증) 검토
- [ ] Instagram/Threads 링크는 실존 검증이 안 됨 — 신고 누적 탭 주기 확인
