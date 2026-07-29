# CELEBUS MOMENT — 통합 UI/UX 이슈 리스트

**문서 버전:** v1.0 · 2026-07-29  
**대상:** Next.js 16 · React 19 · Supabase 기반 V01D 전용 파일럿  
**근거 자료:** `CELEBUS MOMENT · 전체 화면 리뷰.html` 12개 실앱 캡처, `celebus-moment-review-packet.md`, `v01d-specialization-review-packet.md`, 기존 `CELEBUS-MOMENT-design-review-action-plan.md`  
**범위:** 디자인·카피·플로우·상태·접근성. 보안·운영·배포·SSO 구현 자체는 제외한다.  
**전제:** 이 문서는 HTML을 직접 수정하지 않고, 개발 에이전트가 Next.js/React/Supabase 구현 티켓으로 사용할 수 있도록 작성한다.

## 0. 확정 원칙

**컴포넌트 명칭 고정:** 이 문서에서 개발 티켓이 참조하는 컴포넌트는 리뷰 패킷 명칭을 그대로 따른다: `버튼`, `세그먼트·필터 칩`, `멤버 반응 배지`, `카드`, `영상 카드`, `헤더`, `하단 탭`, `올리기 시트`, `바텀시트`, `로그인 유도 모달`, `빈 상태`, `스켈레톤`, `에러+재시도`, `NotFound`. 코드 식별자는 필요 시 영문으로 만들 수 있지만, 제품·디자인·QA 티켓의 표기와 동작 계약은 이 명칭을 사용한다.

- 라이트·뉴트럴 UI를 유지한다: 페이지 `bg` `#F7F7FA`, 카드·시트 `card` `#FFFFFF`.
- CELEBUS 바이올렛을 유지한다: `primary` `#6C4DE6`, `primary-strong` `#4E2FC0`, `primary-soft` `#F1EBFF`.
- 브랜드 그라데이션 `#A855E8 → #6C4DE6`은 **CELEBUS 워드마크와 그라데 버튼(올리기)에만** 사용한다. `MOMENT`는 `fg` `#17171C` 솔리드로 처리한다.
- 사용자 UI 용어는 `공연`을 사용한다. 내부 테이블·타입·라우트의 `stage`는 유지할 수 있으나 번역 레이어에서 사용자에게 직접 노출하지 않는다.
- 멤버 반응은 실제 행동만 표시한다. 조회·하트·댓글을 섞지 않는다. `하트=하트`를 유지하며, 멤버 하트를 별도 아이콘으로 바꾸지 않는다.
- 멤버 반응은 `member reaction badge`(작은 아바타 스택 + 검증 체크 + `primary-soft` 배경 + `primary-strong` 텍스트)로 절제한다. 글로우·컨페티·금색 특수효과는 사용하지 않는다.
- 공개 영상 열람은 로그인 없이 허용한다. 로그인은 하트·댓글·업로드·월드컵 투표·마이 상호작용 시점에만 유도한다.
- 로그인 전 의도와 로그인 후 복귀 위치를 보존한다. 영상 딥링크는 `/video/[id]`를 유지한다.
- V01D 특화는 `V01D 아카이브`, `V01D Pick`, 멤버명·파트·공식 아바타 수준으로 시작한다. 공식 확인 전 멤버 시그니처 컬러를 고정하거나 밴드 장식 테마를 추가하지 않는다.

## 1. 심각도 정의

- **P0:** 신뢰성·핵심 루프·접근성·딥링크를 막거나 잘못된 멤버 반응을 전달하는 문제. 출시 전 해결.
- **P1:** 핵심 사용성·정보 위계·상태·용어 일관성을 크게 저해하는 문제. 첫 구현 스프린트에서 해결.
- **P2:** 품질·확장성·브랜드 완성도를 높이는 후속 개선. 핵심 루프 안정화 후 진행.

## 2. 통합 이슈 목록

| ID | 심각도 | 화면 | 문제 | 구체적 수정안 |
|---|---|---|---|---|
| GLB-01 | P0 | 전역 / 화면 1, 2, 7, 9 | 전체 `CELEBUS MOMENT`에 그라데이션이 적용되어 `MOMENT`까지 브랜드 포인트처럼 보인다. 패킷의 그라데이션 사용 규칙과도 충돌한다. | `Wordmark`를 `CELEBUS` 그라데이션 `#A855E8 → #6C4DE6` + `MOMENT` `fg` `#17171C`로 분리 렌더링한다. `Gradient` 버튼은 올리기에만 사용하고 일반 본문·히어로·태그라인에는 적용하지 않는다. |
| GLB-02 | P1 | 전역 / 하단 탭 | 리뷰 캡처·설명에서 `스테이지`와 `공연`이 혼용된다. 사용자에게 내부 `stage` 모델이 노출될 위험이 있다. | `Bottom Navigation` 라벨을 `홈 · 공연 · ＋ · 이벤트 · 마이`로 고정한다. `stage`는 DB·타입·내부 route에서만 사용하고 i18n dictionary에서 `공연/Performance/公演`으로 치환한다. |
| GLB-03 | P0 | 전역 카드·히어로·V01D Pick | 썸네일의 밝은 이미지 위 흰색 제목·메타가 읽히지 않을 수 있다. | 썸네일 하단에만 `fg` 기반 반투명 dark overlay를 적용하고 텍스트 대비를 확보한다. 배경 전체에 그라데이션을 깔지 않는다. 이미지가 없는 상태는 `card` + `border` 기반 placeholder로 처리한다. |
| GLB-04 | P1 | 전역 | 일부 리뷰 아이콘이 이모지/설명용 glyph에 의존하면 플랫폼별 모양과 의미가 달라진다. | `IconButton`, `Bottom Navigation`, `Member Reaction Badge`에 일관된 SVG/icon library를 사용한다. 모든 아이콘 버튼은 44×44px 이상 터치 영역과 accessible name을 갖는다. |
| GLB-05 | P1 | 전역 상태 | 영상 중심 앱인데 `Loading·Empty·Error·NotFound·Auth`의 시각 상태가 기본 캡처에 충분히 드러나지 않는다. | 화면별 `Skeleton`, 통합 `Empty State`, `Error + 다시 시도`, `NotFound`, `Login Prompt Modal`을 상태 계약에 포함한다. 로딩 중에는 빈 상태 문구를 먼저 노출하지 않는다. |
| HOM-01 | P1 | ① 홈 `/` | 홈 히어로가 실제 콘텐츠보다 placeholder/장식 중심으로 보일 가능성이 있다. | `Hero Card`는 실제 영상 썸네일을 사용한다. 우선순위는 멤버 댓글 → 멤버 하트 수 → 멤버 전원 하트 → 팬 좋아요로 정하고, 반응 데이터가 없으면 히어로 섹션을 자동 숨긴다. |
| HOM-02 | P1 | ① 홈 `/` | 홈 섹션이 `멤버가 봤어요`, `V01D 아카이브`, `V01D Pick`, 월드컵으로 나뉘지만 각 섹션의 행동 목적이 한눈에 분리되지 않는다. | 섹션 제목·보조 설명·`더보기`를 분리한다. `V01D 아카이브`는 공연 탐색, `V01D Pick`은 실제 멤버 하트 콘텐츠, 월드컵은 투표 행동으로 명시한다. |
| HOM-03 | P1 | ① 홈 `/` | 콘텐츠 카드가 모바일 폭에서 정보가 많아지면 제목·핸들·팬 좋아요·멤버 반응이 경쟁한다. | 카드 기본 정보는 제목·팬 좋아요·멤버 반응 라인만 유지하고 부가 메타는 상세로 이동한다. `member reaction badge`는 반응이 있을 때만 조건부 렌더링한다. |
| ARC-01 | P1 | ② V01D 아카이브 `/stages` | `V01D 아카이브`와 `공연`의 관계가 명확하지 않으면 V01D가 파일 형식·카테고리로 오해될 수 있다. | 페이지 헤더는 `V01D 아카이브`, 보조 카피는 `공연별로 팬 영상을 모아보는 아카이브예요.`로 고정한다. 카드 객체와 탐색 단위는 `공연`으로 표시한다. |
| ARC-02 | P1 | ② V01D 아카이브 `/stages` | 진행 중/보관 세그먼트와 카드 상태가 작게 표시되면 업로드 가능 여부를 오해할 수 있다. | `Segment / Filter Chips`의 활성 상태를 명확히 하고, 카드에 `업로드 가능`/`보관` 상태칩과 날짜·영상 수·`열어보기` CTA를 함께 표시한다. 보관 카드는 업로드 CTA를 비활성화한다. |
| ARC-03 | P2 | ② V01D 아카이브 `/stages` | 공연 카드가 많아질 때 아티스트·공연명·날짜의 식별 계층이 약해질 수 있다. | 카드 Title은 공연명, Subtitle은 `V01D · 날짜`, Caption은 영상 수로 고정한다. 다중 아티스트 확장 시 아티스트 식별자를 추가한다. |
| PERF-01 | P0 | ③ 공연 상세 `/stage/[id]` | 팬 좋아요와 멤버 하트가 같은 하트 계열 정보로 보이면 핵심 보상인 멤버 행동의 의미가 흐려진다. | `Video Card`에서 팬 좋아요는 일반 action row, 멤버 반응은 `member reaction badge`/reaction line으로 분리한다. 멤버 반응이 없으면 해당 라인을 숨긴다. 조회·하트·댓글 카피도 별도 이벤트로 생성한다. |
| PERF-02 | P0 | ③ 공연 상세 `/stage/[id]` | 2열 썸네일 위 카테고리·재생 glyph·제목이 밝은 이미지에서 읽히지 않고 작은 버튼은 오작동 위험이 있다. | `Video Card` 썸네일 비율을 전 카드에서 통일하고 하단 dark overlay, `border`, `shadow-sm`를 적용한다. 카드 전체를 `/video/[id]` 링크로 만들고 내부 버튼은 44×44px을 확보한다. |
| PERF-03 | P1 | ③ 공연 상세 `/stage/[id]` | 필터 칩과 정렬이 한 그룹처럼 보이면 사용자가 현재 범위와 정렬 기준을 구분하기 어렵다. | `Filter Chips`는 카테고리(전체/직캠/커버/편집/기타), 정렬은 별도 `Bottom Sheet`로 분리한다. 현재 상태는 `공연명 · 전체`와 `최신순`으로 명시한다. |
| VIDEO-01 | P0 | ④ 영상 상세 `/video/[id]`, ⑫ 로그인 유도 모달 | 공개 영상을 보려는 게스트까지 로그인 모달을 만나면 공유 유입과 딥링크가 막힌다. | `/video/[id]`의 임베드·댓글 열람은 게스트 허용. 하트·댓글·공유 카드 생성 등 상호작용 시 `Login Prompt Modal`을 호출한다. 로그인 버튼과 닫기 버튼을 모두 제공한다. |
| VIDEO-02 | P0 | ④ 영상 상세 `/video/[id]`, ⑪ 알림 | 알림/외부 공유에서 영상으로 들어온 뒤 멤버 반응 위치와 이전 화면이 보존되는 계약이 없다. | `/video/[id]`를 canonical deep link로 사용하고 query/state로 `returnTo`, `focusReaction`, `commentId`를 보존한다. 알림 클릭 시 해당 반응 라인/댓글로 scroll 및 focus한다. 브라우저 뒤로가기를 지원한다. |
| VIDEO-03 | P1 | ④ 영상 상세 `/video/[id]` | 외부 임베드, 멤버 하트 라인, 팬 좋아요, 자랑/원본/신고, 댓글이 한 화면에 몰려 행동 우선순위가 약하다. | 순서를 `임베드 → member reaction badge/line → 제목/공연 → 팬 좋아요 → 자랑/원본/신고 → 댓글`로 고정한다. `Share`와 `Report`는 `Secondary` 또는 `Bottom Sheet`로 정리한다. |
| VIDEO-04 | P0 | ④ 영상 상세 `/video/[id]` | YouTube/TikTok/Instagram 임베드 실패·비공개·삭제·NotFound 상태에서 사용자가 다음 행동을 알기 어렵다. | 플랫폼별 오류를 `Error State`로 통합하고 `원본 보기`와 `다시 시도`를 제공한다. 삭제/비공개는 원본 링크를 숨기고, NotFound는 공연 탐색으로 돌아가는 CTA를 제공한다. |
| UP-01 | P0 | ⑤ 올리기·공연 선택 | `＋ → 로그인 게이트 → 공연 선택`에서 로그인 전 의도와 선택 단계 복귀가 보장되지 않으면 업로드가 끊긴다. | `Gradient` 올리기 버튼을 누른 시점에만 로그인 게이트를 열고 `intent=upload`, `step=performance-select`를 저장한다. 로그인 완료 후 같은 `Upload Sheet` 1단계로 복귀한다. |
| UP-02 | P1 | ⑤ 올리기·공연 선택 | 보관 공연이나 마감된 공연도 선택 가능한 것처럼 보이면 게시 실패를 늦게 알게 된다. | 공연 카드에 `업로드 가능/보관` 상태를 표시하고 보관·마감 카드는 `disabled` 처리한다. 대체 안내는 현재 진행 중인 공연 목록으로 연결한다. |
| UP-03 | P0 | ⑥ 올리기·폼 | 링크 기반 서비스인데 URL 검증·미리보기·지원 플랫폼·중복·비공개 상태가 명세에 비해 화면에서 충분히 안내되지 않는다. | `Input`의 첫 단계에 URL을 배치하고 붙여넣는 즉시 플랫폼·제목·썸네일을 fetch한다. 성공 전 게시를 비활성화하고, 실패 유형별 inline error와 재시도/수정 CTA를 제공한다. |
| UP-04 | P1 | ⑥ 올리기·폼 | `멤버들이 봐요`처럼 보장형으로 읽힐 수 있는 문구는 실제 반응 전 기대를 과장한다. | 보조 카피를 `링크만 붙여넣으면 끝 · 멤버에게 보여줄 수 있어요.`로 변경한다. 게시 완료 후에도 `멤버 반응을 기다리고 있어요`만 표시하고 반응을 생성하지 않는다. |
| EVT-01 | P1 | ⑦ 이벤트 `/events` | 월드컵과 `V01D Pick`은 투표 행동과 멤버 반응 아카이브인데 같은 레벨의 카드로 보이면 목적이 섞인다. | `Events` 화면을 `진행 중인 이벤트`와 `V01D Pick` 두 영역으로 분리한다. 월드컵 CTA는 투표, V01D Pick CTA는 실제 멤버 하트 영상 열람으로 라벨링한다. |
| EVT-02 | P1 | ⑧ 월드컵 플레이 | 대결 화면에 뒤로/나가기 경로가 없으면 사용자가 갇힌 느낌을 받는다. | 상단 `Back`/`Exit`를 제공하고 진행 상황·현재 라운드·남은 투표 횟수를 표시한다. 실수 선택 방지를 위해 선택 후 다음 대결 전 확인 또는 즉시 실행 규칙을 명시한다. |
| EVT-03 | P1 | ⑧ 월드컵 결과 | `우승비율`과 `1:1 승률`의 정의가 화면에서 구분되지 않으면 결과를 오해할 수 있다. | 결과 항목 옆에 짧은 설명을 제공하고 `3회 집계 캡`과 이벤트 범위를 표시한다. 시상은 실제 계산 결과가 생성된 경우에만 노출한다. |
| PICK-01 | P0 | ⑨ V01D Pick `/hearts` | `V01D Pick`이 멤버 하트 받은 영상 모음인데 반응 없는 콘텐츠가 채워지면 브랜드 약속이 깨진다. | 실제 멤버 하트가 1개 이상인 `Video Card`만 노출한다. `그랜드슬램`은 모든 멤버의 하트가 확인될 때만 표시한다. 조회만 있는 영상은 Pick에 넣지 않는다. |
| PICK-02 | P1 | ⑨ V01D Pick `/hearts` | 멤버 하트 라인이 팬 좋아요와 시각적으로 유사하고 썸네일 위 텍스트 대비가 불안정하다. | 팬 좋아요와 `member reaction badge`를 별도 row로 배치하고 `primary-soft`/`primary-strong`를 사용한다. 썸네일 텍스트는 dark overlay 위에 배치한다. |
| MY-01 | P1 | ⑩ 마이페이지 `/my` | `내 영상 없음` 상태가 하단 ＋에 의존해 첫 업로드 행동을 충분히 안내하지 않는다. | `Empty State` 중앙에 `첫 영상을 올려보세요.`와 `영상 올리기` `Gradient`/`Primary` CTA를 함께 표시한다. CTA는 로그인 후 업로드 시트로 복귀한다. |
| MY-02 | P0 | ⑩ 마이페이지 `/my` | `멤버가 봤어요`, `멤버 전원` 수치가 조회/하트 기준인지 불명확하면 신뢰를 훼손한다. | 통계에 데이터 정의를 연결한다: 조회 수는 멤버 view event, 멤버 하트 수는 명시적 heart, 전원 수는 모든 대상 멤버 heart 충족. 데이터가 없으면 0/빈 상태를 정확히 표시한다. |
| NOTI-01 | P1 | ⑪ 알림 | 멤버 하트·조회·댓글 알림이 동일한 리스트 모양이면 중요도와 행동 유형을 빠르게 구분하기 어렵다. | `Notification Item`에 이벤트 타입별 문구와 멤버 아바타를 사용한다. 아이콘 색은 모두 `primary` 계열 안에서 보조적으로만 차이를 주고, 색상만으로 타입을 구분하지 않는다. |
| NOTI-02 | P0 | ⑪ 알림 | 알림 클릭이 영상 딥링크로 연결되더라도 해당 멤버 하트/댓글 위치까지 이동하는 요구가 없다. | 알림 payload에 `videoId`, `reactionType`, `commentId`, `readAt`를 저장하고 `/video/[id]?focusReaction=...`로 이동한다. 읽음 처리 후 뒤로가기는 알림 목록 위치를 복원한다. |
| V01D-01 | P1 | 전 화면 | 현재 V01D 특화는 라벨·아바타·데이터 구조에 머물러 멤버별 정체성이 약하다. 반대로 공식 확인 전 임시 색을 확정하면 잘못된 브랜드를 고정할 수 있다. | 1차는 `V01D 아카이브`, `V01D Pick`, 공식 멤버명·파트·아바타·`이 멤버가 반응한 영상` filter만 구현한다. 시그니처 컬러는 공식 가이드 승인 후 별도 토큰으로 추가한다. |
| V01D-02 | P2 | 전 화면 | D10V/디오브 팬덤명, 멤버 제공 seed 영상, 싸인 포카 보상은 매력적이지만 현재 핵심 루프와 운영 정책이 확정되지 않았다. | 파일럿 1차 범위에서 기본 UI에 상시 노출하지 않는다. 공식 콘텐츠·보상 정책·당첨/배송 운영이 확정되면 `V01D Pick`의 별도 후속 티켓으로 설계한다. |
| A11Y-01 | P0 | 전 화면 | 작은 텍스트에 `subtle` `#A6A7B2`를 사용하면 대비가 부족할 수 있고, 카드/입력 경계가 배경과 약하게 보일 수 있다. | 본문·상태 텍스트는 `fg`/`muted`를 사용하고 `subtle`은 장식용 메타에만 사용한다. 입력·카드에는 `border` `#E6E6ED`를 적용하고 focus는 `primary` ring으로 표시한다. |
| A11Y-02 | P1 | 전 화면 / 390–430px | 멤버 반응 더보기·공유·신고·뒤로가기 등 작은 조작 영역이 촘촘하다. | 모든 interactive component에 최소 44×44px hit area, 명확한 focus/pressed/disabled 상태, 키보드 접근을 적용한다. `reduced-motion`에서는 fade-up/sheet-up을 정지 또는 축소한다. |

## 3. 화면별 검토 상태

| 화면 | Route | 현재 리뷰 상태 | 개발 전 추가해야 할 상태 |
|---|---|---|---|
| 홈 | `/` | Visual reviewed | Loading / 전체 Empty / Error / 섹션별 자동 숨김 |
| V01D 아카이브 | `/stages` | Visual reviewed | 진행 중 Empty / 보관 결과 / Error / 카드 Loading |
| 공연 상세 | `/stage/[id]` | Visual reviewed | 공연 NotFound / 영상 없음 / 필터 결과 없음 / Error |
| 영상 상세 | `/video/[id]` | Visual reviewed | 게스트 열람 / 임베드 Error / 삭제·비공개 / NotFound / 댓글 Loading |
| 올리기·공연 선택 | upload sheet step 1 | Visual reviewed | Auth 복귀 / 진행 중 공연 없음 / 마감 공연 |
| 올리기·폼 | upload sheet step 2 | Visual reviewed | URL validating / unsupported / invalid / private / duplicate / post Error |
| 이벤트 | `/events` | Visual reviewed | 진행 중 이벤트 없음 / V01D Pick Empty / Error |
| 월드컵 플레이 | event play route | Visual reviewed | 투표 cap / 네트워크 실패 / Exit 확인 / 결과 Loading |
| V01D Pick | `/hearts` | Visual reviewed | 반응 없음 Empty / Loading / Error |
| 마이페이지 | `/my` | Visual reviewed | Guest Auth / 탭별 Empty / 통계 Loading / Error |
| 알림 | notifications route | Visual reviewed | 읽음·안읽음 / 알림 없음 / pagination / Error |
| 로그인 유도 모달 | overlay | Visual reviewed | interaction-only 진입 / 복귀 intent / dismiss / Auth Error |

## 4. 지금 먼저 할 3가지

1. **P0 계약 고정:** `CELEBUS/MOMENT` 그라데이션, `공연` 용어, 조회·하트·댓글·전원 하트 데이터/카피, 게스트 열람·로그인 intent를 하나의 제품 계약으로 확정한다. 담당: product + design + development.
2. **핵심 루프 연결:** `/video/[id]` 게스트 deep link, interaction-only `Login Prompt Modal`, 알림 → 반응 위치 복귀, URL-first 업로드 preview/예외 상태를 구현한다. 담당: development.
3. **모바일 신뢰성 검증:** 썸네일 dark overlay와 대비, 멤버/팬 반응 분리, 44×44px touch target, Skeleton/Empty/Error를 390px·430px에서 QA한다. 담당: design + development.
