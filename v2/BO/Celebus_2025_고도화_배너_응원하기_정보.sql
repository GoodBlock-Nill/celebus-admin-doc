CREATE TABLE `info_image` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '이미지 ID',
	`Field`	VARCHAR(255)	NULL,
	`id2`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '정보 ID'
);

CREATE TABLE `user` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID'
);

CREATE TABLE `info_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`info_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '정보 ID',
	`lang_code`	varchar(10)	NOT NULL	COMMENT '언어 코드',
	`title`	varchar(200)	NOT NULL	COMMENT '제목',
	`description`	text	NULL	COMMENT '본문 (소식에서만 사용)',
	`place`	varchar(200)	NULL	COMMENT '장소 (일정에서만 사용)'
);

CREATE TABLE `support_event` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '응원하기 ID',
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID',
	`support_event_status`	enum('DRAFT', 'ACTIVE', 'ACHIEVED', 'EXECUTING', 'COMPLETED', 'NOT_ACHIEVED 'CANCELLED')	NOT NULL	COMMENT '상태 (작성, 모집중, 달성, 집행중, 완료, 미달성종료, 집행취소)',
	`target_point`	int unsigned	NOT NULL	COMMENT '목표 포인트',
	`total_supported_point`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '총 누적 포인트',
	`start_dt`	datetime	NOT NULL	COMMENT '모집 시작 일시',
	`end_dt`	datetime	NOT NULL	COMMENT '모집 종료 일시',
	`achieved_dt`	datetime	NULL	COMMENT '목표 달성 일시',
	`executing_dt`	datetime	NULL	COMMENT '집행중 전환 일시',
	`completed_dt`	datetime	NULL	COMMENT '완료 전환 일시',
	`not_achieved_dt`	datetime	NULL	COMMENT '미달성 종료 일시',
	`cancelled_dt`	datetime	NULL	COMMENT '집행 취소 일시',
	`cancelled_admin_id`	int unsigned	NULL	COMMENT '집행 취소 관리자 ID',
	`cancelled_reason`	varchar(100)	NULL	COMMENT '집행 취소 사유',
	`image_url`	varchar(500)	NULL	COMMENT '대표 이미지 URL',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `support_event_participation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '응원하기 참여 ID',
	`support_event_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '응원하기 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`total_supported_point`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '총 사용 포인트',
	`refunded_point`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '반환된 포인트',
	`refund_completed_dt`	datetime	NULL	COMMENT '반환 완료 일시'
);

CREATE TABLE `notice` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '공지 ID',
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID',
	`notice_status`	enum('DRAFT', 'PUBLISH')	NOT NULL,
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `user_info_read` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '읽음 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID',
	`info_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '정보 ID'
);

CREATE TABLE `info` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '정보 ID',
	`artist_group_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID',
	`info_type`	enum('SCHEDULE', 'NEWS')	NOT NULL	COMMENT '정보 유형',
	`info_status`	enum('DRAFT', 'PUBLISH')	NOT NULL	COMMENT '상태',
	`schedule_dt`	datetime	NULL	COMMENT '일정 일시 (일정에서만 사용)',
	`exclusive_yn`	boolean	NOT NULL	COMMENT '단독 여부',
	`thumbnail_url`	varchar(500)	NULL	COMMENT '썸네일 (소식에서만 사용)',
	`like_count`	int unsigned	NOT NULL	DEFAULT 0	COMMENT '좋아요 수',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `notice_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`notice_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '공지 ID',
	`lang_code`	varchar(10)	NOT NULL	COMMENT '언어코드',
	`title`	varchar(150)	NOT NULL	COMMENT '제목',
	`description`	text	NULL	COMMENT '내용'
);

CREATE TABLE `support_event_translation` (
	`id`	int unsigned	NOT NULL	COMMENT '다국어 ID',
	`support_event_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '응원하기 ID',
	`lang_code`	varchar(10)	NOT NULL	COMMENT '언어코드',
	`title`	varchar(100)	NOT NULL	COMMENT '제목',
	`description`	text	NOT NULL	COMMENT '상세 설명',
	`caution`	text	NULL	COMMENT '유의사항'
);

CREATE TABLE `event_banner` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '배너 ID',
	`source_type`	enum('RAFFLE', 'SUPPORT_EVENT')	NOT NULL	COMMENT '원본 타입',
	`source_id`	int unsigned	NOT NULL	COMMENT '원본 ID',
	`image_url`	varchar(500)	NOT NULL	COMMENT '이미지 URL',
	`deep_link_url`	varchar(500)	NOT NULL	COMMENT '딥링크 URL',
	`exposure_start_dt`	datetime	NOT NULL	COMMENT '노출 시작 일시',
	`exposure_end_dt`	datetime	NOT NULL	COMMENT '노출 종료 일시',
	`sort_order`	int unsigned	NOT NULL	COMMENT '정렬 순서',
	`hidden_yn`	boolean	NOT NULL	DEFAULT false	COMMENT '숨김 여부',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `info_link_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`info_link_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '일정 링크 ID',
	`lang_code`	varchar(10)	NOT NULL	COMMENT '언어 코드',
	`label`	varchar(50)	NOT NULL	COMMENT '링크 라벨'
);

CREATE TABLE `artist_group` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '아티스트 그룹 ID'
);

CREATE TABLE `info_link` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '정보 링크 ID',
	`info_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '정보 ID',
	`sort_order`	int unsigned	NOT NULL	COMMENT '정렬 순서',
	`url`	varchar(500)	NOT NULL	COMMENT 'URL',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `user_info_like` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '좋아요 ID',
	`user_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '유저 ID',
	`info_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '정보 ID',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '좋아요 여부'
);

CREATE TABLE `support_event_result_media` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '응원하기 결과 미디어 ID',
	`support_event_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '응원하기 ID',
	`media_type`	enum('IMAGE', 'VIDEO')	NOT NULL	COMMENT '미디어 유형',
	`media_url`	varchar(500)	NOT NULL	COMMENT '미디어 url',
	`sort_order`	int	NOT NULL	DEFAULT 1	COMMENT '정렬 순서',
	`use_yn`	boolean	NOT NULL	DEFAULT true	COMMENT '사용 여부'
);

CREATE TABLE `event_banner_translation` (
	`id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '다국어 ID',
	`event_banner_id`	int unsigned	NOT NULL	DEFAULT auto_increment	COMMENT '배너 ID',
	`lang_code`	varchar(10)	NOT NULL	COMMENT '언어 코드',
	`title`	varchar(200)	NOT NULL	COMMENT '제목',
	`subtitle`	varchar(300)	NULL	COMMENT '부제목'
);

ALTER TABLE `info_image` ADD CONSTRAINT `PK_INFO_IMAGE` PRIMARY KEY (
	`id`
);

ALTER TABLE `user` ADD CONSTRAINT `PK_USER` PRIMARY KEY (
	`id`
);

ALTER TABLE `info_translation` ADD CONSTRAINT `PK_INFO_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `support_event` ADD CONSTRAINT `PK_SUPPORT_EVENT` PRIMARY KEY (
	`id`
);

ALTER TABLE `support_event_participation` ADD CONSTRAINT `PK_SUPPORT_EVENT_PARTICIPATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `notice` ADD CONSTRAINT `PK_NOTICE` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_info_read` ADD CONSTRAINT `PK_USER_INFO_READ` PRIMARY KEY (
	`id`
);

ALTER TABLE `info` ADD CONSTRAINT `PK_INFO` PRIMARY KEY (
	`id`
);

ALTER TABLE `notice_translation` ADD CONSTRAINT `PK_NOTICE_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `support_event_translation` ADD CONSTRAINT `PK_SUPPORT_EVENT_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `event_banner` ADD CONSTRAINT `PK_EVENT_BANNER` PRIMARY KEY (
	`id`
);

ALTER TABLE `info_link_translation` ADD CONSTRAINT `PK_INFO_LINK_TRANSLATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `artist_group` ADD CONSTRAINT `PK_ARTIST_GROUP` PRIMARY KEY (
	`id`
);

ALTER TABLE `info_link` ADD CONSTRAINT `PK_INFO_LINK` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_info_like` ADD CONSTRAINT `PK_USER_INFO_LIKE` PRIMARY KEY (
	`id`
);

ALTER TABLE `support_event_result_media` ADD CONSTRAINT `PK_SUPPORT_EVENT_RESULT_MEDIA` PRIMARY KEY (
	`id`
);

ALTER TABLE `event_banner_translation` ADD CONSTRAINT `PK_EVENT_BANNER_TRANSLATION` PRIMARY KEY (
	`id`
);

