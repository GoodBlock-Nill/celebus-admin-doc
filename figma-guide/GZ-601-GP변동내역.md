# [CEB-BO-GZ-601] GP 변동 내역 - Figma 조립 가이드

> 원본: [CEB-BO-GZ-601] GP 변동 내역.md
> Frame: 1440 × auto, name="GZ-601_GP변동내역"

---

## 레이아웃 구조

```
Frame: GZ-601_GP변동내역
├── Header
│   ├── Breadcrumb (Chevrons)
│   └── Typography (H1)
├── Filter Area
│   ├── Advanced Select [변동 유형]
│   ├── Advanced Select [기간]
│   └── Input [검색]
└── Content
    ├── Table (Striped, Hover)
    └── Pagination (With Icons)
```

---

## 영역별 Preline 컴포넌트 매핑

### Header 영역

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Breadcrumb | Breadcrumb (Chevrons) | Default | 홈 > 게임존 > GP 변동 내역 |
| 2 | 페이지 제목 | Typography (H1) | Size: 2xl, Weight: Bold | 📊 GP 변동 내역 |

### Filter 영역

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 변동 유형 Select | Advanced Select | Height: 40px | 옵션: 전체, 참여, 부스팅, 환급, 보상, GP충전, GP출금 |
| 2 | 기간 Select | Advanced Select | Height: 40px | 옵션: 전체(기본), 오늘, 최근 7일, 최근 30일, 커스텀 |
| 3 | 검색 입력 | Input | Type: Search, Size: Default | Placeholder: "닉네임 검색" |

### Table 영역

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 테이블 컨테이너 | Tables (Striped) | With hover | 6개 컬럼 |
| 2 | 테이블 헤더 | Table Header | Sortable | 일시, 닉네임, 유형, GP 변동, 변동 후 잔액, 비고 |
| 3 | 일시 | Typography (Body) | Size: sm | YYYY.MM.DD HH:mm |
| 4 | 닉네임 | Typography (Body) | Size: sm, Weight: Medium | user1, starlight23 |
| 5 | 유형 Badge (참여) | Badge (Soft) | Color: Blue | 참여 |
| 6 | 유형 Badge (부스팅) | Badge (Soft) | Color: Purple | 부스팅 |
| 7 | 유형 Badge (환급) | Badge (Soft) | Color: Green | 환급 |
| 8 | 유형 Badge (보상) | Badge (Soft) | Color: Gold | 보상 |
| 9 | 유형 Badge (GP충전) | Badge (Soft) | Color: Cyan | GP 충전 |
| 10 | 유형 Badge (GP출금) | Badge (Soft) | Color: Orange | GP 출금 |
| 11 | GP 변동 (증가) | Typography (Body) | Size: sm, Weight: Semibold, Color: Green | +1,000 GP |
| 12 | GP 변동 (감소) | Typography (Body) | Size: sm, Weight: Semibold, Color: Red | -500 GP |
| 13 | 변동 후 잔액 | Typography (Body) | Size: sm, Align: right | 6,000 GP |
| 14 | 비고 | Typography (Body) | Size: sm, Color: Gray | 정답, 참여, CELB교환 등 |
| 15 | Row Hover | Table Row | State: Hover | 전체 행 hover 시 배경 연한 회색 |

### Pagination 영역

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Pagination | Pagination (With Icons) | Alignment: Center | 페이지당 20건 |
| 2 | Previous Icon | Icon | Type: ChevronLeft | < |
| 3 | Page Numbers | Button | Variant: Ghost | 1, 2, 3, ... |
| 4 | Next Icon | Icon | Type: ChevronRight | > |

---

## 상태별 변형 (Variants)

### 변동 유형 Badge (상세 스펙)

| 유형 | 배경 색상 | 텍스트 색상 | 텍스트 |
|------|----------|------------|--------|
| 참여 | #DBEAFE | #1D4ED8 | 참여 |
| 부스팅 | #EDE9FE | #6B21A8 | 부스팅 |
| 환급 | #DCFCE7 | #15803D | 환급 |
| 보상 | #FEF3C7 | #D97706 | 보상 |
| GP 충전 | #CFFAFE | #0E7490 | GP 충전 |
| GP 출금 | #FFEDD5 | #C2410C | GP 출금 |

### GP 변동량 표시

| 변동 방향 | 표시 형식 | 색상 |
|----------|---------|------|
| 증가 (+) | +1,000 GP | 초록색 (#10B981) |
| 감소 (-) | -500 GP | 빨간색 (#EF4444) |

### Table Row 상태

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default | 배경 | 흰색 (짝수 행), 연한 회색 (홀수 행) |
| Hover | 배경 | 연한 회색 (#F9FAFB), 커서 pointer |

### Empty State

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Loading | Table Body, Cards | Skeleton (5개 행, 3개 카드) |
| Empty | Table Body | 📭 "GP 변동 내역이 없습니다." (중앙 정렬) |
| Error | Table Body | "데이터를 불러오는 중 오류가 발생했습니다." + Retry 버튼 |

---

## 디자이너 참고사항

### 간격 (Spacing)
- Header 하단 여백: 24px
- Filter 영역 하단 여백: 16px
- Table 행 높이: 56px
- Pagination 상단 여백: 24px

### Badge 스타일
- 패딩: 4px 12px (상하 4px, 좌우 12px)
- 모서리 라운드: 4px
- 폰트 크기: 12px
- 폰트 무게: Medium

### 인터랙션
- Table Row 클릭 → CEB-BO-GZ-601-MD-DETAIL 모달 오픈
- [커스텀] 기간 선택 시 → DateRangePicker 오픈 (최대 90일)
- 정렬 가능 컬럼 헤더 클릭 → 화살표 아이콘 회전

### DateRangePicker 스펙
- 위치: 기간 Select 하단
- 너비: 400px
- 최대 선택 범위: 90일
- 범위 초과 시: 에러 메시지 표시

### 정렬 아이콘
- 정렬 전: ⬍ (회색, 비활성)
- 오름차순: ▲ (파란색, 활성)
- 내림차순: ▼ (파란색, 활성)
- 기본 정렬: 최근내역순 - 변동일시 내림차순 (▼ 활성)

### 관련 게임 링크
- 색상: 파란색 (#3B82F6)
- Hover: 진한 파란색 (#1D4ED8)
- 밑줄: 항상 표시
- 커서: pointer
- 아이콘: 🔗 (우측)

### 접근성
- Table Header에 aria-sort 속성
- Row에 role="button", tabindex="0"
- Summary Cards에 aria-label
- Badge에 적절한 색상 대비 (WCAG AA)

### 반응형
- 테이블 최소 너비: 1200px
- 화면 너비 부족 시: 가로 스크롤 허용

### 비고 내용 예시
| 변동 유형 | 비고 예시 |
|----------|---------|
| 참여 | "참여" |
| 부스팅 | "2배", "3배", "5배" |
| 환급 | "환급" |
| 보상 | "정답", "1등", "2등", "3등" |
| GP 충전 | "CELB 교환" |
| GP 출금 | "CELB 교환" |
