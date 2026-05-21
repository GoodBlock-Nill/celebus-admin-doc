# Sync Matrix — CEB-BO-SQ-MOCK-GUIDE SQ mock 데이터 가이드

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/SQ/[CEB-BO-SQ-MOCK-GUIDE] mock 데이터 가이드.md` | — |
| 프로토타입 대상 | — | `prototype/src/mock/sq.ts` |
| 동기화일 | — | 2026-05-21 |

## 정합 매트릭스

| # | 명세 §섹션 | 항목 | 프로토타입 (mock 객체) | 상태 |
|---|---|---|---|---|
| 1 | §2 v1.0 | 아티스트 3종 (V01D / iKON / CELEBUS) | `ArtistGroup` 타입 + `episodeGroups`에서 3종 분포 | ✅ (2026-05-21 신규) |
| 2 | §2 v1.0 | 에피소드 그룹 6건 (ACTIVE 2 / DRAFT 2 / CLOSED 2) | `episodeGroups` 배열 (id 1~6) | ✅ (2026-05-21 신규) |
| 3 | §3 v1.0 | 에피소드 24건 (그룹별 메인 + 반복 분포) | `storyQuests` 배열 (id 1~24) | ✅ (2026-05-21 신규) |
| 4 | §4 v1.0 | **정책 매트릭스 6조합 100% 커버 (DRAFT/ACTIVE/CLOSED × 팬퀘스트/PM/ST)** | `storyEpisodes` 배열 40건 — 모든 조합 1건 이상 mock 확인 | ✅ (2026-05-21 신규, SQ-204-EDIT v1.1 정합) |
| 5 | §5 v1.0 | **PM/ST 미션 22건 다국어 titleEN/titleJA 100% 입력** | `storyEpisodes`에서 type=PREDICTION_MARKET·SURVIVAL_TRIVIA 모두 KO/EN/JA 3종 입력 | ✅ (2026-05-21 신규, [CEB-BO-011] §5 다국어 필수 정합) |
| 6 | §6 v1.0 | 반복 주기 3종(DAILY/WEEKLY/MONTHLY) 모두 실장 | Mission 602 (DAILY), 1401·1901 (WEEKLY), 601·1101 (MONTHLY) | ✅ (2026-05-21 신규) |
| 7 | §7-1 v1.0 | SQ-204-EDIT v1.1 정책 검증 시나리오 mock 매핑 | 6가지 시나리오 모두 mock id 명시 (Story 1·7·12 등) | ✅ (2026-05-21 신규) |
| 8 | §7-2 v1.0 | SQ-204 다국어 카드 노출 검증 mock 매핑 | Mission 101 (FQ 미노출) / 102·103 (PM·ST 노출) | ✅ (2026-05-21 신규) |
| 9 | §7-3 v1.0 | SQ-204-CREATE 다국어 필수 검증 mock 매핑 | Story 4·5 (메인) / Story 6 (반복) | ✅ (2026-05-21 신규) |
| 10 | §7-4 v1.0 | [CEB-BO-011] §5 정책 상수 검증 mock 매핑 | 아티스트당 ACTIVE 1·메인 5+반복 1·미션 10·팬퀘스트 1:1 매핑 모두 검증 가능 | ✅ (2026-05-21 신규) |

## 구조 변경 매트릭스

| 변경 | 변경 전 (v2.2) | 변경 후 (v2.3) | 영향 |
|---|---|---|---|
| 미션 정의 구조 | `EPISODE_DATA` 단일 템플릿 배열 (10건) — 모든 에피소드가 같은 미션 재사용 | `storyEpisodes` 직접 정의 배열 (40건) — 각 미션이 `storyQuestId` 명시 | 화면 의존성 영향 없음 (`getEpisodesByStoryId`·`getEpisodeById` 시그니처 유지) |
| `CHAPTER_FAN_QUEST_ASSIGNMENT` | 별도 매핑 객체 | 폐기 (각 미션 객체에 `fanQuestId` 직접 정의) | `getAssignedFanQuestIds` 내부 구현만 변경 — 외부 시그니처 동일 |
| 에피소드 수 | 14건 (V01D 단일) | 24건 (V01D + iKON + CELEBUS) | 그룹 리스트·에피소드 상세 화면 시각 다양성 향상 |
| 미션 수 | 10건 (단일 템플릿) | 40건 (각 에피소드별 1~3건) | 정책 매트릭스 6조합 검증 가능 |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | **신규 작성 — SQ mock 데이터 풀 개선과 함께 신설** ① mock 풀 재작성 (그룹 3→6 / 에피소드 14→24 / 미션 10→40) ② 정책 매트릭스 6조합 100% 커버 ③ PM/ST 다국어 100% 입력 ④ 반복 주기 3종 실장 ⑤ EPISODE_DATA 단일 템플릿 → storyEpisodes 직접 정의 배열 구조 전환 ⑥ K-pop 시즌 스토리텔링으로 모든 타이틀 재작성 ⑦ 정책 검증 시나리오 가이드 §7 신설 — mock id로 SQ-204-EDIT v1.1·SQ-204 v3.2·SQ-204-CREATE v3.3·[CEB-BO-011] §5 직접 검증 가능. [CEB-BO-011] v3.8 동시 정합 |
