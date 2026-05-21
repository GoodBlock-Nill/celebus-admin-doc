# Sync Matrix — CEB-BO-RFT-101 응모권 현황

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/RFT/[CEB-BO-RFT-101] 응모권 현황.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/rft/current/page.tsx` |
| 동기화일 | — | 2026-05-21 |

## 정합 매트릭스

| # | 명세 §섹션 | 항목 | 프로토타입 | 상태 |
|---|---|---|---|---|
| 1 | §2-1 | 기간 필터 5종 (오늘/이번 주/이번 달/올해/전체), 기본 이번 달 | PERIODS 배열 + useState 'month' | ✅ |
| 2 | §2-2 | 통계 카드 3종 (총 발급·총 보유·총 사용) + 변형(에메랄드/회색) | StatCardWithBar 3개 | ✅ |
| 3 | §2-2 | **기간 필터 영향 (총 발급·총 사용은 변동, 총 보유는 영향 없음)** | periodMultiplier 5단계 + 총 보유는 미적용 | ✅ (2026-05-21 정정) |
| 4 | §2-3 | 정규 발급 5종 막대 (에메랄드, "발급 5종" 배지) | getSourceDistribution + 막대 분기 | ✅ |
| 5 | §2-3 | 사용 1종 막대 (rose, "사용 1종" 배지) | getUseDistribution + 막대 분기 | ✅ |
| 6 | §2-3 | 막대 클릭 → RFT-201 출처 필터 자동 적용 | router.push '/rft/history?source=' | ✅ |
| 7 | §2-4 | 좌우 분할 패널 — 최근 발급 5건 / 최근 사용 5건 | grid-cols-2 + slice(0, 5) | ✅ |
| 8 | §2-4 | 컬럼 4종 (일시·회원·변동·출처) + 회원 새 탭 진입 | a href target=_blank | ✅ |
| 9 | §2-4 | "더 보기 →" → RFT-201?type=ISSUED / ?type=USED | router.push 정합 | ✅ |
| 10 | §2-4 | 빈 상태 메시지 ("발급 이력이 없습니다." / "사용 이력이 없습니다.") | emptyMessage 정합 | ✅ |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | 신규 작성 + Important 1건 정정 — 기간 필터 연동(periodMultiplier로 mock 수치 동적 변동), 총 보유는 명세 따라 영향 없음 |
