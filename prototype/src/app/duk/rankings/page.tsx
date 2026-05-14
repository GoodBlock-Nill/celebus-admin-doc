'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { TrophyIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import { rankings, seasons, type ArtistGroup } from '@/mock/duk';

const RANK_BG = ['bg-amber-100 text-amber-700', 'bg-gray-100 text-gray-700', 'bg-orange-100 text-orange-700'];

export default function DukRankingsPage() {
  const router = useRouter();
  const activeSeasons = seasons.filter((s) => s.status === 'ACTIVE');
  const [seasonId, setSeasonId] = useState<number>(activeSeasons[0]?.id ?? 1);
  const [artistFilter, setArtistFilter] = useState<ArtistGroup | 'ALL'>('ALL');

  const currentSeason = seasons.find((s) => s.id === seasonId);
  const filtered = artistFilter === 'ALL' ? rankings : rankings.filter((r) => r.artistGroup === artistFilter);

  const v01dCount = rankings.filter((r) => r.artistGroup === 'V01D').length;
  const ikonCount = rankings.filter((r) => r.artistGroup === 'iKON').length;
  const celebusCount = rankings.filter((r) => r.artistGroup === 'CELEBUS').length;

  return (
    <div>
      <PageHeader title="랭킹" breadcrumbItems={[{ label: '덕력' }, { label: '랭킹' }]} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="전체 랭커" count={rankings.length} variant="default" />
        <StatCardWithBar label="V01D Top" count={v01dCount} variant="active" />
        <StatCardWithBar label="iKON Top" count={ikonCount} variant="active" />
        <StatCardWithBar label="CELEBUS Top" count={celebusCount} variant="active" />
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-indigo-900 mb-1">랭킹 산출 정책 — 시즌 글로벌 × 아티스트 분리</h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          시즌은 글로벌 1개지만 랭킹은 아티스트별로 분리됩니다. <code className="px-1 bg-indigo-100 rounded">SELECT * FROM fan_power_season_ranking JOIN user_fan_power ON artist_group_id</code> 패턴 사용.
          Redis 캐시 키 재실행: 시즌 카드에서 "랭킹 reload" 버튼.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(parseInt(e.target.value, 10))}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[260px]"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1">
          {(['ALL', 'V01D', 'iKON', 'CELEBUS'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setArtistFilter(a)}
              className={`h-8 px-3 text-xs font-medium rounded-md transition-colors ${
                artistFilter === a ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {a === 'ALL' ? '전체' : a}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {currentSeason?.rankingReloadAt && (
          <div className="text-xs text-gray-500">최근 reload: <span className="text-gray-900 font-medium">{currentSeason.rankingReloadAt}</span></div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-20">아티스트 순위</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-24">아티스트</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">회원</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-32">덕력</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-28">주간 변동</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr
                key={`${r.artistGroup}-${r.memberId}`}
                onClick={() => router.push(`/duk/history/${r.memberId}`)}
                className="hover:bg-indigo-50/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-xs ${RANK_BG[r.rank - 1] ?? 'bg-gray-50 text-gray-600'}`}>
                    {r.rank <= 3 && <TrophyIcon className="w-3 h-3" />}
                    #{r.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700">{r.artistGroup}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-900 font-medium">{r.nickname}</div>
                  <div className="text-[11px] text-gray-500">member#{r.memberId}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-indigo-700 font-bold">{r.fanPower.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 ml-1">DUK</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold text-xs ${r.deltaWeekly >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {r.deltaWeekly >= 0 ? '+' : ''}{r.deltaWeekly.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-gray-500">조건에 맞는 랭킹이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
