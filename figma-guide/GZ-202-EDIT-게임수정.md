# [CEB-BO-GZ-202-EDIT] 게임 수정 - Figma 조립 가이드

> 원본: [CEB-BO-GZ-202-EDIT] 게임 수정.md
> Frame: 1440 × auto, name="GZ-202-EDIT-게임수정"

---

## 레이아웃 구조

```
Frame: GZ-202-EDIT-게임수정
├── Sidebar (공통 컴포넌트)
├── Content Area
│   ├── Header
│   │   ├── Breadcrumb
│   │   └── Page Title
│   ├── Form Container
│   │   ├── Section: 기본정보
│   │   │   ├── Field: 게임유형 (읽기 전용)
│   │   │   ├── Tabs (KO/EN/JP)
│   │   │   ├── Input: 타이틀 (다국어)
│   │   │   ├── WYSIWYG Editor: 상세설명 (다국어)
│   │   │   ├── File Upload: 썸네일 이미지 (변경 가능)
│   │   │   └── Input URL: 힌트 링크
│   │   ├── Section: 보상설정
│   │   │   └── Input Number: 총 상금 GP
│   │   ├── Section: 참여설정
│   │   │   ├── Checkbox + Input Number: 참여 정원
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
│       └── Button (Primary): 저장
```

---

## 영역별 Preline 컴포넌트 매핑

### 영역 1: Header
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Breadcrumb | Breadcrumb (Default) | Separator: ">" | 홈 > 게임존 > 게임 관리 > {타이틀} > 수정 |
| 2 | Page Title | Heading (H1) | - | "게임 수정" |

### 영역 2: 기본정보 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "기본정보" |
| 3 | Field: 게임유형 | Form Group | - | - |
| 4 | Label | Label (Required) | - | "게임유형 *" |
| 5 | Input (Disabled) | Input (Text) | disabled: true, background: gray-100 | "Prediction Market" (읽기 전용) |
| 6 | Help Text | Text (Small) | color: gray-500 | "게임유형은 수정할 수 없습니다." |
| 7 | Field: 타이틀 | Form Group | - | (게임 생성과 동일, 기존 값 채워짐) |
| 8 | Label | Label (Required) | - | "타이틀 *" |
| 9 | Language Tabs | Tabs (Pills) | variant: pills, size: sm | KO / EN / JP |
| 10 | Input (KO) | Input (Text) | maxlength: 50, show-counter: true, value: "{기존 타이틀 KO}" | 기존 값 표시 |
| 11 | Input (EN) | Input (Text) | maxlength: 50, show-counter: true, value: "{기존 타이틀 EN}" | 기존 값 표시 |
| 12 | Input (JP) | Input (Text) | maxlength: 50, show-counter: true, value: "{기존 타이틀 JP}" | 기존 값 표시 |
| 13 | Character Counter | Text (Small) | color: gray-500 | "{현재 글자수}/50" |
| 14 | Field: 상세설명 | Form Group | - | (게임 생성과 동일, 기존 값 채워짐) |
| 15 | Label | Label (Required) | - | "상세설명 *" |
| 16 | Language Tabs | Tabs (Pills) | variant: pills, size: sm | KO / EN / JP |
| 17 | WYSIWYG Editor | Custom Component | - | Toolbar + contentEditable 영역 |
| 18 | Toolbar | Flex Container | gap: 2px, bg: gray-100, padding: 6px 8px, border-bottom: gray-200 | - |
| 19 | Toolbar Buttons | Button (Icon, Small) | size: 28px, each | [B] [I] [U] [•] [1.] [⇤] [⇥] ¦ [🔗] [🖼] |
| 20 | Editor Area | Div (contentEditable) | min-height: 200px, padding: 12px, font-size: 14px, value: "{기존 HTML 내용}" | WYSIWYG 편집 영역 (기존 값 표시) |
| 21 | Field: 썸네일 이미지 | Form Group | - | - |
| 22 | Label | Label (Required) | - | "썸네일 *" |
| 23 | Image Preview | Image Container | width: 320px, aspect-ratio: 16:9 | 기존 이미지 미리보기 |
| 24 | 이미지 변경 버튼 | Button (Outline, Small) | - | "이미지 변경" (클릭 시 파일 선택) |
| 25 | File Input (Hidden) | File Input | accept: "image/jpeg,image/png,image/webp", maxSize: 5MB | - |
| 26 | Field: 힌트 링크 | Form Group | - | - |
| 27 | Label | Label | - | "힌트 링크" |
| 28 | Input (URL) | Input (URL) | type: url, placeholder: "https://example.com/hint", value: "{기존 값}" | URL 입력 (기존 값 표시) |
| 29 | Help Text | Text (Small) | color: gray-500 | "게임 관련 힌트 페이지 URL을 입력하세요." |

### 영역 3: 보상설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "보상설정" |
| 3 | Field: 총 상금 GP | Form Group | - | - |
| 4 | Label | Label (Required) | - | "총 상금 GP *" |
| 5 | Input Number | Input Number | min: 1, max: 1000000, step: 100, suffix: "GP", value: "{기존 값}" | 기존 값 표시 |
| 6 | Help Text | Text (Small) | color: gray-500 | "최소 1 GP ~ 최대 1,000,000 GP" |

### 영역 4: 참여설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "참여설정" |
| 3 | Field: 참여 정원 | Form Group | - | - |
| 4 | Label | Label (Required) | - | "참여 정원 *" |
| 5 | Input Group | Flex Container | gap: 12px, align-center | - |
| 6 | Checkbox | Checkbox | checked: {기존 값이 0이면 true} | "☑ 무제한" |
| 7 | Input Number | Input Number | min: 2, max: 10000, step: 1, suffix: "명", disabled: {무제한 체크 시}, value: "{기존 값}" | 무제한 체크 시 비활성화 |
| 8 | Field: 참여 비용 | Form Group | - | - |
| 9 | Label | Label (Required) | - | "참여 비용 *" |
| 10 | Input Number | Input Number | min: 1, max: 10000, step: 1, suffix: "GP", value: "{기존 값}" | 기존 값 표시 |
| 11 | Constraint Note | Text (Small) | color: orange-600 | "참여자가 1명 이상일 경우 수정 불가" (참여자 있을 때만 표시) |
| 12 | Field: 부스팅 | Form Group | - | - |
| 13 | Label | Label | - | "부스팅" |
| 14 | Segmented Button | Segmented Control | options: ["가능", "불가능"], value: "{기존 값}" | 가능/불가능 선택 (기존 값 표시) |
| 15 | Constraint Note | Text (Small) | color: orange-600 | "참여자가 1명 이상일 경우 부스팅 가능/불가능 변경 및 비용 수정 불가" (참여자 있을 때만 표시) |
| 16 | Field: 부스팅 비용 (조건부) | Form Group | visible: 부스팅 "가능" 선택 시 | - |
| 17 | Label | Label (Required) | - | "부스팅 비용 *" |
| 18 | Input Number | Input Number | min: 1, max: 10000, step: 1, suffix: "GP", value: "{기존 값}" | 기존 값 표시 |

### 영역 5: 일정설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "일정설정" |
| 3 | Field: 투표 시작일시 | Form Group | - | - |
| 4 | Label | Label (Required) | - | "투표 시작일시 *" |
| 5 | Input Group | Flex Container | gap: 8px | - |
| 6 | Datepicker | Datepicker | format: "YYYY.MM.DD", min: today, icon: calendar, value: "{기존 날짜}" | 기존 값 표시 |
| 7 | Timepicker | Input (Time) | format: "HH:mm", step: 1, value: "{기존 시간}" | 기존 값 표시 |
| 8 | Field: 투표 종료일시 | Form Group | - | - |
| 9 | Label | Label (Required) | - | "투표 종료일시 *" |
| 10 | Input Group | Flex Container | gap: 8px | - |
| 11 | Datepicker | Datepicker | format: "YYYY.MM.DD", min: 투표 시작일, icon: calendar, value: "{기존 날짜}" | 기존 값 표시 |
| 12 | Timepicker | Input (Time) | format: "HH:mm", step: 1, value: "{기존 시간}" | 기존 값 표시 |
| 13 | Field: 결과 발표 예정일 | Form Group | - | - |
| 14 | Label | Label (Required) | - | "결과 발표 예정일 *" |
| 15 | Datepicker | Datepicker | format: "YYYY.MM.DD", min: 투표 종료일, icon: calendar, value: "{기존 날짜}" | 기존 값 표시 |

### 영역 6: 결과설정 섹션
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Section Container | Form Section | padding: 24px, border: gray-200 | - |
| 2 | Section Title | Heading (H2) | - | "결과설정" |
| 3 | Field: 결과 확인 기준 | Form Group | - | - |
| 4 | Label | Label (Required) | - | "결과 확인 기준 *" |
| 5 | Language Tabs | Tabs (Pills) | variant: pills, size: sm | KO / EN / JP |
| 6 | Textarea (KO) | Textarea | rows: 3, maxlength: 200, show-counter: true, value: "{기존 값 KO}" | 기존 값 표시 |
| 7 | Textarea (EN) | Textarea | rows: 3, maxlength: 200, show-counter: true, value: "{기존 값 EN}" | 기존 값 표시 |
| 8 | Textarea (JP) | Textarea | rows: 3, maxlength: 200, show-counter: true, value: "{기존 값 JP}" | 기존 값 표시 |
| 9 | Character Counter | Text (Small) | color: gray-500 | "{현재 글자수}/200" |

### 영역 7: Footer 액션 버튼
| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Footer Container | Flex Container | justify-between, padding: 24px, border-top: gray-200 | - |
| 2 | 취소 버튼 | Button (Outline) | size: md | "취소" |
| 3 | 저장 버튼 | Button (Primary) | size: md | "저장" |

---

## 상태별 변형 (Variants)

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default (Draft/Scheduled) | - | 정상 폼 표시 (위 내용 그대로) |
| Loading | 전체 Form | Disabled + Spinner overlay (데이터 로딩 중) |
| Active 이후 상태 접근 | 전체 화면 | 자동 리다이렉트 (게임 상세로 이동) + Toast: "진행 중이거나 종료된 게임은 수정할 수 없습니다." |
| Validation Error | 해당 Input/Textarea | border: red-500, error message (red-600, 12px) |
| 참여자 존재 시 | 참여 비용 Input, 부스팅 가능/불가능 Segmented Button, 부스팅 비용 Input | disabled: true, background: gray-100, 안내 텍스트 표시 |
| Image Upload Success | File Input | 새 이미지 미리보기 표시 |
| Image Upload Error | File Input | Alert (Danger, Inline) + 에러 메시지 |
| Submitting | 저장 버튼 | disabled: true, Spinner icon |

---

## 디자이너 참고사항

### 폼 레이아웃
- **Form Container**: max-width: 800px, margin: 0 auto
- **Section 간격**: 32px
- **Section 내부 Field 간격**: 24px
- **Label ~ Input 간격**: 8px

### 읽기 전용 필드 (게임유형)
- **Input (Disabled)**: background: gray-100, color: gray-600, cursor: not-allowed
- **Border**: gray-300 (일반 Input보다 연한 색상)
- **Help Text**: "게임유형은 수정할 수 없습니다." (gray-500, 12px)

### 기존 값 표시
- 모든 필드에 기존 데이터가 채워진 상태로 표시
- **Input**: value 속성에 기존 값 설정
- **Textarea**: 기존 텍스트 표시
- **Datepicker/Timepicker**: 기존 날짜/시간 표시
- **Image**: 기존 이미지 미리보기 표시

### 이미지 변경 UI
- **기존 이미지**: 320px 너비, 16:9 비율, border-radius: 8px
- **이미지 변경 버튼**: Button (Outline, Small), 이미지 아래 또는 우측에 배치
- **클릭 동작**: 파일 선택 다이얼로그 오픈
- **변경 후**: 새 이미지로 미리보기 교체, [원래 이미지로 복원] 버튼 추가 (선택 사항)

### 참여 정원 입력
- **Checkbox + Input 조합**: 수평 배치 (gap: 12px)
- **무제한 체크 시**: Input Number 비활성화 (disabled: true, background: gray-100)
- **무제한 해제 시**: Input Number 활성화, 기존 값 표시 또는 기본값 2

### 제약 사항 표시
- **참여자 존재 시**: 참여 비용, 부스팅 비용 Input 비활성화
- **안내 텍스트**: Input 아래에 주황색 텍스트 (orange-600, 12px)
  - "참여자가 1명 이상일 경우 수정 불가"
- **Disabled Input**: background: gray-100, cursor: not-allowed

### 날짜/시간 제약
- **투표 시작일시**: 현재 시각 이후만 선택 가능 (Scheduled 상태일 때)
- **투표 종료일시**: 투표 시작일시 이후만 선택 가능
- **결과 발표 예정일**: 투표 종료일시 이후만 선택 가능
- **Datepicker**: min 속성으로 선택 가능 범위 제한

### Validation 에러 스타일
- **Input/Textarea**: border: red-500, box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1)
- **에러 메시지**: Input 바로 아래, color: red-600, font-size: 12px
- **예시**: "투표 종료일시는 시작일시 이후여야 합니다."

### 타이포그래피
- **Page Title (H1)**: 28px, Bold
- **Section Title (H2)**: 20px, Semibold
- **Label**: 14px, Medium
- **Required Label**: 14px, Medium + red-500 asterisk (*)
- **Input/Textarea**: 14px, Regular
- **Help Text**: 12px, Regular, gray-500
- **Error Message**: 12px, Medium, red-600
- **Constraint Note**: 12px, Medium, orange-600

### 간격 (상세)
- Breadcrumb ~ Page Title: 8px
- Page Title ~ Form: 24px
- Section 간: 32px
- Field 간 (섹션 내): 24px
- Label ~ Input: 8px
- Input ~ Help Text: 4px
- Footer 버튼 간: 12px

### 인터랙션
- **취소 버튼**: 클릭 시 CEB-BO-GZ-202-MD-EDIT-CANCEL 모달 오픈 (변경 사항 있을 때만)
- **저장 버튼**: 모든 필드 Validation 후 저장, 성공 시 게임 상세 화면으로 복귀
- **이미지 변경**: 클릭 시 파일 선택, 선택 후 즉시 미리보기 교체
- **무제한 Checkbox**: 체크/해제 시 참여 정원 Input 활성화/비활성화 토글
- **Datepicker**: 날짜 선택 시 범위 체크, 오류 시 에러 메시지 표시

### 생성 폼과의 차이점
| 항목 | 게임 생성 | 게임 수정 |
|------|----------|----------|
| 게임유형 | Radio 선택 (고정) | Input (Disabled, 읽기 전용) |
| 기존 값 | 빈 필드 | 기존 값 채워짐 |
| 썸네일 업로드 | 업로드 버튼 | 미리보기 + 변경 버튼 |
| 참여 정원 | Input Number | Checkbox + Input Number |
| 부스팅 | Segmented Button | Segmented Button (참여자 있으면 변경 불가) |
| 참여 비용/부스팅 비용 | 수정 가능 | 참여자 있으면 수정 불가 |
| Footer 버튼 | 취소 / 임시저장 / 게시 | 취소 / 저장 |
| Breadcrumb | ... > 게임 생성 | ... > {타이틀} > 수정 |

### 접근 제어
- **Draft/Scheduled 상태**: 수정 페이지 접근 가능, 모든 필드 수정 가능
- **Active 이후 상태**: 수정 페이지 접근 차단, 자동 리다이렉트
- **권한 없음**: 수정 페이지 접근 차단, 권한 오류 페이지로 이동

### 저장 후 동작
- **성공**:
  1. CEB-BO-GZ-202-MD-EDIT-COMPLETE 토스트 표시: "게임이 수정되었습니다."
  2. 게임 상세(CEB-BO-GZ-202) 화면으로 복귀
- **실패**:
  1. 에러 토스트 표시: "게임 수정에 실패했습니다. 다시 시도해주세요."
  2. 폼 유지, 입력 내용 보존

### 반응형
- 1440px 이상: Form Container max-width: 800px (중앙 정렬)
- 1024px ~ 1439px: Form Container max-width: 700px
- 768px ~ 1023px: Form Container max-width: 100%, padding: 16px
- 768px 미만: 입력 필드 full-width, 버튼 세로 스택

### 접근성
- **Label for Input**: 모든 Label에 for 속성 연결
- **Required 표시**: asterisk (*) + aria-required="true"
- **Disabled Field**: aria-disabled="true" + 시각적 표시 (회색 배경)
- **에러 메시지**: aria-describedby로 Input과 연결
- **Tab 순서**: 위에서 아래로 자연스러운 순서
