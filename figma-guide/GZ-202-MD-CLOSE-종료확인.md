# [CEB-BO-GZ-202-MD-CLOSE] 종료 확인 - Figma 조립 가이드

> 원본: `[CEB-BO-GZ-202-MD-CLOSE] 종료 확인.md`
> 유형: Modal
> 크기: 640px × auto

---

## 레이아웃 구조

```
Frame (Modal)
├── Overlay Background (전체 화면)
│   └── opacity: 0.5, bg-gray-900
└── Modal Container (중앙 정렬, 640px)
    ├── Header
    │   ├── Title: "게임을 강제 종료하시겠습니까?"
    │   └── Close Button [X]
    ├── Body
    │   ├── Warning Icon + Text (경고 문구)
    │   ├── Info Box (처리 내용 안내)
    │   │   ├── Title: "강제 종료 시 처리 내용"
    │   │   ├── Item 1: "• 게임 상태: Active → Ended"
    │   │   ├── Item 2: "• 모든 참여자 참여 GP 전액 환급"
    │   │   ├── Item 3: "• 부스팅 GP도 전액 환급"
    │   │   └── Item 4: "• 보상 미지급 (결과 없이 종료)"
    │   └── Summary Table
    │       ├── Row 1: 타이틀 | {게임 타이틀}
    │       ├── Row 2: 현재 참여자 | {숫자}명
    │       └── Row 3: 환급 예정 GP | {숫자} GP
    └── Footer
        ├── Button (Secondary): "취소"
        └── Button (Danger): "강제 종료"
```

---

## Preline 컴포넌트 매핑

| 순서 | UI 요소 | Preline 컴포넌트 | 속성 | 내용 |
|------|---------|-----------------|------|------|
| 1 | 배경 오버레이 | Overlay | `opacity: 0.5` | 반투명 검정 배경 |
| 2 | 모달 컨테이너 | Modal | `width: 640px` | 중앙 정렬, 더 넓게 |
| 3 | 모달 타이틀 | Text (H3) | - | "게임을 강제 종료하시겠습니까?" |
| 4 | 닫기 버튼 | Icon Button | - | [X], 우측 상단 |
| 5 | 경고 아이콘 | Icon | `color: warning` | ⚠️, 24×24px |
| 6 | 경고 문구 1 | Text (Body) | - | "⚠️ 강제 종료 시 진행 중인 참여가 즉시 마감됩니다." |
| 7 | 경고 문구 2 | Text (Body) | - | "참여자에게는 참여 GP가 전액 환급됩니다." |
| 8 | 경고 문구 3 | Text (Body) | - | "이 작업은 되돌릴 수 없습니다." |
| 9 | 처리 내용 박스 | Info Box | `variant: info` | 배경 연한 파란색 |
| 10 | 박스 타이틀 | Text (Subtitle) | - | "강제 종료 시 처리 내용" |
| 11 | 처리 항목 1 | List Item | - | "• 게임 상태: Active → Ended" |
| 12 | 처리 항목 2 | List Item | - | "• 모든 참여자 참여 GP 전액 환급" |
| 13 | 처리 항목 3 | List Item | - | "• 부스팅 GP도 전액 환급" |
| 14 | 처리 항목 4 | List Item | - | "• 보상 미지급 (결과 없이 종료)" |
| 15 | 요약 테이블 | Table | `variant: bordered` | 게임 정보 요약 |
| 16 | 테이블 Row 1 | Table Row | - | 타이틀 \| {게임 타이틀} |
| 17 | 테이블 Row 2 | Table Row | - | 현재 참여자 \| {숫자}명 |
| 18 | 테이블 Row 3 | Table Row | - | 환급 예정 GP \| {숫자} GP |
| 19 | 취소 버튼 | Button | `variant: secondary` | 좌측 배치 |
| 20 | 강제 종료 버튼 | Button | `variant: danger` | 우측 배치, 빨간색 |

---

## 상태별 변형

### 버튼 동작
- **취소**: 모달 닫기, 게임 상세 화면 복귀
- **강제 종료**: 게임 상태 Active → Ended, GP 환급 실행, 토스트 표시

### 성공 시
- 토스트 메시지: "게임이 종료되었습니다."
- 모달 닫기
- 게임 상세 화면 갱신

---

## 디자이너 참고사항

### 모달 크기
- 너비: 640px (처리 내용 박스와 테이블 포함으로 더 넓게)
- 높이: auto

### 경고 표시
- 경고 아이콘: ⚠️, 24×24px, 주황색
- 경고 문구: 3줄로 구성, 위험성 강조

### 처리 내용 안내 박스
- 배경색: 연한 파란색 (Info)
- 패딩: 16px
- 리스트 스타일: Bullet (•)
- 4개 항목 포함

### 요약 테이블
- 3개 행: 타이틀, 현재 참여자, 환급 예정 GP
- 환급 예정 GP = 모든 참여자의 (참여 GP + 부스팅 GP) 합계

### 버튼 스타일
- **취소**: Secondary
- **강제 종료**: Danger (빨간색) - 위험한 액션 강조

### 환급 계산
```
환급 예정 GP = Σ(각 참여자의 참여 GP + 부스팅 GP)
```

### 에러 케이스
- 게임 상태가 Active가 아님: "종료할 수 없는 상태의 게임입니다."
- 환급 처리 실패: 트랜잭션 롤백, 게임 상태 유지
