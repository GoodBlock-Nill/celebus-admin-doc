# FanStage 감사 백로그 (배포 전 리뷰 결과)

로직·문구·UI/UX 3종 리뷰 결과. **P0(배포 전 필수)는 보완 완료**, 아래는 후속(P1/P2) 항목.

## ✅ P0 — 보완 완료 (2026-07)

### 보안·무결성
- 투표 무한 조작 → **IP 총량 스로틀(시간당 30) + IP+디바이스 결합 voter_hash** (실측: 40회 조작 시도 → 30에서 컷)
- XFF 스푸핑 → `getClientIp` 신뢰순위 `x-vercel-forwarded-for` → `x-real-ip` → xff
- 비밀번호 무차별 대입 → verify/claim/edit/delete에 IP+리소스별 스로틀(10분 8회) — 굿즈 탈취 방어
- admin 인증 → `timingSafeEqual` 상수시간 비교
- UUID 미검증 500 → 각 `[id]` 라우트에 `z.string().uuid()` 선검증(400)
- 수상 엔트리 삭제 고아화 → 관리자 삭제 시 award 존재 검사 후 차단

### 로직 (⚠️ `supabase/005_integrity_hardening.sql` 적용 필요)
- 신고 상태 가드(open/voting만) — 수상작 강제 숨김 방지
- 인기상 확정 중복 부분 유니크 인덱스 (경합 TOCTOU)
- 수정/삭제 `submit_end_at` 가드 — 마감 후 바꿔치기 방지
- 인기상 0표 수상 방지 (`vote_count > 0`)

### 문구·UI
- sw_agree EN에 "보상 회수" 조항 추가 / dday_over EN "Time's up"(status_closed와 구분)
- `document.documentElement.lang` 언어 전환 동기화 / aria-label i18n(nav·언어선택)
- 모달 닫기 히트영역 44px+aria+sticky 헤더 / 투표 버튼 터치타깃 상향
- 신고 confirm() → 바텀시트 모달 / 에러 화면 3곳 재시도 버튼(ErrorState)
- iPhone safe-area-inset 대응(viewportFit cover + 고정 CTA·모달 하단 패딩)
- 포디움 1위 강조 모바일 유지 / 위저드 1단계 버튼 pill 통일 / 관리자 역방향 전환 경고색

---

## 🔜 P1 — 다음 스프린트 (권장)

| # | 항목 | 파일 | 비고 |
|---|------|------|------|
| L | 에러 메시지 코드 기반 i18n | `schema.ts`, `api/**`, `i18n.ts` | 현재 검증 오류가 한국어 원문으로 EN/JA 사용자에 노출. code 반환 → `t(code)` 매핑으로 전환 |
| L | 실격 사유 공개 노출 + 안내 | `types.ts`, `contest_entries_public`, `EntryView` | "실격" 배지만 있고 사유·문의처 없음(차가운 UX) |
| L | 공유 OG 설명 언어 중립화 | `entry/[id]/page.tsx:19` | 항상 한국어 → `Accept-Language` 또는 중립 문구 |
| L | err_pw / claim_already 원인 분리 | `api/**`, `i18n.ts` | "비번 틀림 vs 시점 지남"을 code로 구분 |
| U | 실격 사유 prompt() → 인라인/모달 | `admin/EntriesPanel.tsx` | 관리자 UX |
| U | 관리자 수상 취소 이중 확인 | `admin/AwardsPanel.tsx` | 파괴적 액션 보호 |

## 🎨 P2 — 디자인 시스템 부채

- success/warning 색상 토큰화 (`@theme`에 `--color-success/warning`, emerald/amber 하드코딩 6개 파일 치환)
- 텍스트 크기 스케일 정리 (`text-[11px]`~`[15px]` 임의값 난립 → 5단계 커스텀 유틸)
- `accent-[#8b5cf6]` 체크박스 → `accent-primary` 매핑
- 홈 지난 콘테스트 섹션 톤다운(시각 위계)

## 파일럿 한계 (본 서비스 CELEBUS 계정연동 시 해소)
- 무로그인 특성상 투표·출품·신고가 IP·디바이스ID에 의존 — 소셜 로그인이 근본 해법(`linked_user_id` 예약 컬럼)
- 인메모리 스로틀은 서버리스 다중 인스턴스에서 best-effort — 트래픽 확대 시 Upstash 등으로 이전
- IG/Threads oEmbed 실존 검증 불가 — 신고+관리자 hide로 보완 중
