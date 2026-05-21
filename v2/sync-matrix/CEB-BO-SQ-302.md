# Sync Matrix — CEB-BO-SQ-302 팬퀘스트 리스트

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/SQ/[CEB-BO-SQ-302] 팬퀘스트 리스트.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/sq/quests/page.tsx` |
| 동기화일 | — | 2026-05-21 |

## 정합 매트릭스

| # | 명세 §섹션 | 항목 | 프로토타입 | 상태 |
|---|---|---|---|---|
| 1 | §2-2 | [반려사유 설정] 라우트 `/sq/reject-reasons` | router.push 정합 | ✅ (2026-05-21 정정) |
| 2 | §2-2 | [생성하기] 라우트 `/sq/quests/create` | router.push 정합 | ✅ (2026-05-21 정정) |
| 3 | §2-3 | Row 클릭 라우트 `/sq/quests/{id}?tab=info` | onRowClick 정합 | ✅ (2026-05-21 정정) |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | 신규 작성 + Important 3건 정정 — 라우트 마이그레이션 `/fanquest/*` → `/sq/quests/*`·`/sq/reject-reasons` (점진 마이그레이션 — sq/quests/[id]·sq/quests/create·sq/reject-reasons 신규 페이지가 기존 fanquest 컴포넌트를 re-export 방식으로 사용) |
