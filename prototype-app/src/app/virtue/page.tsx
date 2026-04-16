'use client';

import { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import Toast from '@/components/ui/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { useArtistStore } from '@/stores/useArtistStore';
import { MOCK_RANKING } from '@/mock/ranking';
import { cn, formatNumber } from '@/lib/utils';

const MOCK_RANKING_PREV = {
  ...MOCK_RANKING,
  myRank: 12,
  myEarnedPt: 890,
  myHeldPt: 450,
  seasonLabel: '3월 시즌',
  seasonDaysLeft: 0,
  topUsers: [
    { rank: 1, nickname: 'dream_fan', earnedPt: 4200, isMe: false },
    { rank: 2, nickname: 'v01d_lover', earnedPt: 3900, isMe: false },
    { rank: 3, nickname: 'music_soul', earnedPt: 3400, isMe: false },
    { rank: 4, nickname: 'star_chaser', earnedPt: 3100, isMe: false },
    { rank: 5, nickname: 'fan_forever', earnedPt: 2800, isMe: false },
    { rank: 6, nickname: 'bright_day', earnedPt: 2500, isMe: false },
    { rank: 7, nickname: 'cool_breeze', earnedPt: 2300, isMe: false },
    { rank: 8, nickname: 'sweet_melody', earnedPt: 2100, isMe: false },
    { rank: 9, nickname: 'happy_voice', earnedPt: 1900, isMe: false },
    { rank: 10, nickname: 'shining_star', earnedPt: 1700, isMe: false },
    { rank: 11, nickname: 'fan_11', earnedPt: 1000, isMe: false },
    { rank: 12, nickname: '나', earnedPt: 890, isMe: true },
    ...Array.from({ length: 88 }, (_, i) => ({
      rank: 13 + i,
      nickname: `fan_${13 + i}`,
      earnedPt: 880 - i * 8,
      isMe: false,
    })),
  ],
};

type SeasonView = 'current' | 'prev';
type DebugPreset = 'default' | 'guest';

export default function VirtuePage() {
  const artistName = useArtistStore((s) => s.activeArtist.name);
  const addToast = useUIStore((s) => s.addToast);
  const [seasonView, setSeasonView] = useState<SeasonView>('current');
  const [showHistory, setShowHistory] = useState(false);
  const [preset, setPreset] = useState<DebugPreset>('default');
  const [debugOpen, setDebugOpen] = useState(false);
  const data = seasonView === 'prev' ? MOCK_RANKING_PREV : MOCK_RANKING;

  const isLoggedIn = preset !== 'guest';

  const myEntry = data.topUsers.find((u) => u.isMe);
  const isInTop100 = myEntry && data.topUsers.indexOf(myEntry) < 100;

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 — 열람 가능, 참여 시 로그인 필요
        </div>
      )}
      <SubPageHeader title="덕력 랭킹" />

      {/* 시즌 드롭다운 */}
      <div className="px-4 mt-3 flex justify-end">
        <select
          value={seasonView}
          onChange={(e) => setSeasonView(e.target.value as SeasonView)}
          className="text-xs bg-gray-100 rounded-lg px-3 py-1.5 text-gray-700 font-medium"
        >
          <option value="current">{MOCK_RANKING.seasonLabel} (현재)</option>
          <option value="prev">{MOCK_RANKING_PREV.seasonLabel}</option>
        </select>
      </div>

      {/* 내 정보 카드 */}
      <div className="mx-4 mt-3 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⭐</span>
          <span className="text-base font-bold text-gray-900">내 랭킹</span>
          {seasonView === 'prev' && (
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">이 시즌 보상: 슈퍼팬 뱃지</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-gray-500">순위</p>
            <p className="text-lg font-bold text-violet-700">{isLoggedIn ? `${data.myRank}위` : '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">획득 덕력</p>
            <p className="text-lg font-bold text-gray-900">{isLoggedIn ? `${formatNumber(data.myEarnedPt)}pt` : '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">보유 덕력</p>
            <p className="text-lg font-bold text-gray-600">{isLoggedIn ? `${formatNumber(data.myHeldPt)}pt` : '-'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{data.seasonLabel} (D-{data.seasonDaysLeft})</span>
          {isLoggedIn && (
            <button onClick={() => setShowHistory(true)} className="text-xs text-violet-600 font-medium">
              덕력 이력 보기 →
            </button>
          )}
        </div>
      </div>

      {/* TOP 100 리더보드 */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TOP 100</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="space-y-1">
          {data.topUsers.slice(0, 100).map((user) => {
            const rankIcon = user.rank === 1 ? '🏆' : user.rank === 2 ? '🥇' : user.rank === 3 ? '🥈' : null;
            return (
              <div
                key={`${user.rank}-${user.nickname}`}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-xl',
                  user.isMe ? 'bg-violet-50 border border-violet-200' : 'bg-white'
                )}
              >
                <span className="w-8 text-xs font-semibold text-gray-500">{user.rank}</span>
                <span className="w-6 text-center">{rankIcon || (user.isMe ? '⭐' : '')}</span>
                <span className={cn('flex-1 text-sm', user.isMe ? 'font-bold text-violet-700' : 'text-gray-800')}>
                  {user.nickname} {user.isMe && '★'}
                </span>
                <span className="text-xs text-gray-500">{formatNumber(user.earnedPt)}pt</span>
              </div>
            );
          })}
        </div>

        {/* TOP 100 밖 내 순위 */}
        {isLoggedIn && !isInTop100 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">── 내 순위 ──</span>
            </div>
            <div className="flex items-center px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-200">
              <span className="w-8 text-xs font-semibold text-gray-500">{data.myRank}</span>
              <span className="w-6 text-center">⭐</span>
              <span className="flex-1 text-sm font-bold text-violet-700">나 ★</span>
              <span className="text-xs text-gray-500">{formatNumber(data.myEarnedPt)}pt</span>
            </div>
          </div>
        )}
      </div>

      {/* 시즌 보상 안내 */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">시즌 보상</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="flex gap-2">
          {[
            { icon: '🏆', label: '1위', reward: '사인 앨범' },
            { icon: '🥇', label: 'TOP 10', reward: '사인 포토카드' },
            { icon: '🌟', label: 'TOP 10%', reward: '슈퍼팬 뱃지' },
          ].map((r) => (
            <div key={r.label} className="flex-1 bg-gray-50 rounded-xl px-3 py-3 text-center">
              <span className="text-lg">{r.icon}</span>
              <p className="text-[10px] font-semibold text-gray-700 mt-1">{r.label}</p>
              <p className="text-[9px] text-gray-500">{r.reward}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="mx-4 mt-4 bg-gray-50 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-500">
          ℹ️ 랭킹은 획득 덕력 기준입니다. 서포트에 응원한 덕력은 랭킹에 영향을 주지 않습니다.
        </p>
      </div>

      {/* 덕력 이력 바텀시트 */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-end" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-2xl px-5 py-6 animate-slideInUp" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-4">덕력 이력</h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {[
                { activity: '퀘스트 미션 완료 (1장 미션3)', pt: 50, date: '04.14', type: 'earn' as const },
                { activity: '출석 체크', pt: 10, date: '04.14', type: 'earn' as const },
                { activity: '일일 미션 완료', pt: 20, date: '04.14', type: 'earn' as const },
                { activity: '서포트 응원: ☕ 커피차 서포트', pt: -500, date: '04.13', type: 'use' as const },
                { activity: '출석 체크', pt: 10, date: '04.13', type: 'earn' as const },
                { activity: '독점 콘텐츠 해금: 비하인드 사진', pt: -100, date: '04.12', type: 'use' as const },
                { activity: '기억 저장', pt: 30, date: '04.12', type: 'earn' as const },
                { activity: '7일 연속 출석 보너스', pt: 50, date: '04.11', type: 'earn' as const },
                { activity: '서포트 덕력 반환: 생일카페', pt: 300, date: '04.10', type: 'refund' as const },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between py-0.5 active:bg-gray-50 rounded-lg transition-colors"
                  onClick={(e) => { e.stopPropagation(); if (item.type === 'use' || item.type === 'refund') addToast('info', `${item.activity} 상세 이동`); }}>
                  <span className="text-sm text-gray-700 text-left">{item.activity}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={cn('text-sm font-semibold', item.pt > 0 ? 'text-green-600' : 'text-red-500')}>{item.pt > 0 ? '+' : ''}{item.pt}pt</span>
                    <span className="text-[10px] text-gray-400">{item.date}</span>
                    {(item.type === 'use' || item.type === 'refund') && <span className="text-[10px] text-gray-300">→</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'default' as const, label: '로그인' },
              { key: 'guest' as const, label: '비로그인' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
          <span className="text-[10px] font-semibold">{preset === 'guest' ? '비로그인' : '로그인'}</span>
          <span className="text-[8px]">▲</span>
        </button>
      </div>
    </div>
  );
}
