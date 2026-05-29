CREATE TABLE `daily_mission_group_reward` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '일일미션 완료 보상 ID',
	`required_mission_count`	tinyint unsigned	NULL	COMMENT '보상 지급 기준 완료 미션 수',
	`reward_fan_point`	tinyint unsigned	NULL	COMMENT '보상 덕력 포인트',
	`use_yn`	boolean	NULL	COMMENT '사용여부'
);

CREATE TABLE `user_favorite_artist` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 최애 아티스트 ID',
	`user_id`	int unsigned	NOT NULL	COMMENT '유저 ID',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID'
);

CREATE TABLE `user_daily_mission_streak_count` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT 'ID',
	`current_streak_count`	int unsigned	NULL,
	`max_streak_count`	int unsigned	NULL,
	`last_streak_date`	date	NULL,
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID'
);

CREATE TABLE `story_quest` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 ID',
	`story_quest_status`	enum(DRAFT, ACTIVE, CLOSED)	NULL	COMMENT '상태(DRAFT: 초안, ACTIVE: 활성화, CLOSED: 종료)',
	`open_dt`	datetime	NULL	COMMENT '스토리 퀘스트 공개일시',
	`close_dt`	datetime	NULL	COMMENT '스토리 퀘스트 종료일시',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT 'soft delete용',
	`active_yn`	boolean	NULL	DEFAULT true	COMMENT '백오피스 검색 여부'
);

CREATE TABLE `story_quest_chapter_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`story_quest_chapter_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 챕터 ID',
	`lang_code`	varchar(10)	NULL	COMMENT '언어코드',
	`title`	varchar(255)	NULL	COMMENT '제목',
	`description`	varchar(255)	NULL	COMMENT '내용'
);

CREATE TABLE `story_quest_chapter` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 챕터 ID',
	`story_quest_chapter_order`	tinyint unsigned	NOT NULL	COMMENT '챕터 순서',
	`story_quest_chapter_type`	enum(FAN_QUEST, PREDICTION_MARKET, SURVIVAL_TRIVIA)	NULL	COMMENT '챕터 유형',
	`story_quest_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 ID',
	`reward_entry_ticket`	int unsigned	NULL	COMMENT '보상 응모권',
	`reward_fan_point`	int unsigned	NULL	COMMENT '보상 덕력',
	`repeat_yn`	VARCHAR(255)	NULL	COMMENT '반복퀘스트 여부',
	`minting_event_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '민팅이벤트 ID'
);

CREATE TABLE `daily_mission_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`lang_code`	varchar(10)	NOT NULL	COMMENT '언어코드',
	`title`	varchar(255)	NOT NULL	COMMENT '미션 제목',
	`description`	varchar(255)	NOT NULL	COMMENT '미션 설명',
	`daily_mission_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '일일미션 ID'
);

CREATE TABLE `minting_event` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '민팅이벤트 ID',
	`action_type`	enum(SIGNUP_REWARD, ATTENDANCE_REWARD, RAFFLE_REWARD, FANQUEST_REWARD, STORY_QUEST_REWARD)	NOT NULL	COMMENT '연결기능타입',
	`reward_fan_point`	VARCHAR(255)	NULL
);

CREATE TABLE `daily_mission` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '일일미션 ID',
	`daily_mission_type`	enum('ATTENDANCE, ACTION, COUNT')	NOT NULL	COMMENT '미션유형(ATTENDANCE: 참여형, ACTION: 실행형, COUNT: 횟수형)',
	`event_code`	varchar(50)	NOT NULL	COMMENT '이벤트코드(FAN_QUSET, RAFFLE, ...)',
	`mission_count`	int unsigned	NULL	COMMENT '이벤트 완료 횟수 (유형이 COUNT일때만)',
	`reward_fan_point`	int unsigned	NULL	COMMENT '보상 수량',
	`streak_yn`	boolean	NOT NULL	DEFAULT false	COMMENT '스트릭 계산 여부 (초반엔 출석체크만 true 고정)',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용여부',
	`active_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '백오피스 조회 여부',
	`daily_mission_status`	enum(DRAFT, ACTIVE, CLOSED)	NOT NULL	DEFAULT DRAFT	COMMENT '미션의상태(DRAFT: 초안, ACTIVE: 활성화중, CLOSED: 종료)',
	`open_date`	date	NULL	COMMENT '오픈일자 (일단 추가)',
	`close_date`	date	NULL	COMMENT '종료일자(일단추가)',
	`icon_url`	varchar(255)	NULL	COMMENT '아이콘 URL'
);

CREATE TABLE `user_artist_group_notification` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 아티스트 그룹 알림설정 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT '알림설정'
);

CREATE TABLE `user` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID'
);

CREATE TABLE `user_daily_mission_streak_reward` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '연속보상 ID',
	`daily_mission_streak_reward_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '일일미션 연속 보상ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`reward_date`	date	NULL	COMMENT '보상받은 일자',
	`claimed_dt`	datetime	NULL	COMMENT '보상수령한 일시'
);

CREATE TABLE `minting_event_goods` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '민팅 이벤트 굿즈 ID',
	`minting_event_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '민팅이벤트 ID',
	`weight`	int unsigned	NULL	DEFAULT 1	COMMENT '가중치',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT '사용여부',
	`artist_group_goods_id`	int unsigned	NULL	COMMENT '아티스트 그룹 상품 ID'
);

CREATE TABLE `daily_mission_streak_reward` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT 'ID',
	`daily_streak_count`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '일일미션 연속참여 횟수',
	`streak_reward`	int unsigned	NULL	COMMENT '스트릭 리워드(덕력 포인트)',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT '사용여부'
);

CREATE TABLE `artist_group` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID',
	`recommend_yn`	boolean	NULL	DEFAULT false	COMMENT '추천여부',
	`recommend_order`	tinyint unsigned	NULL	COMMENT '추천순서'
);

CREATE TABLE `user_goods_history` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 상품 이력 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`acquire_type`	enum(PURCHASE, TRADE, EVENT, TICKET_REWARD, COLLECTION_REWARD, ADMIN, SEND, RECEIVE, DELETE, RAFFLE, FAN_QUEST, STORY_QUEST)	NULL	COMMENT '획득 유형(구매, 거래, 티켓 보상, 이벤트, 보상, 관리자지급 등)'
);

CREATE TABLE `story_quest_chapter_mission` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 챕터 미션 ID',
	`story_quest_chapter_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 챕터 ID',
	`source_type`	enum(FAN_QUEST, PREDICTION_MARKET, SURVIVAL_TRIVIA)	NULL	COMMENT '미션 유형',
	`source_id`	int unsigned	NULL	COMMENT '유형에 따라 연결해야하는 ID가 달라짐',
	`completed_type`	enum(ADMIN_APPROVAL, PREDICTION_MARKET_PARTICIPATION, PREDICTION_MARKET_CORRECT, TRIVIA_PARTICIPATION, TRIVIA_CORRECT_COUNT)	NULL	COMMENT 'ADMIN_APPROVAL: 관리자 승인, PREDICTION_MARKET_PARTICIPATION: 프리딕션 참가, PREDICTION_MARKET_CORRECT: 프리딕션 정답맞추기, TRIVIA_PARTICIPATION: 트리비아 참가, TRIVIA_CORRECT_COUNT: 트리비아 n문제 생존',
	`completed_value`	int unsigned	NULL	COMMENT '완료 조건 값',
	`repeat_cycle`	enum(MONTHLY, WEEKLY)	NULL	COMMENT '반복주기',
	`repeat_interval`	tinyint unsigned	NULL	COMMENT '반복간격',
	`open_dt`	datetime	NULL	COMMENT '오픈일시',
	`close_dt`	datetime	NULL	COMMENT '종료일시'
);

CREATE TABLE `user_daily_mission_group_reward` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저의 일일미션 완료보상 ID',
	`daily_mission_completion_reward_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '일일미션 완료 보상 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`reward_date`	date	NULL	COMMENT '보상 지급 기준일',
	`rewarded_dt`	datetime	NULL	COMMENT '보상 지급 일시'
);

CREATE TABLE `artist_group_goods` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 굿즈 ID',
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID',
	`thumbnail_url`	varchar(255)	NULL	COMMENT '썸네일 URL',
	`goods_type`	enum(IMAGE, VIDEO, SOUND)	NULL
);

CREATE TABLE `fan_quest` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬 퀘스트 ID',
	`repeat_participation_yn`	VARCHAR(255)	NULL	DEFAULT false	COMMENT '반복 참여 가능 여부'
);

CREATE TABLE `trivia` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '트리비아 ID',
	`trivia_status`	enum('DRAFT', 'PENDING_PUBLISH', 'ONGOING', 'ACTIVE', 'ENDED', 'FORCE_ENDED', 'FORCE_REFUNDED')	NOT NULL	COMMENT '트리비아 상태',
	`max_participants`	int unsigned	NULL	COMMENT '최대 모집인원',
	`max_prize`	decimal(38, 8)	NULL	COMMENT '최대 상금풀',
	`multiple`	decimal(38, 8)	NULL	COMMENT '배수',
	`entry_gp`	decimal(38, 8)	NULL	COMMENT '참여비(상금풀 / 모집인원 *배수)',
	`reward_type`	enum('TIER', 'RATIO')	NULL	COMMENT '보상 유형 (단계, 비율)',
	`entry_ticket_amount`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '탈락자 응모권 지급 수량',
	`open_dt`	datetime	NULL	COMMENT '입장 가능 일시',
	`start_dt`	datetime	NULL	COMMENT '시작일시',
	`apply_prize`	decimal(38, 8)	NULL	COMMENT '적용 상금풀',
	`result_status`	enum('READY', 'NORMAL_ENDED', 'FORCE_ENDED', 'FORCE_REFUNDED')	NOT NULL	DEFAULT 'READY'	COMMENT '결과 상태 (정상종료, 강제종료)',
	`limit_sec`	int unsigned	NULL	COMMENT '문제 제한시간',
	`answer_sec`	int unsigned	NULL	COMMENT '정답 노출 시간',
	`end_dt`	datetime	NULL	COMMENT '종료 예정 일시',
	`actual_end_dt`	datetime	NULL	COMMENT '실제 종료일시',
	`force_end_admin_id`	int unsigned	NULL	COMMENT '강제 종료 관리자 ID',
	`force_refund_admin_id`	int unsigned	NULL	COMMENT '강제 환불 관리자 ID',
	`settled_dt`	datetime	NULL	COMMENT '정산완료 일시',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용여부',
	`publish_dt`	datetime	NULL	COMMENT '게시일시',
	`banner_image_url`	varchar(500)	NULL	COMMENT '배너 이미지 url',
	`detail_image_url`	varchar(500)	NULL	COMMENT '상세 이미지 url'
);

CREATE TABLE `user_daily_mission` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '진행도 ID',
	`mission_date`	date	NOT NULL	COMMENT '미션진행일',
	`mission_count`	int unsigned	NULL	COMMENT '진행 횟수',
	`completed_yn`	boolean	NULL	DEFAULT false	COMMENT '미션상태',
	`completed_dt`	datetime	NULL	COMMENT '미션완료 시각',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용여부',
	`active_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '백오피스 조회 여부',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`daily_mission_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '일일미션 ID'
);

CREATE TABLE `story_quest_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`lang_code`	varchar(10)	NOT NULL	COMMENT '언어코드',
	`title`	varchar(255)	NULL	COMMENT '스토리 퀘스트 제목',
	`story_quest_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 ID'
);

CREATE TABLE `user_story_quest_chapter_mission` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저의 스토리 퀘스트 챕터 미션 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`story_quest_chapter_mission_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 챕터 미션 ID',
	`progress_round_key`	varchar(20)	NULL	COMMENT 'MAIN(메인), yyyy-MM, yyyy-Www',
	`story_quest_chapter_mission_status`	enum(INCOMPLETE, SUBMITTED, APPROVED, REJECTED)	NULL	COMMENT 'INCOMPLETE: 미참가(참가하기), SUBMITTED: 제출, APPROVED: 승인, REJECTED: 승인거절',
	`submit_count`	tinyint unsigned	NULL	COMMENT '참여 횟수',
	`latest_participation_ref_id`	int unsigned	NULL	COMMENT '마지막 참여 이력 ID',
	`last_submitted_dt`	datetime	NULL	COMMENT '마지막 참여일시',
	`completed_dt`	datetime	NULL	COMMENT '완료일시',
	`rejected_dt`	datetime	NULL	COMMENT '거절일시'
);

CREATE TABLE `user_story_quest_chapter` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저의 스토리 퀘스트 챕터 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`story_quest_chapter_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '스토리 퀘스트 챕터 ID',
	`story_quest_chapter_status`	enum(LOCK, ACTIVE, COMPLETED)	NULL	COMMENT 'LOCK: 잠금, ACTIVE: 활성화, COMPLETED: 완료',
	`started_dt`	datetime	NULL	COMMENT '챕터 시작일시',
	`completed_dt`	datetime	NULL	COMMENT '챕터 완료일시',
	`reward_received_yn`	boolean	NULL	COMMENT '챕터 보상수령여부',
	`reward_received_dt`	datetime	NULL	COMMENT '챕터 보상수령일시'
);

ALTER TABLE `daily_mission_group_reward` ADD CONSTRAINT `PK_DAILY_MISSION_GROUP_REWARD` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_favorite_artist` ADD CONSTRAINT `PK_USER_FAVORITE_ARTIST` PRIMARY KEY (
	`id`,
	`user_id`
);

ALTER TABLE `user_daily_mission_streak_count` ADD CONSTRAINT `PK_USER_DAILY_MISSION_STREAK_COUNT` PRIMARY KEY (
	`id`
);

ALTER TABLE `story_quest` ADD CONSTRAINT `PK_STORY_QUEST` PRIMARY KEY (
	`id`
);

ALTER TABLE `story_quest_chapter_translation` ADD CONSTRAINT `PK_STORY_QUEST_CHAPTER_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `story_quest_chapter` ADD CONSTRAINT `PK_STORY_QUEST_CHAPTER` PRIMARY KEY (
	`id`
);

ALTER TABLE `daily_mission_translation` ADD CONSTRAINT `PK_DAILY_MISSION_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `minting_event` ADD CONSTRAINT `PK_MINTING_EVENT` PRIMARY KEY (
	`id`
);

ALTER TABLE `daily_mission` ADD CONSTRAINT `PK_DAILY_MISSION` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_artist_group_notification` ADD CONSTRAINT `PK_USER_ARTIST_GROUP_NOTIFICATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `user` ADD CONSTRAINT `PK_USER` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_daily_mission_streak_reward` ADD CONSTRAINT `PK_USER_DAILY_MISSION_STREAK_REWARD` PRIMARY KEY (
	`id`
);

ALTER TABLE `minting_event_goods` ADD CONSTRAINT `PK_MINTING_EVENT_GOODS` PRIMARY KEY (
	`id`,
	`minting_event_id`
);

ALTER TABLE `daily_mission_streak_reward` ADD CONSTRAINT `PK_DAILY_MISSION_STREAK_REWARD` PRIMARY KEY (
	`id`
);

ALTER TABLE `artist_group` ADD CONSTRAINT `PK_ARTIST_GROUP` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_goods_history` ADD CONSTRAINT `PK_USER_GOODS_HISTORY` PRIMARY KEY (
	`id`
);

ALTER TABLE `story_quest_chapter_mission` ADD CONSTRAINT `PK_STORY_QUEST_CHAPTER_MISSION` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_daily_mission_group_reward` ADD CONSTRAINT `PK_USER_DAILY_MISSION_GROUP_REWARD` PRIMARY KEY (
	`id`
);

ALTER TABLE `artist_group_goods` ADD CONSTRAINT `PK_ARTIST_GROUP_GOODS` PRIMARY KEY (
	`id`
);

ALTER TABLE `fan_quest` ADD CONSTRAINT `PK_FAN_QUEST` PRIMARY KEY (
	`id`
);

ALTER TABLE `trivia` ADD CONSTRAINT `PK_TRIVIA` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_daily_mission` ADD CONSTRAINT `PK_USER_DAILY_MISSION` PRIMARY KEY (
	`id`
);

ALTER TABLE `story_quest_translation` ADD CONSTRAINT `PK_STORY_QUEST_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_story_quest_chapter_mission` ADD CONSTRAINT `PK_USER_STORY_QUEST_CHAPTER_MISSION` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_story_quest_chapter` ADD CONSTRAINT `PK_USER_STORY_QUEST_CHAPTER` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_favorite_artist` ADD CONSTRAINT `FK_user_TO_user_favorite_artist_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `user` (
	`id`
);

ALTER TABLE `minting_event_goods` ADD CONSTRAINT `FK_minting_event_TO_minting_event_goods_1` FOREIGN KEY (
	`minting_event_id`
)
REFERENCES `minting_event` (
	`id`
);

