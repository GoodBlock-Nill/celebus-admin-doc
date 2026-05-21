# Sync Matrix — CEB-BO-SQ-204-EDIT 미션 수정

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/SQ/[CEB-BO-SQ-204-EDIT] 미션 수정.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/sq/[id]/quests/[qid]/edit/page.tsx` |
| 진입 경로 | [CEB-BO-SQ-204] 미션 상세 [수정하기] 버튼 | `quests/[qid]/page.tsx:75` `router.push('/sq/{id}/quests/{qid}/edit')` |
| 동기화일 | — | 2026-05-21 |

## 정합 매트릭스

| # | 명세 §섹션 | 항목 | 프로토타입 | 상태 |
|---|---|---|---|---|
| 1 | §1 v1.0 | 화면 경로 `/sq/{id}/quests/{qid}/edit` + Breadcrumb 4단계 | route 디렉터리 + PageHeader breadcrumbItems 4단계 | ✅ (2026-05-21 신규) |
| 2 | §2-2 v1.1 | **상태 배너 4분기 — DRAFT 미노출 / ACTIVE+PM/ST 노랑 / ACTIVE+팬퀘스트 회색 차단 / CLOSED 회색 차단** | `isFanQuestActiveBlocked`·`isTitleOnlyEditable`·`status === 'CLOSED'` 3분기 배너 (LockClosedIcon·ExclamationTriangleIcon) | ✅ (2026-05-21 정정 — v1.0 "진행중 보상만 read-only" → v1.1 진입 차단·다국어만 정책 강화) |
| 3 | §2-3 v1.0 | 팬퀘스트 메타 안내 박스 (FAN_QUEST 한정) | `isFanQuest && <indigo 박스>` — 매핑 ID·메타 수정 범위 명시 | ✅ (2026-05-21 신규) |
| 4 | §2-4 v1.0 | 기본 정보 표시 순서·유형 모두 read-only | 회색 박스 + 유형 배지 read-only | ✅ (2026-05-21 신규) |
| 5 | §2-6 v1.0 | **PM/ST 다국어 타이틀 prefill + KO·EN·JA 3종 모두 필수 검증** | `title` state quest.titleKO/EN/JA prefill + LangField + `isAllLangsFilled(title)` 검증 | ✅ (2026-05-21 신규, [CEB-BO-011] §5 정합) |
| 6 | §2-6 v1.0 | PM/ST 다국어 타이틀 — 종료 상태에서 read-only Row 3행으로 대체 | `isAllLocked ? <Row 3행> : <LangField>` 분기 | ✅ (2026-05-21 신규) |
| 7 | §2-6 v1.1 | **판정 유형 prefill + 진행중·종료 read-only** (정정 — 진행중 PM/ST에서도 잠금) | `completedType`·`completedValue`·`sourceRefName` prefill + `disabled={isAllLocked \|\| isTitleOnlyEditable}` | ✅ (2026-05-21 정정 — v1.0 "종료만 read-only" → v1.1 진행중도 잠금) |
| 8 | §2-6 v1.1 | **보상(응모권·덕력·BIVE·민팅) — 진행중·종료 read-only (회원 기대권 보호)** | `disabled={isRewardLocked}` (= `isAllLocked \|\| isTitleOnlyEditable`) + 노랑 배지 노출 | ✅ (2026-05-21 유지 — `isRewardLocked` 재정의로 정합 유지) |
| 9 | §2-6 v1.1 | **반복 여부·반복 주기·기간 — 진행중·종료 read-only** (정정 — 진행중 PM/ST에서도 잠금) | `repeat`·`repeatCycle`·`openDt`·`closeDt` prefill + `isRepeatEpisode` 분기 + `disabled={isAllLocked \|\| isTitleOnlyEditable}` | ✅ (2026-05-21 정정 — v1.0 "종료만 read-only" → v1.1 진행중도 잠금) |
| 10 | §2-7 v1.0 | 하단 액션 [취소하기]·[저장] (Sticky 푸터) — 검증 통과 시 활성 | sticky 푸터 + `disabled={!isValid}` | ✅ (2026-05-21 신규) |
| 11 | §5 v1.0 | 유형·팬퀘스트 매핑(fanQuestId) 변경 불가 정책 | 유형은 read-only 배지, fanQuestId 표시 후 변경 UI 미제공 | ✅ (2026-05-21 신규) |
| 12 | §2-2 v1.1 | **신규 — 진입 차단 케이스 (ACTIVE+팬퀘스트 / CLOSED 전 유형) 직접 URL 진입 방어** | `isFanQuestActiveBlocked = ACTIVE && FAN_QUEST` + `isAllLocked = CLOSED \|\| isFanQuestActiveBlocked` + 회색 차단 배너 | ✅ (2026-05-21 신규) |
| 13 | §2-2 v1.1 | **신규 — 진행중+PM/ST 다국어 타이틀만 수정 가능 정책** | `isTitleOnlyEditable = ACTIVE && isGameType` + 다국어 LangField만 활성 + 노랑 안내 배너 | ✅ (2026-05-21 신규) |

## SQ-204 상세 [수정하기] 버튼 연계

| # | 항목 | 변경 전 | 변경 후 | 상태 |
|---|---|---|---|---|
| L1 | [수정하기] onClick (`prototype/src/app/sq/[id]/quests/[qid]/page.tsx:75`) | `alert('[Mock] 미션 수정 — ...')` | `router.push('/sq/{id}/quests/{quest.id}/edit')` | ✅ (2026-05-21 정합) |
| L2 | [CEB-BO-SQ-204] §4 "[수정하기] 클릭" 행 | "본 화면을 수정 모드로 전환 (또는 별도 페이지 — **후속 정의**)" | "[CEB-BO-SQ-204-EDIT] 미션 수정 화면(`/sq/{id}/quests/{qid}/edit`)으로 이동" | ✅ (2026-05-21 정합) |
| L3 | [CEB-BO-SQ-204] §6 연관 화면 "[수정하기]" 행 | "(본 화면 수정 모드 또는 후속 정의 페이지)" | "[CEB-BO-SQ-204-EDIT] 미션 수정" | ✅ (2026-05-21 정합) |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | **진행중·종료 정책 강화 (사용자 정정 반영, v1.0 → v1.1)** ① 정합 매트릭스 #2 상태 배너 4분기 재작성 ② #7·#9 판정·반복 잠금 정책 정정 (진행중 PM/ST에서도 잠금) — `disabled={isAllLocked \|\| isTitleOnlyEditable}` ③ #12·#13 신규 행 추가 — 진입 차단 케이스 + 다국어 타이틀만 수정 정책 ④ 프로토타입 `isFanQuestActiveBlocked`·`isTitleOnlyEditable` 변수 신규 도입. `isAllLocked = CLOSED \|\| isFanQuestActiveBlocked`로 확장 ⑤ SQ-204 상세 [수정하기] 버튼도 조건부 `disabled` (종료 또는 진행중+팬퀘스트) ⑥ [CEB-BO-SQ-204] v3.4·[CEB-BO-011] v3.7·[CEB-BO-SQ-FLOW] v3.7 동시 정합 |
| 2026-05-21 | **신규 작성 — 미션 수정 화면 신규** ① [CEB-BO-SQ-204-EDIT] v1.0 + 프로토타입 `quests/[qid]/edit/page.tsx` 동시 작성. CREATE v3.3을 base로 prefill + 상태별 잠금 (DRAFT/ACTIVE/CLOSED) + 팬퀘스트 메타 제한 추가 ② SQ-204 상세 [수정하기] alert mock → `router.push` 정합 + 명세 §4·§6 "후속 정의" → "[CEB-BO-SQ-204-EDIT] 진입" 정정 (SQ-204 v3.3) ③ 영역 가이드 [CEB-BO-011] v3.6 §5 정책 상수 2행 추가 + [CEB-BO-SQ-FLOW] v3.6 §2-1 활성 화면 + §6-6 미션 수정 플로우 재작성 |
