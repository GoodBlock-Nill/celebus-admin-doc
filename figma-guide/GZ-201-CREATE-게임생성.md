# [CEB-BO-GZ-201-CREATE] 게임 생성 - Figma 조립 가이드

> 원본: [CEB-BO-GZ-201-CREATE] 게임 생성.md
> Frame: 1440 × auto, name="GZ-201-CREATE-게임생성"

---

## 레이아웃 구조

```
Frame: GZ-201-CREATE-게임생성
├── Sidebar (공통 컴포넌트)
├── Content Area
│   ├── Header
│   │   ├── Breadcrumb
│   │   └── Page Title
│   ├── Form Container
│   │   ├── Section: 게임 유형 선택
│   │   │   └── Radio: Prediction Market (고정)
│   │   ├── Section: 기본정보
│   │   │   ├── Tabs (KO/EN/JP)
│   │   │   ├── Input: 타이틀 (다국어)
│   │   │   ├── WYSIWYG Editor: 상세설명 (다국어)
│   │   │   ├── File Upload: 썸네일 이미지
│   │   │   └── Input URL: 힌트 링크
│   │   ├── Section: 보상설정
│   │   │   └── Input Number: 총 상금 GP
│   │   ├── Section: 참여설정
│   │   │   ├── Input Number: 참여 정원
│   │   │   ├── Input Number: 참여 비용
│   │   │   ├── Segmented Button: 부스팅 (가능/불가능)
│   │   │   └── Input Number: 부스팅 비용 (부스팅 "가능" 시)
│   │   ├── Section: 일정설정
│   │   │   ├── Datepicker + Timepicker: 투표 시작일시
│   │   │   ├── Datepicker + Timepicker: 투표 종료일시
│   │   │   └── Datepicker: 결과 발표 예정일
│   │   └── Section: 결과설정
│   │       ├── Tabs (KO/EN/JP)
│   │       └── Textarea: 결과 확인 기준 (다국어)
│   └── Footer
│       ├── Button (Outline): 취소
│       ├── Button (Outline): 임시저장
│       └── Button (Primary): 게시
```

---

## 영역별 Preline 컴포넌트 매핑

### 영역 1: Header
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Breadcrumb | Breadcrumb (Default) | Separator: ">" | 홈 > 게임존 > 게임 관리 > 게임 생성 |
| 2 | Page Title | Heading (H1) | - | "게임 생성" |

### 영역 2: 게임 유형 선택
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Label | Label | - | "게임 유형 *" |
| 3 | Radio Button | Radio (Checked) | disabled: false | "● Prediction Market" |
| 4 | Help Text | Text (Small) | color: gray-500 | Phase 1에서는 고정, Phase 2에서 추가 유형 선택 가능 |

### 영역 3: 기본정보 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "기본정보" |
| 3 | Field: 타이틀 | Form Group | - | - |
| 4 | Label | Label (Required) | - | "타이틀 *" |
| 5 | Language Tabs | Tabs (Pills) | variant: pills, size: sm | KO / EN / JP |
| 6 | Input (KO) | Input (Text) | maxlength: 50, show-counter: true | Placeholder: "한글 타이틀 입력 (최대 50자)" |
| 7 | Input (EN) | Input (Text) | maxlength: 50, show-counter: true | Placeholder: "Enter English title (max 50 chars)" |
| 8 | Input (JP) | Input (Text) | maxlength: 50, show-counter: true | Placeholder: "日本語タイトルを入力 (最大50文字)" |
| 9 | Character Counter | Text (Small) | color: gray-500 | "0/50" (실시간 변경) |
| 10 | Field: 상세설명 | Form Group | - | - |
| 11 | Label | Label (Required) | - | "상세설명 *" |
| 12 | Language Tabs | Tabs (Pills) | variant: pills, size: sm | KO / EN / JP |
| 13 | WYSIWYG Editor | Custom Component | - | Toolbar + contentEditable 영역 |
| 14 | Toolbar | Flex Container | gap: 2px, bg: gray-100, padding: 6px 8px, border-bottom: gray-200 | - |
| 15 | Toolbar Buttons | Button (Icon, Small) | size: 28px, each | [B] [I] [U] [•] [1.] [⇤] [⇥] ¦ [🔗] [🖼] |
| 16 | Editor Area | Div (contentEditable) | min-height: 200px, padding: 12px, font-size: 14px | WYSIWYG 편집 영역 |
| 17 | Field: 썸네일 이미지 | Form Group | - | - |
| 18 | Label | Label (Required) | - | "썸네일 이미지 *" |
| 19 | File Input | File Input (Dropzone) | accept: "image/jpeg,image/png", maxSize: 5MB | [📷 업로드] 버튼 + Drag & Drop 영역 |
| 20 | File Constraint | Text (Small) | color: gray-500 | "JPG, PNG / 최대 5MB" |
| 21 | Image Preview | Image Container | width: 320px, aspect-ratio: 16:9 | 업로드 후 미리보기 표시 |
| 22 | Delete Button | Button (Icon, Small) | icon: x-circle, position: top-right | 이미지 삭제 버튼 |
| 23 | Field: 힌트 링크 | Form Group | - | - |
| 24 | Label | Label | - | "힌트 링크" |
| 25 | Input (URL) | Input (URL) | type: url, placeholder: "https://example.com/hint" | URL 입력 |
| 26 | Help Text | Text (Small) | color: gray-500 | "게임 관련 힌트 페이지 URL을 입력하세요." |

### 영역 4: 보상설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "보상설정" |
| 3 | Field: 총 상금 GP | Form Group | - | - |
| 4 | Label | Label (Required) | - | "총 상금 GP *" |
| 5 | Input Number | Input Number | min: 100, max: 10000000, step: 100, suffix: "GP" | Placeholder: "100" |
| 6 | Help Text | Text (Small) | color: gray-500 | "최소 100 GP ~ 최대 10,000,000 GP" |

### 영역 5: 참여설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "참여설정" |
| 3 | Field: 참여 정원 | Form Group | - | - |
| 4 | Label | Label | - | "참여 정원" |
| 5 | Input Number | Input Number | min: 0, max: 100000, step: 1, suffix: "명" | Placeholder: "0 (무제한)" |
| 6 | Help Text | Text (Small) | color: gray-500 | "0 입력 시 무제한" |
| 7 | Field: 참여 비용 | Form Group | - | - |
| 8 | Label | Label (Required) | - | "참여 비용 *" |
| 9 | Input Number | Input Number | min: 1, max: 1000, step: 1, suffix: "GP", default: 1 | Placeholder: "1" |
| 10 | Field: 부스팅 | Form Group | - | - |
| 11 | Label | Label | - | "부스팅" |
| 12 | Segmented Button | Segmented Control | options: ["가능", "불가능"], default: "가능" | 가능/불가능 선택 |
| 13 | Field: 부스팅 비용 (조건부) | Form Group | visible: 부스팅 "가능" 선택 시 | - |
| 14 | Label | Label (Required) | - | "부스팅 비용 *" |
| 15 | Input Number | Input Number | min: 1, max: 1000, step: 1, suffix: "GP", default: 1 | Placeholder: "1" |

### 영역 6: 일정설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "일정설정" |
| 3 | Field: 투표 시작일시 | Form Group | - | - |
| 4 | Label | Label (Required) | - | "투표 시작일시 *" |
| 5 | Input Group | Flex Container | gap: 8px | - |
| 6 | Datepicker | Datepicker | format: "YYYY.MM.DD", min: today, icon: calendar | 📅 |
| 7 | Timepicker | Input (Time) | format: "HH:mm", step: 1 | 🕐 |
| 8 | Field: 투표 종료일시 | Form Group | - | - |
| 9 | Label | Label (Required) | - | "투표 종료일시 *" |
| 10 | Input Group | Flex Container | gap: 8px | - |
| 11 | Datepicker | Datepicker | format: "YYYY.MM.DD", min: 투표 시작일, icon: calendar | 📅 |
| 12 | Timepicker | Input (Time) | format: "HH:mm", step: 1 | 🕐 |
| 13 | Field: 결과 발표 예정일 | Form Group | - | - |
| 14 | Label | Label (Required) | - | "결과 발표 예정일 *" |
| 15 | Datepicker | Datepicker | format: "YYYY.MM.DD", min: 투표 종료일, icon: calendar | 📅 |

### 영역 7: 결과설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "결과설정" |
| 3 | Field: 결과 확인 기준 | Form Group | - | - |
| 4 | Label | Label (Required) | - | "결과 확인 기준 *" |
| 5 | Language Tabs | Tabs (Pills) | variant: pills, size: sm | KO / EN / JP |
| 6 | Textarea (KO) | Textarea | rows: 3, maxlength: 200, show-counter: true | Placeholder: "예: FIFA 공식 홈페이지 발표 기준" |
| 7 | Textarea (EN) | Textarea | rows: 3, maxlength: 200, show-counter: true | Placeholder: "e.g. Based on FIFA official website announcement" |
| 8 | Textarea (JP) | Textarea | rows: 3, maxlength: 200, show-counter: true | Placeholder: "例: FIFA公式サイトの発表基準" |
| 9 | Character Counter | Text (Small) | color: gray-500 | "0/200" (실시간 변경) |

### 영역 8: Footer 액션 버튼
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Footer Container | Flex Container | justify-between, padding: 24px, border-top: gray-200 | - |
| 2 | 취소 버튼 | Button (Outline) | size: md | "취소" |
| 3 | Button Group (Right) | Flex Container | gap: 12px | - |
| 4 | 임시저장 버튼 | Button (Outline) | size: md | "임시저장" |
| 5 | 게시 버튼 | Button (Primary) | size: md | "게시" |

---

## 상태별 변형 (Variants)

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default | - | 정상 폼 표시 (위 내용 그대로) |
| Loading | 전체 Form | Disabled + Spinner overlay |
| Validation Error | 해당 Input/Textarea | border: red-500, error message (red-600, 12px) |
| Required Field Empty | Label | 빨간색 asterisk (*) 강조 |
| Image Upload Success | File Input | 미리보기 이미지 표시 + [X 삭제] 버튼 |
| Image Upload Error | File Input | Alert (Danger, Inline) + 에러 메시지 |
| Button Disabled | 게시/임시저장 버튼 | disabled: true, opacity: 0.5 (필수 항목 미입력 시) |
| Submitting | 게시/임시저장 버튼 | disabled: true, Spinner icon |

---

## 디자이너 참고사항

### 폼 레이아웃
- **Form Container**: max-width: 800px, margin: 0 auto
- **Section 간격**: 32px
- **Section 내부 Field 간격**: 24px
- **Label ~ Input 간격**: 8px

### Tabs (언어 전환)
- **Variant**: Pills (둥근 모서리)
- **Active Tab**: blue-600 배경, white 텍스트
- **Inactive Tab**: gray-200 배경, gray-700 텍스트
- **크기**: 각 탭 width: 60px, height: 32px

### WYSIWYG Editor 스타일
- **Container**: border: gray-200, border-radius: 8px, overflow: hidden
- **Focus 시**: ring-2, ring-blue-500
- **Toolbar 영역**: background: gray-100, border-bottom: gray-200, padding: 6px 8px
- **Toolbar 버튼**: width: 28px, height: 28px, border-radius: 4px, font-weight: 600
- **Toolbar 버튼 Hover**: background: gray-200
- **Toolbar 구분선**: width: 1px, height: 20px, background: gray-300, margin: 0 4px
- **Editor 영역**: min-height: 200px, padding: 12px, font-size: 14px
- **Focus 시**: outline: none (Container에 ring 적용)

### Segmented Button (부스팅)
- **Container**: border: gray-200, border-radius: 8px, overflow: hidden
- **Active 버튼**: background: blue-600, color: white
- **Inactive 버튼**: background: white, color: gray-600, hover: gray-50
- **크기**: padding: 6px 16px, font-size: 14px, font-weight: 500

### Input Number 스타일
- **Suffix**: "GP", "명" 등을 Input 우측 내부에 표시 (읽기 전용 텍스트)
- **증감 버튼**: Input 우측에 +/- 버튼 표시 (Preline Input Number 기본 스타일)
- **천 단위 콤마**: 입력 시 자동 적용 (예: 1000 → 1,000)

### File Upload 영역
- **Dropzone**: 점선 테두리 (gray-300), 배경: gray-50
- **호버 시**: 테두리 색상 blue-400, 배경: blue-50
- **미리보기**: 업로드 성공 시 Dropzone 영역을 이미지로 교체
- **삭제 버튼**: 이미지 우측 상단에 X 아이콘 버튼 (hover: red-600)

### Datepicker & Timepicker
- **Datepicker**: 캘린더 아이콘 + 입력 필드 (클릭 시 캘린더 팝업)
- **Timepicker**: 시계 아이콘 + 입력 필드 (00:00 ~ 23:59, 15분 단위 추천)
- **Input Group**: 날짜 + 시간 필드를 가로로 나란히 배치 (gap: 8px)

### 에러 메시지 스타일
- **위치**: Input/Textarea 바로 아래
- **색상**: red-600
- **크기**: 12px
- **아이콘**: ⚠️ (선택적)
- **예시**: "타이틀을 입력해주세요." (빨간색)

### 도움말 텍스트
- **위치**: Input/Textarea 바로 아래 (에러 메시지 없을 때)
- **색상**: gray-500
- **크기**: 12px
- **예시**: "최소 100 GP ~ 최대 10,000,000 GP"

### 타이포그래피
- **Page Title (H1)**: 28px, Bold
- **Section Title (H2)**: 20px, Semibold
- **Label**: 14px, Medium
- **Required Label**: 14px, Medium + red-500 asterisk (*)
- **Input/Textarea**: 14px, Regular
- **Help Text**: 12px, Regular, gray-500
- **Error Message**: 12px, Medium, red-600

### 간격 (상세)
- Breadcrumb ~ Page Title: 8px
- Page Title ~ Form: 24px
- Section 간: 32px
- Field 간 (섹션 내): 24px
- Label ~ Input: 8px
- Input ~ Help Text: 4px
- Footer 버튼 간: 12px

### 인터랙션
- **취소 버튼**: 클릭 시 CEB-BO-GZ-201-MD-CANCEL 모달 오픈 (입력 내용 있을 때만)
- **임시저장**: 필수 항목만 체크, 통과 시 Draft 상태로 저장
- **게시**: 모든 필수 항목 체크, 통과 시 Scheduled 상태로 저장
- **Tabs 전환**: 클릭 시 해당 언어 Input/Textarea 표시, 입력 내용 유지
- **File Upload**: 드래그 앤 드롭 또는 클릭하여 파일 선택
- **Validation**: 실시간 체크 (blur 또는 submit 시)

### Validation 규칙 시각화
- **필수 입력 누락**: 빨간색 테두리 + "필드명을 입력해주세요."
- **숫자 범위 초과**: 빨간색 테두리 + "최소 X ~ 최대 Y 사이여야 합니다."
- **날짜 순서 오류**: 빨간색 테두리 + "투표 종료일시는 시작일시 이후여야 합니다."
- **파일 형식 오류**: Alert (Danger, Inline) + "JPG 또는 PNG 파일만 업로드 가능합니다."

### 반응형
- 1440px 이상: Form Container max-width: 800px (중앙 정렬)
- 1024px ~ 1439px: Form Container max-width: 700px
- 768px ~ 1023px: Form Container max-width: 100%, padding: 16px
- 768px 미만: 입력 필드 full-width, 버튼 세로 스택

### 접근성
- **Label for Input**: 모든 Label에 for 속성 연결
- **Required 표시**: asterisk (*) + aria-required="true"
- **에러 메시지**: aria-describedby로 Input과 연결
- **Tab 순서**: 위에서 아래로, 좌에서 우로 자연스러운 순서
