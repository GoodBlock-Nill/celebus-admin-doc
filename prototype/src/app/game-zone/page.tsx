'use client';

import PageHeader from '@/components/layout/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import GameTypeCard from '@/components/ui/GameTypeCard';
import { useGameStore } from '@/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { mockGPChanges } from '@/mock/gp-changes';
import { mockExchanges } from '@/mock/exchanges';
import { mockRankings } from '@/mock/rankings';
import { formatNumber, formatGP } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

export default function GameZoneHome() {
  const games = useGameStore((s) => s.games);
  const rankingSettings = useSettingsStore((s) => s.rankingSettings);

  const activeGames = games.filter(g => g.status === 'Active');
  const pendingGames = games.filter(g => g.status === 'Pending');
  const todayParticipants = activeGames.reduce((sum, g) => sum + g.participantCount, 0);

  const todayExchanges = mockExchanges.slice(0, 10);
  const todayChargeGP = todayExchanges
    .filter(e => e.direction === 'CHARGE' && e.status === 'SUCCESS')
    .reduce((sum, e) => sum + e.gpAmount, 0);
  const todayWithdrawGP = todayExchanges
    .filter(e => e.direction === 'WITHDRAW' && e.status === 'SUCCESS')
    .reduce((sum, e) => sum + e.gpAmount, 0);

  const todayGPChanges = mockGPChanges.slice(0, 50);

  const top1User = mockRankings[0];

  return (
    <div>
      <PageHeader
        title="게임존"
        breadcrumbItems={[{ label: '게임존' }]}
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">전체 현황</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatsCard label="진행중 게임" value={`${activeGames.length}개`} />
          <StatsCard label="결과 입력 필요" value={`${pendingGames.length}개`} variant="warning" />
          <StatsCard label="오늘 GP 충전" value={formatGP(todayChargeGP)} variant="gp" />
          <StatsCard label="오늘 GP 출금" value={formatGP(todayWithdrawGP)} variant="gp" />
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">게임 관리</h2>
          <Link href="/game-zone/games" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            전체 보기 <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <GameTypeCard
            name="Prediction Market"
            href="/game-zone/games"
            stats={[
              { label: '진행중 게임', value: `${activeGames.length}개` },
              { label: '결과 입력 필요', value: `${pendingGames.length}개` },
              { label: '오늘 참여자', value: `${formatNumber(todayParticipants)}명` },
            ]}
          />
          <GameTypeCard
            name="Survival Trivia"
            href="#"
            comingSoon
          />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <InfoCard
            title="랭킹"
            href="/game-zone/ranking"
            items={[
              { label: 'TOP 10 공개', value: rankingSettings.top10Public ? 'ON' : 'OFF', badge: rankingSettings.top10Public },
              { label: 'TOP 1', value: top1User?.nickname || '-' },
              { label: 'TOP 1 누적 GP', value: top1User ? formatGP(top1User.accumulatedGP) : '-' },
            ]}
          />
          <InfoCard
            title="GP 교환소"
            href="/game-zone/exchange"
            items={[
              { label: '오늘 GP 충전', value: formatGP(todayChargeGP) },
              { label: '오늘 GP 출금', value: formatGP(todayWithdrawGP) },
            ]}
          />
        </div>
        <InfoCard
          title="GP 변동 내역"
          href="/game-zone/gp-history"
          items={[
            { label: '오늘 GP 변동 건수', value: `${todayGPChanges.length}건` },
          ]}
        />
      </section>
    </div>
  );
}

function InfoCard({ title, href, items }: {
  title: string;
  href: string;
  items: { label: string; value: string; badge?: boolean }[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <Link href={href} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          바로가기 <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{item.label}</span>
            {item.badge !== undefined ? (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.badge ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {item.value}
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
