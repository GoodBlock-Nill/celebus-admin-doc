# [CEB-BO-GZ-202-MD-EDIT-CANCEL] 수정 취소 확인 - Figma 조립 가이드

> 원본: `[CEB-BO-GZ-202-MD-EDIT-CANCEL] 수정 취소 확인.md`
> 유형: Modal
> 크기: 480px × auto

---

## 레이아웃 구조

```
Frame (Modal)
├── Overlay Background (전체 화면)
│   └── opacity: 0.5~0.7, bg-gray-900
└── Modal Container (중앙 정렬, 480px)
    ├── Header
    │   ├── Title: "수정을 취소하시겠습니까?"
    │   └── Close Button [X]
    ├── Body
    │   └── Text: "변경 사항은 저장되지 않습니다."
    └── Footer
        ├── Button (Secondary): "계속 수정"
        └── Button (Primary Destructive): "취소하기"
```

---

## Preline 컴포넌트 매핑

| 순서 | UI 요소 | Preline 컴포넌트 | 속성 | 내용 |
|------|---------|-----------------|------|------|
| 1 | 배경 오버레이 | Overlay | `opacity: 0.5~0.7` | 반투명 검정 배경 |
| 2 | 모달 컨테이너 | Modal | `width: 480px` | 중앙 정렬 |
| 3 | 모달 타이틀 | Text (H3) | - | "수정을 취소하시겠습니까?" |
| 4 | 닫기 버튼 | Icon Button | - | [X], 우측 상단 |
| 5 | 본문 텍스트 | Text (Body) | - | "변경 사항은 저장되지 않습니다." |
| 6 | 계속 수정 버튼 | Button | `variant: secondary` | 좌측 배치, 회색 외곽선 |
| 7 | 취소하기 버튼 | Button | `variant: primary destructive` | 우측 배치, 빨간색 배경 |

---

## 상태별 변형

### 모달 표시 조건
- 변경사항이 있을 때만 표시
- 변경사항 없으면 바로 상세 화면으로 이동

### Focus
- X 버튼 클릭: 모달 닫기, 수정 화면 유지
- ESC 키: 모달 닫기, 수정 화면 유지
- 배경 클릭: 모달 닫기, 수정 화면 유지

### 버튼 동작
- **계속 수정**: 모달 닫기, 수정 화면 유지
- **취소하기**: 게임 상세(CEB-BO-GZ-202) 화면으로 이동

---

## 디자이너 참고사항

### 모달 크기 및 위치
- 모달 너비: 480px
- 모달 최소 높이: auto (콘텐츠에 따라 조정)
- 모달 위치: 화면 중앙 (vertical + horizontal center)

### 버튼 레이아웃
- 버튼 배치: 하단 우측 정렬
- 버튼 간 간격: 8px

### 버튼 스타일
- **계속 수정**: Secondary 스타일, 회색 외곽선, 텍스트 검정
- **취소하기**: Primary Destructive 스타일, 빨간색 배경, 텍스트 흰색

### 유사 화면과의 차이
- 생성 취소 확인(GZ-201-MD-CANCEL)과 동일한 구조
- 문구만 다름: "수정" vs "생성", "변경 사항" vs "작성 중인 내용"
