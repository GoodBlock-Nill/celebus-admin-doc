-- ============================================================
-- CELEBUS PWA - Seed Data
-- Mock 데이터 기반 초기 데이터
-- ============================================================

-- 기존 데이터 정리 (부분 실행 복구용)
TRUNCATE TABLE memory_images, memories,
  user_info_alarms, info_items,
  user_bive_collection, bive_items,
  user_fandom_contributions, fandom_level_progress, fandom_levels,
  user_raffle_entries, raffles,
  support_event_images, user_support_investments, support_events,
  virtue_transactions, seasons,
  user_streak_bonuses, user_streaks, user_daily_missions, user_daily_checkins, daily_mission_pool,
  user_chapter_goods, user_quest_progress, quest_mission_links, quest_missions, quest_chapters, repeating_quests,
  user_tickets, user_currencies, user_artist_follows,
  app_notices, banners, events,
  artist_members
  CASCADE;
DELETE FROM users;
DELETE FROM artists;

-- ========================
-- 1. Artist: V01D
-- ========================

INSERT INTO artists (id, name, name_en, logo_url, background_url) VALUES
  ('v01d', 'V01D', 'V01D', '/v01d/logo.png', '/v01d/background.jpg');

INSERT INTO artist_members (id, artist_id, name, name_en, image_url, sort_order) VALUES
  ('member-1', 'v01d', '멤버1', 'Member1', '/v01d/member1.jpg', 1),
  ('member-2', 'v01d', '멤버2', 'Member2', '/v01d/member2.jpg', 2),
  ('member-3', 'v01d', '멤버3', 'Member3', '/v01d/member3.jpg', 3),
  ('member-4', 'v01d', '멤버4', 'Member4', '/v01d/member4.jpg', 4);

-- ========================
-- 2. Test User
-- ========================

INSERT INTO users (id, nickname, profile_image_url) VALUES
  ('test-user-001', '테스트팬', NULL);

INSERT INTO user_artist_follows (user_id, artist_id) VALUES
  ('test-user-001', 'v01d');

INSERT INTO user_currencies (user_id, artist_id, virtue_earned, virtue_held) VALUES
  ('test-user-001', 'v01d', 2450, 1200);

INSERT INTO user_tickets (user_id, tickets) VALUES
  ('test-user-001', 5);

-- ========================
-- 3. Ranking Users (100명)
-- ========================

INSERT INTO users (id, nickname) VALUES
  ('user-001', 'v01d_lover'),
  ('user-002', 'star_chaser'),
  ('user-003', 'dream_fan'),
  ('user-004', 'music_soul'),
  ('user-005', 'fan_forever'),
  ('user-006', 'bright_day'),
  ('user-007', 'happy_voice'),
  ('user-008', 'sweet_melody'),
  ('user-009', 'cool_breeze'),
  ('user-010', 'shining_star')
ON CONFLICT (id) DO NOTHING;

-- 나머지 90명 생성
DO $$
BEGIN
  FOR i IN 11..100 LOOP
    INSERT INTO users (id, nickname) VALUES ('user-' || lpad(i::text, 3, '0'), 'fan_' || i)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 모든 랭킹 유저 V01D 팔로우
DO $$
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO user_artist_follows (user_id, artist_id) VALUES ('user-' || lpad(i::text, 3, '0'), 'v01d')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ========================
-- 4. Seasons
-- ========================

INSERT INTO seasons (id, artist_id, label, start_date, end_date, is_current) VALUES
  ('season-2026-04', 'v01d', '4월 시즌', '2026-04-01', '2026-04-30', true),
  ('season-2026-03', 'v01d', '3월 시즌', '2026-03-01', '2026-03-31', false);

-- ========================
-- 5. Virtue Transactions (랭킹 데이터)
-- ========================

-- TOP 10
INSERT INTO virtue_transactions (user_id, artist_id, season_id, amount, type, source) VALUES
  ('user-001', 'v01d', 'season-2026-04', 5200, 'earn', 'quest'),
  ('user-002', 'v01d', 'season-2026-04', 4800, 'earn', 'quest'),
  ('user-003', 'v01d', 'season-2026-04', 4100, 'earn', 'quest'),
  ('user-004', 'v01d', 'season-2026-04', 3900, 'earn', 'quest'),
  ('user-005', 'v01d', 'season-2026-04', 3600, 'earn', 'quest'),
  ('user-006', 'v01d', 'season-2026-04', 3200, 'earn', 'mission'),
  ('user-007', 'v01d', 'season-2026-04', 3000, 'earn', 'mission'),
  ('user-008', 'v01d', 'season-2026-04', 2900, 'earn', 'mission'),
  ('user-009', 'v01d', 'season-2026-04', 2700, 'earn', 'checkin'),
  ('user-010', 'v01d', 'season-2026-04', 2600, 'earn', 'checkin');

-- 11~37위
DO $$
BEGIN
  FOR i IN 11..37 LOOP
    INSERT INTO virtue_transactions (user_id, artist_id, season_id, amount, type, source)
    VALUES ('user-' || lpad(i::text, 3, '0'), 'v01d', 'season-2026-04', 2500 - (i - 11) * 30, 'earn', 'checkin');
  END LOOP;
END $$;

-- 테스트 유저 (38위)
INSERT INTO virtue_transactions (user_id, artist_id, season_id, amount, type, source) VALUES
  ('test-user-001', 'v01d', 'season-2026-04', 2450, 'earn', 'quest');

-- 39~100위
DO $$
BEGIN
  FOR i IN 39..100 LOOP
    INSERT INTO virtue_transactions (user_id, artist_id, season_id, amount, type, source)
    VALUES ('user-' || lpad((i-1)::text, 3, '0'), 'v01d', 'season-2026-04', 2400 - (i - 39) * 20, 'earn', 'checkin');
  END LOOP;
END $$;

-- 이전 시즌 (3월)
INSERT INTO virtue_transactions (user_id, artist_id, season_id, amount, type, source) VALUES
  ('user-001', 'v01d', 'season-2026-03', 4500, 'earn', 'quest'),
  ('user-002', 'v01d', 'season-2026-03', 4200, 'earn', 'quest'),
  ('test-user-001', 'v01d', 'season-2026-03', 1800, 'earn', 'checkin');

-- ========================
-- 6. Quest Chapters & Missions
-- ========================

INSERT INTO quest_chapters (id, artist_id, chapter_number, title, description, goods_name, goods_grade) VALUES
  ('ch1', 'v01d', 1, 'V01D를 만나다', 'V01D의 공식 채널을 팔로우하고 첫 만남을 시작하세요', '스토리의 시작', 1),
  ('ch2', 'v01d', 2, 'V01D를 듣다', 'V01D의 음악을 듣고 감상을 기록하세요', '성장 스토리', 2),
  ('ch3', 'v01d', 3, 'V01D를 알다', 'V01D에 대한 퀴즈에 도전해보세요! Trivia 게임 참여', '아티스트의 꿈', 3),
  ('ch4', 'v01d', 4, 'V01D를 예측하다', 'V01D의 미래를 예측해보세요! PM 게임 참여', '아티스트의 준비', 4),
  ('ch5', 'v01d', 5, 'V01D를 응원하다', 'V01D를 세상에 알리는 서포트에 함께하세요', '아티스트의 데뷔', 5);

-- v5.0: Quest 보상 T3 고관여 75pt 일관 적용
INSERT INTO quest_missions (id, chapter_id, title, type, reward_text, sort_order) VALUES
  -- Chapter 1
  ('m1-1', 'ch1', 'V01D 공식 X 팔로우', 'capture', '덕력 75pt', 1),
  ('m1-2', 'ch1', 'V01D 공식 IG 팔로우', 'capture', '덕력 75pt', 2),
  ('m1-3', 'ch1', 'V01D 공식 YouTube 구독', 'capture', '응모권 1장', 3),
  -- Chapter 2
  ('m2-1', 'ch2', '"Tug of War" 스트리밍 인증', 'capture', '덕력 75pt', 1),
  ('m2-2', 'ch2', '"ROCKROCK" MV 시청 인증', 'capture', '덕력 75pt', 2),
  ('m2-3', 'ch2', 'V01D 앨범 감상 소감 인증', 'capture', '응모권 1장', 3),
  -- Chapter 3
  ('m3-1', 'ch3', 'V01D Trivia 1차 도전 (7/10 이상)', 'trivia', '덕력 75pt', 1),
  ('m3-2', 'ch3', 'V01D Trivia 2차 도전 (7/10 이상)', 'trivia', '덕력 75pt', 2),
  ('m3-3', 'ch3', 'V01D Trivia 최종 도전 (8/10 이상)', 'trivia', '응모권 2장', 3),
  -- Chapter 4
  ('m4-1', 'ch4', 'V01D PM 게임 1회 참여', 'pm', '덕력 75pt', 1),
  ('m4-2', 'ch4', 'V01D PM 게임 2회 참여', 'pm', '덕력 75pt', 2),
  ('m4-3', 'ch4', 'V01D PM 게임 3회 참여', 'pm', '응모권 3장', 3),
  -- Chapter 5
  ('m5-1', 'ch5', 'V01D 서포트 X 게시 (@celebus @V01D 태그)', 'capture', '덕력 75pt', 1),
  ('m5-2', 'ch5', 'V01D 서포트 IG 스토리 공유', 'capture', '덕력 75pt', 2),
  ('m5-3', 'ch5', 'V01D 응원 메시지 작성', 'capture', '응모권 3장', 3);

-- Mission Links
INSERT INTO quest_mission_links (mission_id, label, url) VALUES
  ('m1-1', 'X 프로필 열기', 'https://x.com/V01D_iX'),
  ('m1-2', 'Instagram 열기', 'https://instagram.com/v01d_ix'),
  ('m1-3', 'YouTube 채널', 'https://youtube.com/@v01d'),
  ('m2-1', 'Spotify 열기', 'https://open.spotify.com'),
  ('m2-2', 'YouTube MV', 'https://youtube.com'),
  ('m5-1', 'X에 게시하기', 'https://x.com'),
  ('m5-2', 'Instagram 열기', 'https://instagram.com');

-- Test User Quest Progress (ch1 진행중)
INSERT INTO user_quest_progress (user_id, mission_id, status, submitted_at, reviewed_at) VALUES
  ('test-user-001', 'm1-1', 'APPROVED', now() - interval '3 days', now() - interval '2 days'),
  ('test-user-001', 'm1-2', 'SUBMITTED', now() - interval '1 day', NULL),
  ('test-user-001', 'm1-3', 'INCOMPLETE', NULL, NULL);

-- Repeating Quests
INSERT INTO repeating_quests (id, artist_id, title, period_start, period_end, mission_count, reward_text, status) VALUES
  ('rq-1', 'v01d', '[4/14~4/20] 스트리밍 인증', '2026-04-14', '2026-04-20', 2, '덕력 75pt', 'active'),
  ('rq-2', 'v01d', '[4/14~4/20] SNS 공유', '2026-04-14', '2026-04-20', 1, '응모권 2장', 'active');

-- ========================
-- 7. Daily Mission Pool
-- ========================

-- v5.1: 일일 미션 일괄 지급 25pt (T2 저관여)
INSERT INTO daily_mission_pool (id, title, description, target_href, reward_pt) VALUES
  ('dm-1', 'V01D 페이지 방문', 'V01D 탭에 방문하면 완료', '/artist', 25),
  ('dm-2', '게임존 방문', '게임존 탭에 방문하면 완료', '/game', 25),
  ('dm-3', '기억저장소 방문', '기억저장소에 방문하면 완료', '/memory', 25),
  ('dm-4', '덕력 랭킹 확인', '덕력 랭킹을 확인하면 완료', '/virtue', 25),
  ('dm-5', '래플 확인', '래플 리스트를 확인하면 완료', '/raffle', 25),
  ('dm-6', '컬렉션 확인', '디지털 굿즈 컬렉션을 확인하면 완료', '/collection', 25),
  ('dm-7', '서포트 이벤트 확인', '서포트 이벤트를 확인하면 완료', '/support', 25),
  ('dm-8', '아티스트 정보 확인', '아티스트 정보 피드를 확인하면 완료', '/info', 25);

-- Test User Streak
INSERT INTO user_streaks (user_id, artist_id, current_streak, last_checkin_date) VALUES
  ('test-user-001', 'v01d', 12, CURRENT_DATE - 1);

-- Streak Bonuses
INSERT INTO user_streak_bonuses (user_id, artist_id, days_milestone, reward_pt, claimed) VALUES
  ('test-user-001', 'v01d', 7, 200, true),
  ('test-user-001', 'v01d', 14, 500, false),
  ('test-user-001', 'v01d', 30, 1000, false),
  ('test-user-001', 'v01d', 100, 5000, false);

-- ========================
-- 8. Support Events
-- ========================

INSERT INTO support_events (id, artist_id, title, icon, description, status, target_pt, current_pt, participants, days_left, start_date, end_date, result_message) VALUES
  ('sup-1', 'v01d', 'V01D 커피차 서포트', '☕', 'V01D 생일 기념 커피차를 보내주세요! 팬들의 마음을 모아 특별한 선물을 전달합니다.', 'active', 15000, 10500, 128, 5, '2026-04-15', '2026-04-30', NULL),
  ('sup-2', 'v01d', 'V01D 지하철 광고', '🚇', '강남역 지하철 광고를 통해 V01D를 알리자!', 'completed', 30000, 32000, 215, 0, '2026-03-01', '2026-03-31', 'V01D 멤버들이 감사 인사를 전해왔어요! 감사합니다 💜'),
  ('sup-3', 'v01d', 'V01D 버스 광고', '🚌', '서울 시내버스 광고로 V01D를 알리자!', 'expired', 20000, 8000, 45, 0, '2026-03-01', '2026-03-20', NULL),
  ('sup-4', 'v01d', 'V01D 도시락 서포트', '🍱', '촬영장에 도시락을 보내드려요!', 'achieved', 5000, 5200, 89, 0, '2026-04-01', '2026-04-20', NULL);

INSERT INTO support_event_images (event_id, image_url, sort_order) VALUES
  ('sup-2', '/v01d/logo.png', 1),
  ('sup-2', '/v01d/logo.png', 2);

INSERT INTO user_support_investments (user_id, event_id, amount) VALUES
  ('test-user-001', 'sup-1', 500),
  ('test-user-001', 'sup-2', 800),
  ('test-user-001', 'sup-3', 300),
  ('test-user-001', 'sup-4', 200);

-- ========================
-- 9. Raffles
-- ========================

INSERT INTO raffles (id, artist_id, title, prize_name, prize_image, ticket_cost, total_entries, status, end_date) VALUES
  ('raffle-1', 'v01d', 'V01D 싸인앨범 래플', 'V01D 전원 싸인앨범', '/v01d/logo.png', 1, 342, 'active', '2026-04-30T23:59:00Z'),
  ('raffle-2', 'v01d', 'V01D 포토카드 세트', 'V01D 한정판 포토카드', '/v01d/logo.png', 2, 187, 'active', '2026-05-15T23:59:00Z'),
  ('raffle-3', 'v01d', '팬미팅 초대권', '팬미팅 VIP 초대', '/v01d/logo.png', 3, 521, 'closed', '2026-03-31T23:59:00Z');

INSERT INTO user_raffle_entries (user_id, raffle_id, entries, result) VALUES
  ('test-user-001', 'raffle-1', 2, 'pending'),
  ('test-user-001', 'raffle-3', 1, 'loser');

-- ========================
-- 10. Fandom Level
-- ========================

-- v5.2: 권장 레벨링 곡선 적용 (디자이너 피드백 반영)
-- Lv1 10,000 → Lv5 300,000 → Lv10 6,000,000 누적값. 활성 팬덤 1만 명 기준 6~12개월 Lv5 도달 설계
INSERT INTO fandom_levels (artist_id, level, target_pt, reward_name) VALUES
  ('v01d', 1, 10000, '독점 콘텐츠 해금'),
  ('v01d', 2, 30000, '보이스 메시지 + 사인 포토카드'),
  ('v01d', 3, 70000, '디지털 포카세트 + 사인앨범 래플'),
  ('v01d', 4, 150000, '???'),
  ('v01d', 5, 300000, '???'),
  ('v01d', 6, 550000, '???'),
  ('v01d', 7, 1000000, '???'),
  ('v01d', 8, 1800000, '???'),
  ('v01d', 9, 3200000, '???'),
  ('v01d', 10, 6000000, '???');

-- v5.2: 신규 곡선 기준 Lv3 진행 중 (40,000pt = Lv3 70,000 목표 향해 ~57% 진행)
INSERT INTO fandom_level_progress (artist_id, current_level, current_pt, participant_count, monthly_total, top_activity) VALUES
  ('v01d', 3, 40000, 342, 12000, 'Quest 미션');

INSERT INTO user_fandom_contributions (user_id, artist_id, contribution_pt) VALUES
  ('test-user-001', 'v01d', 150);

-- ========================
-- 11. BIVE Items
-- ========================

INSERT INTO bive_items (id, artist_id, name, grade, category, image_url, how_to_get, sort_order) VALUES
  ('bive-1', 'v01d', 'V01D 데뷔 기념 포카', 'Gr.1', 'artist', '/v01d/logo.png', 'Quest Ch.1 보상', 1),
  ('bive-2', 'v01d', 'V01D 성장 스토리', 'Gr.2', 'artist', '/v01d/logo.png', 'Quest Ch.2 보상', 2),
  ('bive-3', 'v01d', 'V01D 아티스트의 꿈', 'Gr.3', 'artist', '/v01d/logo.png', 'Quest Ch.3 보상', 3),
  ('bive-4', 'v01d', 'V01D 한정판 이벤트', 'Event', 'event', '/v01d/logo.png', '이벤트 참여 보상', 4),
  ('bive-5', 'v01d', 'V01D 스페셜 에디션', 'Special', 'special', '/v01d/logo.png', '특별 이벤트', 5),
  ('bive-6', 'v01d', 'V01D 팬미팅 기념', 'Gr.4', 'event', '/v01d/logo.png', '팬미팅 참여', 6),
  ('bive-7', 'v01d', 'V01D 데뷔 100일', 'Gr.5', 'special', '/v01d/logo.png', '데뷔 100일 기념', 7),
  ('bive-8', 'v01d', 'V01D 멤버 셀카', 'Gr.1', 'artist', '/v01d/logo.png', '일일 미션 보상', 8),
  ('bive-9', 'v01d', 'V01D 연습실 비하인드', 'Gr.2', 'artist', '/v01d/logo.png', '팬덤 레벨 보상', 9);

-- Test User Owns some BIVEs
INSERT INTO user_bive_collection (user_id, bive_id) VALUES
  ('test-user-001', 'bive-1'),
  ('test-user-001', 'bive-4'),
  ('test-user-001', 'bive-8');

-- ========================
-- 12. Info Feed
-- ========================

INSERT INTO info_items (id, artist_id, type, title, date, time, location, is_exclusive, group_label) VALUES
  ('info-1', 'v01d', 'schedule', 'V01D 팬미팅', '2026-05-10', '18:00', '올림픽홀', false, '이번 달'),
  ('info-2', 'v01d', 'schedule', '뮤직뱅크 출연', '2026-04-25', '17:30', 'KBS', false, '이번 주'),
  ('info-3', 'v01d', 'news', 'V01D 새 앨범 프리뷰 공개', '2026-04-22', NULL, NULL, true, '오늘'),
  ('info-4', 'v01d', 'schedule', '라디오 스타 출연', '2026-04-28', '23:00', 'MBC', false, '이번 주'),
  ('info-5', 'v01d', 'news', 'V01D 콘셉트 포토 공개', '2026-04-20', NULL, NULL, false, '지난 주'),
  ('info-6', 'v01d', 'schedule', '인기가요 출연', '2026-04-27', '15:40', 'SBS', false, '이번 주');

-- ========================
-- 13. Memories
-- ========================

INSERT INTO memories (id, user_id, artist_id, emojis, emoji_labels, date, text, location, is_public) VALUES
  ('mem-1', 'test-user-001', 'v01d', ARRAY['💜','🎵'], ARRAY['사랑','음악'], '2026-04-20', '오늘 V01D 신곡 들었는데 너무 좋다! 최고 💜', '서울 강남', true),
  ('mem-2', 'test-user-001', 'v01d', ARRAY['🎉'], ARRAY['축하'], '2026-04-18', '팬미팅 티켓 당첨!! 기대된다', NULL, false),
  ('mem-3', 'test-user-001', 'v01d', ARRAY['😭','💜'], ARRAY['감동','사랑'], '2026-04-15', '뮤직뱅크 1위 축하해요! 감동이다...', '서울 여의도 KBS', true),
  ('mem-4', 'test-user-001', 'v01d', ARRAY['📸'], ARRAY['사진'], '2026-04-10', '포토카드 도착! 너무 예쁘다', '집', false),
  ('mem-5', 'test-user-001', 'v01d', ARRAY['🎤','✨'], ARRAY['공연','반짝'], '2026-04-05', '첫 콘서트 다녀왔다. 잊을 수 없는 밤!', '서울 올림픽공원', true);

INSERT INTO memory_images (memory_id, image_url, sort_order) VALUES
  ('mem-1', '/v01d/logo.png', 1),
  ('mem-3', '/v01d/logo.png', 1),
  ('mem-5', '/v01d/logo.png', 1),
  ('mem-5', '/v01d/logo.png', 2);

-- ========================
-- 14. Events (Home carousel)
-- ========================

INSERT INTO events (id, artist_id, title, subtitle, type, emoji, d_day, is_active, start_date, end_date, linked_entity_id) VALUES
  ('evt-1', 'v01d', 'V01D 싸인앨범 래플', '지금 응모하세요!', 'raffle', '🎁', 9, true, '2026-04-15', '2026-04-30', 'raffle-1'),
  ('evt-2', 'v01d', 'V01D 포토카드 세트 래플', '한정판 포토카드', 'raffle', '📸', 24, true, '2026-04-20', '2026-05-15', 'raffle-2'),
  ('evt-3', 'v01d', 'V01D 커피차 서포트', '목표 70% 달성!', 'support', '☕', 5, true, '2026-04-15', '2026-04-30', 'sup-1'),
  ('evt-4', 'v01d', '팬미팅 초대권 래플', '종료', 'raffle', '🎤', 0, false, '2026-03-15', '2026-03-31', 'raffle-3'),
  ('evt-5', 'v01d', 'V01D 지하철 광고', '집행 완료!', 'support', '🚇', 0, false, '2026-03-01', '2026-03-31', 'sup-2');

-- ========================
-- 15. Banners
-- ========================

INSERT INTO banners (id, artist_id, title, subtitle, image_url, is_active, sort_order, linked_url) VALUES
  ('banner-1', 'v01d', 'V01D 싸인앨범 래플 진행중!', '지금 응모하세요', '/v01d/logo.png', true, 1, '/raffle'),
  ('banner-2', 'v01d', 'V01D 커피차 서포트', '목표 70% 달성!', '/v01d/logo.png', true, 2, '/support'),
  ('banner-3', 'v01d', 'V01D 팬미팅 안내', '5/10 올림픽홀', '/v01d/logo.png', true, 3, '/info');

-- ========================
-- 16. App Notices
-- ========================

INSERT INTO app_notices (id, title, date, is_active) VALUES
  ('notice-1', 'CELEBUS 서비스 업데이트 안내', '2026-04-20', true),
  ('notice-2', '4월 시즌 보상 안내', '2026-04-01', true);
