# Sync Matrix — CEB-BO-RFL-201 래플 상세 (기본정보)

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/RFL/[CEB-BO-RFL-201] 래플 상세 (기본정보).md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/raffle/[id]/page.tsx` |
| 동기화일 | — | 2026-05-21 |

## 정합 매트릭스

| # | 명세 §섹션 | 항목 | 프로토타입 | 상태 |
|---|---|---|---|---|
| 1 | Breadcrumb | **"래플 상세"** (구 "Raffle 상세") | breadcrumbItems 정합 | ✅ (2026-05-21 정정) |
| 2 | §2-4-A | 카드 제목 **"래플 정보"** (구 "Raffle 정보") | h3 정합 | ✅ (2026-05-21 정정) |
| 3 | §2-5 | LangSection 제목 **"래플 타이틀"·"래플 설명"** (구 "Raffle 타이틀"·"Raffle 설명") | LangSection title 정합 | ✅ (2026-05-21 정정) |
| 4 | §2-5 | LangSection 제목 "경품 상세" | 정합 | ✅ |
| 5 | §4-2 | 게시 활성 조건 — 현장 수령일 때 location/items KO/EN/JA 검증 | pickupValidForPublish | ✅ |
| 6 | §4 | 추첨대기 상태 헤더 액션 (없음) | isAwaiting 분기 | ✅ |

## 모달 트리거 정합 (RFL-201-MD-*)

| # | 명세 모달 | 프로토타입 | 상태 |
|---|---|---|---|
| MD1 | RFL-201-MD-OPEN 게시 | ConfirmModal "게시하시겠어요?" + canPublish 검증 (모달 진입 시점 검증 완료 보장, 내부 alert 제거) | ✅ (2026-05-21 정정 — alert 제거) |
| MD2 | RFL-201-MD-CLOSE 종료 | ConfirmModal "종료하시겠어요?" + 응모자 0건 즉시 종료 | ✅ |
| MD3 | RFL-201-MD-DELETE 삭제 | ConfirmModal "삭제하시겠어요?" | ✅ |
| MD4 | RFL-201-MD-HIDE 숨김 토글 | ConfirmModal raffle.hidden 분기 (숨김 처리/해제) | ✅ |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | 신규 작성 + Critical 3건 + Important 1건 정정 — "Raffle" → "래플" 라벨 4건, 게시 모달 내부 alert 제거 (모달 진입 시점 canPublish 검증 완료 보장 정합) |
