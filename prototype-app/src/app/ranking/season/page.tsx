import { Check } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { Card } from '@/components/ui/primitives';
import { SEASON, SEASON_REWARDS } from '@/lib/data';

export default function SeasonInfoPage() {
  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title="시즌 보상 안내" />
      <div className="space-y-6 px-4 pt-2">
        {/* 시즌 정보 */}
        <section>
          <h2 className="mb-2 text-[14px] font-semibold">🗓 시즌 정보</h2>
          <Card className="p-4">
            <p className="text-[15px] font-bold">{SEASON.name} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-text-body">종료 D-{SEASON.endDday}</span></p>
            <p className="mt-1 text-[13px] text-text-body">2026.05.14 ~ 2026.00.00 KST</p>
            <p className="mt-0.5 text-[12px] text-text-disabled">시즌 종료 후 최종 랭킹이 확정됩니다.</p>
          </Card>
        </section>

        {/* 시즌 보상 */}
        <section>
          <h2 className="mb-1 text-[14px] font-semibold">🎁 시즌 보상</h2>
          <p className="mb-2 text-[12px] text-text-disabled">ⓘ 보상은 최종 달성 랭킹 기준 상위 보상만 지급돼요.</p>
          <div className="space-y-2">
            {SEASON_REWARDS.map((t) => (
              <Card key={t.tier} className="p-4">
                <p className="text-[14px] font-semibold">{t.tier}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.items.map((i) => (
                    <span key={i} className="rounded-full border border-primary/50 px-2.5 py-1 text-[12px] text-purple-light">{i}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 빠르게 덕력 쌓는 방법 */}
        <section>
          <h2 className="mb-2 text-[14px] font-semibold">✦ 빠르게 덕력 쌓는 방법</h2>
          <Card className="space-y-2.5 p-4">
            {['매일 출석 체크하기', '일일 미션 모두 완료하기', '진행 중인 퀘스트 참여하기'].map((m) => (
              <p key={m} className="flex items-center gap-2 text-[13px]"><Check className="size-4 text-primary" />{m}</p>
            ))}
            <button className="mt-1 w-full text-right text-[13px] font-medium text-primary">덕력 쌓으러 가기 ›</button>
          </Card>
        </section>

        {/* 유의사항 */}
        <section>
          <h2 className="mb-2 text-[14px] font-semibold">📣 꼭 읽어주세요</h2>
          <ul className="space-y-1.5 text-[13px] text-text-body">
            <li>• 랭킹은 획득 덕력만 반영됩니다.</li>
            <li>• 보상은 시즌 종료 후 지급됩니다.</li>
            <li>• 보상은 상위 보상만 제공됩니다. (중복 미제공)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
