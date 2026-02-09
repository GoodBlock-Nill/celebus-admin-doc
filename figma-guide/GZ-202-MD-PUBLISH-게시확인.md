# [CEB-BO-GZ-202-MD-PUBLISH] 게시 확인 - Figma 조립 가이드

> 원본: `[CEB-BO-GZ-202-MD-PUBLISH] 게시 확인.md`
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
    │   ├── Title: "게임을 게시하시겠습니까?"
    │   └── Close Button [X]
    ├── Body
    │   ├── Info Text (안내 문구)
    │   └── Summary Table
    │       ├── Row 1: 타이틀 | {게임 타이틀}
    │       ├── Row 2: 참여 기간 | {YYYY.MM.DD HH:mm ~ YYYY.MM.DD HH:mm}
    │       └── Row 3: 총 상금 GP | {숫자} GP
    └── Footer
        ├── Button (Secondary): "취소"
        └── Button (Primary): "게시하기"
```

---

## Preline 컴포넌트 매핑

| 순서 | UI 요소 | Preline 컴포넌트 | 속성 | 내용 |
|------|---------|-----------------|------|------|
| 1 | 배경 오버레이 | Overlay | `opacity: 0.5` | 반투명 검정 배경 |
| 2 | 모달 컨테이너 | Modal | `width: 560px` | 중앙 정렬 |
| 3 | 모달 타이틀 | Text (H3) | - | "게임을 게시하시겠습니까?" |
| 4 | 닫기 버튼 | Icon Button | - | [X], 우측 상단 |
| 5 | 안내 문구 1 | Text (Body) | - | "게시 후 참여 시작일시에 게임이 자동으로 시작됩니다." |
| 6 | 안내 문구 2 | Text (Body) | - | "게시 후에도 참여 시작 전까지 수정이 가능합니다." |
| 7 | 요약 테이블 | Table | `variant: bordered` | 게시 정보 요약 |
| 8 | 테이블 Row 1 | Table Row | - | 타이틀 \| {게임 타이틀} |
| 9 | 테이블 Row 2 | Table Row | - | 참여 기간 \| {날짜 범위} |
| 10 | 테이블 Row 3 | Table Row | - | 총 상금 GP \| {숫자} GP |
| 11 | 취소 버튼 | Button | `variant: secondary` | 좌측 배치 |
| 12 | 게시하기 버튼 | Button | `variant: primary` | 우측 배치, 파란색 |

---

## 상태별 변형

### 버튼 동작
- **취소**: 모달 닫기, 게임 상세 화면 복귀
- **게시하기**: 게임 상태 Draft → Scheduled, 토스트 표시, 상세 화면 갱신

### 성공 시
- 토스트 메시지: "게임이 게시되었습니다."
- 모달 닫기
- 게임 상세 화면 갱신 (상태 및 액션 버튼 변경)

### 실패 시
- 에러 토스트 표시
- 모달 유지 (재시도 가능)

---

## 디자이너 참고사항

### 모달 크기
- 너비: 560px (요약 테이블을 포함하므로 더 넓게)
- 높이: auto (콘텐츠에 따라 조정)

### 안내 문구 스타일
- 2줄로 구성
- 폰트 크기: Body
- 색상: 회색 (강조 아님)

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
- **게시하기**: Primary (파란색)

### 에러 케이스
- 참여 시작일시가 현재 시각보다 이전: "참여 시작일시가 현재 시각보다 이전입니다."
- 이미 게시됨: "이미 게시된 게임입니다."
