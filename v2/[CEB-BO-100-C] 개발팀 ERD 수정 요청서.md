# [CEB-BO-100-C] 개발팀 ERD 수정 요청서

## Page Properties

| Key | Value |
| ---- | ---- |
| Screen ID | CEB-BO-100-C |
| 기획담당자 | @Nill Yoo |
| 디자인담당자 | |
| 개발담당자 | |
| 기능영역(Epic) | 개발팀 ERD 수정 요청 — 합의 4건 반영용 DDL 변경 |
| 상태 | Action Required |
| 버전 | v1.2 |
| 최근 업데이트 | 2026.05.11 |
| 비고 | v1.2: §5 P0 순서 본문 순서와 정렬(§2.1→§2.2→§2.3) + §9 테스트 검증 시나리오 신설(ALTER 적용 후 기존 데이터 영향 점검 SQL 5건). v1.1: 스토리 퀘스트(SQ) 구조 정정 합의 추가 — `story_quest_chapter`에 `image_url`, `bive_reward_yn` 컬럼 추가 요청 (§2.3 신규). v1.0: 2026.05.08 합의 결정사항 4건([CEB-BO-100-B] §9, [CEB-BO-100] v1.5) 반영용 개발팀 작업 요청서. |

---

## 1. 작업 배경

2026.05.08~05.09 ERD 검토 합의 결과 **5건**:

1. 덕력 시즌 = **글로벌 시즌** 유지 (가이드 정책 그대로) — 2026.05.08
2. 팬덤 레벨 = **시즌별 리셋** (ERD 그대로 채택) — 2026.05.08
3. 챌린지 영역 코드 = **SQ (Story Quest)** + 영역 가이드 14번째로 신설 — 2026.05.08
4. SQ 멀티아티스트 = **아티스트별 스토리 퀘스트** (🔴 Critical) — 2026.05.08
5. **SQ 구조 정정** ⭐ v1.1 추가 — 운영 용어 "챕터→에피소드", 수량 제약(스토리당 5/에피소드당 10), 에피소드 메인 이미지·BIVE 보상 on/off 토글 — 2026.05.09

상세 근거: [CEB-BO-100-B] 개발팀 ERD 검토 리포트 v1.1 §9 + [CEB-BO-100] v1.7 §3 SQ 행.

본 요청서는 위 5건 합의를 반영하기 위한 **개발팀 작업 항목**을 정리한다.

---

## 2. 즉시 수정 요청 (2건, DDL 변경)

### 2.1 🔴 `fan_power_season.artist_group_id` NULL 허용/제거

**현재 ERD** (`Celebus_고도화_덕력_팬덤_기억저장소.sql`):

```sql
CREATE TABLE `fan_power_season` (
    `fan_power_season_id` int unsigned NOT NULL DEFAULT auto_increment COMMENT '덕력 시즌 ID',
    `artist_group_id` int unsigned NOT NULL COMMENT '아티스트 그룹 ID',  -- ⚠️ NOT NULL
    `name` varchar(100) NOT NULL COMMENT '시즌명',
    `start_dt` datetime NOT NULL COMMENT '시즌 시작일시',
    `end_dt` datetime NOT NULL COMMENT '시즌 종료일시',
    ...
);
```

**합의 결과**: 덕력 시즌 = **글로벌 시즌 마스터 + 아티스트별 독립 랭킹** ([CEB-BO-100] v1.5 §3, 결정사항 ⑨)

**권장 수정안** (택1):

#### 옵션 A — `artist_group_id` 컬럼 제거 (권장)

```sql
CREATE TABLE `fan_power_season` (
    `fan_power_season_id` int unsigned NOT NULL DEFAULT auto_increment COMMENT '덕력 시즌 ID',
    -- artist_group_id 제거
    `name` varchar(100) NOT NULL COMMENT '시즌명',
    `start_dt` datetime NOT NULL COMMENT '시즌 시작일시',
    `end_dt` datetime NOT NULL COMMENT '시즌 종료일시',
    ...
);
```

랭킹은 `fan_power_season_ranking.user_id` + `user_fan_power.artist_group_id` 조인으로 산출.

#### 옵션 B — NULL 허용으로 변경

```sql
ALTER TABLE `fan_power_season`
  MODIFY COLUMN `artist_group_id` int unsigned NULL COMMENT '아티스트 그룹 ID (NULL=글로벌 시즌)';
```

`NULL`이면 글로벌 시즌, 값 있으면 아티스트별 시즌(향후 확장 옵션).

**관련 영향**:
- `user_fan_power_season.fan_power_season_id` FK는 유지.
- `user_fan_power.artist_group_id`는 그대로 유지 (아티스트별 누적·랭킹 기준).
- `fan_power_season_ranking` 쿼리는 `JOIN user_fan_power ON artist_group_id` 추가.

---

### 2.2 🔴 `story_quest.artist_group_id NOT NULL` 추가

**현재 ERD** (`Celebus_고도화_챌린지_일일미션_아티스트.sql`):

```sql
CREATE TABLE `story_quest` (
    `id` int unsigned NOT NULL DEFAULT auto_increment COMMENT '스토리 퀘스트 ID',
    `story_quest_status` enum(DRAFT, ACTIVE, CLOSED) NULL COMMENT '상태',
    `open_dt` datetime NULL COMMENT '스토리 퀘스트 공개일시',
    `close_dt` datetime NULL COMMENT '스토리 퀘스트 종료일시',
    -- ⚠️ artist_group_id 누락
    ...
);
```

**합의 결과**: SQ = **아티스트별** (🔴 Critical, [CEB-BO-100] v1.5 §3 결정사항 ⑫)

**권장 수정**:

```sql
ALTER TABLE `story_quest`
  ADD COLUMN `artist_group_id` int unsigned NOT NULL COMMENT '아티스트 그룹 ID' AFTER `id`,
  ADD CONSTRAINT `FK_artist_group_TO_story_quest`
    FOREIGN KEY (`artist_group_id`) REFERENCES `artist_group`(`id`);
```

**관련 정책**:
- 스토리 퀘스트 자체는 아티스트별 (V01D 스토리·iKON 스토리 별도).
- 챕터 `story_quest_chapter.story_quest_chapter_type`이 `FAN_QUEST`면 챕터 미션도 아티스트별. `PREDICTION_MARKET`/`SURVIVAL_TRIVIA`는 게임존 글로벌 콘텐츠와 연결.
- EXTERNAL_ARTIST 권한자는 자기 아티스트 SQ만 R/W.

---

### 2.3 🔴 `story_quest_chapter`에 `image_url`·`bive_reward_yn` 컬럼 추가 ⭐ v1.1 신규

**현재 ERD** (`Celebus_고도화_챌린지_일일미션_아티스트.sql` 라인 41~49):

```sql
CREATE TABLE `story_quest_chapter` (
    `id` int unsigned NOT NULL DEFAULT auto_increment COMMENT '스토리 퀘스트 챕터 ID',
    `story_quest_chapter_order` tinyint unsigned NOT NULL,
    `story_quest_chapter_type` enum(FAN_QUEST, PREDICTION_MARKET, SURVIVAL_TRIVIA) NULL,
    `story_quest_id` int unsigned NOT NULL DEFAULT auto_increment,
    `reward_entry_ticket` int unsigned NULL,
    `reward_fan_point` int unsigned NULL,
    `repeat_yn` VARCHAR(255) NULL,
    `minting_event_id` int unsigned NOT NULL DEFAULT auto_increment
);
```

**합의 결과** (2026.05.09 추가 합의 — [CEB-BO-100] v1.7 §3 SQ 행, [CEB-BO-011] v1.1 §4.2):

| 의제 | 결정 |
| --- | --- |
| 운영 용어 | "챕터" → **"에피소드"** 통일 (테이블명 `story_quest_chapter` 유지, 운영 노출 텍스트만 변경) |
| 수량 제약 | 스토리당 최대 5 에피소드, 에피소드당 최대 10 미션 (응용 레벨 검증, DB 제약 X) |
| 에피소드 메인 이미지 | **신규 추가** |
| BIVE 보상 on/off 토글 | **신규 추가** |

**권장 수정** (ALTER 2건):

```sql
ALTER TABLE `story_quest_chapter`
  ADD COLUMN `image_url` varchar(500) NULL COMMENT '에피소드 메인 이미지 URL (16:9 권장, ≤5MB)' AFTER `story_quest_chapter_type`,
  ADD COLUMN `bive_reward_yn` boolean NOT NULL DEFAULT false COMMENT 'BIVE 보상 활성 여부 (ON 시 minting_event_id 필수)' AFTER `reward_fan_point`,
  MODIFY COLUMN `minting_event_id` int unsigned NULL COMMENT 'BIVE 민팅 이벤트 ID (bive_reward_yn=true 시 필수, false 시 NULL)';
```

**관련 정책**:

- `image_url`: 16:9 비율 권장 (가로 ≥1280px). PNG·JPG·WebP·GIF. 최대 5MB. 파일 업로드 후 CDN URL 저장.
- `bive_reward_yn`: 기본 `false`. BO에서 운영자가 토글 (ON/OFF). ON 시 `minting_event_id` 필수 (응용 레벨 검증).
- `minting_event_id`: 기존 `NOT NULL DEFAULT auto_increment` → **NULL 허용**으로 변경 (보상 OFF 케이스 대응). FK는 `minting_event(id)`.
- 부가 정정: `repeat_yn`은 `VARCHAR(255)` → `boolean DEFAULT false`로 정정 권장 (별도 의제).

**관련 가이드**:

- [CEB-BO-011] v1.1 §4.2 에피소드 데이터 모델
- [CEB-BO-SQ-202] v1.1 §3 4섹션 (메인 이미지 + BIVE 보상 토글)
- [CEB-BO-SQ-202-CREATE] v1.1 §4.1·4.2 입력 폼

---

## 3. 추가 SQL 제공 요청 (5건)

본 검토에 누락된 5개 영역 ERD/SQL **추가 제공 요청**.

### 3.1 회원 제재·정지사유 영역 (USR)

| 테이블 | 핵심 컬럼 | 가이드 |
| --- | --- | --- |
| `member_sanction` (또는 유사) | `member_id`, `suspension_reason_code`, `suspension_level`, `discovery_context` (NULL 가능, 발견 아티스트 ID), `discovered_feature` (FANQUEST/RAFFLE/MEM/INF_COMMENT/SUPPORT/OTHER), `applied_admin_id`, `applied_dt`, `expire_dt` | [CEB-BO-USR-501] v1.1 §4.7 |
| `suspension_reason` | `code` (영문 PK), `display_name_ko/en/jp`, `category` (INAPPR/POLICY/FRAUD/OTHER), `applicable_steps`, `active_yn` | 동일 |

**핵심 메타필드**: `discovery_context` — 회원 정지 처리 시점에 발견된 아티스트 활동 컨텍스트 메타.

### 3.2 반려사유 마스터 (FQ)

| 테이블 | 핵심 컬럼 |
| --- | --- |
| `rejection_reason` | `id`, **`artist_group_id` NOT NULL** (아티스트별 분리), `code`, `display_name_*`, `category`, `apply_to` (Quest 검수/Raffle 응모/추첨 후 회수), `active_yn` |

가이드: [CEB-BO-FQ-502] (아티스트별 분리, 신규 아티스트 추가 시 템플릿에서 복제).

### 3.3 관리자 활동 로그 (SYS)

| 테이블 | 핵심 컬럼 |
| --- | --- |
| `admin_activity_log` | `id`, `admin_id`, `area` (영역 코드), `category` (대분류·중분류·소분류), `message`, `ip`, **`artist_context` (NULL 가능)** ⭐ 메타필드, `created_at` |

가이드: [CEB-BO-SYS-601] §3.2.

### 3.4 응모권 변동 로그 (RFT)

| 테이블 | 핵심 컬럼 |
| --- | --- |
| `raffle_ticket` (회원 잔액) | `member_id`, `balance` |
| `rft_ledger` (변동 로그) | `id`, `member_id`, `delta` (+발급/-사용), `balance_after`, `source_feature` (enum: FANQUEST_REWARD/RAFFLE_ENTRY/GP_EXCHANGE/DAILY_MISSION/BIVE_BENEFIT/SUPPORT_REWARD), **`source_artist_context` (NULL 가능)** ⭐, `source_ref_id`, `source_ref_type`, `created_at` |

가이드: [CEB-BO-010] §5, [CEB-BO-RFT-201].

### 3.5 권한 스코프 (SYS)

| 테이블 | 핵심 컬럼 |
| --- | --- |
| `admin_role` | `id`, `name`, `permissions` (JSON 또는 영역×CRUD 매트릭스), **`scope_artist_ids` (JSON 배열, NULL=전역)** ⭐ |
| `admin_role_assignment` | `admin_id`, `role_id`, **`scope_artist_ids` (JSON, NULL=Role 디폴트 사용)** ⭐, `expires_at` |

가이드: [CEB-BO-SYS-501] §4.

---

## 4. 추가 정합성 갱신 사항 (선택)

### 4.1 `event_banner.source_type` ENUM 확장 (선택)

**현재**:

```sql
`source_type` enum('RAFFLE', 'SUPPORT_EVENT') NOT NULL
```

**권장 확장**:

```sql
`source_type` enum('RAFFLE', 'SUPPORT_EVENT', 'QUEST', 'BIVE_CAMPAIGN', 'INF_NEWS', 'PROMO') NOT NULL
```

홈 배너에서 Quest·BIVE 캠페인·소식·프로모션도 노출 가능.

### 4.2 `daily_mission.event_code` enum 표준화 (선택)

**현재**: `event_code varchar(50) NOT NULL` — 자유 입력.

**권장**: enum 6종으로 표준화 (`FAN_QUEST`, `RAFFLE`, `STREAM`, `SHARE`, `LOGIN`, `OTHER`).

### 4.3 `lang_code DEFAULT` 표준화 (선택)

일부 `*_translation` 테이블에서 `lang_code DEFAULT 'en'`이지만 권장은 `'ko'` 폴백 정책 일치를 위해 `DEFAULT 'ko'`.

---

## 5. 수정 우선순위·일정

| 우선순위 | 항목 | 예상 분량 | 차단 의존성 |
| --- | --- | --- | --- |
| 🔴 P0 | §2.1 `fan_power_season.artist_group_id` NULL/제거 | 작음 (ALTER 1건) | 마이그레이션 (기존 데이터 처리) |
| 🔴 P0 | §2.2 `story_quest.artist_group_id` 추가 | 작음 (ALTER 1건) | 없음 |
| 🔴 P0 | §2.3 `story_quest_chapter.image_url` + `bive_reward_yn` 추가 + `minting_event_id` NULL 허용 ⭐ v1.1 | 작음 (ALTER 3건) | 없음 |
| 🟠 P1 | §3.1 회원 제재 ERD/SQL 제공 | 중 (3-4 테이블) | 없음 |
| 🟠 P1 | §3.2 반려사유 마스터 ERD/SQL 제공 | 작음 (1 테이블) | 없음 |
| 🟠 P1 | §3.3 관리자 활동 로그 ERD/SQL 제공 | 작음 (1 테이블) | 없음 |
| 🟠 P1 | §3.4 응모권 변동 ERD/SQL 제공 | 중 (2-3 테이블) | 없음 |
| 🟡 P2 | §3.5 권한 스코프 ERD/SQL 제공 | 작음 (2 테이블) | 없음 |
| 🟡 P2 | §4.1 event_banner ENUM 확장 | 작음 | 없음 |
| 🟡 P2 | §4.2 daily_mission event_code 표준화 | 작음 | 없음 |
| 🟡 P2 | §4.3 lang_code DEFAULT 표준화 | 작음 | 없음 |

**총 작업량**: P0 2건 + P1 4건 + P2 4건 = **10건**.

---

## 6. 응답 형식 요청

개발팀 회신은 다음 형식으로 부탁드립니다.

| 항목 | 응답 |
| --- | --- |
| §2.1 fan_power_season | 옵션 A(제거) vs 옵션 B(NULL) 중 선택 + 마이그레이션 계획 |
| §2.2 story_quest | DDL 적용 일정 |
| §2.3 story_quest_chapter ⭐ v1.1 | image_url·bive_reward_yn·minting_event_id NULL 허용 적용 일정 + 기존 데이터 처리(`bive_reward_yn` 기본 false 적용) |
| §3.1~3.5 누락 ERD/SQL | 별도 SQL 파일 제공 또는 통합 ERD 갱신본 |
| §4.1~4.3 선택 사항 | 검토 후 적용 여부 회신 |

---

## 7. 연관 문서

| 문서 | 역할 |
| --- | --- |
| [CEB-BO-100] v1.7 | 멀티아티스트 운영 마스터 — 결정사항 ⑨~⑫ 정책 정의 + SQ v1.7 정정 |
| [CEB-BO-100-B] v1.1 | ERD 검토 리포트 — 합의 결과 §9 |
| [CEB-BO-011] v1.1 | SQ 영역 가이드 — §4.2 에피소드 데이터 모델 |
| [CEB-BO-USR-501] v1.1 | 회원 정지사유 — `discoveryContext` 메타 |
| [CEB-BO-FQ-502] | 반려사유 마스터 — 아티스트별 |
| [CEB-BO-SYS-601] | 활동 로그 — `artistContext` 메타 |
| [CEB-BO-SYS-501] | 권한 스코프 — `scopeArtistIds` |
| [CEB-BO-010] v1.2 | 응모권 영역 — `source_artist_context` 메타 |

---

## 8. 테스트 검증 시나리오 ⭐ v1.2 신규

개발팀이 §2 ALTER 적용 후 기존 데이터 영향을 점검하기 위한 SQL 5건. 운영 DB 적용 전 스테이징에서 실행 권장.

### 8.1 `fan_power_season` 영향 점검 (§2.1)

```sql
-- 기존 시즌 행 + 회원 시즌 연결 카운트
SELECT
  s.fan_power_season_id,
  s.name,
  s.artist_group_id AS legacy_artist_group_id,
  COUNT(DISTINCT u.user_id) AS member_count
FROM fan_power_season s
LEFT JOIN user_fan_power_season u ON u.fan_power_season_id = s.fan_power_season_id
GROUP BY s.fan_power_season_id;
```

옵션 A(컬럼 제거) 선택 시: 위 결과의 `legacy_artist_group_id`를 백업 후 DROP. 옵션 B(NULL 허용) 선택 시: 기존 행은 그대로 유지하고 신규 글로벌 시즌만 NULL로 입력.

### 8.2 `story_quest` 아티스트 매핑 검증 (§2.2)

```sql
-- artist_group_id ALTER 추가 전: 기존 story_quest 행이 0건인지 확인
SELECT COUNT(*) AS existing_rows FROM story_quest;

-- 0건이 아니면: 기존 행에 default artist_group_id 매핑 필요
-- 운영 합의: 기존 story_quest는 모두 V01D(artist_group_id=1)로 매핑
UPDATE story_quest SET artist_group_id = 1 WHERE artist_group_id IS NULL;  -- ALTER 적용 직후 1회 실행
```

ALTER `NOT NULL` 추가 전에 기존 행 매핑 또는 TRUNCATE 결정 필요.

### 8.3 `story_quest_chapter` 신규 컬럼 영향 점검 (§2.3)

```sql
-- 기존 챕터 행 + minting_event 연결 상태 확인
SELECT
  c.id,
  c.story_quest_id,
  c.story_quest_chapter_order AS episode_order,
  c.minting_event_id,
  CASE WHEN c.minting_event_id IS NULL OR c.minting_event_id = 0
    THEN 'OFF'
    ELSE 'ON'
  END AS bive_reward_inferred
FROM story_quest_chapter c
ORDER BY c.story_quest_id, c.story_quest_chapter_order;

-- ALTER 적용 직후 기존 데이터 백필
UPDATE story_quest_chapter
   SET bive_reward_yn = CASE WHEN minting_event_id IS NOT NULL AND minting_event_id > 0 THEN true ELSE false END,
       minting_event_id = CASE WHEN minting_event_id = 0 THEN NULL ELSE minting_event_id END
 WHERE 1=1;
```

### 8.4 수량 제약 응용 레벨 검증 (§2.3, 응용 코드 영역)

```sql
-- 스토리당 에피소드 ≤5 위반 행 탐지
SELECT story_quest_id, COUNT(*) AS episode_count
  FROM story_quest_chapter
 GROUP BY story_quest_id
HAVING COUNT(*) > 5;

-- 에피소드당 미션 ≤10 위반 행 탐지
SELECT story_quest_chapter_id, COUNT(*) AS mission_count
  FROM story_quest_chapter_mission
 GROUP BY story_quest_chapter_id
HAVING COUNT(*) > 10;
```

위반 행이 있으면 BO 응용 레벨에서 별도 정리 (운영팀과 협의 후 삭제 또는 분리).

### 8.5 `minting_event` 참조 무결성 검증 (§2.3 부수)

```sql
-- bive_reward_yn=true인데 minting_event_id가 무효한 행 탐지
SELECT c.id, c.story_quest_id, c.minting_event_id
  FROM story_quest_chapter c
  LEFT JOIN minting_event m ON m.id = c.minting_event_id
 WHERE c.bive_reward_yn = true
   AND (c.minting_event_id IS NULL OR m.id IS NULL);
```

응용 레벨 검증: BO에서 BIVE 보상 ON 토글 시 minting_event_id 필수 입력 (드롭다운).

---

## 9. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
| --- | --- | --- | --- |
| v1.0 | 2026.05.08 | @Nill Yoo | 최초 작성. [CEB-BO-100-B] v1.1 §9 합의 4건 반영용 개발팀 작업 요청서. P0 2건 (DDL 변경) + P1 4건 (누락 ERD 제공) + P2 4건 (선택 사항) = 총 10건. 개발팀 응답 형식 §6에 정의. |
| **v1.1** | **2026.05.09** | **@Nill Yoo** | **SQ 구조 정정 합의 추가** ([CEB-BO-100] v1.7, [CEB-BO-011] v1.1). ① §2.3 신설 — `story_quest_chapter`에 `image_url varchar(500) NULL`(에피소드 메인 이미지) + `bive_reward_yn boolean NOT NULL DEFAULT false`(BIVE 보상 토글) 컬럼 추가 ② `story_quest_chapter.minting_event_id`를 NOT NULL → **NULL 허용**으로 변경 (보상 OFF 케이스 대응) ③ P0 우선순위 3건으로 확장 (§2.1 + §2.2 + §2.3) ④ §6 응답 형식에 §2.3 항목 추가 ⑤ 운영 용어 "챕터→에피소드" 통일 명시 (테이블명 유지). 동기화: prototype `mock/sq.ts` v1.1 (`StoryEpisode` 인터페이스 + `imageUrl`/`biveRewardYn` 필드) 완료. |
| **v1.2** | **2026.05.11** | **@Nill Yoo** | **개발팀 전달 정리 4건**. ① §1 작업 배경 — 합의 4건 → **5건**(v1.1 SQ 구조 정정 추가)으로 표기 정합 ② §5 우선순위 표 P0 3건 순서를 본문 순서(§2.1→§2.2→§2.3)와 일치하도록 정렬 ③ **§8 테스트 검증 시나리오 신설** — ALTER 적용 후 기존 데이터 영향 점검 SQL 5건 (8.1 `fan_power_season` / 8.2 `story_quest` 매핑 / 8.3 `story_quest_chapter` 백필 / 8.4 수량 제약 위반 탐지 / 8.5 `minting_event` 무결성) ④ §7 연관 문서에 [CEB-BO-011] v1.1 추가, [CEB-BO-100] v1.5 → v1.7로 갱신. 본 v1.2는 개발팀 전달 직전 최종 정리본. |
