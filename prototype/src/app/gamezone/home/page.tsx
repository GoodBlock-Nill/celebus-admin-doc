'use client';

import Link from 'next/link';
import { TrophyIcon, UsersIcon, ArrowsRightLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { gameZoneStats } from '@/mock/gamezone';

function StatBlock({ label, value, icon: Icon, iconBg, iconColor }: { label: string; value: string | number; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; iconBg: string; iconColor: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

function SubCard({ title, href, rows }: { title: string; href: string; rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <Link href={href} className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
          바로가기 <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{r.label}</span>
            <span className="font-semibold text-gray-900">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GameZoneHomePage() {
  return (
    <div>
      <PageHeader title="게임존" breadcrumbItems={[{ label: '게임존' }, { label: '게임존 홈' }]} />

      {/* 전체 현황 */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">전체 현황</h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatBlock label="진행중 게임 (개)" value={gameZoneStats.activeGames} icon={TrophyIcon} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatBlock label="결과 입력 필요 (개)" value={gameZoneStats.resultPending} icon={UsersIcon} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <StatBlock label="오늘 GP 충전" value={gameZoneStats.todayCharge} icon={ArrowsRightLeftIcon} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatBlock label="오늘 GP 출금" value={gameZoneStats.todayWithdraw} icon={ArrowsRightLeftIcon} iconBg="bg-red-50" iconColor="text-red-600" />
      </div>

      {/* 게임 관리 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">게임 관리</h3>
        <Link href="/gamezone/games" className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
          전체 보기 <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <SubCard title="Prediction Market" href="/gamezone/games" rows={[
          { label: '진행중 게임', value: `${gameZoneStats.pm.active}개` },
          { label: '결과 입력 필요', value: `${gameZoneStats.pm.resultPending}개` },
          { label: '오늘 참여자', value: `${gameZoneStats.pm.todayParticipants}명` },
        ]} />
        <SubCard title="Survival Trivia" href="/gamezone/games" rows={[
          { label: '진행중 게임', value: `${gameZoneStats.st.active}개` },
          { label: '게시 대기', value: `${gameZoneStats.st.ready}개` },
          { label: '오늘 참여자', value: `${gameZoneStats.st.todayParticipants}명` },
        ]} />
      </div>

      {/* 운영 요약 */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">운영 요약</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <SubCard title="랭킹" href="/gamezone/ranking" rows={[
          { label: 'TOP 10 공개', value: <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{gameZoneStats.ranking.top10Public ? 'ON' : 'OFF'}</span> },
          { label: 'TOP 1', value: gameZoneStats.ranking.top1Nickname },
          { label: 'TOP 1 누적 GP', value: `${gameZoneStats.ranking.top1GP} GP` },
        ]} />
        <SubCard title="GP 교환소" href="/gamezone/exchange" rows={[
          { label: '오늘 GP 충전', value: `${gameZoneStats.exchange.todayCharge} GP` },
          { label: '오늘 GP 출금', value: `${gameZoneStats.exchange.todayWithdraw} GP` },
        ]} />
      </div>
      <SubCard title="GP 변동 내역" href="/gamezone/gp-history" rows={[
        { label: '오늘 GP 변동 건수', value: `${gameZoneStats.gpHistory.todayCount}건` },
      ]} />
    </div>
  );
}
