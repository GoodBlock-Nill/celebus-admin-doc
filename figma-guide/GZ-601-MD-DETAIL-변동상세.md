# [CEB-BO-GZ-601-MD-DETAIL] 변동 상세 - Figma 조립 가이드

> 원본: [CEB-BO-GZ-601-MD-DETAIL] 변동 상세.md
> Modal: 600px (width), name="GZ-601-MD-DETAIL_변동상세"

---

## 레이아웃 구조

```
Modal: GZ-601-MD-DETAIL_변동상세
├── Modal Header
│   ├── Typography (H2)
│   └── Button (Ghost) [X]
├── Modal Body (게임 관련)
│   ├── Typography (Label + Value) [변동 ID]
│   ├── Typography (Label + Value) [변동일시]
│   ├── Typography (Label + Value) [닉네임] (링크)
│   ├── Typography (Label + Value) [지갑주소]
│   ├── Badge [변동 유형]
│   ├── Typography (Label + Value) [GP 변동량]
│   ├── Typography (Label + Value) [변동 전 잔액]
│   ├── Typography (Label + Value) [변동 후 잔액]
│   ├── Typography (Label + Value) [관련 게임] (링크)
│   ├── Typography (Label + Value) [관련 교환] (BSCScan 링크, 교환 시에만 표시)
│   └── Typography (Label + Value) [비고]
└── Modal Footer
    └── Button (Solid/Primary) [닫기]
```

---

## 영역별 Preline 컴포넌트 매핑

### Modal Header

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 모달 타이틀 | Typography (H2) | Size: lg, Weight: Semibold | GP 변동 상세 |
| 2 | 닫기 버튼 | Button (Ghost) | Size: sm, Icon only | X 아이콘 |

### Modal Body (게임 관련 변동)

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 변동 ID Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 변동 ID |
| 2 | 변동 ID Value | Typography (Body) | Size: sm | GPT202502031435001 |
| 3 | 변동일시 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 변동일시 |
| 4 | 변동일시 Value | Typography (Body) | Size: sm | 2025.02.03 14:35:20 |
| 5 | 닉네임 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 닉네임 |
| 6 | 닉네임 Value | Typography (Body) | Size: sm, Color: Blue, Underline | user1, starlight23 🔗 (링크) |
| 7 | 지갑주소 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 지갑주소 |
| 8 | 지갑주소 Value | Typography (Body) | Size: xs, Font: Mono, break-all | 0x1234...5678 |
| 9 | 변동 유형 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 변동 유형 |
| 10 | 변동 유형 Badge | Badge (Soft) | 6가지 유형별 색상 | 참여, 부스팅, 환급, 보상, GP충전, GP출금 |
| 11 | GP 변동량 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | GP 변동량 |
| 12 | GP 변동량 (증가) | Typography (Body) | Size: sm, Weight: Semibold, Color: Green | +1,000 GP |
| 13 | GP 변동량 (감소) | Typography (Body) | Size: sm, Weight: Semibold, Color: Red | -500 GP |
| 14 | 변동 전 잔액 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 변동 전 잔액 |
| 15 | 변동 전 잔액 Value | Typography (Body) | Size: sm | 5,000 GP |
| 16 | 변동 후 잔액 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 변동 후 잔액 |
| 17 | 변동 후 잔액 Value | Typography (Body) | Size: sm, Weight: Semibold | 6,000 GP |
| 18 | 관련 게임 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 관련 게임 |
| 19 | 관련 게임 Value (링크) | Typography (Body) | Size: sm, Color: Blue, Underline | 오늘의 퀴즈 🔗 |
| 20 | 관련 게임 Value (없음) | Typography (Body) | Size: sm, Color: Gray | - |
| 21 | 관련 교환 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 관련 교환 |
| 22 | 관련 교환 Value (BSCScan 링크) | Typography (Body) + Link | Size: xs, Font: Mono, Color: Blue | 0x7a3b... 🔗 (BSCScan 링크) |
| 23 | 관련 교환 Value (없음) | Typography (Body) | Size: sm, Color: Gray | - |
| 24 | 비고 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 비고 |
| 25 | 비고 Value | Typography (Body) | Size: sm | 정답, 참여, CELB 교환 등 |

### Modal Footer

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 닫기 버튼 | Button (Solid/Primary) | Size: Default, Color: Blue | 닫기 |

---

## 상태별 변형 (Variants)

### 변동 유형 Badge

| 유형 | 배경 색상 | 텍스트 색상 |
|------|----------|------------|
| 참여 | #DBEAFE | #1D4ED8 |
| 부스팅 | #EDE9FE | #6B21A8 |
| 환급 | #DCFCE7 | #15803D |
| 보상 | #FEF3C7 | #D97706 |
| GP 가져오기 | #CFFAFE | #0E7490 |
| CELB으로 보내기 | #FFEDD5 | #C2410C |

### GP 변동량 표시

| 변동 방향 | 표시 형식 | 색상 |
|----------|---------|------|
| 증가 (+) | +1,000 GP | 초록색 (#10B981) |
| 감소 (-) | -500 GP | 빨간색 (#EF4444) |

### 관련 게임/교환 표시

| 변동 유형 | 관련 게임 | 관련 교환 |
|----------|----------|----------|
| 참여, 부스팅, 환급, 보상 | 게임 타이틀 🔗 (링크) | 필드 미표시 |
| GP 가져오기, CELB으로 보내기 | "-" | Txid 🔗 (BSCScan 링크: https://bscscan.com/tx/{txid}) |

### 링크 상태

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default | 텍스트 색상 | 파란색 (#3B82F6), 밑줄 |
| Hover | 텍스트 색상 | 진한 파란색 (#1D4ED8), 커서 pointer |

---

## 디자이너 참고사항

### 모달 크기
- 너비: 600px (고정)
- 높이: auto (콘텐츠에 따라 가변)
- 최대 높이: 화면 높이의 80%
- 내용 초과 시: 세로 스크롤

### 간격 (Spacing)
- Modal Body 패딩: 24px (상하좌우)
- Label과 Value 간격: 12px (가로 배치)
- 필드 간 세로 간격: 16px
- Modal Footer 패딩: 16px 24px

### 2컬럼 레이아웃
- Label: 좌측 정렬, 너비 150px
- Value: 우측 정렬, 너비 나머지 (flex)
- Label 색상: 회색 (#6B7280)
- Value 색상: 검정 (#1F2937)

### Badge 스타일
- 패딩: 4px 12px
- 모서리 라운드: 4px
- 폰트 크기: 12px
- 폰트 무게: Medium

### 비고 내용 예시
| 변동 유형 | 비고 예시 |
|----------|---------|
| 참여 | "참여" |
| 부스팅 | "2배", "3배", "5배" |
| 환급 | "환급" |
| 보상 | "정답", "1등", "2등", "3등" |
| GP 가져오기 | "CELB 교환" |
| CELB으로 보내기 | "CELB 교환" |

### 인터랙션
- 닉네임 클릭 → CEB-BO-USR-201 (회원 상세) 새 탭에서 열기
- 관련 게임 클릭 → CEB-BO-GZ-202 (게임 상세) 새 탭에서 열기
- 관련 교환 (Txid) 클릭 → BSCScan 트랜잭션 페이지 새 탭에서 열기
- [닫기] 버튼 클릭 → 모달 닫기
- ESC 키 → 모달 닫기
- 모달 외부 클릭 → 모달 닫기

### 모달 Z-index
```
GP 변동 내역 화면 (Z-index: 0)
 └─ GP 변동 상세 모달 (Z-index: 1000)
```

- GP 변동 상세 모달 닫기 → GP 변동 내역 화면으로 복귀
- ESC 키: 모달 닫기

### Loading 상태
- 데이터 로딩 중: Body 영역에 Skeleton 표시
- Skeleton: Label 12개 행 표시

### 에러 상태
- API 호출 실패 시: Toast "GP 변동 상세 정보를 불러올 수 없습니다."
- 모달 자동 닫기

### 접근성
- Modal Header에 role="dialog", aria-modal="true"
- 닫기 버튼에 aria-label="닫기"
- 포커스 트랩: 모달 내부 요소만 Tab 이동
- 첫 포커스: 닫기 버튼
- ESC 키로 닫기 지원
- 링크에 aria-label 적용

### 계산 예시 (게임 참여)
```
변동 전 GP 잔액: 5,000 GP
GP 변동량: -500 GP
변동 후 GP 잔액: 4,500 GP (5,000 - 500)
```

### 계산 예시 (보상 지급)
```
변동 전 GP 잔액: 4,500 GP
GP 변동량: +1,000 GP
변동 후 GP 잔액: 5,500 GP (4,500 + 1,000)
```

### 계산 예시 (부스팅)
```
변동 전 GP 잔액: 5,500 GP
GP 변동량: -100 GP
변동 후 GP 잔액: 5,400 GP (5,500 - 100)
비고: "2배"
```

### 계산 예시 (GP 가져오기)
```
변동 전 GP 잔액: 5,000 GP
GP 변동량: +2,000 GP
변동 후 GP 잔액: 7,000 GP (5,000 + 2,000)
관련 교환: 0x7a3b... 🔗 (BSCScan 링크)
비고: "CELB 교환"
```

### 계산 예시 (CELB으로 보내기)
```
변동 전 GP 잔액: 7,000 GP
GP 변동량: -1,000 GP
변동 후 GP 잔액: 6,000 GP (7,000 - 1,000)
관련 교환: 0x9c4d... 🔗 (BSCScan 링크)
비고: "CELB 교환"
```
