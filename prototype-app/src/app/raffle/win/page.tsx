import SubHeader from '@/components/layout/SubHeader';
import { Card } from '@/components/ui/primitives';
import { WIN_DETAIL } from '@/lib/data';

export default function RaffleWinPage() {
  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title="RAFFLE" />
      <div className="space-y-4 px-4 pt-2">
        <div>
          <p className="text-[18px] font-bold">🎁 {WIN_DETAIL.title}</p>
          <p className="mt-1 text-[13px] text-text-body">ℹ️ {WIN_DETAIL.pickup}</p>
        </div>

        <Card className="p-4">
          <p className="text-[13px] text-text-body">당첨내역</p>
          <p className="mt-1 text-[15px] font-semibold">{WIN_DETAIL.prize}</p>
        </Card>

        <Card className="space-y-3 p-4">
          <Row label="수령 일시" value={WIN_DETAIL.date} sub={`운영시간 ${WIN_DETAIL.hours}`} />
          <Row label="수령 장소" value={WIN_DETAIL.place} />
          <Row label="지참물" value={`🪪 ${WIN_DETAIL.bring}`} />
        </Card>

        <p className="text-[12px] text-purple-light">수령 기간이 지나면 상품을 수령할 수 없어요. 기간 내 꼭 수령해 주세요!</p>
      </div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-16 shrink-0 text-[13px] text-text-body">{label}</span>
      <div>
        <p className="text-[14px] font-medium text-purple-light">{value}</p>
        {sub && <p className="text-[12px] text-text-disabled">{sub}</p>}
      </div>
    </div>
  );
}
