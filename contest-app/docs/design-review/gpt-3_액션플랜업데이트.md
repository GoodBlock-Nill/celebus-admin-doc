# CELEBUS MOMENT — 디자인 검토 실행 계획 업데이트

**문서 버전:** v1.0 · 2026-07-29  
**문서 성격:** 기존 `CELEBUS-MOMENT-design-review-action-plan.md`에 대한 이번 전체 화면 리뷰/V01D 특화 리뷰 델타  
**대상:** Next.js 16 · React 19 · Tailwind v4 · Supabase · 한/영/일 PWA  
**이번 범위:** 12개 실앱 화면의 시각 QA, V01D 파일럿 특화, 디자인·카피·플로우·상태 요구  
**제외:** HTML/PWA 직접 수정, 보안·운영·배포·SSO 구현 자체

> 기준 원칙은 기존 액션플랜을 유지한다. 이 문서는 기존 문서를 대체하지 않고, **이번 리뷰에서 확정·추가·변경된 항목만** 정리한다.

## 1. 기존 액션플랜에서 이미 반영된 것

다음은 기존 액션플랜의 결정으로 유지한다.

### 브랜드·시각

- 라이트·뉴트럴 테마: `bg #F7F7FA`, `card #FFFFFF`.
- CELEBUS 바이올렛: `primary #6C4DE6`, `primary-strong #4E2FC0`, `primary-soft #F1EBFF`.
- 큰 그림자 대신 `border #E6E6ED` + `shadow-sm`.
- 태그라인 `Your moment. Their response.` 유지.
- 글로우·네온·컨페티·과도한 게임화 배제.
- Pretendard, 모바일 390–430px 우선, reduced-motion 존중.
- `CELEBUS MOMENT` 워드마크를 브랜드 자산으로 분리.

### IA·탐색

- 사용자 하단 탭은 `홈 · 공연 · ＋ · 이벤트 · 마이`.
- 내부 데이터 모델·라우트에서 `stage`를 유지할 수 있으나 사용자 UI에는 `공연`을 사용.
- 공개 콘텐츠는 로그인 없이 열람하고, 하트·댓글·업로드·투표·마이 상호작용에서 로그인 유도.
- 영상 공유/알림 유입은 `/video/[id]` deep link로 처리.
- 로그인 후 원래 의도와 위치로 복귀.

### 멤버 반응·카피

- 팬 좋아요와 멤버 하트를 분리.
- 멤버 조회·하트·댓글을 구분하고 실제 이벤트가 있을 때만 표시.
- 전원 반응은 대상 멤버 전원의 **하트**가 확인된 경우 `그랜드슬램`으로 제한.
- 조회/하트를 같은 의미로 쓰지 않음. `하트=하트`.
- V01D 특화 라벨 `V01D 아카이브`, `V01D Pick` 유지.

### 핵심 플로우

- 공연 발견 → 영상 열람 → 영상 올리기 → 멤버 반응 대기 → 알림 → 영상 상세 → 자랑 카드의 루프를 제품 중심 플로우로 삼음.
- 업로드 URL preview와 지원하지 않는 플랫폼·비공개·중복·마감·게시 실패 상태를 설계 대상으로 포함.
- 화면 인벤토리를 `Visual reviewed / Spec defined / Needs state review`로 분리.

## 2. 이번 리뷰에서 신규로 추가된 사항

### 2.1 게스트 열람과 로그인 게이트를 명시적으로 분리 — P0

전체 화면 리뷰의 로그인 유도 모달은 영상 화면 위에서 보이므로, 공개 영상 열람까지 막는 구조로 구현되면 공유 유입이 끊길 위험이 있다.

**신규 확정안**

- `/video/[id]`의 공개 임베드·영상 제목·댓글 열람은 guest 허용.
- 로그인 유도는 팬 하트, 댓글 작성, 업로드, 월드컵 투표, 마이 상호작용에서만 호출.
- `Login Prompt Modal`은 `intent`와 `returnTo`를 저장한다.
- 로그인 완료 후 영상·댓글·월드컵 대진·업로드 시트의 동일 위치/단계로 복귀한다.
- 모달에는 `로그인`과 `닫기`를 모두 제공한다. 로그인 없이 콘텐츠를 소비할 수 있는 구조를 해치지 않는다.

### 2.2 썸네일 텍스트 대비를 공통 카드 계약으로 승격 — P0

화면 3·9 등에서 밝은 썸네일 위 텍스트가 약해질 수 있다.

**신규 확정안**

- `Video Card`·`Hero Card` 썸네일 하단에만 dark overlay를 둔다.
- `#F7F7FA` 배경, 콘텐츠 썸네일 색상 우선 원칙은 유지한다.
- 흰색 텍스트를 이미지 위에 직접 얹지 않는다.
- overlay가 있어도 읽히지 않는 경우 메타를 카드 본문으로 이동한다.
- 390px·430px에서 WCAG 대비와 실제 사진 샘플을 함께 QA한다.

### 2.3 멤버 하트와 팬 좋아요를 의미·레이아웃에서 분리 — P0

전체 화면 리뷰에서 하트 아이콘이 팬 좋아요와 멤버 반응에 함께 쓰여 혼동 가능성이 확인되었다.

**신규 확정안**

- 팬 좋아요: 일반 `action row`, 사용자 액션.
- 멤버 하트: `member reaction badge` 및 reaction line, 공식 멤버 아바타·검증 체크.
- 아이콘을 임의로 별/왕관으로 바꾸지 않는다. 하트 행동의 정직성을 유지하면서 컨테이너·레이블·아바타로 구분한다.
- 멤버 조회는 하트로 시각화하지 않는다.
- 반응이 없는 영상에는 멤버 reaction line을 노출하지 않는다.

### 2.4 화면별 상태 계약을 개발 티켓 필수 항목으로 추가 — P0/P1

12개 화면은 기본 화면 중심으로 검토되었고, Skeleton/Empty/Error/NotFound/Auth 상태는 별도 확인이 필요하다.

**신규 확정안**

- 모든 주요 화면에 `Loading`, `Empty`, `Error + 다시 시도`, `NotFound`, 필요한 경우 `Auth`를 정의.
- 영상 상세: 임베드 실패·비공개·삭제·NotFound.
- 업로드: URL validating·unsupported·invalid·private·duplicate·closed performance·post failure.
- 알림: 읽음/안읽음·알림 없음·pagination·Error.
- 마이: guest·탭별 Empty·통계 Loading.
- 월드컵: 현재 라운드·투표 잔여·3회 cap·나가기·결과 Loading.

## 3. 이번 리뷰에서 변경된 사항

### 3.1 브랜드 그라데이션 적용 대상 — 기존 규칙을 더 엄격하게 변경

**이전 문서의 불일치**

- `celebus-moment-review-packet.md`에는 `MOMENT` 텍스트와 ＋ 버튼에 그라데이션이라고 기재되어 있음.
- 실제 리뷰 캡처의 `CELEBUS MOMENT`, 태그라인, 히어로 등에 그라데이션이 더 넓게 사용됨.

**변경 후 최종 규칙**

| 대상 | 처리 |
|---|---|
| `CELEBUS` | `#A855E8 → #6C4DE6` 브랜드 그라데이션 |
| `MOMENT` | `fg #17171C` 솔리드 |
| 올리기 `＋` 버튼 | `Gradient` 버튼 허용 |
| 태그라인 | `muted #686A76` 또는 `fg #17171C` 단색 |
| 히어로 배경 | 실제 영상 썸네일, UI 그라데이션 금지 |
| 멤버 반응 | `primary-soft #F1EBFF` + `primary-strong #4E2FC0` |
| 일반 CTA/탭/칩 | `primary #6C4DE6` 또는 `fg`, 솔리드 |

### 3.2 V01D 특화의 강도 — 중간 강도의 콘텐츠/데이터 특화로 고정

**유지·확정**

- `V01D 아카이브`: 공연별 영상 탐색의 상위 라벨.
- `V01D Pick`: 실제 멤버 하트 영상만 모은 `/hearts` 페이지/섹션.
- 공식 멤버명·파트·아바타·`이 멤버가 반응한 영상` 필터는 1차 특화 범위.
- 멤버 반응에는 공식 아바타와 검증 체크를 사용.

**이번 단계에서 보류**

- 공식 승인 전 임시 멤버 시그니처 컬러의 토큰화.
- 밴드 악기·앰프·아날로그 질감·무대 장식의 상시 UI 배경화.
- `D10V/디오브` 팬 레벨·뱃지·슬로건의 전역 노출.
- 싸인 포카/폴라로이드 보상과 멤버 제공 seed 영상의 운영·보상 UX.

**이유**

V01D의 정체성은 실제 아티스트 데이터·멤버 반응·공연 콘텐츠가 담당하고, CELEBUS MOMENT의 라이트·뉴트럴 UI는 콘텐츠를 담는 안정적인 프레임으로 유지한다. 공식 브랜드 자산과 운영 정책이 확정된 후 별도 후속 티켓으로 확대한다.

### 3.3 알림을 핵심 루프의 일급 화면으로 승격

기존 문서는 알림을 루프에 포함했지만 시각 검토 화면에서는 별도 동작 계약이 약했다.

**변경 후**

- `Notification Item`은 `view / heart / comment` 이벤트 타입을 구분한다.
- payload는 최소 `videoId`, `reactionType`, `commentId?`, `createdAt`, `readAt`를 갖는다.
- 클릭 시 `/video/[id]`로 이동하고 `focusReaction` 또는 `commentId`로 해당 위치를 강조한다.
- 뒤로가기는 알림 목록의 scroll position과 읽음 상태를 복원한다.
- 문구는 실제 행동에 맞춘다: `주연 님이 회원님의 영상에 하트를 보냈어요` 등.

## 4. 화면별 델타

| 화면 | 이미 반영된 것 | 신규 델타 | 변경·확정된 구현 방향 |
|---|---|---|---|
| 홈 `/` | 실제 영상 중심 히어로, 멤버 반응 우선, V01D 아카이브/Pick | dark overlay, 데이터 없는 섹션 자동 숨김, section CTA 명확화 | 멤버 댓글 → 하트 수 → 전원 하트 → 팬 좋아요 순으로 Hero 후보 선정 |
| V01D 아카이브 `/stages` | 진행/보관, 공연 카드, 날짜·영상 수·상태칩 | V01D와 공연의 관계 설명, 보관 카드 비활성화 | 헤더 `V01D 아카이브`, 보조 `공연별로 팬 영상을 모아보는 아카이브예요.` |
| 공연 상세 `/stage/[id]` | 카테고리 칩, 2열 그리드, 정렬 분리 | 썸네일 대비, 멤버/팬 반응 분리, 44px 터치 | `Video Card`를 `/video/[id]` 링크로 연결하고 reaction line 조건부 렌더 |
| 영상 상세 `/video/[id]` | 외부 임베드, 댓글, 자랑/원본/신고 | 게스트 열람, reaction focus deep link, 임베드 오류 | 공개 열람은 guest; interaction만 Auth; `returnTo`·`focusReaction` 보존 |
| 올리기·공연 선택 | 로그인 게이트, 공연 선택 | intent 복귀, 마감/보관 비활성 | `intent=upload`, `step=performance-select` 저장 후 동일 sheet 복귀 |
| 올리기·폼 | URL→미리보기→카테고리→게시 | URL-first 검증·예외 상태·보장형 카피 제거 | 성공 전 게시 disabled, 실패 유형별 inline error + retry |
| 이벤트 `/events` | 월드컵 + V01D Pick | 두 기능의 목적 분리 | 진행 중 이벤트와 V01D Pick을 별도 section/card로 렌더 |
| 월드컵 플레이 | 대결·우승작·랭킹 | Exit/back, 잔여 횟수, 결과 정의 | `3 / 8`, `이번 이벤트 투표 1/3` 등 상태 표시 |
| V01D Pick `/hearts` | 실제 멤버 하트 콘텐츠, 그랜드슬램 | 반응 없는 콘텐츠 금지, 카드 대비 | 모든 멤버 heart 충족 시에만 그랜드슬램 표시 |
| 마이 `/my` | 프로필·통계·탭·반응 대기/하트 수신 | 중앙 업로드 CTA, 통계 정의 | Empty State에 `영상 올리기` CTA 추가 |
| 알림 | 멤버 하트 문구·영상 딥링크 | 타입·payload·reaction focus | view/heart/comment별 `Notification Item`, 클릭 시 정확한 위치 복귀 |
| 로그인 모달 | 상호작용 시 노출 구조 | 공개 열람 차단 방지, dismiss/복귀 | guest browsing 유지, interaction-only Auth |

## 5. 변경하지 않는 제약

- 라이트·뉴트럴 + CELEBUS 바이올렛.
- 멤버 반응 절제, 글로우·컨페티 없음.
- 카피 정직: 조회는 조회, 하트는 하트, 댓글은 댓글.
- 하단 탭 `홈 · 공연 · ＋ · 이벤트 · 마이`.
- 영상 canonical deep link `/video/[id]`.
- 로그인 후 의도 복귀.
- 사용자 UI `공연`, 내부 `stage` 유지 가능.
- V01D 라벨 `V01D 아카이브`, `V01D Pick`.
- 한/영/일, 모바일 390–430px 우선.

## 6. 업데이트된 실행 순서

### Sprint 0 — 제품 계약 고정

1. `CELEBUS/MOMENT` 그라데이션·토큰 계약.
2. `공연` 사용자 용어와 내부 `stage` 범위.
3. view/heart/comment/all-hearts 이벤트·카피·통계 정의.
4. guest browsing, interaction-only Login Prompt, `returnTo`/`intent` 계약.
5. V01D 1차 특화 범위와 보류 범위 승인.

### Sprint 1 — 핵심 루프 구현

1. `/video/[id]` guest deep link 및 브라우저 back.
2. 알림 → 영상 상세 → reaction/comment focus 복귀.
3. 올리기 URL-first preview, 검증/실패/마감/중복 상태.
4. 멤버/팬 반응 분리 및 실제 이벤트 조건부 렌더.
5. 홈 Hero, 공연 상세, V01D Pick의 thumbnail overlay/대비.

### Sprint 2 — 화면 상태·이벤트 품질

1. `/stages`, `/events`, `/my`, 알림의 Loading/Empty/Error.
2. 월드컵 Exit/back, 잔여 투표, cap, 결과 설명.
3. Login Prompt Modal의 intent 복귀와 Auth Error.
4. 390/430px 터치 영역·키보드·focus·reduced-motion QA.

### Sprint 3 — V01D 확장/후속 검토

1. 공식 멤버 컬러·프로필이 승인된 경우에만 signature token 검토.
2. 멤버별/곡별/공연 유형 filter의 데이터 가용성 검토.
3. D10V/디오브 카피·배지·슬로건 실험.
4. V01D Pick 보상·seed 콘텐츠 운영 정책 확정 후 별도 UX 설계.

## 7. 업데이트 Definition of Done

- [ ] 공개 `/video/[id]` 링크를 로그인 없이 열람할 수 있다.
- [ ] 하트·댓글·업로드·투표 시에만 `Login Prompt Modal`이 열리고, 로그인 후 동일 의도로 복귀한다.
- [ ] 알림 클릭이 정확한 영상·반응/댓글 위치로 이동한다.
- [ ] 팬 좋아요·멤버 조회·멤버 하트·멤버 댓글이 데이터와 UI에서 분리된다.
- [ ] `V01D Pick`에는 실제 멤버 하트 영상만 노출된다.
- [ ] `CELEBUS`만 그라데이션, `MOMENT`는 `fg` 솔리드이며, 그라데이션은 올리기 버튼 외 일반 UI에 퍼지지 않는다.
- [ ] 사용자 화면에 `스테이지`/`무대`가 잔존하지 않고 `공연`으로 표시된다.
- [ ] 썸네일 text contrast와 44×44px touch target을 390px·430px에서 확인했다.
- [ ] 각 주요 화면의 Loading/Empty/Error/NotFound/Auth 상태가 구현·검토되었다.
- [ ] 월드컵 종료·나가기·투표 cap·결과 정의가 구현되었다.
- [ ] V01D 보류 범위가 공식 승인 없이 전역 UI에 들어가지 않았다.
