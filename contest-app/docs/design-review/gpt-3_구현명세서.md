# CELEBUS MOMENT — 최종 구현 명세서

**문서 버전:** v1.0 · 2026-07-29  
**상태:** 개발 티켓 입력용  
**대상:** Next.js 16 · React 19 · Tailwind v4 · Supabase · PWA  
**제품:** CELEBUS MOMENT · V01D 파일럿  
**기본 경로:** `/`, `/stages`, `/stage/[id]`, `/video/[id]`, `/events`, `/hearts`, `/my`  
**사용자 언어:** 한국어 / English / 日本語

---

## 0. 구현 전역 계약

### 0.1 확정 디자인 토큰

**리뷰 패킷의 디자인 시스템 표기:** `bg`, `card`, `fg`, `muted`, `subtle`, `border`, `primary`, `primary-strong`, `primary-soft`를 기본 시맨틱 토큰으로 사용한다. 아래 보조 토큰은 패킷의 `Gradient`, `shadow-sm`, `radius`, `spacing`, `motion` 규칙을 구현하기 위한 확장이다.

| 토큰 | 시맨틱명 | 값 | 사용 |
|---|---|---:|---|
| `--color-bg` | `bg` | `#F7F7FA` | 페이지 배경 |
| `--color-card` | `card` | `#FFFFFF` | 카드·시트·모달 |
| `--color-fg` | `fg` | `#17171C` | 제목·주요 본문·MOMENT |
| `--color-muted` | `muted` | `#686A76` | 보조 본문·설명 |
| `--color-subtle` | `subtle` | `#A6A7B2` | 장식성 메타에 한정 |
| `--color-border` | `border` | `#E6E6ED` | 카드·입력·구분선 |
| `--color-primary` | `primary` | `#6C4DE6` | 솔리드 CTA·활성 탭·focus |
| `--color-primary-strong` | `primary-strong` | `#4E2FC0` | hover·pressed·멤버 반응 텍스트 |
| `--color-primary-soft` | `primary-soft` | `#F1EBFF` | 멤버 반응 배지·선택 배경 |
| `--gradient-brand` | `brand-gradient` | `#A855E8 → #6C4DE6` | CELEBUS 워드마크·올리기 버튼만 |
| `--shadow-sm` | `shadow-sm` | `0 1px 2px rgba(23,23,28,.06)` | 카드·시트의 최소 elevation |
| `--radius-card` | `radius-card` | `16px` | 카드 |
| `--radius-control` | `radius-control` | `12px` | 버튼·입력·칩 |
| `--focus-ring` | `focus-ring` | `0 0 0 3px rgba(108,77,230,.28)` | 키보드·접근성 focus |
| `--overlay-thumbnail` | `thumbnail-overlay` | `rgba(23,23,28,.52)` | 썸네일 하단 텍스트 대비 |
| `--font-family` | `Pretendard` | `Pretendard, sans-serif` | 전체 UI |
| `--type-display` | `Display` | `24px` | 주요 헤딩 |
| `--type-title` | `Title` | `19px` | 카드·섹션 제목 |
| `--type-subtitle` | `Subtitle` | `15px` | 보조 제목 |
| `--type-body` | `Body` | `13–14px` | 본문 |
| `--type-caption` | `Caption` | `11–12px` | 캡션·메타 |
| `--radius-sm` | `sm` | `12px` | 컨트롤 |
| `--radius-md` | `md` | `16px` | 카드 |
| `--radius-lg` | `lg` | `22px` | 큰 카드·시트 |
| `--radius-pill` | `pill` | `100px` | 칩·알약형 상태 |
| `--spacing-unit` | `spacing` | `4px` | 간격 기준 |
| `--motion-fade-up` | `fade-up` | `motion` | 콘텐츠 진입 |
| `--motion-sheet-up` | `sheet-up` | `motion` | 시트 진입 |

**토큰 규칙**

- `brand-gradient`를 본문, 태그라인, 일반 탭, 멤버 반응, 배경 장식에 사용하지 않는다.
- `MOMENT`는 언제나 `fg #17171C` 솔리드다.
- `subtle`은 본문·버튼·오류·필수 입력에 사용하지 않는다.
- 모든 interactive component는 최소 44×44px hit area를 갖는다.
- 이미지 위 텍스트는 `thumbnail-overlay` 없이는 렌더하지 않는다.

### 0.2 공통 컴포넌트 명칭

**리뷰 패킷 명칭을 그대로 사용한다:** `버튼`, `세그먼트·필터 칩`, `멤버 반응 배지`, `카드`, `영상 카드`, `헤더`, `하단 탭`, `올리기 시트`, `바텀시트`, `로그인 유도 모달`, `빈 상태`, `스켈레톤`, `에러+재시도`, `NotFound`.

코드 식별자는 영문으로 구현해도 되지만 매핑을 유지한다: `버튼=Button`, `세그먼트·필터 칩=Segmented Control/Filter Chips`, `멤버 반응 배지=Member Reaction Badge`, `카드=Card`, `영상 카드=Video Card`, `헤더=Header`, `하단 탭=Bottom Navigation`, `올리기 시트=Upload Sheet`, `바텀시트=Bottom Sheet`, `로그인 유도 모달=Login Prompt Modal`, `빈 상태=Empty State`, `스켈레톤=Skeleton`, `에러+재시도=Error State`.

### 0.3 반응·통계 데이터 계약

| 사용자에게 표시 | 내부 의미 | 표시 조건 |
|---|---|---|
| 멤버가 봤어요 | member view event | 실제 view event 1개 이상 |
| 멤버가 하트를 보냈어요 | explicit member heart event | 실제 heart event 1개 이상 |
| 멤버가 댓글을 남겼어요 | explicit member comment event | 실제 comment event 1개 이상 |
| 멤버 전원 하트 / `그랜드슬램` | 대상 멤버 전원의 explicit heart | 모든 대상 멤버 heart 확인 시에만 |
| 팬 좋아요 | current user/community like | 팬 like 집계와 member event 분리 |

절대 규칙: view를 heart로 표현하지 않는다. 조회만으로 `V01D Pick`에 넣지 않는다. 멤버 반응이 없는 경우 `Member Reaction Badge`를 숨긴다.

### 0.4 로그인·딥링크 계약

- 공개 `/video/[id]`의 영상 열람과 댓글 읽기는 guest 허용.
- 하트·댓글 작성·업로드·월드컵 투표·마이 상호작용은 `Login Prompt Modal` 호출.
- 로그인 게이트 진입 시 `intent`, `returnTo`, `returnState`를 저장한다.
- 로그인 후 동일 화면·단계·스크롤 위치로 복귀한다.
- 알림 클릭은 `/video/[id]?focusReaction={view|heart|comment}&commentId={id?}`로 이동한다.
- deleted/private/not-found 상태는 명시적 `Error State`/`NotFound State`와 대체 CTA를 표시한다.

### 0.5 공통 카피 dictionary

| key | 한국어 | English | 日本語 |
|---|---|---|---|
| `nav.home` | 홈 | Home | ホーム |
| `nav.performance` | 공연 | Performances | 公演 |
| `nav.upload` | 올리기 | Upload | アップロード |
| `nav.events` | 이벤트 | Events | イベント |
| `nav.my` | 마이 | My | マイ |
| `archive.v01d.title` | V01D 아카이브 | V01D Archive | V01Dアーカイブ |
| `archive.v01d.description` | 공연별로 팬 영상을 모아보는 아카이브예요. | A fan video archive organized by performance. | 公演ごとにファン動画を見つけられるアーカイブです。 |
| `pick.v01d.title` | V01D Pick | V01D Pick | V01D Pick |
| `upload.helper` | 링크만 붙여넣으면 끝 · 멤버에게 보여줄 수 있어요. | Paste a link and share it with the members. | リンクを貼り付けるだけ · メンバーに届けられます。 |
| `upload.cta` | 영상 올리기 | Upload a video | 動画をアップロード |
| `empty.my` | 아직 올린 영상이 없어요. 첫 영상을 올려보세요. | You haven't uploaded any videos yet. Share your first one. | まだ動画がありません。最初の動画をシェアしましょう。 |
| `video.member.viewed` | {member} 님이 봤어요 | {member} viewed it | {member}さんが見ました |
| `video.member.hearted` | {member} 님이 하트를 보냈어요 | {member} sent a heart | {member}さんがハートを送りました |
| `video.member.commented` | {member} 님이 댓글을 남겼어요 | {member} commented | {member}さんがコメントしました |
| `video.member.allHearted` | 멤버 전원이 하트를 보냈어요 | Every member sent a heart | メンバー全員がハートを送りました |
| `video.fan.like` | 좋아요 | Like | いいね |
| `video.member.waiting` | 멤버 반응을 기다리고 있어요. | Waiting for a member reaction. | メンバーからの反応を待っています。 |
| `auth.title` | 로그인하고 계속하기 | Log in to continue | ログインして続ける |
| `auth.description` | 이 기능을 사용하려면 로그인이 필요해요. | Log in to use this feature. | この機能を使うにはログインが必要です。 |
| `auth.login` | 로그인 | Log in | ログイン |
| `auth.close` | 닫기 | Close | 閉じる |
| `video.notFound.title` | 영상을 찾을 수 없어요. | We couldn't find this video. | 動画が見つかりません。 |
| `video.notFound.cta` | 공연 둘러보기 | Browse performances | 公演を見る |
| `common.retry` | 다시 시도 | Try again | 再試行 |
| `common.back` | 뒤로 | Back | 戻る |
| `common.exit` | 나가기 | Exit | 終了 |

**카피 원칙:** `하트=하트`, `봤어요=봤어요`, `댓글=댓글`. 실제 이벤트 전에는 완료형을 사용하지 않는다.

---

# 1. 지금 먼저 할 3가지

## NOW-01 — P0: 공개 영상·로그인 의도·알림 복귀 계약

**대상:** `Bottom Navigation`, `Video Card`, `/video/[id]`, `Notification Item`, `Login Prompt Modal`  
**담당:** Frontend + Supabase + Product  
**토큰:** `bg`, `card`, `fg`, `muted`, `primary`, `primary-soft`, `border`, `focus-ring`

**변경 전**

- 로그인 모달이 콘텐츠 열람과 상호작용을 구분하지 못할 수 있음.
- 알림에서 영상 상세로 들어온 뒤 멤버 반응/댓글 위치 복귀 계약이 없음.
- 브라우저·공유 딥링크가 열람 루프를 막을 수 있음.

**변경 후**

- `/video/[id]` 공개 영상/댓글 읽기 허용.
- 하트·댓글 작성·업로드·투표·마이 상호작용에서만 `Login Prompt Modal`.
- `intent`, `returnTo`, `returnState`, `focusReaction`, `commentId` 보존.
- 로그인 완료 후 동일 화면으로 복귀하고 pending action을 재개하거나 확인한다.

**Acceptance**

- [ ] 로그아웃 상태에서 공유 `/video/[id]`를 열어 영상 제목·임베드·댓글 읽기가 가능하다.
- [ ] 로그아웃 상태에서 하트/댓글/업로드/투표/마이 조작 시에만 `Login Prompt Modal`이 열린다.
- [ ] 모달 `로그인`·`닫기` 모두 44×44px 이상이며 닫기 후 원래 화면이 유지된다.
- [ ] 로그인 후 `returnTo` 화면과 `returnState` 스크롤/단계가 복원된다.
- [ ] 알림 클릭은 정확한 `videoId`와 `focusReaction`/`commentId`로 이동한다.
- [ ] 키보드 focus, screen reader label, reduced-motion 상태를 검증한다.

**States**

- Loading: route skeleton + video player placeholder; 모달이 먼저 튀어나오지 않음.
- Empty: 댓글 없음 — `아직 댓글이 없어요.` / `No comments yet.` / `まだコメントはありません。`
- Error: 임베드 실패 — `영상을 불러오지 못했어요.` + `다시 시도`; 원본 보기 가능 여부는 플랫폼 정책에 따름.
- NotFound: `영상을 찾을 수 없어요.` + `공연 둘러보기`.
- Auth error: 로그인 실패 원인과 `다시 시도`, 원래 딥링크 보존.

## NOW-02 — P0: URL-first 업로드와 정직한 멤버 반응 루프

**대상:** `Gradient` 올리기 버튼, `Upload Sheet`, `Performance Card`, `Input`, `Video Card`, `Member Reaction Badge`  
**담당:** Frontend + Supabase + Product  
**토큰:** `brand-gradient`, `primary`, `primary-strong`, `primary-soft`, `card`, `border`, `muted`, `thumbnail-overlay`

**변경 전**

- 공연 선택·URL 입력·미리보기·게시 실패의 단계 계약이 약함.
- `멤버들이 봐요`처럼 결과를 보장하는 인상 가능.
- 팬 좋아요·멤버 반응·조회 의미가 섞일 위험.

**변경 후**

- `＋`는 `brand-gradient`를 사용한 올리기 진입 버튼으로 유지.
- 로그인 전 `intent=upload`, 로그인 후 `Upload Sheet` 동일 단계 복귀.
- 공연 선택 → URL `Input` → platform/title/thumbnail preview → category → post.
- URL 검증 성공 전 게시 disabled.
- copy: `링크만 붙여넣으면 끝 · 멤버에게 보여줄 수 있어요.` / `Paste a link and share it with the members.` / `リンクを貼り付けるだけ · メンバーに届けられます。`
- 공개 전에는 `멤버 반응을 기다리고 있어요.`만 표시.

**Acceptance**

- [ ] `Gradient` 버튼은 올리기 진입에만 사용되며 일반 CTA는 `primary` 솔리드다.
- [ ] 보관/마감 공연은 선택·게시할 수 없다.
- [ ] URL paste 후 지원 플랫폼·제목·썸네일 preview가 표시된다.
- [ ] unsupported/invalid/private/duplicate/network failure 상태에 정확한 inline error가 표시된다.
- [ ] 성공 전 게시 버튼이 disabled이며, 성공 후 `/video/[id]` 또는 게시 완료 위치로 이동한다.
- [ ] 멤버 반응 전 완료형 멤버 카피가 노출되지 않는다.

**States**

- Loading: URL validating skeleton/spinner; 게시 disabled.
- Empty: 진행 가능한 공연 없음 — `지금 올릴 수 있는 공연이 없어요.` / `No performances are open for uploads right now.` / `現在アップロードできる公演はありません。`
- Error: `이 링크는 지원하지 않아요.` / `This link isn't supported.` / `このリンクは対応していません。` + 링크 수정/다시 시도.
- Auth: 로그인 후 동일 공연·폼 단계로 복귀.
- Closed: `이 공연은 업로드가 마감됐어요.` / `Uploads for this performance are closed.` / `この公演のアップロードは終了しました。`

## NOW-03 — P0: 썸네일 대비·반응 분리·모바일 접근성 공통 QA

**대상:** `Hero Card`, `Performance Card`, `Video Card`, `Member Reaction Badge`, `Filter Chips`, `Bottom Navigation`, `IconButton`  
**담당:** Design + Frontend + QA  
**토큰:** `bg`, `card`, `fg`, `muted`, `subtle`, `border`, `thumbnail-overlay`, `primary`, `primary-soft`, `focus-ring`, `shadow-sm`

**변경 전**

- 밝은 영상 이미지 위 텍스트 대비가 불안정.
- 팬 좋아요와 멤버 하트가 같은 하트 계열로 보임.
- 작은 조작 영역과 설명용 glyph가 플랫폼별로 달라질 위험.

**변경 후**

- 썸네일 하단에 `thumbnail-overlay rgba(23,23,28,.52)` 적용.
- 팬 좋아요는 `action row`, 멤버 반응은 `Member Reaction Badge` + 공식 아바타/검증 체크.
- 조회는 별도 `view` semantic과 카피.
- 모든 버튼·칩·탭·아이콘 44×44px hit area, SVG/icon library, focus ring.
- 390px·430px visual regression + contrast QA.

**Acceptance**

- [ ] 테스트 이미지 밝기/색상 샘플에서 카드 제목·메타가 읽힌다.
- [ ] `Member Reaction Badge`가 없을 때 빈 공간 없이 자연스럽게 접힌다.
- [ ] 팬 `좋아요`, 멤버 `하트`, 멤버 `봤어요`, 멤버 `댓글`이 라벨/데이터/레이아웃에서 구분된다.
- [ ] 44×44px hit area와 keyboard focus를 모든 interactive component에서 확인한다.
- [ ] `prefers-reduced-motion`에서 sheet/fade 애니메이션이 축소된다.

**States**

- Loading: `Skeleton`이 이미지·텍스트·reaction line 높이를 보존한다.
- Empty: 이미지 없음은 `card` + `border` placeholder, 반응 없음은 badge 숨김.
- Error: 이미지 실패는 alt text와 `다시 시도`; 반응 fetch 실패는 영상은 유지하고 reaction error를 비차단 toast로 표시.
- Disabled: 보관/마감/로그인 필요 조작은 이유를 tooltip/보조 텍스트로 전달.

---

# 2. 화면·컴포넌트별 구현 티켓

## T-01. 홈 `/` — Discovery

**대상:** `Top Bar`, `Wordmark`, `Hero Card`, `Video Card`, `Bottom Navigation`  
**우선순위:** P1  
**토큰:** `bg`, `card`, `fg`, `muted`, `border`, `primary`, `primary-soft`, `thumbnail-overlay`, `shadow-sm`

### 변경 전 / 후

- 전: 히어로·섹션이 모두 강한 브랜드/그라데이션을 사용하고, 섹션 목적·반응 상태가 한눈에 섞일 수 있음.
- 후: `CELEBUS` 워드마크만 `brand-gradient`, `MOMENT`는 `fg`; `Hero Card`는 실제 멤버 반응/콘텐츠를 조건부 노출; 섹션은 `V01D 아카이브`, `V01D Pick`, `이벤트`로 행동 목적을 분리.

### 카피

- KO: `V01D 아카이브` / `공연별로 팬 영상을 모아보는 아카이브예요.` / `V01D Pick` / `더보기`
- EN: `V01D Archive` / `A fan video archive organized by performance.` / `V01D Pick` / `See all`
- JA: `V01Dアーカイブ` / `公演ごとにファン動画を見つけられるアーカイブです。` / `V01D Pick` / `すべて見る`

### Acceptance

- [ ] 데이터가 없는 반응 섹션은 자동 숨김되고 빈 카드가 남지 않는다.
- [ ] Hero 후보 우선순위가 댓글 → 하트 → 전원 하트 → 팬 좋아요로 고정된다.
- [ ] `Video Card` 전체가 `/video/[id]`로 이동하며 nested button은 링크를 중첩하지 않는다.
- [ ] `Bottom Navigation`이 5개 탭으로 고정되고 현재 탭이 `primary` 솔리드로 식별된다.

### States

- Loading: `Hero Card`와 section `Skeleton`.
- Empty: `오늘의 영상이 아직 없어요.` / `No featured videos yet.` / `おすすめ動画はまだありません。`
- Error: 섹션 단위 `불러오지 못했어요 · 다시 시도`.

## T-02. V01D 아카이브 `/stages` — Performance list

**대상:** `Top Bar`, `Segmented Control`, `Performance Card`, `Filter Chips`  
**우선순위:** P1  
**토큰:** `bg`, `card`, `fg`, `muted`, `subtle`, `border`, `primary`, `primary-soft`, `shadow-sm`

### 변경 전 / 후

- 전: V01D 특화 라벨과 공연 탐색 단위가 분리되어 보이지 않고, 진행/보관 상태가 약할 수 있음.
- 후: 헤더는 `V01D 아카이브`, 보조 설명은 공연 중심, 카드에 상태·날짜·영상 수·열기 CTA, 보관 카드는 업로드 disabled.

### 카피

- KO: `진행 중` / `보관` / `공연별로 팬 영상을 모아보는 아카이브예요.` / `공연 열어보기` / `업로드 가능` / `보관됨`
- EN: `Open` / `Archived` / `A fan video archive organized by performance.` / `Open performance` / `Uploads open` / `Archived`
- JA: `受付中` / `アーカイブ` / `公演ごとにファン動画を見つけられるアーカイブです。` / `公演を見る` / `アップロード可能` / `アーカイブ済み`

### Acceptance

- [ ] 사용자 화면에 `stage`/`스테이지`가 표시되지 않는다.
- [ ] `Segmented Control`에서 활성 세그먼트가 명확하다.
- [ ] 보관/마감 카드는 업로드 CTA가 disabled이고 탐색은 가능하다.
- [ ] 카드 Title=공연명, Subtitle=`V01D · 날짜`, Caption=영상 수 구조를 지킨다.

### States

- Loading: 카드 3개 `Skeleton`.
- Empty: `아직 등록된 공연이 없어요.` / `No performances yet.` / `登録された公演はまだありません。`
- Error: `공연을 불러오지 못했어요.` / `We couldn't load performances.` / `公演を読み込めませんでした。`

## T-03. 공연 상세 `/stage/[id]` — Video grid

**대상:** `Top Bar`, `Filter Chips`, `Bottom Sheet`, `Video Card`, `Member Reaction Badge`  
**우선순위:** P0  
**토큰:** `bg`, `card`, `fg`, `muted`, `border`, `primary`, `primary-soft`, `primary-strong`, `thumbnail-overlay`, `shadow-sm`, `focus-ring`

### 변경 전 / 후

- 전: 카테고리·정렬·팬 좋아요·멤버 반응이 같은 밀도로 보이고 썸네일 텍스트가 이미지에 묻을 수 있음.
- 후: 카테고리는 `Filter Chips`, 정렬은 `Bottom Sheet`; `Video Card` 전체는 `/video/[id]`; 팬 좋아요와 `Member Reaction Badge` 분리; 썸네일 overlay 적용.

### 카피

- KO: `전체` / `직캠` / `커버` / `편집` / `기타` / `최신순` / `아직 영상이 없어요.`
- EN: `All` / `Fancam` / `Cover` / `Edit` / `Other` / `Newest` / `No videos yet.`
- JA: `すべて` / `ファンカム` / `カバー` / `編集` / `その他` / `新着順` / `動画はまだありません。`

### Acceptance

- [ ] 필터·정렬 상태가 각각 독립적으로 URL/state에 반영된다.
- [ ] 카드에 팬 좋아요와 멤버 반응이 별도 row로 표시된다.
- [ ] 영상 카드 클릭이 `/video/[id]`로 이동한다.
- [ ] 390px에서 2열 카드 텍스트·버튼이 겹치지 않는다.

### States

- Loading: 이미지 비율을 유지한 `Skeleton` grid.
- Empty: 필터 결과 없음과 공연 영상 없음 문구를 구분.
- Error: 영상 목록만 실패해도 페이지 header·filter는 유지하고 retry.

## T-04. 영상 상세 `/video/[id]` — Guest deep link

**대상:** `Top Bar`, video embed, `Member Reaction Badge`, `Button`, `Notification Item`, `Bottom Sheet`, comments  
**우선순위:** P0  
**토큰:** `bg`, `card`, `fg`, `muted`, `border`, `primary`, `primary-soft`, `primary-strong`, `focus-ring`

### 변경 전 / 후

- 전: 로그인 유도 모달이 열람 단계까지 차단하거나, 알림에서 반응 위치를 복원하지 않을 수 있음.
- 후: guest 열람 허용, 상호작용만 로그인, `/video/[id]` + `focusReaction`/`commentId` + `returnTo` 계약.

### 카피

- KO: `멤버가 봤어요` / `멤버가 하트를 보냈어요` / `멤버가 댓글을 남겼어요` / `좋아요` / `원본 보기` / `신고` / `아직 댓글이 없어요.`
- EN: `Member viewed it` / `Member sent a heart` / `Member commented` / `Like` / `View original` / `Report` / `No comments yet.`
- JA: `メンバーが見ました` / `メンバーがハートを送りました` / `メンバーがコメントしました` / `いいね` / `元の動画を見る` / `報告` / `まだコメントはありません。`

### Acceptance

- [ ] guest가 video embed, title, metadata, comments read를 볼 수 있다.
- [ ] heart/comment 작성은 `Login Prompt Modal`을 거친다.
- [ ] 알림 deep link가 reaction/comment 위치로 scroll/focus한다.
- [ ] 원본 보기·신고는 secondary action 또는 `Bottom Sheet`로 정리된다.

### States

- Loading: embed/player와 reaction skeleton.
- Empty: 댓글 없음.
- Error: platform embed failure + retry/original policy-based CTA.
- NotFound/private/deleted: 상태별 문구, NotFound는 공연으로 돌아가기.

## T-05. 올리기·공연 선택 — `Upload Sheet` step 1

**대상:** `Gradient` upload button, `Upload Sheet`, `Performance Card`, `Login Prompt Modal`  
**우선순위:** P0  
**토큰:** `brand-gradient`, `primary`, `primary-strong`, `card`, `border`, `muted`, `focus-ring`

### 변경 전 / 후

- 전: 로그인 후 공연 선택 시트의 원래 의도/단계 복귀가 불명확할 수 있음.
- 후: `intent=upload`, `returnTo`, `step=performance-select`를 저장하고 로그인 후 동일 시트로 복귀. 공연 카드 상태를 선택 가능/보관/마감으로 명시.

### 카피

- KO: `어떤 공연에 올릴까요?` / `업로드 가능` / `보관됨` / `지금 올릴 수 있는 공연이 없어요.` / `닫기`
- EN: `Which performance is this for?` / `Uploads open` / `Archived` / `No performances are open for uploads right now.` / `Close`
- JA: `どの公演にアップロードしますか？` / `アップロード可能` / `アーカイブ済み` / `現在アップロードできる公演はありません。` / `閉じる`

### Acceptance

- [ ] 보관/마감 performance 선택이 불가능하다.
- [ ] 닫기 후 원래 화면과 scroll이 복원된다.
- [ ] 로그인 후 동일 `Upload Sheet` step 1로 복귀한다.

### States

- Loading: 공연 카드 skeleton.
- Empty: 업로드 가능한 공연 없음 + 공연 탭 CTA.
- Error: 목록 retry.

## T-06. 올리기·폼 — `Upload Sheet` step 2

**대상:** `Upload Sheet`, `Input`, `Button`, preview card, `Toast`  
**우선순위:** P0  
**토큰:** `card`, `fg`, `muted`, `subtle`, `border`, `primary`, `primary-strong`, `focus-ring`, `thumbnail-overlay`

### 변경 전 / 후

- 전: URL 입력 이후 검증/미리보기/게시 가능 조건이 한눈에 확정되지 않음.
- 후: URL paste → platform/title/thumbnail preview → category → post. 성공 전 disabled. 반응 보장 문구 제거.

### 카피

- KO: `영상 링크` / `링크만 붙여넣으면 끝 · 멤버에게 보여줄 수 있어요.` / `미리보기` / `게시하기` / `이 링크는 지원하지 않아요.` / `이 공연은 업로드가 마감됐어요.`
- EN: `Video link` / `Paste a link and share it with the members.` / `Preview` / `Post` / `This link isn't supported.` / `Uploads for this performance are closed.`
- JA: `動画リンク` / `リンクを貼り付けるだけ · メンバーに届けられます。` / `プレビュー` / `投稿する` / `このリンクは対応していません。` / `この公演のアップロードは終了しました。`

### Acceptance

- [ ] URL validation 중 `Button` disabled.
- [ ] supported preview가 로딩·성공·실패 상태를 갖는다.
- [ ] duplicate/private/invalid/unsupported를 구분한다.
- [ ] 게시 완료 후 멤버 반응을 보장하지 않는다.

### States

- Loading: URL validating + preview skeleton.
- Empty: URL 미입력 — 제출 disabled.
- Error: inline error + retry/edit.
- Success: 게시 완료 toast와 `/video/[id]` 링크.

## T-07. 이벤트 `/events` — World Cup + V01D Pick

**대상:** `Top Bar`, event cards, `V01D Pick`, `Button`, `Login Prompt Modal`  
**우선순위:** P1  
**토큰:** `bg`, `card`, `fg`, `muted`, `border`, `primary`, `primary-soft`, `primary-strong`, `shadow-sm`

### 변경 전 / 후

- 전: 월드컵과 멤버 하트 아카이브가 같은 이벤트 목록처럼 보일 수 있음.
- 후: `진행 중인 이벤트`와 `V01D Pick`을 별도 section으로 분리. 월드컵은 투표, Pick은 반응 확인 행동으로 CTA 분리.

### 카피

- KO: `진행 중인 이벤트` / `V01D Pick` / `투표하기` / `멤버 하트 영상 보기` / `진행 중인 이벤트가 없어요.`
- EN: `Live events` / `V01D Pick` / `Vote now` / `View member-hearted videos` / `No live events.`
- JA: `開催中のイベント` / `V01D Pick` / `投票する` / `メンバーがハートを送った動画を見る` / `開催中のイベントはありません。`

### Acceptance

- [ ] 두 카드의 CTA가 서로 다른 행동을 명시한다.
- [ ] V01D Pick에는 실제 heart가 있는 영상만 연결된다.
- [ ] 투표는 guest에게 로그인 게이트를 노출하고 intent를 보존한다.

### States

- Loading: section/card skeleton.
- Empty: 이벤트 없음과 Pick 없음 분리.
- Error: section retry.

## T-08. 월드컵 플레이 — event play

**대상:** `Top Bar`, matchup card, `Button`, progress, `Login Prompt Modal`, `Bottom Sheet`  
**우선순위:** P1  
**토큰:** `bg`, `card`, `fg`, `muted`, `border`, `primary`, `primary-soft`, `primary-strong`, `focus-ring`

### 변경 전 / 후

- 전: 대결·결과 중심이라 나가기·잔여 투표·결과 산식이 약할 수 있음.
- 후: `Back/Exit`, 라운드·진행도·잔여 투표·cap·결과 정의를 항상 표시.

### 카피

- KO: `나가기` / `라운드 {current}/{total}` / `이번 이벤트 투표 {used}/{cap}` / `우승비율` / `1:1 승률` / `투표를 저장하지 못했어요.`
- EN: `Exit` / `Round {current}/{total}` / `Event votes {used}/{cap}` / `Win share` / `Head-to-head win rate` / `We couldn't save your vote.`
- JA: `終了` / `ラウンド {current}/{total}` / `今回の投票 {used}/{cap}` / `優勝率` / `対戦勝率` / `投票を保存できませんでした。`

### Acceptance

- [ ] 나가기 action과 브라우저 back이 모두 존재한다.
- [ ] 투표 후 진행도·잔여 cap이 갱신된다.
- [ ] cap 초과 시 투표 버튼이 disabled되고 이유가 보인다.
- [ ] guest vote는 로그인 후 같은 matchup으로 복귀한다.

### States

- Loading: matchup skeleton; vote pending indicator.
- Empty: 대진 없음 + 이벤트 목록 CTA.
- Error: vote retry; 중복 제출 방지.
- Result: 산식 설명과 집계 시점을 표시.

## T-09. V01D Pick `/hearts`

**대상:** `Top Bar`, `Filter Chips`, `Video Card`, `Member Reaction Badge`, `Empty State`  
**우선순위:** P0  
**토큰:** `bg`, `card`, `fg`, `muted`, `border`, `primary-soft`, `primary-strong`, `thumbnail-overlay`, `shadow-sm`

### 변경 전 / 후

- 전: Pick과 일반 하트/조회 콘텐츠가 혼동될 수 있음.
- 후: 실제 멤버 heart가 1개 이상인 video만 노출. `그랜드슬램`은 모든 대상 멤버 heart 충족 시만 표시. 조회만 있는 video는 제외.

### 카피

- KO: `V01D Pick` / `멤버가 하트를 보낸 영상이에요.` / `아직 멤버 하트를 받은 영상이 없어요.` / `멤버별로 보기`
- EN: `V01D Pick` / `Videos that received a member heart.` / `No videos have received a member heart yet.` / `Browse by member`
- JA: `V01D Pick` / `メンバーがハートを送った動画です。` / `まだメンバーからハートを受けた動画はありません。` / `メンバー別に見る`

### Acceptance

- [ ] query 조건에 explicit member heart가 포함된다.
- [ ] view-only video가 Pick에 들어가지 않는다.
- [ ] all-member heart일 때만 `그랜드슬램`이 표시된다.
- [ ] member filter가 있으면 해당 멤버의 실제 heart만 기준으로 한다.

### States

- Loading: Pick card skeleton.
- Empty: 명시적 Empty copy + 공연/아카이브 CTA.
- Error: reaction query retry, video list는 독립 처리.

## T-10. 마이 `/my`

**대상:** `Top Bar`, profile header, stats, tabs, `Empty State`, `Gradient` upload CTA  
**우선순위:** P1  
**토큰:** `bg`, `card`, `fg`, `muted`, `subtle`, `border`, `primary`, `brand-gradient`, `shadow-sm`, `focus-ring`

### 변경 전 / 후

- 전: 빈 마이페이지가 하단 ＋만으로 업로드를 유도하고 통계 정의가 드러나지 않을 수 있음.
- 후: 첫 업로드 `Empty State` CTA 추가. 통계는 view/heart/all-hearts 실제 event 정의와 연결.

### 카피

- KO: `아직 올린 영상이 없어요. 첫 영상을 올려보세요.` / `영상 올리기` / `멤버가 봤어요` / `멤버 하트` / `멤버 전원`
- EN: `You haven't uploaded any videos yet. Share your first one.` / `Upload a video` / `Member views` / `Member hearts` / `All members`
- JA: `まだ動画がありません。最初の動画をシェアしましょう。` / `動画をアップロード` / `メンバーの閲覧` / `メンバーのハート` / `メンバー全員`

### Acceptance

- [ ] guest `/my`는 로그인 유도와 공개 화면 복귀를 제공한다.
- [ ] empty CTA가 upload intent로 연결된다.
- [ ] stats label과 backend event가 일치한다.
- [ ] reaction tabs의 0건 상태가 정확히 표시된다.

### States

- Loading: profile/stats/tab skeleton.
- Empty: 탭별 empty copy.
- Error: stats와 list를 독립 retry.
- Auth: login 후 `/my` 복귀.

## T-11. 알림

**대상:** `Top Bar`, `Notification Item`, `Member Reaction Badge`, `Video Card`  
**우선순위:** P0  
**토큰:** `bg`, `card`, `fg`, `muted`, `subtle`, `border`, `primary`, `primary-soft`, `primary-strong`, `focus-ring`

### 변경 전 / 후

- 전: 멤버 반응 알림이 영상 위치로 정확히 복귀하는 계약과 타입별 차이가 약함.
- 후: `view/heart/comment`를 구분하고 payload·deep link·focus를 구현.

### 카피

- KO: `{member} 님이 봤어요` / `{member} 님이 하트를 보냈어요` / `{member} 님이 댓글을 남겼어요` / `알림이 없어요.`
- EN: `{member} viewed your video` / `{member} sent a heart` / `{member} commented on your video` / `No notifications.`
- JA: `{member}さんが動画を見ました` / `{member}さんがハートを送りました` / `{member}さんが動画にコメントしました` / `通知はありません。`

### Acceptance

- [ ] 각 `Notification Item`에 event type이 데이터와 일치한다.
- [ ] 클릭 시 `/video/[id]`와 focus query가 생성된다.
- [ ] 읽음 처리와 뒤로가기 목록 위치가 복원된다.
- [ ] 색상 외에 아이콘/문구/스크린리더 label로 타입이 전달된다.

### States

- Loading: list skeleton.
- Empty: 알림 없음.
- Error: 다시 시도 + 기존 목록 보존.
- Pagination: 중복·순서 역전 없이 append.

## T-12. 로그인 유도 모달

**대상:** `Login Prompt Modal`, `Button`, `Toast`  
**우선순위:** P0  
**토큰:** `card`, `fg`, `muted`, `border`, `primary`, `primary-strong`, `focus-ring`, `shadow-sm`

### 변경 전 / 후

- 전: 로그인 모달이 열람·상호작용 구분 없이 등장할 수 있음.
- 후: interaction-only gate; intent/return state 저장; 로그인/닫기 모두 제공.

### 카피

- KO: `로그인하고 계속하기` / `이 기능을 사용하려면 로그인이 필요해요.` / `로그인` / `닫기`
- EN: `Log in to continue` / `Log in to use this feature.` / `Log in` / `Close`
- JA: `ログインして続ける` / `この機能を使うにはログインが必要です。` / `ログイン` / `閉じる`

### Acceptance

- [ ] 공개 video 열람에서는 자동으로 열리지 않는다.
- [ ] restricted action에서만 호출된다.
- [ ] dismiss 후 원래 화면을 유지한다.
- [ ] login success/failure 모두 원래 intent를 보존한다.
- [ ] modal focus trap·Esc·backdrop·screen reader dialog semantics를 지원한다.

### States

- Loading: auth button pending, 중복 submit 방지.
- Error: 로그인 실패 inline/Toast + retry.
- Dismissed: pending action은 실행하지 않고 원래 화면 유지.

---

# 3. 데이터·라우팅·QA 체크리스트

## 3.1 Supabase 계약 확인

- [ ] `stage` 내부 모델과 사용자 `공연` 번역을 분리.
- [ ] `videos`는 canonical `id`, `performance_id`, `source_url`, `source_platform`, `title`, `thumbnail_url`, `status`를 제공.
- [ ] member event는 `member_id`, `video_id`, `type=view|heart|comment`, `created_at`, 필요 시 `comment_id`를 제공.
- [ ] member view와 heart를 동일 boolean/count로 저장하지 않는다.
- [ ] V01D Pick query는 `type=heart`만 사용.
- [ ] all-member heart query는 대상 멤버 집합을 기준으로 계산.
- [ ] 알림은 `video_id`, `reaction_type`, `comment_id?`, `read_at`를 제공.
- [ ] upload preview/validation 결과를 post 전 transient state로 처리하고 private/duplicate/unsupported를 구분.

## 3.2 라우팅

- [ ] `/video/[id]`가 공유·알림의 canonical URL.
- [ ] `focusReaction`, `commentId`, `returnTo`, `returnState`, `intent`의 허용 범위와 sanitize 정책 확정.
- [ ] 로그인 후 redirect allowlist 적용.
- [ ] `/stage/[id]`는 사용자 화면에서 `공연`으로 렌더.
- [ ] `/stages`는 `V01D 아카이브`의 공연 목록으로 렌더.

## 3.3 카피·다국어

- [ ] 모든 신규 카피에 ko/en/ja dictionary key가 있다.
- [ ] singular/plural·member placeholder·날짜·숫자 locale 처리.
- [ ] 한국어 사용자 화면에 `스테이지`/`무대`가 노출되지 않는다.
- [ ] V01D 고유 라벨은 `V01D 아카이브`, `V01D Pick`을 유지한다.
- [ ] 하트/조회/댓글 카피가 이벤트 타입과 일치한다.

## 3.4 접근성·반응형

- [ ] 390px·430px·태블릿에서 horizontal overflow가 없다.
- [ ] tap target 최소 44×44px.
- [ ] focus ring `focus-ring`; keyboard tab order; modal focus trap.
- [ ] 이미지 alt, video title, icon accessible name.
- [ ] 색상만으로 상태 구분 금지.
- [ ] `prefers-reduced-motion` 지원.
- [ ] 주요 텍스트와 배경 대비를 실제 썸네일 샘플로 QA.

## 3.5 출시 전 검수 순서

1. Storybook/컴포넌트 수준: 토큰, Wordmark, Video Card, Member Reaction Badge, Login Prompt Modal, Upload Sheet.
2. 라우팅 수준: guest `/video/[id]` → interaction gate → login return → notification focus.
3. 데이터 수준: view/heart/comment/all-hearts와 V01D Pick query.
4. 모바일 수준: 390/430px, portrait, keyboard/screen reader, reduced-motion.
5. 카피 수준: ko/en/ja, 사용자 `공연`, 정직한 reaction wording.
6. 회귀 수준: 홈·공연·영상·업로드·이벤트·마이·알림 12개 캡처 비교.

## 3.6 최종 완료 조건

- [ ] 통합 이슈 리스트의 P0가 모두 해결되거나 product 승인으로 명시되었다.
- [ ] P1 항목의 첫 스프린트 범위가 티켓화되었다.
- [ ] 브랜드 그라데이션이 CELEBUS 워드마크와 올리기에만 남는다.
- [ ] V01D Pick이 실제 멤버 하트 데이터만 소비한다.
- [ ] 공개 공유 영상이 로그인 없이 열린다.
- [ ] 로그인 후 의도와 위치가 복귀된다.
- [ ] 알림에서 반응/댓글 위치가 focus된다.
- [ ] 상태·접근성·다국어 QA가 완료된다.
