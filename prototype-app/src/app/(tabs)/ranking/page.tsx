'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import BottomSheet from '@/components/modals/BottomSheet';
import { formatNumber, formatPercent } from '@/lib/utils';
import type { RankingUser } from '@/lib/types';

const mockRankings: RankingUser[] = Array.from({ length: 30 }, (_, i) => {
  const totalGP = Math.round(50000 - i * 1500 + Math.random() * 500);
  const stGP = Math.round(totalGP * 0.15);
  const pmGP = totalGP - stGP;
  const totalParticipation = Math.round(50 - i + Math.random() * 10);
  const stParticipation = Math.round(totalParticipation * 0.2);
  const pmParticipation = totalParticipation - stParticipation;
  const totalWinRate = +(0.8 - i * 0.015 + Math.random() * 0.05).toFixed(2);

  return {
    rank: i + 1,
    nickname: `Player_${String(i + 1).padStart(2, '0')}`,
    uid: `user${String(i + 1).padStart(3, '0')}`,
    profileImage: `https://api.dicebear.com/7.x/thumbs/svg?seed=player${i + 1}`,
    accumulatedGP: totalGP,
    participationCount: totalParticipation,
    winRate: totalWinRate,
    lastParticipation: '2026-02-24T10:00:00Z',
    pmAccumulatedGP: pmGP,
    pmParticipationCount: pmParticipation,
    pmWinRate: +(totalWinRate + 0.05).toFixed(2),
    stAccumulatedGP: stGP,
    stParticipationCount: stParticipation,
    stWinRate: +(totalWinRate - 0.1).toFixed(2),
  };
});

const myRank: RankingUser = {
  ...mockRankings[14],
  nickname: 'CelebFan_01',
  uid: 'user001',
};

const myRankPercent = ((myRank.rank / mockRankings.length) * 100).toFixed(1);

const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];

function ProfileAvatar({ user, size = 'md' }: { user: RankingUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0`}>
      <span className="text-white text-xs font-bold">
        {user.nickname.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

export default function RankingPage() {
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const topThree = mockRankings.slice(0, 3);
  const rest = mockRankings.slice(3, 10);
  const isMyRankInTop10 = myRank.rank <= 10;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        title="랭킹"
        rightAction={
          <button
            onClick={() => setShowInfo(true)}
            className="w-8 h-8 flex items-center justify-center text-gray-500"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* 내 랭킹 카드 */}
        <div className="mx-4 mt-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg px-5 py-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-blue-200 font-medium">누적 Game Point</p>
            <button
              onClick={() => setShowInfo(true)}
              className="w-5 h-5 flex items-center justify-center text-blue-300"
              aria-label="누적 GP 안내"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-green-300 font-medium mb-1">
            상위 {myRankPercent}% · {myRank.rank}위
          </p>

          <p className="text-3xl font-black text-white mb-3">
            {formatNumber(myRank.accumulatedGP)} GP
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between"
          >
            <p className="text-xs text-blue-200">
              총 참여 {formatNumber(myRank.participationCount)} · 승률 {formatPercent(myRank.winRate)}
            </p>
            <svg
              className={`w-4 h-4 text-blue-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-blue-500 space-y-3 text-left">
              <p className="text-xs text-blue-200 font-medium">게임별 누적</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-semibold">Prediction Market</p>
                    <p className="text-xs text-blue-300">
                      참여 {myRank.pmParticipationCount}회 · 승률 {formatPercent(myRank.pmWinRate)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-white">{formatNumber(myRank.pmAccumulatedGP)} GP</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-200 font-semibold">Survival Trivia</p>
                    <p className="text-xs text-blue-300">참여 {myRank.stParticipationCount}회 · 승률 {formatPercent(myRank.stWinRate)}</p>
                  </div>
                  <p className="text-sm font-bold text-white">{formatNumber(myRank.stAccumulatedGP)} GP</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="mx-4 my-4 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* TOP 10 */}
        <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-base font-bold text-gray-900">TOP 10 🏆</p>
            <p className="text-xs text-gray-400 mt-0.5">순위는 매일 00시 업데이트됩니다.</p>
          </div>

          {/* 1~3위 */}
          <div className="divide-y divide-gray-50">
            {topThree.map((user) => {
              const isMe = user.uid === myRank.uid;
              return (
                <div
                  key={user.uid}
                  className={`px-5 py-4 flex items-center gap-3 ${isMe ? 'bg-blue-50' : ''}`}
                >
                  <span className="text-2xl w-8 text-center">{MEDAL_EMOJI[user.rank - 1]}</span>
                  <ProfileAvatar user={user} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isMe && (
                        <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">YOU</span>
                      )}
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.nickname}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      참여 {formatNumber(user.participationCount)} · 승률 {formatPercent(user.winRate)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-blue-600 shrink-0">
                    {formatNumber(user.accumulatedGP)} GP
                  </p>
                </div>
              );
            })}
          </div>

          {/* 4~10위 */}
          <div className="divide-y divide-gray-50">
            {rest.map((user) => {
              const isMe = user.uid === myRank.uid;
              return (
                <div
                  key={user.uid}
                  className={`px-5 py-3 flex items-center gap-3 ${isMe ? 'bg-blue-50' : ''}`}
                >
                  <span className="text-sm text-gray-400 font-medium w-8 text-center">{user.rank}</span>
                  <ProfileAvatar user={user} size="sm" />
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    {isMe && (
                      <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold shrink-0">YOU</span>
                    )}
                    <p className="text-sm text-gray-900 truncate">{user.nickname}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600 shrink-0">
                    {formatNumber(user.accumulatedGP)} GP
                  </p>
                </div>
              );
            })}
          </div>

          {/* 내 순위 (TOP 10 밖) */}
          {!isMyRankInTop10 && (
            <>
              <div className="px-5 py-2 text-center text-xs text-gray-400">···</div>
              <div className="px-5 py-3 flex items-center gap-3 bg-amber-50 border-t border-amber-100">
                <span className="text-sm text-amber-600 font-bold w-8 text-center">{myRank.rank}</span>
                <ProfileAvatar user={myRank} size="sm" />
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold shrink-0">YOU</span>
                  <p className="text-sm text-gray-900 truncate">{myRank.nickname}</p>
                </div>
                <p className="text-sm font-bold text-blue-600 shrink-0">
                  {formatNumber(myRank.accumulatedGP)} GP
                </p>
              </div>
            </>
          )}
        </div>

        {/* 11~30위 */}
        <div className="mx-4 mt-3 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-600">11 ~ 30위</p>
          </div>
          <div className="divide-y divide-gray-50">
            {mockRankings.slice(10, 30).map((user) => {
              const isMe = user.uid === myRank.uid;
              return (
                <div
                  key={user.uid}
                  className={`px-5 py-3 flex items-center gap-3 ${isMe ? 'bg-amber-50' : ''}`}
                >
                  <span className="text-sm text-gray-400 font-medium w-8 text-center">{user.rank}</span>
                  <ProfileAvatar user={user} size="sm" />
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    {isMe && (
                      <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold shrink-0">YOU</span>
                    )}
                    <p className="text-sm text-gray-900 truncate">{user.nickname}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600 shrink-0">
                    {formatNumber(user.accumulatedGP)} GP
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 누적 GP 안내 바텀시트 */}
      <BottomSheet isOpen={showInfo} onClose={() => setShowInfo(false)} title="누적 GP란?">
        <div className="px-5 py-4 pb-8 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            누적 GP는 게임을 통해 지금까지 획득한 Game Point의 합계에요.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            게임 참여로 얻은 GP가 모두 합산되며, 랭킹은 누적 GP를 기준으로 정해져요.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            게임별 상세 성과는 카드 펼침 영역에서 확인할 수 있어요.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
