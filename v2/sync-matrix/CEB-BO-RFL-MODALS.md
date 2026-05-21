# Sync Matrix — CEB-BO-RFL 모달 7개

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 (7개) | `v2/BO/RFL/[CEB-BO-RFL-{201-MD-OPEN/CLOSE/DELETE/HIDE, 202-MD-DETAIL, 203-MD-DRAW/NOTE}].md` | — |
| 프로토타입 컴포넌트 | — | `prototype/src/app/raffle/_components/{DrawModal,EntryDetailModal,WinnerNoteModal}.tsx` + `[id]/page.tsx`의 ConfirmModal |
| 동기화일 | — | 2026-05-21 |

## 모달별 정합 매트릭스

| # | 모달 명세 | 트리거 + 컨텐츠 | 상태 |
|---|---|---|---|
| MD1 | RFL-201-MD-OPEN 게시 | ConfirmModal "게시하시겠어요?" + canPublish (다국어 3종+pickup 검증) | ✅ (2026-05-21 정정 — 내부 alert 제거, 모달 진입 시점 검증 완료 보장) |
| MD2 | RFL-201-MD-CLOSE 종료 | ConfirmModal "종료하시겠어요?" + 응모자 0건 시 즉시 종료 분기 | ✅ |
| MD3 | RFL-201-MD-DELETE 삭제 | ConfirmModal "삭제하시겠어요?" + danger | ✅ |
| MD4 | RFL-201-MD-HIDE 숨김 토글 | ConfirmModal raffle.hidden 분기 (숨김 처리/해제) + danger·인디고 분기 | ✅ |
| MD5 | RFL-202-MD-DETAIL 응모내역 상세 | EntryDetailModal — 누적 요약·테이블 3컬럼·합계 행·페이지네이션 | ✅ (2026-05-21 정정 — 합계 라벨 "합계 (전체)" → "합계", 0건일 때 페이지네이션 미노출) |
| MD6 | RFL-203-MD-DRAW 추첨 | DrawModal — 시드 박스+[재추첨]·추첨 풀 안내·미리보기 4컬럼+페이지네이션·확정 버튼 | ✅ (2026-05-21 정정 — 모달 제목 "래플 추첨하기", 미리보기 페이지네이션 10건/페이지 신규) |
| MD7 | RFL-203-MD-NOTE 당첨자 비고 | WinnerNoteModal — 200자 제한·당첨자만 활성·"변경사항 없음" 안내 | ✅ (2026-05-21 정정 — "변경사항이 없습니다" 안내 박스 추가) |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | 신규 작성 + Critical 1건 + Important 2건 + Minor 2건 정정 — DrawModal "Raffle 추첨하기" → "래플 추첨하기" (Critical), 게시 모달 alert 제거·EntryDetailModal 0건 페이지네이션 미노출·DrawModal 미리보기 페이지네이션 신규 (Important), EntryDetailModal 합계 라벨·WinnerNoteModal 변경사항 없음 안내 (Minor) |
