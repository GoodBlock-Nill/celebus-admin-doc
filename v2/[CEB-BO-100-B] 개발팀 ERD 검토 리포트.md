# [CEB-BO-100-B] 개발팀 ERD 검토 리포트

## Page Properties

| Key | Value |
| ---- | ---- |
| Screen ID | CEB-BO-100-B |
| 기획담당자 | @Nill Yoo |
| 디자인담당자 | |
| 개발담당자 | |
| 기능영역(Epic) | 개발팀 ERD(SQL DDL) 3종 검토 — v2 BO 가이드 정합성 분석 |
| 상태 | Decided (Review→Decided 2026.05.08) |
| 버전 | v1.2 |
| 최근 업데이트 | 2026.05.11 |
| 비고 | v1.2: SQ 구조 정정 합의 5번째 추가 ([CEB-BO-100] v1.7, [CEB-BO-011] v1.1) — §3 에피소드 용어·수량 제약·`image_url`·`bive_reward_yn` 반영, §6 갭 12건→13건, §9 합의 4건→5건, §10 추가 자료 요청 상태 컬럼. v1.1: §9 즉시 합의 필요 3건 모두 합의 완료 (덕력=글로벌 시즌 / 팬덤=시즌별 리셋 / 챌린지=SQ 영역 + 아티스트별). v1.0: 개발팀이 2026.05.08 제공한 SQL DDL 3종(62 테이블) 검토 결과. v2 BO 13개 영역 가이드(v1.4) + 11개 멀티아티스트 정책 가이드 기준 정합성 분석. 본 리포트는 운영팀·개발팀 검토용. 패턴: [CEB-BO-001-A], [CEB-BO-100-A]와 동일. |

---

## 1. 검토 배경

개발팀이 v2 고도화 ERD 3종을 SQL DDL 파일로 제공:

| 파일 | 영역 | 테이블 수 |
| --- | --- | --- |
| `v2/BO/Celebus_2025_고도화_배너_응원하기_정보.sql` | HOM(배너) / SUP(응원하기) / INF(정보·소식) | 16 |
| `v2/BO/Celebus_고도화_덕력_팬덤_기억저장소.sql` | DUK(덕력) / EVT(팬덤 레벨) / MEM(기억저장소) | 24 |
| `v2/BO/Celebus_고도화_챌린지_일일미션_아티스트.sql` | **챌린지=`story_quest`** / FQ(일일미션) / ART(아티스트) | 22 |

**총 62개 테이블**. SQL DDL이므로 컬럼·외래키·ENUM·다국어 패턴까지 정밀 검증 가능.

---

## 2. 영역별 테이블 매핑 (62개)

### 2.1 SQL 1 — 배너·응원하기·정보 (16 테이블)

| 영역 | 테이블 |
| --- | --- |
| **INF** (소식) | `info`, `info_translation`, `info_link`, `info_link_translation`, `info_image`, `notice`, `notice_translation`, `user_info_read`, `user_info_like` |
| **SUP** (응원하기) | `support_event`, `support_event_translation`, `support_event_participation`, `support_event_result_media` |
| **HOM** (배너) | `event_banner`, `event_banner_translation` |
| **공통** | `artist_group`, `user` |

### 2.2 SQL 2 — 덕력·팬덤·기억저장소 (24 테이블)

| 영역 | 테이블 |
| --- | --- |
| **DUK** (덕력) | `fan_power_season`, `fan_power_season_translation`, `fan_power_season_reward`, `fan_power_season_reward_translation`, `fan_power_season_ranking`, `fan_power_season_ranking_reload`, `fan_power_limit`, `user_fan_power`, `user_fan_power_season`, `user_fan_power_history` |
| **EVT** (팬덤 레벨) | `fandom_level_season`, `fandom_level_policy`, `fandom_level`, `fandom_level_reward`, `fandom_level_reward_translation`, `fandom_level_up_job`, `fandom_level_reward_job`, `user_fandom_level_reward` |
| **MEM** (기억저장소) | `user_artist_memory`, `user_artist_memory_media`, `user_artist_memory_emoji`, `artist_memory_emoji`, `artist_memory_emoji_translation`, `artist_memory_report` |
| **공통/뱃지** | `badge`, `badge_translation`, `user_badge`, `artist_group`, `user` |

### 2.3 SQL 3 — 챌린지·일일미션·아티스트 (22 테이블)

| 영역 | 테이블 |
| --- | --- |
| **🆕 SQ** (스토리 퀘스트) ⭐ v1.2 영역 코드 확정 | `story_quest`, `story_quest_translation`, `story_quest_chapter`, `story_quest_chapter_translation`, `story_quest_chapter_mission`, `user_story_quest_chapter`, `user_story_quest_chapter_mission` (테이블명 `_chapter` 유지, 운영 노출 텍스트만 "에피소드"로 통일) |
| **FQ-501** (일일미션) | `daily_mission`, `daily_mission_translation`, `user_daily_mission`, `daily_mission_group_reward`, `user_daily_mission_group_reward`, `daily_mission_streak_reward`, `user_daily_mission_streak_reward`, `user_daily_mission_streak_count` |
| **BIVE** (민팅 이벤트) | `minting_event`, `minting_event_goods` |
| **ART** (아티스트) | `artist_group`, `artist_group_goods`, `user_favorite_artist`, `user_artist_group_notification` |
| **FQ** (Fan Quest) | `fan_quest` |
| **게임존** (Trivia) | `trivia` |
| **COL** (굿즈) | `user_goods_history` |
| **공통** | `user` |

---

## 3. 🆕 신규 영역 — `story_quest` (스토리 퀘스트, SQ) ⭐ v1.2 정정

### 3.1 구조 분석

스토리 퀘스트는 **시리즈형 콘텐츠** — 하나의 큰 줄거리 안에 여러 **에피소드**(ERD 테이블 `story_quest_chapter`), 에피소드마다 미션이 구성되는 구조.

> **용어 통일** ⭐ v1.2: 운영 노출 텍스트 "에피소드"(테이블명 `_chapter` 유지). [CEB-BO-100] v1.7 결정사항 ⑫.

```text
story_quest (1)
   └─ story_quest_chapter (N≤5) — 에피소드, 순서대로 진행
         └─ story_quest_chapter_mission (M≤10) — 에피소드 안의 개별 미션
               ↓ 회원 진행
         user_story_quest_chapter_mission (회원 × 미션)
   └─ user_story_quest_chapter (회원 × 에피소드, 잠금/활성/완료 상태)
```

### 3.2 핵심 필드 ⭐ v1.2 정정 (image_url + bive_reward_yn 신규)

| 테이블 | 핵심 필드 | 의미 |
| --- | --- | --- |
| `story_quest` | `story_quest_status` (DRAFT/ACTIVE/CLOSED), `open_dt`, `close_dt`, **`artist_group_id NOT NULL`** ⭐ 추가 요청 ([CEB-BO-100-C] §2.2) | 스토리 퀘스트 마스터 — 아티스트별 |
| `story_quest_chapter` | `story_quest_chapter_order`, `story_quest_chapter_type` (FAN_QUEST/PREDICTION_MARKET/SURVIVAL_TRIVIA), **`image_url varchar(500) NULL`** ⭐ 추가 요청 (에피소드 메인 이미지), `reward_entry_ticket`, `reward_fan_point`, **`bive_reward_yn boolean DEFAULT false`** ⭐ 추가 요청 (BIVE 보상 on/off), `minting_event_id`(NULL 허용 변경 요청), `repeat_yn` | 에피소드 — 보상은 응모권·덕력·BIVE 민팅 |
| `story_quest_chapter_mission` | `source_type` (FAN_QUEST/PM/ST), `source_id`, `completed_type` (ADMIN_APPROVAL/PM_PARTICIPATION/PM_CORRECT/TRIVIA_PARTICIPATION/TRIVIA_CORRECT_COUNT), `completed_value`, `repeat_cycle` (MONTHLY/WEEKLY) | 미션 완료 조건 |
| `user_story_quest_chapter_mission` | `story_quest_chapter_mission_status` (INCOMPLETE/SUBMITTED/APPROVED/REJECTED), `progress_round_key` (MAIN, yyyy-MM, yyyy-Www) | 회원 진행 — 반복 주기별 라운드 키 |

### 3.3 수량 제약 ⭐ v1.2 신규

| 항목 | 제약 | 검증 위치 |
| --- | --- | --- |
| 스토리당 에피소드 수 | **최대 5** | 응용 레벨 (BO + APP) |
| 에피소드당 미션 수 | **최대 10** | 응용 레벨 (BO + APP) |
| DB 제약 | 별도 미적용 | 검증 SQL: [CEB-BO-100-C] §8.4 |

### 3.4 기존 가이드와의 관계

- **FQ (팬퀘스트)**: 에피소드 유형 `FAN_QUEST`로 연결. 단 스토리 퀘스트 자체는 별도 영역.
- **게임존 (PM/ST)**: 에피소드 유형 `PREDICTION_MARKET`, `SURVIVAL_TRIVIA`로 연결. 스토리 퀘스트가 게임존 콘텐츠를 미션으로 묶음.
- **BIVE (민팅)**: `bive_reward_yn=true` 시 `minting_event_id` FK — 에피소드 완료 보상으로 BIVE NFT 자동 민팅.
- **DUK (덕력)**: `reward_fan_point` — 에피소드 완료 시 덕력 보상.

### 3.5 권장 조치 — 합의 완료 (2026.05.08 + 05.09)

1. ✅ **신규 영역 가이드 작성** — [CEB-BO-011] v1.1 (에피소드 데이터 모델 포함) 작성 완료.
2. ✅ **[CEB-BO-100] 마스터 §1.2 14번째 영역 SQ 추가** — v1.5에서 완료, v1.7에서 SQ 정정.
3. ✅ **CLAUDE.md L69 영역 목록에 `SQ` 추가** — v2 메타 갱신 완료.
4. ✅ **멀티아티스트 정책 — 아티스트별 확정** — `story_quest.artist_group_id NOT NULL` 추가 요청 ([CEB-BO-100-C] §2.2).
5. ⭐ **v1.7 SQ 구조 정정 4건** — [CEB-BO-100-C] §2.3 (image_url + bive_reward_yn + minting_event_id NULL).

---

## 4. 멀티아티스트 외래키 검증

### 4.1 정합 ✅ — `artist_group_id` 보유 13 테이블

| 테이블 | FK | 비고 |
| --- | --- | --- |
| `support_event` | ✅ NOT NULL | 응원 이벤트 — 아티스트별 |
| `notice` | ✅ NOT NULL | 공지 — 아티스트별 |
| `info` | ✅ NOT NULL | 소식·일정 — 아티스트별 |
| `user_info_read` | ✅ | 회원 읽음 — 아티스트 컨텍스트 추적 |
| `fan_power_season` | ✅ NOT NULL | 덕력 시즌 — **🔴 시즌이 아티스트별** (정책 갭 #2) |
| `fandom_level_season` | ✅ NOT NULL | 팬덤 레벨 시즌 — **🔴 시즌제** (정책 갭 #3) |
| `user_fan_power` | ✅ NOT NULL | 회원 덕력 — 아티스트별 누적 |
| `user_artist_memory` | ✅ NOT NULL | 기억 — 아티스트 단위 |
| `artist_memory_emoji` | ✅ NOT NULL | 이모지 마스터 — 아티스트별 |
| `fan_power_limit` | ✅ NOT NULL | 덕력 한도 — 아티스트별 |
| `badge` | ✅ NOT NULL | 뱃지 — 아티스트별 |
| `user_favorite_artist` | ✅ NOT NULL | 최애 아티스트 |
| `user_artist_group_notification` | ✅ NOT NULL | 알림 설정 — 아티스트별 |

### 4.2 검토 필요 ⚠️ (v1.2 합의 결과 반영)

| 테이블 | 현황 | 합의/조치 |
| --- | --- | --- |
| `event_banner` | ❌ `artist_group_id` 없음 — `source_type`(`RAFFLE`/`SUPPORT_EVENT`)로 간접 연결 | ⚠️ 미합의 — 아티스트별 배너 직접 FK 추가 또는 nullable FK 추가 검토. [CEB-BO-100-C] §4.1 source_type ENUM 확장과 묶어 차기 합의 |
| `story_quest` | ❌ `artist_group_id` 없음 | ✅ **합의 완료** — 아티스트별 확정 (NOT NULL 추가 요청). [CEB-BO-100-C] §2.2 |
| `daily_mission` | ❌ `artist_group_id` 없음 | ⚠️ 미합의 — 가이드 [CEB-BO-FQ-501]은 전역으로 정의. ERD 정합 (전역 유지 가정) |
| `minting_event` | ❌ `artist_group_id` 없음 | ⚠️ 미합의 — BIVE 토큰 자체에 아티스트 연결 추정 (BIVE 영역 SQL 확인 필요) |
| `fan_quest` | ❌ FK 누락 (단순 테이블만 정의) | ⚠️ SQL 3에서 단순 정의 — Fan Quest 영역 SQL 추가 자료 요청 |

---

## 5. 메타필드 검증

### 5.1 가이드에서 정의한 메타필드 8종

| 메타필드 | 정의 위치 | ERD 검증 |
| --- | --- | --- |
| `discoveryContext` (회원 정지 발견 아티스트) | [CEB-BO-USR-501] §4.7 | ❌ ERD에 `member_sanction` 테이블 없음 — **추가 SQL 요청** |
| `discoveredFeature` | [CEB-BO-USR-501] §4.7 | ❌ 동일 |
| `artistContext` (관리자 활동 로그) | [CEB-BO-SYS-601] §3.2 | ❌ `admin_activity_log` 테이블 없음 — **추가 SQL 요청** |
| `sourceFeature` (응모권 출처 6종) | [CEB-BO-010] §5.1 | ❌ `rft_ledger` 테이블 없음 — **추가 SQL 요청** |
| `sourceArtistContext` | [CEB-BO-010] §5.1 | ⚠️ `user_fan_power_history.source_type` 패턴 부분 정합 (덕력 출처 메타) |
| `sourceRefId` / `sourceRefType` | [CEB-BO-010] §5.1 | ⚠️ `user_fan_power_history.source_id` 부분 정합 |

### 5.2 부분 정합 사례 — `user_fan_power_history`

```sql
history_type ENUM('EARN', 'USE')
source_type ENUM(...)  -- 퀘스트, 일일미션, 바이브활동, 프리딕션 참여, 트리비아 참여, 랭킹보상, 응원하기 참여
source_id INT
```

→ 우리 가이드 패턴(`sourceFeature` + `sourceRefId`)과 **유사 구조**. 명명만 정렬하면 정합.

---

## 6. 가이드-ERD 갭 13건 ⭐ v1.2 확장

### 6.1 🔴 Critical (3건 — 모두 합의 완료)

| # | 항목 | 가이드 정책 | ERD 실제 | 합의 결과 |
| --- | --- | --- | --- | --- |
| 1 | "챌린지" 신규 영역 | 미정의 | `story_quest_*` 7테이블 | ✅ **합의 완료** — 영역 코드 = `SQ`, [CEB-BO-011] v1.1 작성. §9.3 |
| 2 | 덕력 시즌 분리 | [CEB-BO-100] §3 "글로벌 시즌 + 아티스트별 랭킹" | `fan_power_season.artist_group_id` NOT NULL — 시즌 자체가 아티스트별 | ✅ **합의 완료** — 글로벌 시즌 유지, ERD `artist_group_id` NULL/제거 요청. §9.1 |
| 3 | 팬덤 레벨 시즌제 | APP [CEB-EVT-201] "영구 누적" | `fandom_level_season` 시즌제 + FK | ✅ **합의 완료** — 시즌별 리셋 채택 (연 1회 1.1~12.31), APP 갱신 필요. §9.2 |

### 6.2 🟠 High (3건)

| # | 항목 | 가이드 | ERD | 조치 |
| --- | --- | --- | --- | --- |
| 4 | 공지 vs 소식 분리 | [CEB-BO-INF] 통합 | `notice` + `info` 별도 | ⚠️ 미합의 — INF 가이드 갱신 또는 ERD 통합 |
| 5 | 배너 source_type | 다양 | 2종(RAFFLE/SUPPORT_EVENT) | ⚠️ 미합의 — [CEB-BO-100-C] §4.1 ENUM 확장 제안 |
| 6 | 메타필드 부재 | 8종 정의 | 5개 영역 ERD 누락 | ⚠️ 추가 SQL 요청 ([CEB-BO-100-C] §3) |

### 6.3 🟡 Info (6건)

| # | 항목 | 비고 |
| --- | --- | --- |
| 7 | `support_event_status` 7단계 | 가이드와 매핑 검증 |
| 8 | `info.exclusive_yn` 단독 콘텐츠 | INF·EVT 독점 콘텐츠 연결 정책 확인 |
| 9 | `daily_mission.event_code` varchar(50) | enum 표준화 검토 ([CEB-BO-100-C] §4.2) |
| 10 | `minting_event.action_type` 5종 | BIVE 가이드와 연결 |
| 11 | `user_goods_history.acquire_type` 11종 | COL 가이드 갱신 |
| 12 | `fandom_level_reward.reward_type` 5종 + `distribution_type ALL/LOTTERY` | EVT-201 가이드 갱신 |

### 6.4 🔴 SQ 구조 정정 (4건) ⭐ v1.2 신규 — 모두 합의 완료

| # | 항목 | 가이드 정책 | ERD 실제 | 합의 결과 |
| --- | --- | --- | --- | --- |
| 13.a | 운영 용어 통일 | "챕터" → "에피소드" | 테이블명 `story_quest_chapter` 유지 | ✅ 운영 노출 텍스트만 "에피소드" ([CEB-BO-100] v1.7) |
| 13.b | 수량 제약 | 스토리당 5 / 에피소드당 10 | DB 제약 미정의 | ✅ 응용 레벨 검증 ([CEB-BO-100-C] §8.4 검증 SQL) |
| 13.c | 에피소드 메인 이미지 | 신규 추가 | 컬럼 부재 | ✅ `image_url varchar(500) NULL` 추가 요청 ([CEB-BO-100-C] §2.3) |
| 13.d | BIVE 보상 on/off 토글 | 신규 추가 | `minting_event_id NOT NULL DEFAULT auto_increment`(오류) | ✅ `bive_reward_yn boolean DEFAULT false` 신규 + `minting_event_id NULL` 허용 ([CEB-BO-100-C] §2.3) |

---

## 7. 다국어 패턴 검증 ✅

ERD에 다음 17개 `*_translation` 테이블 발견 — 가이드 다국어 정책과 정합:

`info_translation`, `notice_translation`, `support_event_translation`, `event_banner_translation`, `info_link_translation`, `fan_power_season_translation`, `fan_power_season_reward_translation`, `fandom_level_reward_translation`, `badge_translation`, `artist_memory_emoji_translation`, `daily_mission_translation`, `story_quest_translation`, `story_quest_chapter_translation`

**공통 패턴**:

```sql
id, {parent}_id, lang_code VARCHAR(10), title VARCHAR(...), description TEXT
```

→ KO/EN/JP 3언어 분리, [CEB-BO-000] §5 다국어 정책 정합 ✅.

> **사소한 점**: `lang_code` DEFAULT가 일부 테이블은 `'en'`이고 일부는 NULL. 표준 권장: `'ko'` 폴백 정책 적용 위해 KO를 기본값으로.

---

## 8. 정합성 확인 항목 (8건 추가 검증)

| 항목 | 가이드 | ERD | 평가 |
| --- | --- | --- | --- |
| 응원 이벤트 7단계 상태 | 미상세 | DRAFT/ACTIVE/ACHIEVED/EXECUTING/COMPLETED/NOT_ACHIEVED/CANCELLED | ✅ 잘 설계됨 |
| 덕력 한도 정책 | 일·주·월간 한도 | `fan_power_limit.daily_limit/weekly_limit/monthly_limit` | ✅ 정합 |
| 일일미션 스트릭 | 보상 지급 | `daily_mission_streak_reward` + `user_daily_mission_streak_count` | ✅ 정합 |
| 일일미션 그룹 보상 | 미상세 | `daily_mission_group_reward.required_mission_count` | 운영 룰 확인 (3개 완료 시 N 포인트 등) |
| 덕력 시즌 랭킹 reload | 미명시 | `fan_power_season_ranking_reload` (Redis 키, 재실행) | 운영 도구 — 가이드 추가 권장 |
| 보상 작업 상태 추적 | 미명시 | `fandom_level_up_job` + `fandom_level_reward_job` (READY/PROCESSING/COMPLETED/FAILED) | 비동기 작업 큐 — 운영 모니터링 화면 필요 |
| 추첨 당첨자 처리 | 미상세 | `fandom_level_reward_job.lottery_status NONE/READY/COMPLETED` | 추첨 워크플로우 가이드 추가 권장 |
| 기억저장소 신고 | 정의 ([CEB-BO-MEM]) | `artist_memory_report` 5종 신고 유형(INAPPROPRIATE/SPAM/HATE_SPEECH/PRIVACY/OTHER) | ✅ 정합 |

---

## 9. ✅ 합의 완료 결정사항 (2026.05.08~05.09)

v1.1에서 4건 합의 완료 (2026.05.08), v1.2에서 5번째 SQ 구조 정정 추가 합의 (2026.05.09):

### 9.1 덕력 시즌 모델 — **글로벌 시즌 유지**

- **결정**: 글로벌 시즌 1개로 모든 아티스트 동시 시작·종료. 랭킹만 아티스트별 분리 산출.
- **근거**: APP [CEB-DUK-101] "통합 누적" 정책과 정합 + 운영 단순성.
- **개발팀 ERD 수정 요청**: `fan_power_season.artist_group_id`를 **NULL 허용** 또는 제거.
- **가이드 영향**: [CEB-BO-100] §3 표현 명확화 ("글로벌 시즌 마스터 + 아티스트별 독립 랭킹 산출").
- **APP 영향**: 변경 없음 (현재 정책 유지).

### 9.2 팬덤 레벨 시즌제 — **시즌별 리셋 (ERD 따르기)**

- **결정**: 시즌 종료 시 회원 팬덤 레벨도 리셋. ERD `fandom_level_season` 구조 그대로 채택.
- **근거**: ERD가 이미 시즌제 구조로 설계됨 (`fandom_level.fandom_level_season_id` FK + 시즌별 보상 작업 큐).
- **개발팀 ERD**: 현재 그대로 유지. 변경 없음.
- **가이드 영향**: [CEB-BO-EVT-201] 또는 [CEB-BO-EVT-101]에 시즌별 리셋 정책 명시. [CEB-BO-100] §3 갱신.
- **APP 영향**: ⚠️ **APP [CEB-EVT-201] "영구 누적" 정책을 "시즌별 리셋"으로 갱신 필요**.

### 9.3 챌린지 영역 코드 — **SQ (Story Quest)**

- **결정**: 영역 코드 = `SQ`. 가이드 ID 패턴 = `[CEB-BO-SQ-*]`.
- **근거**: ERD 테이블명 `story_quest`와 일치 → 의미 명확. 운영 용어 "챌린지"는 별칭으로 유지.
- **신규 영역 가이드 작성**: `[CEB-BO-011] 스토리 퀘스트(SQ) 영역 가이드` + 화면 가이드.
- **메타 갱신 필요**: [CEB-BO-000] §1.2 13개 → 14개 영역, [CEB-BO-001] §2 14개, CLAUDE.md L69 영역 목록.

### 9.4 SQ 멀티아티스트 정책 — **아티스트별 스토리 퀘스트**

- **결정**: 스토리 퀘스트 자체가 아티스트별. V01D 스토리·iKON 스토리 따로 운영.
- **근거**: 팬덤 몰입감 + 아티스트별 독립 콘텐츠 제작 자유도.
- **개발팀 ERD 수정 요청**: `story_quest.artist_group_id INT UNSIGNED NOT NULL` 추가.
- **가이드 정책 등급**: 🔴 Critical (헤더 토글 + 페이지 필터 모두 적용, EXTERNAL_ARTIST 자기 아티스트만 R/W).
- **[CEB-BO-100] §3 정책 매트릭스에 SQ 행 신규 추가** 필요.

### 9.5 SQ 구조 정정 — **에피소드 + 수량 제약 + 메인 이미지 + BIVE 보상 토글** ⭐ v1.2 신규

- **결정** (2026.05.09):
  - 운영 용어 "챕터" → **"에피소드"** 통일 (테이블명 `story_quest_chapter` 유지)
  - 수량 제약: 스토리당 최대 5 에피소드 / 에피소드당 최대 10 미션 (응용 레벨)
  - 에피소드 메인 이미지 등록 가능
  - 에피소드별 BIVE 보상 on/off 토글
- **근거**: 운영팀 콘텐츠 기획·BO UX 정합성. 1~5장 시리즈 형식이 K-pop 팬덤 콘텐츠 일반 패턴.
- **개발팀 ERD 수정 요청**: [CEB-BO-100-C] §2.3 — `story_quest_chapter` ALTER 3건
  - `ADD COLUMN image_url varchar(500) NULL`
  - `ADD COLUMN bive_reward_yn boolean NOT NULL DEFAULT false`
  - `MODIFY COLUMN minting_event_id int unsigned NULL` (기존 `NOT NULL DEFAULT auto_increment` 오류 정정)
- **가이드 영향**: [CEB-BO-011] v1.1 (에피소드 데이터 모델), [CEB-BO-SQ-202·202-CREATE] v1.1, [CEB-BO-100] v1.7 §3 SQ 행.
- **prototype 영향**: `mock/sq.ts` v1.1 + `/sq/[id]` 화면 v1.1 적용 완료.

### 9.6 합의 결과 요약 표 ⭐ v1.2 — 5건으로 확장

| # | 의제 | 결정 | 영향 — ERD | 영향 — 가이드 | 영향 — APP |
| --- | --- | --- | --- | --- | --- |
| 1 | 덕력 시즌 | 글로벌 시즌 | `fan_power_season.artist_group_id` NULL 허용/제거 | [CEB-BO-100] §3 표현 명확화 | 변경 없음 |
| 2 | 팬덤 레벨 | 시즌별 리셋 (연 1회 1.1~12.31) | 변경 없음 | [CEB-BO-EVT-101] v1.3 + [CEB-BO-100] v1.6 갱신 완료 | **[CEB-EVT-201] "영구 누적" → "시즌별 리셋" 갱신 필요** |
| 3 | 챌린지 영역 코드 | SQ | 변경 없음 | 신규 [CEB-BO-011] v1.1 + 메타 14영역 확장 완료 | APP에 신규 SQ 가이드 작성 (별도 트랙) |
| 4 | SQ 멀티아티스트 | 아티스트별 | `story_quest.artist_group_id NOT NULL` 추가 | [CEB-BO-100] v1.5 §3 SQ 행 추가 (🔴 Critical) 완료 | APP SQ 가이드에 아티스트별 정책 반영 |
| 5 | **SQ 구조 정정** ⭐ v1.2 | 에피소드 용어 + 수량 5/10 + 메인 이미지 + BIVE 보상 on/off | `story_quest_chapter` ALTER 3건 ([CEB-BO-100-C] §2.3) | [CEB-BO-011] v1.1 + [CEB-BO-100] v1.7 + SQ 화면 가이드 4건 완료 | APP SQ 가이드에 에피소드 용어·수량·이미지·BIVE 토글 반영 (별도 트랙) |

---

## 10. 추가 자료 요청 (5종 SQL) — 상태 트래킹

본 SQL 3종에 누락된 다음 5개 영역의 ERD/SQL 추가 제공 요청. v1.2부터 회신 상태 트래킹.

| # | 영역 | 가이드 | 핵심 테이블 추정 | 회신 상태 |
| --- | --- | --- | --- | --- |
| 1 | 회원 제재·정지사유 | [CEB-BO-USR-501] | `member_sanction`, `suspension_reason` | ⏳ 대기 ([CEB-BO-100-C] §3.1 요청) |
| 2 | 반려사유 마스터 (FQ) | [CEB-BO-FQ-502] | `rejection_reason` (`artist_group_id` FK 필수) | ⏳ 대기 ([CEB-BO-100-C] §3.2) |
| 3 | 관리자 활동 로그 컨텍스트 | [CEB-BO-SYS-601] | `admin_activity_log` (`artist_context` 컬럼 필수) | ⏳ 대기 ([CEB-BO-100-C] §3.3) |
| 4 | 응모권 변동 로그 | [CEB-BO-RFT-201] | `raffle_ticket`, `rft_ledger` (`source_artist_context` 메타) | ⏳ 대기 ([CEB-BO-100-C] §3.4) |
| 5 | 권한 스코프 | [CEB-BO-SYS-501] | `admin_role`, `admin_role_assignment` (`scope_artist_ids` 메타) | ⏳ 대기 ([CEB-BO-100-C] §3.5) |

추가 자료 받으면 본 리포트 v1.3으로 갱신하여 정합성 검증 완성.

---

## 11. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
| --- | --- | --- | --- |
| v1.0 | 2026.05.08 | @Nill Yoo | 최초 작성. 개발팀 SQL DDL 3종(62 테이블) 검토 결과. 영역별 매핑(13 영역 + 신규 CHL) + 멀티아티스트 FK 검증 (정합 13건/검토 5건) + 메타필드 8종 검증 + 가이드-ERD 갭 12건 (🔴 3 / 🟠 3 / 🟡 6) + 다국어 패턴 정합 ✅ + 정합성 확인 8건 + 즉시 합의 3건 (덕력 시즌·팬덤 시즌·챌린지 영역 코드) + 추가 자료 요청 5종 (정지·반려·활동 로그·응모권·권한 스코프). 본 리포트는 운영팀·개발팀 검토용. 정정·신규 가이드 작성은 별도 트랙. |
| v1.1 | 2026.05.08 | @Nill Yoo | **§9 즉시 합의 4건 결정 완료** (Review → Decided). ① 덕력 시즌 = **글로벌 시즌 유지** (ERD `fan_power_season.artist_group_id` NULL/제거 요청) ② 팬덤 레벨 = **시즌별 리셋** (ERD 그대로, APP [CEB-EVT-201] 갱신 필요) ③ 챌린지 영역 코드 = **SQ (Story Quest)** — 가이드 ID `[CEB-BO-011]`·`[CEB-BO-SQ-*]` ④ SQ 멀티아티스트 = **아티스트별** (ERD `story_quest.artist_group_id NOT NULL` 추가 요청, 🔴 Critical 등급). §9.5 합의 결과 요약 표 신설. 후속 트랙 5종(A 보고서 갱신 / B 마스터 v1.5 / C 영역 가이드 / D SQ 신규 영역 + 14영역 확장 / E 개발팀 ERD 수정 요청서) 사용자 결정 후 진행. |
| **v1.2** | **2026.05.11** | **@Nill Yoo** | **SQ 구조 정정 합의 5번째 추가** ([CEB-BO-100] v1.7, [CEB-BO-011] v1.1, [CEB-BO-100-C] v1.2 §2.3). ① §2.3 SQ 영역 코드 "🆕 CHL" → "🆕 SQ" 확정 표기 ② §3 신규 영역 구조 갱신 — 에피소드 용어 통일 + 수량 제약(스토리당 5/에피소드당 10) + `image_url` + `bive_reward_yn` 컬럼 추가 요청 반영. §3.3 수량 제약 절·§3.5 권장 조치 합의 완료 표시 ③ §4.2 검토 필요 매트릭스 합의 결과 표시 (story_quest = 아티스트별 확정) ④ **§6 갭 12건 → 13건 확장** — §6.4 SQ 구조 정정 4건(13.a~13.d) 신규 추가 ⑤ §9 합의 4건 → 5건 — §9.5 SQ 구조 정정 신규 + §9.6 요약 표 5건으로 갱신 ⑥ §10 추가 자료 요청 5종 회신 상태 컬럼 추가 (모두 ⏳ 대기) ⑦ Page Properties 버전 v1.1 → v1.2. 본 v1.2는 트랙 G2 산출물. 운영팀·개발팀 SSOT 갱신본. |
