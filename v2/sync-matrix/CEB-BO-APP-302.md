# Sync Matrix — CEB-BO-APP-302 알림 상세·작성

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/APP/[CEB-BO-APP-302] 알림 상세·작성.md` | — |
| 프로토타입 페이지 (상세) | — | `prototype/src/app/app/notifications/[id]/page.tsx` |
| 프로토타입 페이지 (신규) | — | `prototype/src/app/app/notifications/new/page.tsx` |
| 프로토타입 폼 컴포넌트 | — | `prototype/src/components/app/NotificationForm.tsx` |
| 명세 버전 | v1.11 | — |
| 프로토타입 마지막 동기화 | — | 2026-05-21 (매트릭스 신규 작성) |

## 필드 정합 매트릭스

| # | 명세 §섹션 | 명세 필드 (라벨) | 프로토타입 컴포넌트 | 프로토타입 파일:라인 | 옵션·검증 | 상태 |
|---|---|---|---|---|---|---|
| 1 | §2-2 A | 제목 (KO/EN/JP) | `LangBlock` | NotificationForm.tsx:101 | 각 50자, 필수 | ✅ |
| 2 | §2-2 A | 본문 (KO/EN/JP) | `LangBlock` | NotificationForm.tsx:101 | 각 200자, 필수 | ✅ |
| 3 | §2-2 A | 푸시 짧은 메시지 (KO/EN/JP) | `LangBlock` | NotificationForm.tsx:101 | 각 65자, 선택, 미입력 시 제목 자동 | ✅ |
| 4 | §2-2 B | 기본알림 (항상 ON, 비활성 체크박스) | "항상 ON" 배지 | NotificationForm.tsx:145 | 고정 | ✅ |
| 5 | §2-2 B | 푸시알림 토글 | 토글 버튼 | NotificationForm.tsx:155 | ON/OFF | ✅ |
| 6 | §2-2 C | 대상 — 전역 라디오 | `TargetCard` | NotificationForm.tsx:184 | 라디오 1종 | ✅ |
| 7 | §2-2 C | 대상 — 아티스트 팬덤 + 드롭다운 | `TargetCard` + 아티스트 `<Select>` | NotificationForm.tsx:184 | 라디오 + 드롭다운 | ✅ |
| 8 | §2-2 C | 대상 — 특정 회원 그룹 (회원 검색 + CSV 업로드) | `TargetCard` + 검색 + 파일 업로드 | NotificationForm.tsx:184 | 라디오 + 검색 + CSV | ✅ |
| 9 | §2-2 D | 딥링크 — 소스 타입 (텍스트박스) | `DeeplinkPicker.sourceType` | NotificationForm.tsx:260 | 자유 텍스트 | ✅ |
| 10 | §2-2 D | 딥링크 — 링크 URL (텍스트박스) | `DeeplinkPicker.url` | NotificationForm.tsx:260 | `https://`·`http://`·`/` 형식 검증 | ✅ |

## 액션·헤더 정합 매트릭스

| # | 명세 §섹션 | 상태별 액션 | 프로토타입 버튼 | 프로토타입 파일:라인 | 상태 |
|---|---|---|---|---|---|
| A1 | §4-1 신규 | [취소] [임시저장] [예약 발송] [발송] | 4종 버튼 | notifications/new/page.tsx:35~65 | ✅ |
| A2 | §4-1 DRAFT | [취소] | (없음 — 상세는 뒤로가기로 대체) | notifications/[id]/page.tsx | ✅ |
| A3 | §4-1 DRAFT | **[수정 저장]** | `<button key="save">수정 저장</button>` | notifications/[id]/page.tsx:98 | ✅ (2026-05-21 정정) |
| A4 | §4-1 DRAFT | [삭제] | `<button>삭제</button>` | notifications/[id]/page.tsx:93 | ✅ |
| A5 | §4-1 DRAFT | [예약 발송 → 모달] | `<button>예약 발송</button>` | notifications/[id]/page.tsx:97 | ✅ |
| A6 | §4-1 DRAFT | [발송] | `<button>발송</button>` | notifications/[id]/page.tsx:101 | ✅ |
| A7 | §4-1 SCHEDULED | [취소] | (없음 — 뒤로가기로 대체) | notifications/[id]/page.tsx | ✅ |
| A8 | §4-1 SCHEDULED | **[수정 저장]** | `<button key="save">수정 저장</button>` | notifications/[id]/page.tsx:113 | ✅ (2026-05-21 정정) |
| A9 | §4-1 SCHEDULED | [예약 취소] | `<button>예약 취소</button>` | notifications/[id]/page.tsx:110 | ✅ |
| A10 | §4-1 SENT | [복제] | `<button>복제</button>` | notifications/[id]/page.tsx:116 | ✅ |

## 발송 결과 섹션 (SENT 상태 read-only)

| # | 명세 §섹션 | 표시 항목 | 프로토타입 구현 | 프로토타입 파일:라인 | 상태 |
|---|---|---|---|---|---|
| R1 | §3 | 발송 통계 (총 발송 / 도달 / 미도달 / 오픈율) | `ResultSummary` | notifications/[id]/page.tsx:137~175 | ✅ |
| R2 | §3 | 미도달 호버 시 세부 사유 (권한 OFF + 한도 초과) | 커스텀 hover 툴팁 div (group-hover 기반) | notifications/[id]/page.tsx:217~221 | ✅ (2026-05-21 정정 — title 속성 제거하고 커스텀 툴팁 div로 교체) |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | **신규 작성**. 명세 v1.11 기준. 누락 2건(A3 DRAFT [수정 저장], A8 SCHEDULED [수정 저장]) + 불일치 1건(R2 미도달 툴팁 UI 규격) 표기. Critical 2건은 편집은 열려있는데 저장 수단 없음 |
| 2026-05-21 | **정정 완료** — A3 ⚠️→✅ (DRAFT 분기에 [수정 저장] 버튼 추가), A8 ⚠️→✅ (SCHEDULED 분기에 [수정 저장] 버튼 추가), R2 🔄→✅ (브라우저 기본 title 속성 제거, 커스텀 hover 툴팁 div로 교체) |
