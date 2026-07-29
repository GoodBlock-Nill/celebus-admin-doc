# CELEBUS MOMENT 전체 화면 재검토 결과

> **문서 목적:** Claude Code가 CELEBUS MOMENT 모바일 PWA를 구현·수정할 때 사용할 수 있는 UI/UX 검토 결과 및 실행 지시서
>
> **검토일:** 2026-07-29
>
> **검토 대상:** `CELEBUS MOMENT · 전체 화면 리뷰 v2`
>
> **원본 리뷰 HTML:** https://assets.carat-api.im/upload_from_app/2478910/20260729/e36d3290-57df-4cbb-a161-1c780b6302f1.html
>
> **대상 화면:** 384px 폭 모바일 화면 12종

---

## 1. 최종 결론

현재 CELEBUS MOMENT의 브랜드 방향과 전체 Information Architecture는 유지한다. 전면적인 재설계보다 다음 세 가지를 우선 구현한다.

1. **App Shell 안정화**
   - 하단 네비게이션과 콘텐츠 겹침 방지
   - `safe-area-inset-bottom` 대응
   - 바텀시트·모달·floating 요소의 레이어 순서 정리

2. **화면 목적과 상태 명확화**
   - 홈과 알림 화면 분리
   - 업로드의 빈 상태·성공 상태·오류 상태 분리
   - 월드컵 투표 규칙과 산식 노출

3. **컴포넌트 의미와 브랜드 계층 정리**
   - 멤버 반응 정보와 사용자 액션을 다른 컴포넌트로 표현
   - `V01D`에 기능 설명을 함께 표시
   - 44×44px 터치 영역과 키보드 대응을 실제 DOM에서 검증

---

## 2. 유지해야 할 디자인 결정

다음 항목은 현재 방향을 유지한다.

- 제품명: **CELEBUS MOMENT**
- 태그라인: **Your moment. Their response.**
- 사용자-facing 용어: **공연**, **이벤트**, **마이**
- 메인 포인트 컬러: `#6C4DE6` CELEBUS Violet
- gradient 사용 범위:
  - CELEBUS wordmark
  - Upload(+) 버튼
  - 그 외 일반 UI에는 과도한 gradient 사용 금지
- 모바일 기준 폭: 390px / 430px, 최소 검증 폭 384px
- 최소 터치 영역: 44×44px
- 멤버 하트와 팬 좋아요의 의미 분리
- 홈 IA:
  - Hero content
  - 멤버 반응
  - 공연 아카이브
  - 월드컵
  - V01D Pick
- 이벤트 IA:
  - 월드컵
  - V01D Pick

현재 브랜드 및 IA 자체를 다시 뒤집을 필요는 없다.

---

## 3. 구현 우선순위 요약

| ID | 우선순위 | 항목 | 구현 상태 목표 |
|---|---|---|---|
| SHELL-01 | P1 | 하단 네비게이션과 콘텐츠 겹침 방지 | 모든 route에서 최하단 콘텐츠가 가려지지 않음 |
| SHELL-02 | P1 | 검은색 `N` floating 요소 역할 정리 | 제거하거나 명확한 프로필 shortcut으로 통합 |
| SHELL-03 | P1 | 바텀시트·모달·floating 레이어 정리 | 열린 sheet/modal 위에 불필요한 요소가 노출되지 않음 |
| ROUTE-01 | P1 | 알림 화면과 홈 화면 분리 | 알림 route에는 알림 콘텐츠만 표시 |
| VIDEO-01 | P1 | 영상 상세 액션과 멤버 반응 정보 분리 | 버튼·정보 배지·공유 액션의 의미가 시각적으로 구분됨 |
| UPLOAD-01 | P1 | 업로드 상태 3종 구현 | empty / preview success / inline error 구분 |
| EVENT-01 | P1 | 월드컵 규칙·산식 표시 | 투표 횟수와 집계 방식이 화면에서 확인됨 |
| BRAND-01 | P1 | V01D 기능 설명 추가 | 처음 보는 사용자도 V01D의 역할을 이해함 |
| ACCESS-01 | P1 | 실제 44×44px hit area 검증 | 버튼·아이콘·행 전체에 최소 터치 영역 적용 |
| ACCESS-02 | P1 | 키보드 및 safe-area 대응 검증 | 댓글·업로드 입력 시 가려짐 없음 |
| POLISH-01 | P2 | 회색 placeholder 및 카드 정보 보강 | 상태와 콘텐츠 유형이 구분됨 |
| POLISH-02 | P2 | 보조 텍스트 색상 사용 범위 정리 | 핵심 정보에 저대비 색상 사용 없음 |

---

# 4. P1 구현 지시사항

## SHELL-01. 하단 네비게이션과 콘텐츠 겹침 방지

### 문제

홈, 영상 상세, 알림 등 긴 화면에서 fixed bottom navigation이 콘텐츠 위에 놓인다. 실제 구현에서도 댓글 입력창, 마지막 카드, 아카이브 콘텐츠가 네비게이션 아래에 가려질 수 있다.

### 구현

```css
.page-content {
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.bottom-nav {
  min-height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
}
```

권장사항:

- 하단 네비게이션의 실제 높이를 CSS variable로 관리한다.
- `page-content`의 bottom padding은 네비게이션 실제 높이보다 크게 설정한다.
- 영상 상세 댓글 목록의 마지막 항목이 네비게이션 아래에 묻히지 않아야 한다.
- iOS Safari의 Home Indicator 영역을 포함해 검증한다.

### Acceptance Criteria

- 384px, 390px, 430px 폭에서 모든 route의 마지막 콘텐츠가 완전히 보인다.
- 댓글 입력창과 마지막 댓글이 bottom navigation에 가려지지 않는다.
- 스크롤 최하단에서 콘텐츠와 네비게이션 사이에 최소 16px의 시각적 여백이 있다.

---

## SHELL-02. 검은색 `N` floating 요소 정리

### 문제

모든 화면 하단 왼쪽에 검은색 원형 `N` 요소가 반복 노출된다. 현재는 하단 네비게이션의 추가 메뉴인지, 프로필 shortcut인지, 개발용 컨트롤인지 알 수 없다.

### 구현 방향

다음 중 하나를 선택한다.

### 권장안 A: 제거

서비스 기능이 아니라면 production UI에서 제거한다.

### 대안 B: 프로필 shortcut으로 통합

프로필 shortcut이라면:

- `N` 대신 사용자 아바타 또는 명확한 프로필 아이콘 사용
- 하단 네비게이션과 겹치지 않는 위치에 배치
- 최소 44×44px hit area
- `aria-label="마이페이지"` 제공
- 바텀시트·모달이 열리면 dim layer 아래로 이동

### Acceptance Criteria

- 사용자가 `N`의 기능을 추측하지 않아도 된다.
- 바텀시트나 로그인 모달 위에 `N`이 떠 있지 않는다.
- production build에 개발용 floating control이 남지 않는다.

---

## SHELL-03. 바텀시트·모달·floating 요소 레이어 정리

### 문제

공연 선택 바텀시트 화면에서 검은색 `N` 요소가 sheet 위에 노출된다. overlay, bottom navigation, sheet, modal의 z-index 계층이 불명확하다.

### 권장 레이어

```text
base content       z-index: 0
bottom navigation  z-index: 40
floating control   z-index: 50
dim overlay        z-index: 80
bottom sheet       z-index: 90
login modal        z-index: 100
```

### 구현 조건

- sheet/modal이 열리면 base content와 하단 네비게이션은 dim layer 아래에 둔다.
- sheet/modal 외부 요소는 pointer event를 받지 않는다.
- 바텀시트는 `role="dialog"`, `aria-modal="true"`를 사용한다.
- 닫기 버튼과 sheet item의 hit area는 44×44px 이상으로 한다.
- 필요하면 body scroll lock을 적용한다.

### Acceptance Criteria

- 공연 선택 sheet 위에 불필요한 floating 요소가 보이지 않는다.
- sheet가 열린 상태에서 배경 콘텐츠를 실수로 클릭할 수 없다.
- sheet와 modal의 시각적 우선순위가 명확하다.

---

## ROUTE-01. 알림 화면과 홈 화면 분리

### 문제

11번 화면은 `아직 알림이 없어요`라는 알림 empty state와 홈 피드 콘텐츠가 함께 보인다. 하단에서는 홈 탭이 활성화되어 있어, 알림 화면인지 홈 화면인지 구분하기 어렵다.

### 구현

알림 route에는 알림 콘텐츠만 표시한다.

```text
알림
아직 새로운 알림이 없어요.
```

알림 화면에서 제거해야 하는 홈 전용 요소:

- `Your moment. Their response.` hero
- 홈 메인 영상
- 홈 멤버 반응 모듈
- 공연 아카이브
- 월드컵·V01D Pick 홈 섹션

### 필요한 상태

1. 빈 상태
   - `아직 새로운 알림이 없어요.`
2. 멤버 하트 알림
3. 댓글 알림
4. 읽음/읽지 않음 상태
5. 알림 클릭 후 해당 영상의 해당 반응·댓글 위치로 이동

### Acceptance Criteria

- `/notifications` route에서 홈 feed가 렌더링되지 않는다.
- 알림 탭이 활성화된다.
- 알림이 없을 때 빈 상태가 화면 목적을 명확히 전달한다.
- 알림이 있을 때 멤버 하트와 댓글 알림을 구분할 수 있다.

---

## VIDEO-01. 영상 상세의 액션과 멤버 반응 정보 분리

### 문제

04번 화면에서 `멤버 전원 하트`, `주연 님이 하트를 보냈어요`, `자랑하기`가 유사한 연보라색 스타일로 표현되어 버튼인지 정보인지 구분이 약하다.

### 권장 컴포넌트 규칙

| 의미 | 컴포넌트 | 권장 스타일 |
|---|---|---|
| 멤버 전원 하트 | Member reaction status/action | solid violet 또는 명확한 action button |
| 주연 님이 하트를 보냈어요 | Member reaction badge/info row | badge 또는 정보형 row |
| 자랑하기 | Share action | outline button 또는 icon button |
| 원본 보기 | External/source action | secondary button |
| 신고 | Destructive/utility action | 텍스트 링크 또는 별도 utility 영역 |

### 구현 조건

- 멤버 인증 badge와 일반 팬 좋아요 아이콘을 분리한다.
- 정보 표시 row는 누를 수 없는 경우 button semantics를 사용하지 않는다.
- 누를 수 있는 액션은 `button` element와 44×44px hit area를 사용한다.
- icon-only button에는 `aria-label`을 추가한다.
- 하트의 의미가 view count나 단순 engagement count와 섞이지 않도록 한다.

### Acceptance Criteria

- 사용자가 각 요소의 역할을 첫눈에 구분할 수 있다.
- 멤버 반응은 멤버 인증 상태와 함께 표시된다.
- 팬 좋아요와 멤버 하트가 동일한 숫자·아이콘 의미로 합산되지 않는다.

---

## UPLOAD-01. 업로드 상태 3종 구현

### 문제

06번 캡션에는 `즉시 미리보기 · 인라인 오류`가 명시되어 있으나, 화면에는 빈 입력 상태만 보인다. 구현·QA 목적상 상태를 분리해야 한다.

### 필수 상태

#### 상태 A: Empty

```text
링크를 붙여넣어 주세요
[미리보기]
```

- 입력 전 Preview 버튼은 disabled
- disabled 이유가 시각적으로 명확해야 함

#### 상태 B: Preview Success

```text
[입력된 링크]
[썸네일]
영상 제목
출처 또는 원본 플랫폼
[공연 다시 선택]
[업로드하기]
```

#### 상태 C: Inline Error

```text
지원하지 않는 링크예요.
또는
영상을 불러오지 못했어요.
```

- 오류는 입력 필드 인접 위치에 표시
- 오류 색상만으로 의미를 전달하지 않음
- 오류 메시지와 해결 방법을 함께 표시

### 구현 조건

- 링크 입력 field는 명확한 label을 가진다.
- `미리보기` 버튼은 입력값이 유효할 때만 활성화한다.
- loading 상태를 별도로 제공한다.
- preview 실패 시 기존 입력값을 보존한다.
- `공연 다시 선택`은 sheet를 열되 현재 입력값과 preview 상태를 잃지 않는다.

### Acceptance Criteria

- empty / loading / success / error 상태를 재현할 수 있다.
- 오류 발생 시 사용자가 다음 행동을 알 수 있다.
- 업로드 대상 공연과 preview 콘텐츠가 화면에서 동시에 확인된다.
- 모든 주요 입력·버튼의 hit area가 44×44px 이상이다.

---

## EVENT-01. 월드컵 투표 규칙과 산식 표시

### 확인 결과

08번 화면의 `월드컵 시작 (2강)`은 명확한 Primary CTA이고 `랭킹 보기`는 보조 액션이다. 버튼 위계 자체는 다시 바꿀 필요가 없다.

현재 보완할 부분은 투표 규칙 설명이다.

### 추가 카피 예시

```text
이번 이벤트 투표 0/3회
투표는 하루 최대 3회 참여할 수 있어요.
최종 순위는 누적 득표율로 계산됩니다.
[투표 방식 보기]
```

### 구현 조건

- `N/3`의 N은 현재 사용자 기준 참여 횟수임을 명시한다.
- 일일 리셋 시점을 정의한다.
- 득표율/승률/우승 비율 중 실제 산식 하나만 명칭을 사용한다.
- 산식이 확정되지 않았다면 임의의 계산 문구를 노출하지 않는다.
- 규칙은 accordion 또는 bottom sheet로 제공할 수 있다.

### Acceptance Criteria

- 사용자가 남은 투표 횟수를 이해한다.
- 결과가 어떤 기준으로 계산되는지 확인할 수 있다.
- `월드컵 시작`과 `랭킹 보기`의 Primary/Secondary 위계가 유지된다.

---

## BRAND-01. V01D의 기능 설명 추가

### 문제

`V01D 아카이브`, `V01D Pick`, `V01D 파일럿`, `그랜드슬램`이 표시되지만, 신규 사용자에게 V01D가 아티스트명인지 카테고리인지 파일럿명인지 바로 설명되지 않는다.

### 권장 카피

```text
V01D 아카이브
공연별 콘텐츠를 모아볼 수 있어요.

V01D Pick
멤버 하트를 받은 영상

그랜드슬램
V01D 멤버 전원의 하트를 받은 영상
```

### 구현 조건

- `V01D`는 유지하되 최초 노출 시 한 줄 설명을 함께 표시한다.
- 설명은 보조 텍스트이지만 `#A6A7B2`처럼 너무 낮은 대비를 사용하지 않는다.
- 내부 DB·route 명칭과 사용자-facing 카피를 분리한다.
- `Stage`가 UI에 노출되지 않도록 한다. 사용자-facing 용어는 `공연`이다.

---

## ACCESS-01. 실제 44×44px hit area 검증

스크린샷만으로 실제 터치 영역을 확정할 수 없으므로 DOM 및 CSS에서 검증한다.

### 검사 대상

- 하단 네비게이션 각 탭
- Upload(+) 버튼
- 하트·댓글·공유·원본·신고 아이콘
- 공연 카드 전체
- 필터 칩
- 댓글 등록 버튼
- 바텀시트 닫기 버튼
- 공연 선택 list row
- 로그인 모달 버튼

### 구현 기준

```css
.icon-button,
.nav-item,
.sheet-item,
.card-action {
  min-width: 44px;
  min-height: 44px;
}
```

작은 아이콘을 유지해야 할 경우 시각적 아이콘은 16~24px로 두되, 부모 button의 hit area를 44px로 유지한다.

---

## ACCESS-02. 키보드 및 safe-area 검증

### 반드시 확인할 상태

- 영상 상세에서 댓글 입력 field focus
- iOS Safari 키보드가 열린 상태
- 업로드 링크 입력 field focus
- 바텀시트가 열린 상태에서 키보드 표시
- 화면 회전 또는 430px 폭
- 스크롤 최하단

### Acceptance Criteria

- 키보드가 댓글 입력창과 등록 버튼을 가리지 않는다.
- 입력 focus 시 현재 입력 위치가 viewport 안으로 이동한다.
- safe area 아래에 버튼이 붙지 않는다.
- modal/sheet를 닫은 뒤 body scroll이 정상 복구된다.

---

# 5. 화면별 리뷰

## 01. 홈 / Discovery

### 유지

- Hero → 멤버 반응 → 공연 아카이브 → 월드컵 → V01D Pick 순서
- `Your moment. Their response.` 태그라인
- 멤버 반응과 일반 반응의 의미 분리

### 수정

- 하단 네비게이션에 가려지지 않도록 bottom padding 추가
- V01D 아카이브 설명 문구 추가
- 날짜·경과 시간 등 보조 텍스트는 핵심 정보에 사용하지 않도록 대비 조정

**우선순위:** P1 Shell, P2 content polish

---

## 02. V01D 아카이브 / 공연 목록

### 확인 결과

`영상 길이 정보가 없다`는 항목은 P1로 볼 근거가 부족하다. 콘텐츠 정책상 필수 정보가 아니라면 P2 또는 제외한다.

### 수정

- 회색 placeholder가 썸네일인지 준비 중 상태인지 명확히 표현
- `미리보기 준비 중` 또는 `대표 이미지 없음` 상태 카피 검토
- `열어보기`뿐 아니라 카드 전체를 클릭 영역으로 처리
- 긴 공연명은 2줄 line-clamp 적용

**우선순위:** P2

---

## 03. 공연 상세

### 확인 결과

전체/직캠 등 필터 칩의 선택 상태는 충분히 명확하다. 선택 상태가 검은색인 것은 취향 문제가 아니면 변경하지 않는다.

### 수정

- 긴 공연명·작성자명에 line-clamp 적용
- 날짜·작성자·하트 수 최소 가독성 확보
- 카드 전체를 링크 또는 button semantics로 처리
- 카드 내부 아이콘을 공통 2px stroke SVG system으로 통일

**우선순위:** P2

---

## 04. 영상 상세

### 수정

- 댓글 입력창과 마지막 댓글의 safe-area·bottom navigation 겹침 검증
- 멤버 하트 action과 멤버 반응 info row를 다른 컴포넌트로 분리
- 원본 보기·공유·신고·댓글 등록 hit area 검증
- 긴 댓글과 keyboard open 상태 검증

**우선순위:** P1

---

## 05. 공연 선택 바텀시트

### 확인 결과

이전 분석의 “구분선이 없어 오클릭 위험이 크다”는 판단은 확정 이슈로 보지 않는다. 현재 카드 테두리와 여백만으로도 항목은 분리되어 있다.

### 수정

- `N` floating 요소가 sheet 위에 노출되지 않도록 z-index 수정
- 회색 원형 placeholder의 의미를 명확히 표시
- 행 전체가 선택 가능하다는 affordance 추가
- 각 행 최소 44px 높이 보장

**우선순위:** P1 Shell, P2 content polish

---

## 06. 업로드 링크 입력

### 수정

- empty / preview success / inline error 상태 분리
- `미리보기` disabled·loading·success 상태 구분
- 오류 메시지를 field 인접 위치에 표시
- `공연 다시 선택` 시 입력값과 preview 유지

**우선순위:** P1

---

## 07. 이벤트 목록

### 유지

- 월드컵과 V01D Pick을 별도 섹션으로 분리
- 진행중/결과 발표 상태 표시
- V01D Pick을 이벤트 목록 내 별도 목적의 콘텐츠로 표현

### 수정

- 각 섹션에 한 줄 설명 추가
- 월드컵 카드와 V01D Pick 카드의 목적 차이 명시
- 이벤트가 없거나 하나뿐인 경우 empty state 정의

**우선순위:** P2

---

## 08. 월드컵 상세

### 확인 결과

`월드컵 시작 (2강)`이 Primary, `랭킹 보기`가 Secondary로 보이므로 버튼 위계는 충분하다. 버튼 스타일을 다시 바꿀 필요는 없다.

### 수정

- `N/3` 투표 횟수 의미 명시
- 투표 리셋 기준과 집계 산식 표시
- 산식이 확정되지 않은 경우 설명 문구를 임시로 확정하지 않음

**우선순위:** P1 콘텐츠 규칙

---

## 09. V01D Pick

### 유지

- 멤버 하트를 받은 영상만 모으는 목적
- 멤버 전원 하트/그랜드슬램 표현

### 수정

- 제목 아래 `멤버 하트를 받은 영상` 설명 추가
- `그랜드슬램`에 `V01D 멤버 전원의 하트` 설명 추가
- 카드의 하트 수·작성자·날짜 가독성 확인

**우선순위:** P2

---

## 10. 마이페이지

### 확인 결과

빈 상태를 P0로 분류할 정도의 문제는 아니다. 통계 0도 정상적인 상태 표현으로 유지 가능하다.

### 권장 카피

```text
아직 올린 영상이 없어요.
영상을 올리고 멤버의 반응을 받아보세요.
```

### 수정

- empty state의 보조 설명 추가
- `영상 올리러 가기`를 Upload(+)와 동일한 주요 액션으로 연결
- 통계 0과 콘텐츠 없음 상태를 혼동하지 않도록 구분

**우선순위:** P2

---

## 11. 알림

### 핵심 수정

- 홈 feed와 분리
- 알림 탭 활성화
- 빈 상태·멤버 하트·댓글·읽지 않음 상태 구현
- 클릭 시 해당 영상의 반응/댓글 위치로 이동

**우선순위:** P1

---

## 12. 로그인 유도 모달

### 확인 결과

이전 분석의 두 항목은 정정한다.

- dim 처리가 부족하다 → **문제 없음**
- 로그인/다시 확인의 위계가 모호하다 → **문제 없음**

현재 구성은 다음처럼 적절하다.

- 배경 dim 충분
- `CELEBUS에서 로그인`이 Primary
- `다시 확인`이 Secondary
- 모달 설명의 줄바꿈 자연스러움

### 구현 검증

- 닫기 버튼 44×44px
- 외부 로그인 이동 후 원래 의도 복귀
- 로그인 취소 시 원래 화면 유지
- 모달이 열린 상태에서 background click 차단
- focus trap 및 ESC/뒤로가기 처리

**우선순위:** P1 interaction QA, 시각 수정은 불필요

---

# 6. 색상 대비 기준

리뷰 HTML에 정의된 색상 기준 대비 계산 결과:

| 전경색 / 배경색 | 대비 | 사용 판단 |
|---|---:|---|
| `#686A76` / `#F7F7FA` | 약 5.02:1 | 본문 보조 텍스트 사용 가능 |
| `#686A76` / `#FFFFFF` | 약 5.37:1 | 본문 보조 텍스트 사용 가능 |
| `#A6A7B2` / `#F7F7FA` | 약 2.23:1 | 핵심 정보에 사용 금지 |
| `#A6A7B2` / `#FFFFFF` | 약 2.39:1 | 장식·비활성 텍스트에 제한 |
| `#4E2FC0` / `#F1EBFF` | 약 7.25:1 | 안내 박스 텍스트에 사용 가능 |

### 규칙

- 날짜·오류 메시지·버튼 label·핵심 상태에는 `#A6A7B2` 사용 금지
- `#A6A7B2`는 장식, disabled 상태, 중요도가 낮은 metadata에만 사용
- 작은 텍스트는 색상 대비만으로 해결하지 말고 font-weight와 spacing도 함께 확인

---

# 7. 이전 검토에서 정정하는 항목

Claude Code가 잘못된 수정에 시간을 쓰지 않도록 아래 항목은 확정 이슈에서 제외한다.

| 이전 주장 | 재검토 결과 |
|---|---|
| 영상 길이 정보 누락은 P1 | 콘텐츠 정책상 필수가 아니므로 P2 또는 제외 |
| 필터 칩의 검은색 선택 상태가 문제 | 현재 선택 상태는 명확함. 취향 이슈가 아니면 유지 |
| 공연 선택 sheet에 구분선이 없어 오클릭 위험 | 확정 이슈 아님. 카드 테두리·여백으로 구분됨 |
| 월드컵 시작/랭킹 버튼 위계가 모호함 | 현재 Primary/Secondary 위계가 명확함 |
| 마이페이지 빈 상태가 P0 | 정상적인 empty state. P2 개선사항 |
| 로그인 모달 dim이 부족함 | 문제 없음 |
| 로그인/다시 확인 버튼 위계가 모호함 | 문제 없음 |

---

# 8. Claude Code 실행 순서

## Phase 1 — App Shell

1. bottom navigation height와 safe-area variable 정의
2. 모든 route의 content bottom padding 적용
3. `N` floating 요소 제거 또는 프로필 shortcut 통합
4. z-index 계층 및 modal/sheet pointer event 정리
5. 384/390/430px에서 스크롤 최하단 확인

## Phase 2 — Route 및 상태

1. 알림 route에서 홈 feed 제거
2. 알림 empty/filled/read/unread 상태 구현
3. 업로드 empty/loading/success/error 상태 구현
4. 월드컵 투표 규칙과 산식 표시
5. 로그인 후 원래 의도 복귀 흐름 검증

## Phase 3 — 컴포넌트 의미와 접근성

1. 멤버 반응 info row와 action button 분리
2. 모든 icon button에 accessible label 추가
3. 모든 interactive element의 44×44px hit area 보장
4. 키보드·focus·뒤로가기·body scroll lock 검증
5. V01D 설명 카피 추가

## Phase 4 — Visual Polish

1. placeholder 상태 카피 보강
2. 공연·영상 카드 line-clamp 적용
3. metadata 대비와 font-weight 조정
4. empty state 보조 설명 추가
5. SVG icon stroke와 정렬 최종 통일

---

# 9. QA 체크리스트

## Layout

- [ ] 384px에서 가로 스크롤이 발생하지 않는다.
- [ ] 390px에서 하단 탭 label이 잘리지 않는다.
- [ ] 430px에서 카드와 네비게이션 정렬이 유지된다.
- [ ] 모든 화면의 마지막 콘텐츠가 bottom navigation에 가려지지 않는다.
- [ ] iOS safe-area 영역에 버튼이 붙지 않는다.

## Interaction

- [ ] 모든 주요 버튼·아이콘·행의 hit area가 44×44px 이상이다.
- [ ] 바텀시트가 열린 동안 배경을 클릭할 수 없다.
- [ ] 모달이 열린 동안 floating 요소가 위에 노출되지 않는다.
- [ ] 댓글 입력 시 키보드가 입력창을 가리지 않는다.
- [ ] 로그인 후 원래 액션으로 복귀한다.
- [ ] 로그인 취소 시 원래 화면과 입력 상태가 유지된다.

## Content and semantics

- [ ] 사용자-facing `Stage` 표기가 없다.
- [ ] 사용자-facing 공연 용어가 일관된다.
- [ ] V01D 최초 노출 시 기능 설명이 있다.
- [ ] 멤버 하트와 팬 좋아요가 구분된다.
- [ ] 조회수나 Pick count에 하트 의미가 잘못 포함되지 않는다.
- [ ] 월드컵 `N/3`의 의미와 집계 방식이 설명된다.
- [ ] 업로드 오류 메시지와 해결 방법이 함께 표시된다.

## Accessibility

- [ ] icon-only button에 `aria-label`이 있다.
- [ ] dialog에 `role="dialog"`, `aria-modal="true"`가 있다.
- [ ] keyboard focus가 보인다.
- [ ] `#A6A7B2`가 핵심 정보에 사용되지 않는다.
- [ ] disabled, loading, error 상태가 색상만으로 구분되지 않는다.

---

## 최종 판단

이 프로젝트는 현재 **브랜드·IA 재설계 단계가 아니라 App Shell과 상태·접근성 구현을 안정화하는 단계**다.

우선 다음 5개를 완료한 뒤 다시 모바일 캡처 QA를 진행한다.

1. 하단 네비게이션 safe-area 및 콘텐츠 padding
2. `N` floating 요소 정리
3. 알림 route와 홈 route 분리
4. 업로드 3종 상태 구현
5. 영상 상세·댓글·로그인 플로우의 44px 및 keyboard QA

그 이후 V01D 설명 카피, placeholder, metadata 대비 같은 P2 polish를 진행한다.
