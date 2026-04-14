'use client';

import { useState, useMemo } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import Toast from '@/components/ui/Toast';
import { useArtistStore } from '@/stores/useArtistStore';
import { MOCK_RANKING } from '@/mock/ranking';
import { cn, formatNumber } from '@/lib/utils';

type SeasonView = 'current' | 'prev';

export default function VirtuePage() {
  const artistName = useArtistStore((s) => s.activeArtist.name);
  const [seasonView, setSeasonView] = useState<SeasonView>('current');
  const [showHistory, setShowHistory] = useState(false);
  const data = MOCK_RANKING;

  const myEntry = data.topUsers.find((u) => u.isMe);
  const isInTop100 = myEntry && data.topUsers.indexOf(myEntry) < 100;

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      <SubPageHeader title="덕력 랭킹" backHref="/artist" />

      {/* 시즌 드롭다운 */}
      <div className="px-4 mt-3 flex justify-end">
        <select
          value={seasonView}
          onChange={(e) => setSeasonView(e.target.value as SeasonView)}
          className="text-xs bg-gray-100 rounded-lg px-3 py-1.5 text-gray-700 font-medium"
        >
          <option value="current">{data.seasonLabel} (현재)</option>
          <option value="prev">3월 시즌</option>
        </select>
      </div>

      {/* 내 정보 카드 */}
      <div className="mx-4 mt-3 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⭐</span>
          <span className="text-base font-bold text-gray-900">내 랭킹</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-gray-500">순위</p>
            <p className="text-lg font-bold text-violet-700">{data.myRank}위</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">획득 덕력</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(data.myEarnedPt)}pt</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">보유 덕력</p>
            <p className="text-lg font-bold text-gray-600">{formatNumber(data.myHeldPt)}pt</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{data.seasonLabel} (D-{data.seasonDaysLeft})</span>
          <button onClick={() => setShowHistory(true)} className="text-xs text-violet-600 font-medium">
            획득 이력 보기 →
          </button>
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
        {!isInTop100 && (
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

      {/* 획득 이력 바텀시트 */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-end" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/40 animate-fadeIn" />
          <div className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-2xl px-5 py-6 animate-slideInUp" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-4">획득 이력</h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {[
                { activity: '퀘스트 미션 완료', pt: 50, date: '04.14' },
                { activity: '출석 체크', pt: 10, date: '04.14' },
                { activity: '일일 미션 완료', pt: 20, date: '04.14' },
                { activity: 'Trivia 정답', pt: 30, date: '04.13' },
                { activity: 'PM 참여', pt: 20, date: '04.13' },
                { activity: '출석 체크', pt: 10, date: '04.13' },
                { activity: '기억저장소 업로드', pt: 30, date: '04.12' },
                { activity: 'SNS 공유', pt: 50, date: '04.12' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.activity}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600">+{item.pt}pt</span>
                    <span className="text-[10px] text-gray-400">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
