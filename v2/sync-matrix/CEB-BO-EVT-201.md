# Sync Matrix — CEB-BO-EVT-201 팬덤 레벨 상세

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/EVT/[CEB-BO-EVT-201] 팬덤 레벨 상세.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/artists/fandom/[id]/page.tsx` |
| 프로토타입 폼 컴포넌트 | — | `prototype/src/app/artists/fandom/[id]/_components/CurveTab.tsx` |
| 프로토타입 보조 컴포넌트 | — | `prototype/src/app/artists/fandom/[id]/_components/RewardTab.tsx` |
| 프로토타입 신규 컴포넌트 | — | `prototype/src/app/artists/fandom/[id]/_components/HistoryTab.tsx` |
| 프로토타입 데이터 모델 | — | `prototype/src/mock/fandom.ts` (`FandomLevel` 타입) |
| 프로토타입 마지막 동기화 | — | 2026-05-28 |

## 정합 메모

- 3탭: 레벨·곡선 설정(레벨별 목표 덕력·권장 곡선 적용·저장) / 레벨별 보상 설정(보상 타입 5종·지급 방식·래플 추첨 실행) / 변동 내역(회원 변동 조회).
