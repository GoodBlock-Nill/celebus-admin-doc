import type { RankingUser } from '@/lib/types';

// 60개 닉네임 (2페이지 이상 표시)
const NICKNAMES = [
  'starlight', 'pink_blink', 'carat_love', 'dive_in', 'engine_on',
  'wishful', 'my_once', 'kepler_fan', 'love_guys', 'islander',
  'forever_one', 'unitfan', 'golden_child', 'neverland', 'atiny',
  'stay_cool', 'once_upon', 'milli', 'nctzen', 'viviz_fan',
  'musicbank', 'inkigayo', 'mcount_fan', 'theshow', 'musiccore',
  'powerfan', 'stream_king', 'vote_master', 'fandom_lead', 'top_player',
  'concert_fan', 'goods_lover', 'album_fan', 'my_bias', 'allrounder',
  'mvlover', 'liveshow', 'cafe_admin', 'blog_star', 'tiktok_fan',
  'youtuber', 'tweeter', 'insta_fan', 'weverse', 'blip_fan',
  'melon_chart', 'bugs_chart', 'genie_fan', 'flo_chart', 'spotify_fan',
  'vlive_star', 'bubble_fan', 'lysn_user', 'fromis_nine', 'weeekly_fan',
  'treasure_box', 'enhypen_fan', 'aespa_my', 'ive_dive', 'newjeans_bunny',
];

export const mockRankings: RankingUser[] = NICKNAMES.map((nick, i) => ({
  rank: i + 1,
  nickname: nick + String(Math.floor(Math.random() * 100)),
  uid: `UID${String(i + 1).padStart(6, '0')}`,
  accumulatedGP: Math.floor(100000 * Math.pow(0.85, i)) + Math.floor(Math.random() * 1000),
  participationCount: Math.floor(Math.random() * 100) + 5,
  winRate: Math.round((Math.random() * 0.6 + 0.2) * 1000) / 1000,
  lastParticipation: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
})).sort((a, b) => b.accumulatedGP - a.accumulatedGP)
  .map((user, i) => ({ ...user, rank: i + 1 }));
