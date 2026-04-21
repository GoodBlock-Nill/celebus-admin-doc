-- ============================================================
-- CELEBUS PWA - Database Schema
-- 36 tables for 17 screens + common policy
-- ============================================================

-- ========================
-- 1. Core Tables
-- ========================

CREATE TABLE artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  logo_url TEXT,
  background_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE artist_members (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_artist_follows (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE user_currencies (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  virtue_earned INT DEFAULT 0,
  virtue_held INT DEFAULT 0,
  gp INT DEFAULT 0,
  celeb_point INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE user_tickets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tickets INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- 2. Quest System
-- ========================

CREATE TABLE quest_chapters (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goods_name TEXT,
  goods_grade INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (artist_id, chapter_number)
);

CREATE TABLE quest_missions (
  id TEXT PRIMARY KEY,
  chapter_id TEXT REFERENCES quest_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('capture', 'trivia', 'pm')),
  reward_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quest_mission_links (
  id SERIAL PRIMARY KEY,
  mission_id TEXT REFERENCES quest_missions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE TABLE user_quest_progress (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  mission_id TEXT REFERENCES quest_missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'INCOMPLETE'
    CHECK (status IN ('INCOMPLETE', 'SUBMITTED', 'APPROVED', 'REJECTED', 'AUTO_COMPLETED')),
  reject_reason_code TEXT,
  reject_reason_text TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  submission_image_url TEXT,
  PRIMARY KEY (user_id, mission_id)
);

CREATE TABLE user_chapter_goods (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES quest_chapters(id) ON DELETE CASCADE,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, chapter_id)
);

CREATE TABLE repeating_quests (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  mission_count INT DEFAULT 0,
  reward_text TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ready', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- 3. Daily Mission System
-- ========================

CREATE TABLE daily_mission_pool (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_href TEXT,
  reward_pt INT DEFAULT 20,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_daily_checkins (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  reward_pt INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, artist_id, checkin_date)
);

CREATE TABLE user_daily_missions (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  mission_id TEXT REFERENCES daily_mission_pool(id),
  mission_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, artist_id, mission_date)
);

CREATE TABLE user_streaks (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  last_checkin_date DATE,
  PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE user_streak_bonuses (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  days_milestone INT NOT NULL,
  reward_pt INT NOT NULL,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, artist_id, days_milestone)
);

-- ========================
-- 4. Ranking System
-- ========================

CREATE TABLE seasons (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE virtue_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  season_id TEXT REFERENCES seasons(id),
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'refund')),
  source TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_virtue_tx_ranking
  ON virtue_transactions(artist_id, season_id, user_id, created_at);

-- ========================
-- 5. Support Events
-- ========================

CREATE TABLE support_events (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'achieved', 'executing', 'completed', 'expired', 'cancelled')),
  target_pt INT NOT NULL,
  current_pt INT DEFAULT 0,
  participants INT DEFAULT 0,
  result_message TEXT,
  days_left INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE support_event_images (
  id SERIAL PRIMARY KEY,
  event_id TEXT REFERENCES support_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE user_support_investments (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES support_events(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================
-- 6. Raffle System
-- ========================

CREATE TABLE raffles (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prize_name TEXT,
  prize_image TEXT,
  ticket_cost INT DEFAULT 1,
  total_entries INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'drawing', 'closed')),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_raffle_entries (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  raffle_id TEXT REFERENCES raffles(id) ON DELETE CASCADE,
  entries INT DEFAULT 1,
  result TEXT DEFAULT 'pending' CHECK (result IN ('pending', 'winner', 'loser')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, raffle_id)
);

-- ========================
-- 7. Fandom Level
-- ========================

CREATE TABLE fandom_levels (
  id SERIAL PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  level INT NOT NULL,
  target_pt INT NOT NULL,
  reward_name TEXT NOT NULL,
  UNIQUE (artist_id, level)
);

CREATE TABLE fandom_level_progress (
  artist_id TEXT PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
  current_level INT DEFAULT 1,
  current_pt INT DEFAULT 0,
  participant_count INT DEFAULT 0,
  monthly_total INT DEFAULT 0,
  top_activity TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_fandom_contributions (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  contribution_pt INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, artist_id)
);

-- ========================
-- 8. Collection / BIVE
-- ========================

CREATE TABLE bive_items (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('artist', 'event', 'special')),
  image_url TEXT,
  how_to_get TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_bive_collection (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  bive_id TEXT REFERENCES bive_items(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, bive_id)
);

-- ========================
-- 9. Info Feed
-- ========================

CREATE TABLE info_items (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('schedule', 'news')),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  image_url TEXT,
  is_exclusive BOOLEAN DEFAULT false,
  group_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_info_alarms (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  info_item_id TEXT REFERENCES info_items(id) ON DELETE CASCADE,
  alarm_on BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, info_item_id)
);

-- ========================
-- 10. Memory
-- ========================

CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  emojis TEXT[] NOT NULL DEFAULT '{}',
  emoji_labels TEXT[] DEFAULT '{}',
  date DATE NOT NULL,
  text TEXT,
  location TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE memory_images (
  id SERIAL PRIMARY KEY,
  memory_id TEXT REFERENCES memories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- ========================
-- 11. Home / Events
-- ========================

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  type TEXT NOT NULL CHECK (type IN ('raffle', 'support', 'event')),
  emoji TEXT,
  d_day INT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  linked_entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE banners (
  id TEXT PRIMARY KEY,
  artist_id TEXT REFERENCES artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  linked_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app_notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
