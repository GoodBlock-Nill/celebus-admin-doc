# Sync Matrix — CEB-BO-EVT-101 팬덤 레벨 리스트

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/EVT/[CEB-BO-EVT-101] 팬덤 레벨 리스트.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/artists/fandom/page.tsx` |
| 프로토타입 폼 컴포넌트 | — | `prototype/src/app/artists/fandom/_components/FandomCreateModal.tsx` |
| 프로토타입 데이터 모델 | — | `prototype/src/mock/fandom.ts` (`FandomLevel` 타입) |
| 프로토타입 마지막 동기화 | — | 2026-05-29 |

## 정합 메모

- 운영자 수동 생성·관리 리스트. 상태(임시저장/진행중/종료) 카운터·Dropdown 필터·상태 컬럼. [생성] 모달(아티스트·시즌명 → 임시저장). 컬럼: 상태·그룹·현재 시즌·레벨 수·현재 팬덤 레벨·누적 덕력·참여 팬 수·업데이트 일시. Row 클릭 → 상세.
- 상태 전환 액션·상세화면은 [CEB-BO-EVT-201] (재논의 예정).
