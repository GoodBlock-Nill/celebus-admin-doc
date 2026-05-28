import Link from 'next/link';
import { ChevronDown, ChevronRight, Gift, Sparkles } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { Card } from '@/components/ui/primitives';
import { RANKING, ME, SEASON } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function RankingPage() {
  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title="덕력 랭킹" />
      <div className="space-y-4 px-4 pt-2">
        {/* 시즌 드롭다운 */}
        <Card className="flex items-center justify-between p-3.5">
          <span className="text-[14px] font-medium">{SEASON.name} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-text-body">종료 D-{SEASON.endDday}</span></span>
          <ChevronDown className="size-4 text-text-disabled" />
        </Card>

        {/* 내 랭킹 */}
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[13px] text-text-body">내 랭킹</p>
              <p className="text-[28px] font-bold leading-tight">{ME.rank}위 <span className="align-middle rounded bg-primary-900 px-2 py-0.5 text-[12px] text-purple-light">상위 {ME.rankPercent}%</span></p>
            </div>
            <Link href="/ranking/history" className="flex items-center gap-0.5 rounded-lg border border-border-card px-3 py-1.5 text-[12px] text-text-card">덕력 내역 보기<ChevronRight className="size-3.5" /></Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Card className="p-3"><p className="text-[12px] text-text-body"><Sparkles className="mr-1 inline size-3 text-primary" />획득</p><p className="mt-0.5 text-[18px] font-bold">{ME.dukEarned.toLocaleString()} DUK</p></Card>
            <Card className="p-3"><p className="text-[12px] text-text-body"><Sparkles className="mr-1 inline size-3 text-purple-light" />보유</p><p className="mt-0.5 text-[18px] font-bold">{ME.duk.toLocaleString()} DUK</p></Card>
          </div>
          <p className="mt-2 text-[12px] text-text-disabled">ⓘ 랭킹은 획득 덕력만 반영돼요.</p>
        </div>

        {/* 시즌 보상 카드 */}
        <Link href="/ranking/reward">
          <Card className="flex items-center justify-between bg-primary-900/40 p-4">
            <div className="flex items-center gap-3">
              <Gift className="size-6 text-primary" />
              <div>
                <p className="text-[14px] font-semibold">시즌 보상</p>
                <p className="text-[12px] text-text-body">보상을 확인 해보세요</p>
              </div>
            </div>
            <span className="rounded-full border border-primary px-3 py-1.5 text-[12px] font-medium text-primary">보상 확인</span>
          </Card>
        </Link>

        {/* TOP 100 */}
        <div>
          <h2 className="mb-2 text-[15px] font-semibold">👑 TOP 100</h2>
          <Card className="divide-y divide-border-card">
            {RANKING.map((r) => (
              <div key={r.rank} className={cn('flex items-center gap-3 px-4 py-3', r.me && 'bg-primary-900/40')}>
                <span className="w-5 text-[14px] font-bold text-text-body">{r.rank}</span>
                <span className="flex-1 text-[14px]">{r.nickname}{r.me && <span className="ml-1.5 text-[11px] font-bold text-primary">YOU</span>}</span>
                <span className="flex items-center gap-1 text-[14px] font-semibold"><Sparkles className="size-3.5 text-primary" />{r.duk.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
