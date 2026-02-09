# [CEB-BO-GZ-201-MD-CANCEL] 생성 취소 확인 - Figma 조립 가이드

> 원본: `[CEB-BO-GZ-201-MD-CANCEL] 생성 취소 확인.md`
> 유형: Modal
> 크기: 480px × auto

---

## 레이아웃 구조

```
Frame (Modal)
├── Overlay Background (전체 화면)
│   └── opacity: 0.5, bg-gray-900
└── Modal Container (중앙 정렬, 480px)
    ├── Header
    │   ├── Icon (경고, 주황색)
    │   └── Title: "게임 생성을 취소하시겠습니까?"
    ├── Body
    │   └── Text: "작성 중인 내용은 저장되지 않습니다."
    └── Footer
        ├── Button (Secondary): "계속 작성"
        └── Button (Primary Destructive): "취소하기"
```

---

## Preline 컴포넌트 매핑

| 순서 | UI 요소 | Preline 컴포넌트 | 속성 | 내용 |
|------|---------|-----------------|------|------|
| 1 | 배경 오버레이 | Overlay | `opacity: 0.5` | 반투명 검정 배경 |
| 2 | 모달 컨테이너 | Modal | `width: 480px` | 중앙 정렬 |
| 3 | 경고 아이콘 | Icon | `color: warning (주황색)` | 느낌표 아이콘 |
| 4 | 모달 타이틀 | Text (H3) | - | "게임 생성을 취소하시겠습니까?" |
| 5 | 본문 텍스트 | Text (Body) | - | "작성 중인 내용은 저장되지 않습니다." |
| 6 | 계속 작성 버튼 | Button | `variant: secondary` | 좌측 배치 |
| 7 | 취소하기 버튼 | Button | `variant: primary destructive` | 우측 배치, 빨간색 |

---

## 상태별 변형

### Default
- 모달 중앙 정렬
- 배경 Dim 처리 활성화

### Focus
- [계속 작성] 버튼에 기본 포커스
- Tab 키로 버튼 간 이동

### Keyboard Navigation
- ESC 키: 모달 닫기 (계속 작성과 동일)
- Enter 키: 포커스된 버튼 실행

---

## 디자이너 참고사항

### 버튼 배치
- Footer 영역: 우측 정렬
- 버튼 간격: 8px
- [계속 작성] 좌측, [취소하기] 우측

### 버튼 스타일
- **[계속 작성]**: Secondary (안전한 선택, 데이터 유지)
- **[취소하기]**: Primary Destructive (위험한 선택, 빨간색)

### 포커스 관리
- 모달 오픈 시 [계속 작성] 버튼에 기본 포커스
- 사용자가 실수로 데이터를 잃지 않도록 안전한 선택을 기본으로 설정

### 경고 아이콘
- 아이콘 크기: 24×24px
- 색상: warning (주황색)
- 위치: 타이틀 좌측 또는 상단

### 모달 외부 클릭
- 배경 클릭 시 모달 닫기 (계속 작성과 동일)
- 데이터 유지
