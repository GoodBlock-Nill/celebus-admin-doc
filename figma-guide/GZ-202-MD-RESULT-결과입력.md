# [CEB-BO-GZ-202-MD-RESULT] 결과 입력 - Figma 조립 가이드

> 원본: `[CEB-BO-GZ-202-MD-RESULT] 결과 입력.md`
> 유형: Modal
> 크기: 640px × auto

---

## 레이아웃 구조

```
Frame (Modal)
├── Overlay Background (전체 화면)
│   └── opacity: 0.5, bg-gray-900
└── Modal Container (중앙 정렬, 640px)
    ├── Header
    │   ├── Title: "게임 결과 입력"
    │   └── Close Button [X]
    ├── Body
    │   ├── Info Table (게임 정보)
    │   │   ├── Row 1: 타이틀 | {게임 타이틀}
    │   │   ├── Row 2: 결과 확인 기준 | {기준 설명}
    │   │   ├── Row 3: 총 참여자 수 | {숫자}명
    │   │   ├── Row 4: YES 선택 | {숫자}명 ({비율}%)
    │   │   └── Row 5: NO 선택 | {숫자}명 ({비율}%)
    │   ├── Result Title (다국어)
    │   │   ├── Label: "결과제목 *"
    │   │   ├── Tabs (KO/EN/JP): Pills variant, size sm
    │   │   ├── Input (KO): maxlength 50
    │   │   ├── Input (EN): maxlength 50
    │   │   ├── Input (JP): maxlength 50
    │   │   └── Character Counter: "0/50"
    │   ├── Label: "게임 결과를 선택해주세요"
    │   ├── Result Selection (Radio Cards)
    │   │   ├── YES Card
    │   │   │   ├── Radio: ○ YES
    │   │   │   └── Text: "{숫자}명이 정답자가 됩니다"
    │   │   └── NO Card
    │   │       ├── Radio: ○ NO
    │   │       └── Text: "{숫자}명이 정답자가 됩니다"
    │   ├── Result Description (다국어)
    │   │   ├── Label: "결과설명 *"
    │   │   ├── Tabs (KO/EN/JP): Pills variant, size sm
    │   │   ├── Textarea (KO): rows 3, maxlength 500
    │   │   ├── Textarea (EN): rows 3, maxlength 500
    │   │   ├── Textarea (JP): rows 3, maxlength 500
    │   │   └── Character Counter: "0/500"
    │   ├── Result Link (다국어, 선택)
    │   │   ├── Label: "결과링크"
    │   │   ├── Tabs (KO/EN/JP): Pills variant, size sm
    │   │   ├── Input (링크텍스트): placeholder "링크 텍스트를 입력하세요."
    │   │   └── Input (링크 URL): type url, placeholder "https://example.com/result-proof"
    │   └── Warning: "⚠️ 결과 확정 후에는 변경할 수 없습니다."
    └── Footer
        ├── Button (Secondary): "취소"
        └── Button (Primary): "결과 확정" (결과 미선택 시 비활성화)
```

---

## Preline 컴포넌트 매핑

| 순서 | UI 요소 | Preline 컴포넌트 | 속성 | 내용 |
|------|---------|-----------------|------|------|
| 1 | 배경 오버레이 | Overlay | `opacity: 0.5` | 반투명 검정 배경 |
| 2 | 모달 컨테이너 | Modal | `width: 640px` | 중앙 정렬, 큰 모달 |
| 3 | 모달 타이틀 | Text (H3) | - | "게임 결과 입력" |
| 4 | 닫기 버튼 | Icon Button | - | [X], 우측 상단 |
| 5 | 게임 정보 테이블 | Table | `variant: bordered` | 5개 행 |
| 6 | 테이블 Row 1 | Table Row | - | 타이틀 \| {게임 타이틀} |
| 7 | 테이블 Row 2 | Table Row | - | 결과 확인 기준 \| {기준 설명} |
| 8 | 테이블 Row 3 | Table Row | - | 총 참여자 수 \| {숫자}명 |
| 9 | 테이블 Row 4 | Table Row | - | YES 선택 \| {숫자}명 ({비율}%) |
| 10 | 테이블 Row 5 | Table Row | - | NO 선택 \| {숫자}명 ({비율}%) |
| 11 | 결과제목 라벨 | Label (Required) | - | "결과제목 *" |
| 12 | 결과제목 언어 탭 | Tabs (Pills) | `variant: pills, size: sm` | KO / EN / JP |
| 13 | 결과제목 Input (KO) | Input (Text) | `maxlength: 50, show-counter: true` | Placeholder: "결과 제목을 입력하세요." |
| 14 | 결과제목 Input (EN) | Input (Text) | `maxlength: 50, show-counter: true` | Placeholder: "Enter result title." |
| 15 | 결과제목 Input (JP) | Input (Text) | `maxlength: 50, show-counter: true` | Placeholder: "結果タイトルを入力してください." |
| 16 | 결과제목 글자 수 카운터 | Text (Small) | `color: gray-500` | "0/50" (실시간 변경) |
| 17 | 선택 안내 | Text (Body) | - | "게임 결과를 선택해주세요" |
| 18 | YES 카드 | Radio Card | `variant: selectable` | 클릭 시 파란색 테두리 |
| 19 | YES 라디오 | Radio Button | - | ○ YES |
| 20 | YES 안내 텍스트 | Text (Body) | - | "{숫자}명이 정답자가 됩니다" |
| 21 | NO 카드 | Radio Card | `variant: selectable` | 클릭 시 파란색 테두리 |
| 22 | NO 라디오 | Radio Button | - | ○ NO |
| 23 | NO 안내 텍스트 | Text (Body) | - | "{숫자}명이 정답자가 됩니다" |
| 24 | 결과설명 라벨 | Label (Required) | - | "결과설명 *" |
| 25 | 결과설명 언어 탭 | Tabs (Pills) | `variant: pills, size: sm` | KO / EN / JP |
| 26 | 결과설명 Textarea (KO) | Textarea | `rows: 3, maxlength: 500, show-counter: true` | Placeholder: "결과에 대한 설명을 입력하세요." |
| 27 | 결과설명 Textarea (EN) | Textarea | `rows: 3, maxlength: 500, show-counter: true` | Placeholder: "Enter result description." |
| 28 | 결과설명 Textarea (JP) | Textarea | `rows: 3, maxlength: 500, show-counter: true` | Placeholder: "結果の説明を入力してください." |
| 29 | 결과설명 글자 수 카운터 | Text (Small) | `color: gray-500` | "0/500" (실시간 변경) |
| 30 | 결과링크 라벨 | Label | - | "결과링크" |
| 31 | 결과링크 언어 탭 | Tabs (Pills) | `variant: pills, size: sm` | KO / EN / JP |
| 32 | 결과링크 텍스트 Input | Input (Text) | - | Placeholder: "링크 텍스트를 입력하세요." |
| 33 | 결과링크 URL Input | Input (URL) | `type: url` | Placeholder: "https://example.com/result-proof" |
| 34 | 경고 아이콘 | Icon | `color: warning` | ⚠️ |
| 35 | 경고 문구 | Text (Body) | `color: warning` | "결과 확정 후에는 변경할 수 없습니다." |
| 36 | 취소 버튼 | Button | `variant: secondary` | 좌측 배치 |
| 37 | 결과 확정 버튼 | Button | `variant: primary`, `disabled: conditional` | 우측 배치, 조건부 활성화 |

---

## 상태별 변형

### YES 카드 선택 시
- YES 라디오 버튼 선택 (●)
- YES 카드 활성화 스타일 (파란색 테두리, 배경색 변경)
- NO 카드 비활성화 스타일
- "결과 확정" 버튼 활성화

### NO 카드 선택 시
- NO 라디오 버튼 선택 (●)
- NO 카드 활성화 스타일 (파란색 테두리, 배경색 변경)
- YES 카드 비활성화 스타일
- "결과 확정" 버튼 활성화

### 결과 미선택 시
- "결과 확정" 버튼 비활성화 (회색 배경, 커서 not-allowed)

### 결과 확정 버튼 클릭 시
- 2차 확인 모달 표시
  - 타이틀: "게임 결과를 확정하시겠습니까?"
  - 본문: "결과를 '{YES/NO}'(으)로 확정하시겠습니까?\n확정 후 변경할 수 없습니다."
  - 확정 정보 테이블:
    - 선택 결과 | {YES/NO}
    - 정답자 수 | {숫자}명
    - 오답자 수 | {숫자}명
  - 버튼: [돌아가기] [확정]

---

## 디자이너 참고사항

### 모달 크기
- 너비: 640px (테이블과 카드 포함으로 더 넓게)
- 높이: auto

### 게임 정보 테이블
- 5개 행으로 구성
- 필드명 열: 좌측 정렬, 굵게
- 값 열: 좌측 정렬

### 참여자 통계 계산
```
총 참여자 수 = YES 선택자 수 + NO 선택자 수
YES 비율 = (YES 선택자 수 / 총 참여자 수) × 100
NO 비율 = (NO 선택자 수 / 총 참여자 수) × 100
```
- 비율: 소수점 첫째 자리 반올림

### 결과 선택 카드
- 2열 레이아웃 (YES 좌측, NO 우측)
- 카드 간격: 16px
- 각 카드:
  - 패딩: 20px
  - 라디오 버튼 + 텍스트 수직 정렬
  - 선택 시: 파란색 테두리 (2px), 배경색 연한 파란색
  - 미선택 시: 회색 테두리 (1px), 흰색 배경

### 결과제목 (다국어 Input)
- **Label**: "결과제목 *" (필수 표시, red-500 asterisk)
- **Language Tabs**: Pills variant (게임 생성 폼 다국어 탭과 동일)
- **Input**: 최대 50자, 실시간 글자 수 카운터 (우측 하단)
- **Focus 시**: ring-2, ring-blue-500
- **글자 수 카운터**: "0/50" → gray-500, 12px
- **에러 시**: border-red-500, 카운터 red-600
- **위치**: 게임 정보 테이블 아래, 결과 선택 카드 위
- **간격**: 게임 정보 ~ 결과제목: 24px, 결과제목 ~ 결과 선택: 24px

### 결과설명 (다국어 Textarea)
- **Label**: "결과설명 *" (필수 표시, red-500 asterisk)
- **Language Tabs**: Pills variant, 동일 스타일 (게임 생성 폼의 타이틀 다국어 탭과 동일)
  - Active Tab: blue-600 배경, white 텍스트
  - Inactive Tab: gray-200 배경, gray-700 텍스트
  - 크기: 각 탭 width: 60px, height: 32px
- **Textarea**: rows: 3, 최대 500자, 실시간 글자 수 카운터 (우측 하단)
- **Focus 시**: ring-2, ring-blue-500
- **글자 수 카운터**: "0/500" → gray-500, 12px
- **에러 시**: border-red-500, 카운터 red-600
- **위치**: 결과 선택 카드 아래, 결과링크 위
- **간격**: 결과 선택 카드 ~ 결과설명: 24px, 결과설명 ~ 결과링크: 24px

### 결과링크 (다국어 링크 입력)
- **Label**: "결과링크" (선택사항, asterisk 없음)
- **Language Tabs**: Pills variant (동일 스타일)
- **링크텍스트 Input**: 링크에 표시될 텍스트 입력
- **링크 URL Input**: URL 형식, type="url"
- **두 Input 세로 배치**: 링크텍스트 위, URL 아래 (gap: 8px)
- **도움말**: "결과를 확인할 수 있는 링크를 입력하세요. (선택)" → gray-500, 12px
- **위치**: 결과설명 아래, 경고 박스 위
- **간격**: 결과설명 ~ 결과링크: 24px, 결과링크 ~ 경고: 24px

### 경고 표시

- 아이콘 + 텍스트 조합
- 색상: 주황색 (Warning)
- 위치: 카드 아래

### 버튼 스타일
- **취소**: Secondary
- **결과 확정**: Primary (파란색), 결과 미선택 시 비활성화

### 2차 확인 모달
- 결과 확정 전 한 번 더 확인
- 선택한 결과, 정답자/오답자 수 표시
- 돌이킬 수 없음을 강조

### 성공 시
- 게임 상태: Pending → Closed
- 토스트: "게임 결과가 확정되었습니다."
- 게임 상세 화면 갱신 (결과 표시, 보상 지급 버튼 활성화)
