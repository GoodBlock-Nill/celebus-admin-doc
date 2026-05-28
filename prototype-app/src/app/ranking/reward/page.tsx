import Image from 'next/image';
import { ChevronDown, Crown, Check } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { Card } from '@/components/ui/primitives';
import { MY_REWARDS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function MyRewardPage() {
  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title="내 보상" />
      <div className="space-y-5 px-4 pt-2">
        {/* 시즌 드롭다운 */}
        <Card className="flex items-center justify-between p-3.5">
          <span className="text-[14px] font-medium">{MY_REWARDS.selectedSeason}</span>
          <ChevronDown className="size-4 text-text-disabled" />
        </Card>

        {/* 달성 결과 */}
        <div className="flex flex-col items-center py-4">
          <Crown className="size-14 text-primary" />
          <p className="mt-2 text-[20px] font-bold">{MY_REWARDS.achievement}</p>
          <p className="text-[13px] text-text-body">시즌 보상을 획득했어요!</p>
        </div>

        {/* 획득한 보상 */}
        <section>
          <h2 className="mb-2 text-[14px] font-semibold">획득한 보상</h2>
          <div className="space-y-2">
            {MY_REWARDS.rewards.map((r) => (
              <Card key={r.name} className="flex items-center gap-3 p-3.5">
                <Image src={r.image} alt={r.name} width={44} height={44} className="size-11 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-[14px] font-medium">{r.name}</p>
                  <p className={cn('text-[12px]', r.physical ? 'text-purple-light' : 'text-text-disabled')}>{r.status}</p>
                </div>
                {r.physical && <button className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-medium text-white">배송지 입력</button>}
              </Card>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-text-disabled">실물 보상은 배송지 입력 후 순차적으로 배송됩니다.</p>
          <p className="text-[12px] text-text-disabled">입력기한 {MY_REWARDS.deadline} 까지</p>
        </section>

        {/* 보상 받은 시즌 */}
        <section>
          <h2 className="mb-2 text-[14px] font-semibold">보상 받은 시즌</h2>
          <div className="divide-y divide-border-card">
            {MY_REWARDS.seasons.map((s) => (
              <div key={s.name} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[14px] font-medium">{s.name} <span className="ml-1 rounded bg-primary-900 px-1.5 py-0.5 text-[11px] text-purple-light">{s.badge}</span></p>
                  <p className="text-[12px] text-text-disabled">{s.period}</p>
                </div>
                {s.selected && <span className="grid size-6 place-items-center rounded-full bg-primary"><Check className="size-4 text-white" /></span>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
