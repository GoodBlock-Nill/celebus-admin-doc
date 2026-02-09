# [CEB-BO-GZ-301-MD-EDIT] 유형 설정 - Figma 조립 가이드

> 원본: [CEB-BO-GZ-301-MD-EDIT] 유형 설정.md
> Modal: 560px (width), name="GZ-301-MD-EDIT_유형설정"

---

## 레이아웃 구조

```
Modal: GZ-301-MD-EDIT_유형설정
├── Modal Header
│   ├── Typography (H2)
│   └── Button (Ghost) [X]
├── Modal Body
│   ├── Input (Disabled) [게임유형 코드]
│   ├── Input (Disabled) [게임유형명]
│   ├── Input (Disabled) [등록 게임 수]
│   ├── Advanced Select [상태]
│   └── Alert (Warning) [조건부]
└── Modal Footer
    ├── Button (Outline) [취소]
    └── Button (Solid/Primary) [저장]
```

---

## 영역별 Preline 컴포넌트 매핑

### Modal Header

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 모달 타이틀 | Typography (H2) | Size: lg, Weight: Semibold | 게임 유형 설정 |
| 2 | 닫기 버튼 | Button (Ghost) | Size: sm, Icon only | X 아이콘 |

### Modal Body

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 게임유형 코드 Label | Typography (Body) | Size: sm, Weight: Medium | 게임유형 코드 |
| 2 | 게임유형 코드 Input | Input | State: Disabled, Height: 40px | PREDICTION (읽기 전용) |
| 3 | 게임유형명 Label | Typography (Body) | Size: sm, Weight: Medium | 게임유형명 |
| 4 | 게임유형명 Input | Input | State: Disabled, Height: 40px | 예측형 (읽기 전용) |
| 5 | 등록 게임 수 Label | Typography (Body) | Size: sm, Weight: Medium | 등록 게임 수 |
| 6 | 등록 게임 수 Input | Input | State: Disabled, Height: 40px | 42개 (읽기 전용) |
| 7 | 상태 Label | Typography (Body) | Size: sm, Weight: Medium | 상태 |
| 8 | 상태 Select | Advanced Select | Height: 40px, Options: 3 | Active, Inactive, Coming Soon |
| 9 | 경고 메시지 (조건부) | Alert | Variant: Warning, Icon: ⚠️ | "비활성화하면 해당 유형으로 새 게임을 생성할 수 없습니다..." |

### Modal Footer

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 취소 버튼 | Button (Outline) | Size: Default, Color: Gray | 취소 |
| 2 | 저장 버튼 | Button (Solid/Primary) | Size: Default, Color: Blue | 저장 |

---

## 상태별 변형 (Variants)

### Input 상태 (읽기 전용)

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Disabled | 배경 | 회색 (#F3F4F6) |
| Disabled | 텍스트 색상 | 어두운 회색 (#6B7280) |
| Disabled | 커서 | not-allowed |

### Advanced Select 상태

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default | 테두리 | 회색 (#D1D5DB) |
| Focus | 테두리 | 파란색 (#3B82F6), Shadow |
| Open | 드롭다운 메뉴 | 하단에 펼침, 최대 5개 항목 표시 |

### 경고 메시지 표시 조건

| 조건 | 표시 여부 |
|------|---------|
| Active → Inactive | ✅ 표시 |
| Active → Coming Soon | ✅ 표시 |
| Inactive → Active | ❌ 숨김 |
| Inactive → Coming Soon | ❌ 숨김 |
| Coming Soon → Active | ❌ 숨김 |
| Coming Soon → Inactive | ❌ 숨김 |

### 저장 버튼 활성화 상태

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| 상태 변경 없음 | 버튼 | Disabled (회색, 클릭 불가) |
| 상태 변경됨 | 버튼 | Enabled (파란색, 클릭 가능) |

---

## 디자이너 참고사항

### 모달 크기
- 너비: 560px (고정)
- 높이: auto (콘텐츠에 따라 가변)
- 최대 높이: 화면 높이의 90%

### 간격 (Spacing)
- Modal Body 패딩: 24px (상하좌우)
- Label과 Input 간격: 8px
- Input 간 간격: 24px
- 경고 메시지 상단 여백: 16px
- Modal Footer 패딩: 16px 24px

### Alert 컴포넌트 스타일
- 배경: 연한 노란색 (#FEF3C7)
- 아이콘: ⚠️ (주황색)
- 텍스트: 어두운 회색 (#78350F)
- 패딩: 12px 16px
- 테두리 라운드: 8px

### 인터랙션
- 모달 외부 클릭 → 변경사항 있으면 확인 다이얼로그
- ESC 키 → 변경사항 있으면 확인 다이얼로그
- [취소] 클릭 → 변경사항 있으면 확인 다이얼로그
- [저장] 클릭 → API 호출 → 성공 시 모달 닫기 + 목록 새로고침

### 확인 다이얼로그
- 제목: "변경사항이 저장되지 않았습니다."
- 메시지: "창을 닫으시겠습니까?"
- 버튼: [머무르기] (Outline), [나가기] (Solid/Red)

### 접근성
- Modal Header에 role="dialog", aria-modal="true"
- 닫기 버튼에 aria-label="닫기"
- 포커스 트랩: 모달 내부 요소만 Tab 이동
- 첫 포커스: 상태 Select

### Advanced Select 드롭다운
- 옵션 높이: 40px
- 옵션 hover: 배경 연한 파란색 (#EFF6FF)
- 옵션 선택: 체크 아이콘 표시
- 최대 표시 옵션: 5개 (초과 시 스크롤)
