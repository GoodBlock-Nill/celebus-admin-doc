# Sync Matrix — CEB-BO-RFT-201 응모권 변동 내역

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/RFT/[CEB-BO-RFT-201] 응모권 변동 내역.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/rft/history/page.tsx` |
| 프로토타입 데이터 모델 | — | `prototype/src/mock/rft.ts` (RftSourceFeature, RftLog) |
| 동기화일 | — | 2026-05-21 |

## 정합 매트릭스

| # | 명세 §섹션 | 항목 | 프로토타입 | 상태 |
|---|---|---|---|---|
| 1 | §2-1 | 상태 필터 2종 (발급/사용) + 기본 발급 | 라디오 버튼 + ISSUED 기본값 | ✅ |
| 2 | §2-1 | 출처 드롭다운 — 정규 5종 + 사용 1종 + **운영 카테고리 3종** | sourcePolicies 8종 (운영 3종 신규) | ✅ (2026-05-21 정정) |
| 3 | §2-1 | 아티스트 컨텍스트 드롭다운 옵션 5종 (전체/V01D/iKON/CELEBUS/**전역**) | "전역" 라벨 (구 "전역(NULL)") | ✅ (2026-05-21 정정) |
| 4 | §2-1 | 키워드 검색 (닉네임 부분 일치) + [초기화] 버튼 | input + 초기화 버튼 | ✅ |
| 5 | §2-2 | 요약 카드 2개 (필터 결과·선택 유형 합계) | bg-gray-50 + emerald/rose 분기 | ✅ |
| 6 | §2-3 | 테이블 컬럼 8종 (일시·회원·상태·변동·잔액·출처·아티스트·참조) | SimpleTable columns 8개 | ✅ |
| 7 | §2-3 | **운영 카테고리 행 출처 컬럼 "(운영) {유형}" 표기** | isAdminCategory 분기 prefix | ✅ (2026-05-21 정정) |
| 8 | §2-3·§4 | **삭제 회원 클릭 비활성 + "(삭제됨)" 라벨** | r.memberDeleted 분기 + 회색 비활성 | ✅ (2026-05-21 정정) |
| 9 | §2-3 | 페이지네이션 20건/페이지 + 항상 노출 + 윈도잉 (≤7 전체 / 8 이상 윈도우+...) | PAGE_SIZE=20 + SimplePagination + buildPages 윈도잉 | ✅ |

## mock 데이터 정합

| # | 항목 | 위치 | 상태 |
|---|---|---|---|
| M1 | RftSourceFeature 8종 (구 6종 + 운영 3종) | mock/rft.ts:7~17 | ✅ (2026-05-21 정정) |
| M2 | sourcePolicies 8종 SourceMeta 배열 | mock/rft.ts:53~167 | ✅ (2026-05-21 정정) |
| M3 | RftLog.memberDeleted 옵션 필드 | mock/rft.ts:51 | ✅ (2026-05-21 정정) |
| M4 | refMap·refIdMap 8종 매핑 (운영 카테고리 포함) | mock/rft.ts:252~272 | ✅ (2026-05-21 정정) |
| M5 | SAMPLE_LOGS 운영 카테고리 3건 샘플 | mock/rft.ts:303~305 | ✅ (2026-05-21 정정) |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | 신규 작성 + Important 1건 + Minor 2건 정정 — 운영 카테고리 3종(RAFFLE_CANCEL_REFUND·ADMIN_CORRECTION·ADMIN_RECLAIM) mock·드롭다운·"(운영) {유형}" 표기 일괄 추가, "전역(NULL)" → "전역" 라벨, 삭제 회원 비활성+"(삭제됨)" 라벨 |
