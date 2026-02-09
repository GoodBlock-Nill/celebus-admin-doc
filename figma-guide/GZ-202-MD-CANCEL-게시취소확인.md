# [CEB-BO-GZ-202-MD-CANCEL] 게시 취소 확인 - Figma 조립 가이드

> 원본: `[CEB-BO-GZ-202-MD-CANCEL] 게시 취소 확인.md`
> 유형: Modal
> 크기: 560px × auto

---

## 레이아웃 구조

```
Frame (Modal)
├── Overlay Background (전체 화면)
│   └── opacity: 0.5, bg-gray-900
└── Modal Container (중앙 정렬, 560px)
    ├── Header
    │   ├── Title: "게시를 취소하시겠습니까?"
    │   └── Close Button [X]
    ├── Body
    │   ├── Info Text (안내 문구)
    │   ├── Info Box (게시 취소 시 처리 내용)
    │   │   ├── Item 1: 게임 상태: Scheduled → Draft
    │   │   ├── Item 2: 참여 시작일에 자동 시작되지 않음
    │   │   └── Item 3: 기존 설정값은 유지됨
    │   └── Summary Table
    │       ├── Row 1: 타이틀 | {게임 타이틀}
    │       ├── Row 2: 참여 기간 | {YYYY.MM.DD HH:mm ~ YYYY.MM.DD HH:mm}
    │       └── Row 3: 총 상금 GP | {숫자} GP
    └── Footer
        ├── Button (Secondary): "취소"
        └── Button (Primary): "게시 취소"
```

---

## Preline 컴포넌트 매핑

| 순서 | UI 요소 | Preline 컴포넌트 | 속성 | 내용 |
|------|---------|-----------------|------|------|
| 1 | 배경 오버레이 | Overlay | `opacity: 0.5` | 반투명 검정 배경 |
| 2 | 모달 컨테이너 | Modal | `width: 560px` | 중앙 정렬 |
| 3 | 모달 타이틀 | Text (H3) | - | "게시를 취소하시겠습니까?" |
| 4 | 닫기 버튼 | Icon Button | - | [X], 우측 상단 |
| 5 | 안내 문구 1 | Text (Body) | - | "게시 취소 시 게임이 임시저장(Draft) 상태로 돌아갑니다." |
| 6 | 안내 문구 2 | Text (Body) | - | "임시저장 상태에서 다시 수정 및 게시가 가능합니다." |
| 7 | 안내 박스 | Alert (Info) | `variant: info` | 게시 취소 시 처리 내용 |
| 8 | 안내 항목 1 | Text | - | 게임 상태: Scheduled → Draft |
| 9 | 안내 항목 2 | Text | - | 참여 시작일에 자동 시작되지 않음 |
| 10 | 안내 항목 3 | Text | - | 기존 설정값은 유지됨 |
| 11 | 요약 테이블 | Table | `variant: bordered` | 게시 정보 요약 |
| 12 | 테이블 Row 1 | Table Row | - | 타이틀 \| {게임 타이틀} |
| 13 | 취소 버튼 | Button | `variant: secondary` | 좌측 배치 |
| 14 | 게시 취소 버튼 | Button | `variant: primary` | 우측 배치, 파란색 |

---

## 상태별 변형

### 버튼 동작
- **취소**: 모달 닫기, 게임 상세 화면 복귀
- **게시 취소**: 게임 상태 Scheduled → Draft, 토스트 표시, 상세 화면 갱신

### 성공 시
- 토스트 메시지: "게시가 취소되었습니다."
- 모달 닫기
- 게임 상세 화면 갱신 (상태 및 액션 버튼 변경)

### 실패 시
- 에러 토스트 표시
- 모달 유지 (재시도 가능)

---

## 디자이너 참고사항

### 모달 크기
- 너비: 560px (PUBLISH와 동일)
- 높이: auto (콘텐츠에 따라 조정)

### 안내 문구 스타일
- 2줄로 구성
- 폰트 크기: Body
- 색상: 회색 (강조 아님)

### 안내 박스
- 배경색: 파란색 (#eff6ff)
- 테두리색: 파란색 (#bfdbfe)
- 폰트 크기: 14px
- 리스트 형식으로 3개 항목 표시

### 안내 항목
1. **게임 상태**: Scheduled → Draft
2. **참여 시작 처리**: 참여 시작일에 자동 시작되지 않음
3. **설정값 유지**: 기존 설정값은 유지됨

### 요약 테이블
- 2열 구조: 필드명 | 값
- 필드명 열: 좌측 정렬, 굵게 (Bold)
- 값 열: 좌측 정렬

### 테이블 필드
1. **타이틀**: 게임 타이틀 원문 (최대 50자)
2. **참여 기간**: YYYY.MM.DD HH:mm ~ YYYY.MM.DD HH:mm
3. **총 상금 GP**: {숫자} GP (천 단위 콤마)

### 버튼 스타일
- **취소**: Secondary
- **게시 취소**: Primary (파란색)

### 에러 케이스
- 참여가 이미 시작됨: "이미 참여가 시작된 게임입니다."
- 이미 게시 취소됨: "이미 게시 취소된 게임입니다."
