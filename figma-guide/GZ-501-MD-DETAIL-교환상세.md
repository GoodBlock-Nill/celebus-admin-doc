# [CEB-BO-GZ-501-MD-DETAIL] 교환 상세 - Figma 조립 가이드

> 원본: [CEB-BO-GZ-501-MD-DETAIL] 교환 상세.md
> Modal: 720px (width), name="GZ-501-MD-DETAIL_교환상세"

---

## 레이아웃 구조

```
Modal: GZ-501-MD-DETAIL_교환상세
├── Modal Header
│   ├── Typography (H2)
│   └── Button (Ghost) [X]
├── Modal Body
│   ├── Typography (Label + Value) [Txid]
│   ├── Typography (Label + Value) [교환일시]
│   ├── Typography (Label + Value) [닉네임] (링크)
│   ├── Typography (Label + Value) [지갑주소]
│   ├── Badge [교환 방향]
│   ├── Typography (Label + Value) [GP 수량]
│   ├── Typography (Label + Value) [CELB 수량]
│   ├── Typography (Label + Value) [적용 비율]
│   ├── Typography (Label + Value) [교환 전 GP 잔액]
│   ├── Typography (Label + Value) [교환 후 GP 잔액]
│   ├── Badge [상태]
│   └── Typography (Label + Value) [실패 사유]
└── Modal Footer
    └── Button (Solid/Primary) [닫기]
```

---

## 영역별 Preline 컴포넌트 매핑

### Modal Header

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 모달 타이틀 | Typography (H2) | Size: lg, Weight: Semibold | 교환 상세 |
| 2 | 닫기 버튼 | Button (Ghost) | Size: sm, Icon only | X 아이콘 |

### Modal Body

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | Txid Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | Txid |
| 2 | Txid Value | Typography (Body) + Link + Icon Button | Size: xs, Font: Mono, Color: Blue, break-all | 0x7a3b...f8a9b (전체 표시), 클릭→BSCScan 새 탭, 📋 복사 |
| 3 | 교환일시 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 교환일시 |
| 4 | 교환일시 Value | Typography (Body) | Size: sm | 2025.02.03 14:23:15 |
| 5 | 닉네임 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 닉네임 |
| 6 | 닉네임 Value | Typography (Body) | Size: sm, Color: Blue, Underline | user1 🔗 (링크) |
| 7 | 지갑주소 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 지갑주소 |
| 8 | 지갑주소 Value | Typography (Body) + Link + Icon Button | Size: xs, Font: Mono, Color: Blue, break-all | 0x1234...5678 (전체 표시), 클릭→BSCScan 새 탭, 📋 복사 |
| 9 | 교환 방향 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 교환 방향 |
| 10 | 교환 방향 Badge (가져오기) | Badge (Soft) | Color: Blue | GP 가져오기 |
| 11 | 교환 방향 Badge (보내기) | Badge (Soft) | Color: Orange | CELB으로 보내기 |
| 12 | GP 수량 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | GP 수량 |
| 13 | GP 수량 Value | Typography (Body) | Size: sm, Weight: Semibold | 1,000 GP |
| 14 | CELB 수량 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | CELB 수량 |
| 15 | CELB 수량 Value | Typography (Body) | Size: sm, Weight: Semibold | 1,000 CELB |
| 16 | 적용 비율 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 적용 비율 |
| 17 | 적용 비율 Value | Typography (Body) | Size: sm | 1 GP = 1.0 CELB |
| 18 | 교환 전 잔액 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 교환 전 GP 잔액 |
| 19 | 교환 전 잔액 Value | Typography (Body) | Size: sm | 5,000 GP |
| 20 | 교환 후 잔액 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 교환 후 GP 잔액 |
| 21 | 교환 후 잔액 Value | Typography (Body) | Size: sm, Weight: Semibold | 6,000 GP |
| 22 | 상태 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 상태 |
| 23 | 상태 Badge (완료) | Badge (Soft) | Color: Green | 완료 |
| 24 | 상태 Badge (실패) | Badge (Soft) | Color: Red | 실패 |
| 25 | 실패 사유 Label | Typography (Body) | Size: sm, Weight: Medium, Color: Gray | 실패 사유 |
| 26 | 실패 사유 Value (완료) | Typography (Body) | Size: sm, Color: Gray | - |
| 27 | 실패 사유 Value (실패) | Typography (Body) | Size: sm, Color: Red | 잔액 부족, 1일 한도 초과 등 |

### Modal Footer

| 순서 | UI 요소 | Preline 컴포넌트 | 속성/Variant | 내용 |
|------|---------|-----------------|-------------|------|
| 1 | 닫기 버튼 | Button (Solid/Primary) | Size: Default, Color: Blue | 닫기 |

---

## 상태별 변형 (Variants)

### 교환 방향 Badge

| 방향 | Badge 색상 | 텍스트 |
|------|----------|--------|
| GP 가져오기 | 배경 #DBEAFE, 텍스트 #1D4ED8 | GP 가져오기 |
| CELB으로 보내기 | 배경 #FFEDD5, 텍스트 #C2410C | CELB으로 보내기 |

### 상태 Badge

| 상태 | Badge 색상 | 텍스트 |
|------|----------|--------|
| 완료 | 배경 #DCFCE7, 텍스트 #15803D | 완료 |
| 실패 | 배경 #FEE2E2, 텍스트 #DC2626 | 실패 |

### 실패 사유 표시

| 교환 상태 | 실패 사유 표시 |
|----------|--------------|
| 완료 | "-" (회색 텍스트) |
| 실패 | 사유 텍스트 (빨간색) |

### 닉네임 링크 상태

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default | 텍스트 색상 | 파란색 (#3B82F6), 밑줄 |
| Hover | 텍스트 색상 | 진한 파란색 (#1D4ED8), 커서 pointer |

### Txid/지갑주소 링크 상태

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default | 텍스트 색상 | 파란색 (#3B82F6), Font: Mono, break-all |
| Hover | 텍스트 색상 | 진한 파란색 (#1D4ED8), 밑줄, 커서 pointer |

### 복사 아이콘 버튼

| 상태 | 변경 요소 | 표시 |
|------|----------|------|
| Default | 아이콘 색상 | 회색 (#9CA3AF) |
| Hover | 아이콘 색상 | 진한 회색 (#4B5563), 배경 연한 회색 |

---

## 디자이너 참고사항

### 모달 크기
- 너비: 720px (고정, 전체 해시 표시를 위한 넓은 너비)
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

### 실패 사유 목록
| 코드 | 사유 메시지 |
|------|-----------|
| INSUFFICIENT_BALANCE | 잔액 부족 |
| DAILY_LIMIT_EXCEEDED | 1일 한도 초과 |
| MIN_AMOUNT_NOT_MET | 최소 교환 수량 미만 |
| MAX_AMOUNT_EXCEEDED | 최대 교환 수량 초과 |
| EXCHANGE_DISABLED | 교환 기능 비활성화 |
| SYSTEM_ERROR | 시스템 오류 |

### 인터랙션
- 닉네임 클릭 → CEB-BO-USR-201 (회원 상세) 새 탭에서 열기
- Txid 클릭 → https://bscscan.com/tx/{txid} 새 탭에서 열기
- 지갑주소 클릭 → https://bscscan.com/address/{address} 새 탭에서 열기
- 복사 아이콘 클릭 → 클립보드 복사, Toast "복사되었습니다."
- [닫기] 버튼 클릭 → 모달 닫기
- ESC 키 → 모달 닫기
- 모달 외부 클릭 → 모달 닫기

### Loading 상태
- 데이터 로딩 중: Body 영역에 Skeleton 표시
- Skeleton: Label 12개 행 표시

### 에러 상태
- API 호출 실패 시: Toast "교환 상세 정보를 불러올 수 없습니다."
- 모달 자동 닫기

### 접근성
- Modal Header에 role="dialog", aria-modal="true"
- 닫기 버튼에 aria-label="닫기"
- 포커스 트랩: 모달 내부 요소만 Tab 이동
- 첫 포커스: 닫기 버튼
- ESC 키로 닫기 지원

### Badge 스타일
- 패딩: 4px 12px
- 모서리 라운드: 4px
- 폰트 크기: 12px
- 폰트 무게: Medium

### 계산 예시 (GP 가져오기)
```
교환 전 GP 잔액: 5,000 GP
GP 수량: 1,000 GP
교환 후 GP 잔액: 6,000 GP (5,000 + 1,000)
```

### 계산 예시 (CELB으로 보내기)
```
교환 전 GP 잔액: 5,000 GP
GP 수량: 500 GP
교환 후 GP 잔액: 4,500 GP (5,000 - 500)
```

### 실패 케이스 예시
```
교환 전 GP 잔액: 300 GP
GP 수량: 500 GP (출금 시도)
교환 후 GP 잔액: 300 GP (변동 없음)
상태: 실패
실패 사유: 잔액 부족
```
