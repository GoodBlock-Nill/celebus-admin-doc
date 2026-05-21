# Sync Matrix — CEB-BO-APP-202 슬롯 상세

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/APP/[CEB-BO-APP-202] 슬롯 상세.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/home/banners/slot/[slotKind]/[artist]/page.tsx` |
| 명세 버전 | v6.3 | — |
| 프로토타입 마지막 동기화 | — | 2026-05-21 (매트릭스 신규 작성) |

## UI 요소 정합 매트릭스

| # | 명세 §섹션 | 명세 요소 | 프로토타입 컴포넌트 | 프로토타입 파일:라인 | 상태 |
|---|---|---|---|---|---|
| 1 | §2-1 | 타이틀 "{위치명} — {아티스트명}" | 헤더 표시 | slot/page.tsx | ✅ |
| 2 | §2-1 | 위치 Badge | Badge 컴포넌트 | slot/page.tsx | ✅ |
| 3 | §2-1 | 아티스트 Badge (전역 회색 / 그룹명 인디고) | Badge 컴포넌트 | slot/page.tsx | ✅ |
| 4 | §2-1 | 정책 Badge ("캐러셀 · 최대 동시 8개" / "단일 배너 1개 고정") | Badge | slot/page.tsx | ✅ |
| 5 | §2-1 | [+ 배너 추가] 버튼 (항상 활성) | `<button>` | slot/page.tsx | ✅ |
| 6 | §2-2 | 안내 띠 — 캐러셀 한도 미달 (노출중 N / 8 + 대기 건수) | 조건부 렌더 | slot/page.tsx:161~196 | ✅ |
| 7 | §2-2 | 안내 띠 — 캐러셀 한도 도달 (강조 색) | 조건부 렌더 | slot/page.tsx | ✅ |
| 8 | §2-2 | 안내 띠 — 단일 비어 있음 | 조건부 렌더 | slot/page.tsx | ✅ |
| 9 | §2-2 | 안내 띠 — 단일 노출중 1건만 | 조건부 렌더 | slot/page.tsx | ✅ |
| 10 | §2-2 | 안내 띠 — 단일 노출중 1건 + 대기 N건 (자동 종료 안내) | `isSingleSlot && activeCount === 1 && draftCount > 0` 분기 | slot/page.tsx | ✅ |
| 11 | §2-2 | **안내 띠 — 단일 노출중 0건 + 대기 N건 ("운영자가 [노출 시작] 필요")** | 조건부 분기 추가 | slot/page.tsx:193~197 | ✅ (2026-05-21 정정) |
| 12 | §2-3 | 캐러셀 테이블 — 정렬 핸들 컬럼 | 조건부 렌더 (`isCarousel`) | slot/page.tsx | ✅ |
| 13 | §2-3 | 캐러셀 테이블 — 순서 컬럼 | 조건부 렌더 (`isCarousel`) | slot/page.tsx | ✅ |
| 14 | §2-3 | 상태 Badge 컬럼 (임시저장/노출중/노출 종료) | Badge | slot/page.tsx | ✅ |
| 15 | §2-3 | 소스 타입 컬럼 (운영자 입력 라벨, 빈 값 "—", URL 툴팁) | `<td title={banner.linkUrl}>` | slot/page.tsx:207, 299 | ✅ |
| 16 | §2-3 | 타이틀 (KO) 메인+서브 2줄 컬럼 | `<td>` | slot/page.tsx | ✅ |
| 17 | §2-3 | 노출 기간 컬럼 ("무기한" Badge 또는 기간) | `<td>` | slot/page.tsx | ✅ |
| 18 | §2-3 | 최근 수정 컬럼 (시각 + 수정자) | `<td>` | slot/page.tsx | ✅ |
| 19 | §2-3 | 단일 슬롯 테이블 (정렬·순서 컬럼 제거, 나머지 동일) | `isCarousel` 분기 | slot/page.tsx | ✅ |
| 20 | §2-4 | 빈 상태 — Empty 아이콘 + 안내 + [+ 첫 배너 추가] CTA | Empty 상태 | slot/page.tsx | ✅ |
| 21 | §2-3 | Row 클릭 → [CEB-BO-APP-201] 배너 상세 진입 | `onClick` 핸들러 | slot/page.tsx | ✅ |

## 동작 정합

| # | 명세 §섹션 | 동작 | 프로토타입 구현 | 상태 |
|---|---|---|---|---|
| O1 | §4 | 드래그 정렬 (캐러셀 한정) → 즉시 서버 PATCH + 활동 로그 + 성공 토스트 | drag-and-drop 핸들러 | slot/page.tsx | ✅ |
| O2 | §4 | 정렬 저장 실패 → 행 원위치 + 에러 토스트 | 에러 핸들링 | slot/page.tsx | ✅ |
| O3 | §4 | 단일 슬롯 대기 [노출 시작] 시 기존 ACTIVE confirm 모달 | confirm 모달 | slot/page.tsx | ✅ |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | **신규 작성**. 명세 v6.3 기준. 누락 1건(#11 단일 슬롯 ACTIVE 0+DRAFT N 시나리오 안내) 표기 |
| 2026-05-21 | **정정 완료** — #11 ⚠️→✅. slot/page.tsx 안내 띠에 `isSingleSlot && activeCount === 0 && draftCount > 0` 분기 추가 ("· 운영자가 [노출 시작] 필요" 보조 텍스트 노출) |
