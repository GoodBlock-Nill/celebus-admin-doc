CREATE TABLE `artist_memory_report` (
	`artist_memory_report_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '기억 신고 ID',
	`user_artist_memory_id`	int unsigned	NOT NULL	COMMENT '유저 기억 저장소 ID',
	`report_user_id`	int unsigned	NOT NULL	COMMENT '신고한 유저 ID',
	`report_reason_code`	ENUM('INAPPROPRIATE', 'SPAM', 'HATE_SPEECH', 'PRIVACY', 'OTHER')	NOT NULL	COMMENT '신고 유형',
	`report_reason`	varchar(255)	NULL	COMMENT '신고 사유',
	`report_status`	ENUM('SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELED')	NOT NULL	DEFAULT 'SUBMITTED'	COMMENT '처리 상태 (접수됨, 리뷰중, 완료, 거절, 취소)',
	`process_admin_id`	int unsigned	NULL	COMMENT '처리 관리자 ID',
	`process_dt`	datetime	NULL	COMMENT '처리 일시',
	`process_reason`	varchar(255)	NULL	COMMENT '처리 사유'
);

CREATE TABLE `fan_power_season` (
	`fan_power_season_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '덕력 시즌 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`name`	varchar(100)	NOT NULL	COMMENT '시즌명',
	`start_dt`	datetime	NOT NULL	COMMENT '시즌 시작일시',
	`end_dt`	datetime	NOT NULL	COMMENT '시즌 종료일시',
	`status`	enum('READY', 'ACTIVE', 'SETTLING', 'CLOSED')	NOT NULL	DEFAULT 'READY'	COMMENT '시즌 상태 (대기, 진행중, 정산중, 종료)',
	`reward_received_yn`	boolean	NOT NULL	DEFAULT false	COMMENT '보상 지급 여부',
	`reward_received_dt`	datetime	NULL	COMMENT '보상 지급 일시'
);

CREATE TABLE `user_artist_memory_emoji` (
	`user_artist_memory_emoji_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 기억 저장소 이모지 ID',
	`user_artist_memory_id`	int unsigned	NOT NULL	COMMENT '유저 기억 저장소 ID',
	`artist_memory_emoji_id`	int unsigned	NOT NULL	COMMENT '기억 저장소 이모지 ID',
	`sort_order`	tinyint unsigned	NOT NULL	DEFAULT 1	COMMENT '정렬 순서',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `fandom_level` (
	`artist_fandom_level_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬덤 레벨 ID',
	`fandom_level_season_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 시즌 ID',
	`fandom_level_policy_id`	int unsigned	NOT NULL	COMMENT '현재 팬덤 레벨 정책 ID',
	`current_level`	tinyint unsigned	NOT NULL	COMMENT '현재 레벨',
	`current_level_fan_power`	bigint unsigned	NOT NULL	DEFAULT 0	COMMENT '현제 레벨 누적 덕력',
	`current_total_fan_power`	bigint unsigned	NOT NULL	DEFAULT 0	COMMENT '팬덤 전체 누적 덕력',
	`fandom_level_status`	ENUM('ACTIVE', 'MAX')	NOT NULL	DEFAULT 'ACTIVE'	COMMENT '팬덤 레벨 상태',
	`last_level_up_dt`	datetime	NULL	COMMENT '마지막 레벨업 일시'
);

CREATE TABLE `user_fan_power_season` (
	`user_fan_power_season_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 덕력 시즌 ID',
	`user_fan_power_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 덕력 ID',
	`fan_power_season_id`	int unsigned	NOT NULL	COMMENT '덕력 시즌 ID',
	`user_id`	int unsigned	NOT NULL	COMMENT '유저 ID',
	`season_point`	int unsigned	NULL	COMMENT '시즌 누적 덕력 (획득만 누적)',
	`reached_dt`	datetime	NOT NULL	COMMENT '마지막 획득 일시',
	`fan_power_season_reward_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '보상 정책 ID'
);

CREATE TABLE `user_artist_memory_media` (
	`user_artist_memory_media_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 기억 저장소 미디어 ID',
	`user_artist_memory_id`	int unsigned	NOT NULL	COMMENT '유저 기억 저장소 ID',
	`media_url`	VARCHAR(500)	NOT NULL	COMMENT '미디어 URL',
	`sort_order`	TINYINT	NOT NULL	DEFAULT 1	COMMENT '정렬 순서',
	`mime_type`	varchar(100)	NULL	COMMENT 'MIME 유형',
	`file_size`	int unsigned	NULL	COMMENT '파일 크기',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `user_fan_power` (
	`user_fan_power_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 덕력 ID',
	`user_id`	int unsigned	NOT NULL	COMMENT '유저 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`total_point`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '전체 누적 획득 덕력',
	`total_spent`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '전체 누적 사용 덕력'
);

CREATE TABLE `artist_memory_emoji_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`artist_memory_emoji_id`	int unsigned	NOT NULL	COMMENT '기억 저장소 이모지 ID',
	`lang_code`	varchar(10)	NOT NULL	DEFAULT 'en'	COMMENT '언어 코드',
	`emoji_name`	varchar(100)	NOT NULL	COMMENT '이모지명'
);

CREATE TABLE `user_fandom_level_reward` (
	`user_fandom_level_reward_id`	int unsigned	NOT NULL	COMMENT '유저 팬덤 레벨 보상 ID',
	`user_id`	int unsigned	NOT NULL	COMMENT '유저 ID',
	`fandom_level_season_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 시즌 ID',
	`fandom_level_policy_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 정책 ID',
	`fandom_level_reward_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 보상 ID',
	`fandom_level_reward_job_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 보상 작업 ID',
	`winner_yn`	boolean	NOT NULL	DEFAULT FALSE	COMMENT '추첨 당첨 여부',
	`reward_received_status`	enum('READY', 'AUTO_GRANTED', 'LOTTERY_PENDING', 'WINNER', 'COMPLETED', 'FAILED')	NOT NULL	DEFAULT 'READY'	COMMENT '보상 지급 상태',
	`reward_received_dt`	datetime	NULL	COMMENT '보상 지급 일시'
);

CREATE TABLE `fan_power_season_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`fan_power_season_id`	int unsigned	NOT NULL	COMMENT '덕력 시즌 ID',
	`lang_code`	varchar(10)	NOT NULL	DEFAULT 'en'	COMMENT '언어 코드',
	`name`	varchar(100)	NOT NULL	COMMENT '시즌명'
);

CREATE TABLE `fandom_level_up_job` (
	`fandom_level_up_job_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬덤 레벨업 보상 작업 ID',
	`fandom_level_season_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 시즌 ID',
	`fandom_level_policy_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 정책 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`job_status`	ENUM('READY', 'PROCESSING', 'COMPLETED', 'FAILED')	NOT NULL	DEFAULT 'READY'	COMMENT '작업 상태',
	`retry_count`	tinyint unsigned	NOT NULL	DEFAULT 0	COMMENT '재시도 횟수',
	`started_dt`	datetime	NULL	COMMENT '처리 시작일시',
	`completed_dt`	datetime	NULL	COMMENT '처리 완료일시'
);

CREATE TABLE `user_artist_memory` (
	`user_artist_memory_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 기억 저장소 ID',
	`user_id`	int unsigned	NOT NULL	COMMENT '유저 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`memory_date`	date	NOT NULL	COMMENT '날짜',
	`location_name`	varchar(100)	NULL	COMMENT '장소명',
	`latitude`	decimal(10, 7)	NULL	COMMENT '위도',
	`longitude`	decimal(10, 7)	NULL	COMMENT '경도',
	`address`	varchar(255)	NULL	COMMENT '주소',
	`content`	text	NULL	COMMENT '내용',
	`open_yn`	boolean	NOT NULL	DEFAULT false	COMMENT '공개 여부',
	`delete_yn`	boolean	NOT NULL	DEFAULT false	COMMENT '삭제 여부',
	`delete_dt`	datetime	NULL	COMMENT '삭제 일시'
);

CREATE TABLE `user` (
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`artist_memory_open_yn`	boolean	NULL	DEFAULT false	COMMENT '기억저장소 공개 여부'
);

CREATE TABLE `user_fan_power_history` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 덕력 이력 ID',
	`user_fan_power_id`	int unsigned	NOT NULL	COMMENT '유저 덕력 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`fan_power_season_id`	int unsigned	NULL	COMMENT '덕력 시즌 ID',
	`history_type`	enum('EARN', 'USE')	NOT NULL	COMMENT '이력 유형',
	`source_type`	enum()	NOT NULL	COMMENT '소스 유형(퀘스트, 일일미션, 바이브활동, 프리딕션 참여, 트리비아 참여, 랭킹보상, 응원하기 참여)',
	`source_id`	int unsigned	NULL	COMMENT '소스 ID',
	`point`	int	NOT NULL	DEFAULT 0	COMMENT '변동 포인트',
	`point_after`	int	NOT NULL	DEFAULT 0	COMMENT '변동후 포인트',
	`description`	varchar(255)	NULL	COMMENT '설명'
);

CREATE TABLE `badge` (
	`badge_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '뱃지 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`badge_type`	enum('SEASON', 'FANDOM'))	NOT NULL	COMMENT '뱃지 유형(덕력시즌, 팬덤레벨)',
	`badge_image_url`	varchar(255)	NULL	COMMENT '뱃지 이미지 URL',
	`fan_power_season_id`	int unsigned	NULL	COMMENT '덕력 시즌 ID',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `artist_group` (
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID'
);

CREATE TABLE `fan_power_season_reward_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`fan_power_season_reward_id`	int unsigned	NOT NULL	COMMENT '보상 정책 ID',
	`lang_code`	varchar(10)	NOT NULL	DEFAULT 'en'	COMMENT '언어 코드',
	`policy_name`	varchar(100)	NOT NULL	COMMENT '보상 정책명',
	`reward_name`	varchar(100)	NOT NULL	COMMENT '보상 상품명'
);

CREATE TABLE `fandom_level_reward_job` (
	`fandom_level_reward_job_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬덤 레벨 보상 작업 ID',
	`fandom_level_up_job_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨업 보상 작업 ID',
	`fandom_level_policy_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 정책 ID',
	`fandom_level_reward_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 보상 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`job_status`	enum('READY', 'PROCESSING', 'COMPLETED', 'FAILED')	NOT NULL	DEFAULT 'READY'	COMMENT '작업 상태',
	`lottery_status`	enum('NONE', 'READY', 'COMPLETED')	NOT NULL	DEFAULT 'NONE'	COMMENT '추첨 상태',
	`run_admin_id`	int unsigned	NULL	COMMENT '수동 처리 관리자 ID',
	`started_dt`	DATETIME	NULL	COMMENT '처리 시작일시',
	`completed_dt`	DATETIME	NULL	COMMENT '처리 완료일시'
);

CREATE TABLE `user_badge` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT 'ID',
	`user_id`	int unsigned	NOT NULL	COMMENT '유저 ID',
	`badge_id`	int unsigned	NOT NULL	COMMENT '뱃지 ID',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `fan_power_limit` (
	`fan_power_limit_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '덕력 상한 정책 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`daily_limit`	int unsigned	NULL	COMMENT '일일 상한 덕력',
	`weekly_limit`	int unsigned	NULL	COMMENT '주간 상한 덕력',
	`monthly_limit`	int unsigned	NULL	COMMENT '월간 상한 덕력',
	`use_yn`	boolean	NULL	DEFAULT false	COMMENT '사용 여부'
);

CREATE TABLE `fan_power_season_ranking` (
	`fan_power_season_ranking_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '시즌 최종 랭킹 ID',
	`fan_power_season_id`	int unsigned	NOT NULL	COMMENT '덕력 시즌 ID',
	`user_fan_power_season_id`	int unsigned	NOT NULL	COMMENT '유저 덕력 시즌 ID',
	`user_id`	int unsigned	NOT NULL	COMMENT '유저 ID',
	`rank_no`	int unsigned	NOT NULL	COMMENT '최종 순위',
	`season_point`	int unsigned	NOT NULL	COMMENT '시즌 누적 덕력',
	`reached_dt`	datetime	NOT NULL	COMMENT '마지막 획득 일시',
	`fan_power_season_reward_id`	int unsigned	NULL	COMMENT '보상 정책 ID',
	`goods_reward_status`	enum('NONE', 'PROCESSING', 'COMPLETED')	NULL	COMMENT '실물 보상 처리 상태'
);

CREATE TABLE `fan_power_season_reward` (
	`fan_power_season_reward_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '보상 정책 ID',
	`fan_power_season_id`	int unsigned	NOT NULL	COMMENT '덕력 시즌 ID',
	`reward_image_url`	varchar(255)	NULL	COMMENT '보상 이미지 URL',
	`priority`	tinyint unsigned	NOT NULL	DEFAULT 1	COMMENT '우선순위(낮을수록 상위 보상)',
	`reward_target_type`	enum('RANK', 'PERCENT')	NOT NULL	COMMENT '대상 기준 유형 (등수, 비율)',
	`rank_from`	int unsigned	NULL	COMMENT '등수 시작값',
	`rank_to`	int unsigned	NULL	COMMENT '등수 종료값',
	`percent_value`	tinyint unsigned	NULL	COMMENT '상위 퍼센트 값(예: 10.00)',
	`badge_id`	int unsigned	NULL	COMMENT '뱃지 ID',
	`minting_event_id`	int unsigned	NULL	COMMENT '민팅 이벤트 ID (확인 필요)',
	`goods_yn`	boolean	NULL	DEFAULT true	COMMENT '실물 상품 여부',
	`shipping_deadline_dt`	datetime	NULL	COMMENT '배송지 입력 마감일',
	`shipping_form_url`	varchar(500)	NULL	COMMENT '배송지 입력 폼 URL',
	`entry_ticket_amount`	tinyint unsigned	NOT NULL	DEFAULT 0	COMMENT '지급 응모권 수량',
	`fan_power_amount`	tinyint unsigned	NOT NULL	DEFAULT 0	COMMENT '지급 덕력 포인트',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용여부'
);

CREATE TABLE `badge_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`lang_code`	varchar(10)	NOT NULL	DEFAULT 'en'	COMMENT '언어 코드',
	`name`	varchar(100)	NOT NULL	COMMENT '뱃지명',
	`badge_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '뱃지 ID'
);

CREATE TABLE `fandom_level_season` (
	`fandom_level_season_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬덤 레벨 시즌 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`season_year`	year	NOT NULL	COMMENT '시즌 연도',
	`start_dt`	datetime	NOT NULL	COMMENT '시즌 시작 일시',
	`end_dt`	datetime	NOT NULL	COMMENT '시즌 종료 일시',
	`status`	enum('READY', 'ACTIVE', 'SETTLING', 'CLOSED')	NOT NULL	DEFAULT 'READY'	COMMENT '시즌 상태',
	`reward_received_yn`	boolean	NULL	DEFAULT false	COMMENT '보상 지급 여부',
	`reward_received_dt`	datetime	NULL	COMMENT '보상 지급 일시'
);

CREATE TABLE `fandom_level_policy` (
	`fandom_level_policy_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬덤 레벨 정책 ID',
	`fandom_level_season_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 시즌 ID',
	`level`	tinyint unsigned	NOT NULL	COMMENT '레벨',
	`target_fan_power`	bigint unsigned	NOT NULL	COMMENT '레벨업 달성 목표 덕력',
	`max_yn`	boolean	NOT NULL	DEFAULT false	COMMENT '최고 레벨 여부',
	`level_achieved_yn`	boolean	NOT NULL	DEFAULT false	COMMENT '레벨 달성 여부',
	`level_achieved_dt`	datetime	NULL	COMMENT '레벨 달성 일시 (초과)',
	`level_up_achieved_dt`	datetime	NULL	COMMENT '레벨업 달성 일시 (이하)',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `artist_memory_emoji` (
	`artist_memory_emoji_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '기억 저장소 이모지 ID',
	`artist_group_id`	int unsigned	NOT NULL	COMMENT '아티스트 그룹 ID',
	`emotion_code`	varchar(10)	NOT NULL	COMMENT '이모지 (유니코드)',
	`sort_order`	tinyint unsigned	NULL	DEFAULT 0	COMMENT '정렬 순서',
	`use_yn`	boolean	NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `fandom_level_reward` (
	`fandom_level_reward_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬덤 레벨 보상 ID',
	`fandom_level_policy_id`	int unsigned	NOT NULL	COMMENT '팬덤 레벨 정책 ID',
	`reward_type`	enum('EXCLUSIVE_CONTENT', 'DIGITAL', 'DOWNLOAD', 'GOODS', 'EVENT')	NOT NULL	COMMENT '보상 유형 (독점콘텐츠, 디지털 굿즈, 다운로드콘텐츠, 실물보상, 이벤트 참여권)',
	`reward_auto_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '자동 지급 여부',
	`distribution_type`	enum('ALL', 'LOTTERY')	NOT NULL	DEFAULT 'ALL'	COMMENT '지급 방식 (전체, 추첨)',
	`winner_count`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '추첨 당첨자 수',
	`ref_type`	enum('BIVE', 'RAFFLE', 'EVENT', 'BADGE')	NULL	COMMENT '참조 타입 (바이브, 래플, 이벤트, 뱃지 등)',
	`ref_id`	int unsigned	NULL	COMMENT '참조 ID',
	`shipping_deadline_dt`	datetime	NULL	COMMENT '배송지 입력 마감일시',
	`shipping_form_url`	varchar(500)	NULL	COMMENT '배송지 입력 폼 URL',
	`file_url`	varchar(500)	NULL	COMMENT '파일 URL (다운로드콘텐츠)',
	`sort_order`	tinyint unsigned	NOT NULL	DEFAULT 1	COMMENT '정렬 순서',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `fandom_level_reward_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`fandom_level_reward_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '팬덤 레벨 보상 ID',
	`lang_code`	varchar(10)	NOT NULL	DEFAULT 'en'	COMMENT '언어 코드',
	`reward_name`	varchar(255)	NOT NULL	COMMENT '보상명'
);

CREATE TABLE `fan_power_season_ranking_reload` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT 'ID',
	`fan_power_season_id`	int unsigned	NOT NULL	COMMENT '덕력 시즌 ID',
	`job_status`	enum('READY', 'REQUEST', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED')	NOT NULL	COMMENT '재실행 상태',
	`start_dt`	datetime	NULL	COMMENT '재실행 시작 일시',
	`end_dt`	datetime	NULL	COMMENT '재실행 종료 일시',
	`temp_redis_key`	varchar(100)	NULL	COMMENT '임시 Redis 키',
	`error_message`	text	NULL	COMMENT '실패 사유'
);

ALTER TABLE `artist_memory_report` ADD CONSTRAINT `PK_ARTIST_MEMORY_REPORT` PRIMARY KEY (
	`artist_memory_report_id`
);

ALTER TABLE `fan_power_season` ADD CONSTRAINT `PK_FAN_POWER_SEASON` PRIMARY KEY (
	`fan_power_season_id`
);

ALTER TABLE `user_artist_memory_emoji` ADD CONSTRAINT `PK_USER_ARTIST_MEMORY_EMOJI` PRIMARY KEY (
	`user_artist_memory_emoji_id`
);

ALTER TABLE `fandom_level` ADD CONSTRAINT `PK_FANDOM_LEVEL` PRIMARY KEY (
	`artist_fandom_level_id`
);

ALTER TABLE `user_fan_power_season` ADD CONSTRAINT `PK_USER_FAN_POWER_SEASON` PRIMARY KEY (
	`user_fan_power_season_id`
);

ALTER TABLE `user_artist_memory_media` ADD CONSTRAINT `PK_USER_ARTIST_MEMORY_MEDIA` PRIMARY KEY (
	`user_artist_memory_media_id`
);

ALTER TABLE `user_fan_power` ADD CONSTRAINT `PK_USER_FAN_POWER` PRIMARY KEY (
	`user_fan_power_id`
);

ALTER TABLE `artist_memory_emoji_translation` ADD CONSTRAINT `PK_ARTIST_MEMORY_EMOJI_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_fandom_level_reward` ADD CONSTRAINT `PK_USER_FANDOM_LEVEL_REWARD` PRIMARY KEY (
	`user_fandom_level_reward_id`
);

ALTER TABLE `fan_power_season_translation` ADD CONSTRAINT `PK_FAN_POWER_SEASON_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `fandom_level_up_job` ADD CONSTRAINT `PK_FANDOM_LEVEL_UP_JOB` PRIMARY KEY (
	`fandom_level_up_job_id`
);

ALTER TABLE `user_artist_memory` ADD CONSTRAINT `PK_USER_ARTIST_MEMORY` PRIMARY KEY (
	`user_artist_memory_id`
);

ALTER TABLE `user` ADD CONSTRAINT `PK_USER` PRIMARY KEY (
	`user_id`
);

ALTER TABLE `user_fan_power_history` ADD CONSTRAINT `PK_USER_FAN_POWER_HISTORY` PRIMARY KEY (
	`id`
);

ALTER TABLE `badge` ADD CONSTRAINT `PK_BADGE` PRIMARY KEY (
	`badge_id`
);

ALTER TABLE `artist_group` ADD CONSTRAINT `PK_ARTIST_GROUP` PRIMARY KEY (
	`artist_group_id`
);

ALTER TABLE `fan_power_season_reward_translation` ADD CONSTRAINT `PK_FAN_POWER_SEASON_REWARD_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `fandom_level_reward_job` ADD CONSTRAINT `PK_FANDOM_LEVEL_REWARD_JOB` PRIMARY KEY (
	`fandom_level_reward_job_id`
);

ALTER TABLE `user_badge` ADD CONSTRAINT `PK_USER_BADGE` PRIMARY KEY (
	`id`
);

ALTER TABLE `fan_power_limit` ADD CONSTRAINT `PK_FAN_POWER_LIMIT` PRIMARY KEY (
	`fan_power_limit_id`
);

ALTER TABLE `fan_power_season_ranking` ADD CONSTRAINT `PK_FAN_POWER_SEASON_RANKING` PRIMARY KEY (
	`fan_power_season_ranking_id`
);

ALTER TABLE `fan_power_season_reward` ADD CONSTRAINT `PK_FAN_POWER_SEASON_REWARD` PRIMARY KEY (
	`fan_power_season_reward_id`
);

ALTER TABLE `badge_translation` ADD CONSTRAINT `PK_BADGE_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `fandom_level_season` ADD CONSTRAINT `PK_FANDOM_LEVEL_SEASON` PRIMARY KEY (
	`fandom_level_season_id`
);

ALTER TABLE `fandom_level_policy` ADD CONSTRAINT `PK_FANDOM_LEVEL_POLICY` PRIMARY KEY (
	`fandom_level_policy_id`
);

ALTER TABLE `artist_memory_emoji` ADD CONSTRAINT `PK_ARTIST_MEMORY_EMOJI` PRIMARY KEY (
	`artist_memory_emoji_id`
);

ALTER TABLE `fandom_level_reward` ADD CONSTRAINT `PK_FANDOM_LEVEL_REWARD` PRIMARY KEY (
	`fandom_level_reward_id`
);

ALTER TABLE `fandom_level_reward_translation` ADD CONSTRAINT `PK_FANDOM_LEVEL_REWARD_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `fan_power_season_ranking_reload` ADD CONSTRAINT `PK_FAN_POWER_SEASON_RANKING_RELOAD` PRIMARY KEY (
	`id`
);

