# Sync Matrix — CEB-BO-APP-101 배너 관리

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/APP/[CEB-BO-APP-101] 배너 관리.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/home/banners/page.tsx` |
| 명세 버전 | v6.1 | — |
| 프로토타입 마지막 동기화 | — | 2026-05-21 (매트릭스 신규 작성) |

## UI 요소 정합 매트릭스

| # | 명세 §섹션 | 명세 요소 | 프로토타입 컴포넌트 | 프로토타입 파일:라인 | 상태 |
|---|---|---|---|---|---|
| 1 | §2-2 | 노출 위치 탭 2종 (홈 / 아티스트 메인) | Tab 버튼 그룹 | banners/page.tsx (탭 영역) | ✅ |
| 2 | §2-2 | 탭 카운트 자동 생성 슬롯 수 | `slots.length` 표시 | banners/page.tsx:129 | ✅ |
| 3 | §2-2 | URL 쿼리 동기화 (`?placement=home/artist`) | useSearchParams | banners/page.tsx | ✅ |
| 4 | §2-3 | 안내 띠 (탭 슬롯 개수 + 안내문) | `bg-violet-50` 박스 | banners/page.tsx:126 | ✅ |
| 5 | §2-4 | 통계 카드 — 전체 배너 | `StatCardWithBar variant=default` | banners/page.tsx:137 | ✅ |
| 6 | §2-4 | 통계 카드 — 노출중 | `StatCardWithBar variant=active` | banners/page.tsx:138 | ✅ |
| 7 | §2-4 | 통계 카드 — 임시저장 | `StatCardWithBar variant=inactive` | banners/page.tsx:139 | ✅ |
| 8 | §2-4 | 통계 카드 — 노출 종료 | `StatCardWithBar variant=default` | banners/page.tsx:140 | ✅ |
| 9 | §2-4 | **통계 카드 클릭 시 필터 적용 (전체=초기화, 노출중·임시저장·노출 종료=상태 필터)** | `StatCardWithBar onClick` + `statusFilter` state | banners/page.tsx:49, 148-178 | ✅ (2026-05-21 정정 — `StatCardWithBar`에 `onClick`·`active` props 추가, 4개 카드 각각 onClick 핸들러로 statusFilter 연결, filtered useMemo에 반영) |
| 10 | §2-5 | 필터 — 아티스트 (전체/전역/활성 아티스트 동적) | `FilterSelect` | banners/page.tsx:145 | ✅ |
| 11 | §2-5 | 필터 — 위치 (전체/메인·오늘의 할일 또는 다함께·미션) | `FilterSelect` | banners/page.tsx:158 | ✅ |
| 12 | §2-5 | 필터 — 키워드 | `<input>` | banners/page.tsx | ✅ |
| 13 | §2-5 | [초기화] 버튼 | `<button>` | banners/page.tsx | ✅ |
| 14 | §2-6 | 인벤토리 테이블 — 컬럼 5종 (아티스트·배너 위치·배너 수·최근 수정일·최근 수정자) | `<table>` | banners/page.tsx | ✅ |
| 15 | §2-6 | Row 클릭 → 슬롯 상세 진입 | `onClick` 핸들러 | banners/page.tsx | ✅ |

## 정책 정합

| # | 명세 §섹션 | 정책 | 프로토타입 구현 | 상태 |
|---|---|---|---|---|
| P1 | §2-1 | 신규 등록 버튼 없음 (슬롯 상세에서만 추가) | 헤더에 [+ 새 배너] 버튼 없음 | ✅ |
| P2 | §5 | 슬롯 자동 생성 (slotKind × artistGroup) | mock 데이터로 표현 | ✅ |
| P3 | §5 | 통계 카드 카운트 = 현재 탭 전체 기준 (필터 무관) | `tabCounts` 계산 | ✅ |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | **신규 작성**. 명세 v6.1 기준. 누락 1건(#9 통계 카드 클릭 필터 미연동) 표기 |
| 2026-05-21 | **정정 완료** — #9 ⚠️→✅. `StatCardWithBar` 컴포넌트에 `onClick`·`active` props 추가. `banners/page.tsx`에 `statusFilter` state(`'' | 'ACTIVE' | 'DRAFT' | 'CLOSED'`) + 4개 카드 onClick 핸들러 + filtered useMemo에 상태 필터 분기 추가. 활성 카드는 인디고 ring으로 시각 강조 |
