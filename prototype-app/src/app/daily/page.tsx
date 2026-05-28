'use client';

import { useState } from 'react';
import { Check, ChevronRight, Gamepad2, BookHeart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SubHeader from '@/components/layout/SubHeader';
import { Card } from '@/components/ui/primitives';
import { ATTENDANCE, WEEK, DAILY_MISSIONS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function DailyPage() {
  const [checkedIn, setCheckedIn] = useState(true);
  const [missions, setMissions] = useState(() => DAILY_MISSIONS.map((m) => ({ ...m, done: true })));
  const allDone = checkedIn && missions.every((m) => m.done);

  return (
    <div className="min-h-dvh pb-8">
      <SubHeader title="오늘의 할 일" />

      <div className="space-y-6 px-4 pt-2">
        {/* 출석체크 */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[14px] font-semibold">
            출석체크 <span className="text-[12px] font-normal text-purple-light"><Sparkles className="mr-0.5 inline size-3" />매일 5 DUK 획득 가능</span>
          </div>
          <Card className="mb-2 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary-900 text-[16px]">🙌</span>
              <div>
                <p className="text-[14px] font-semibold">출석 체크</p>
                <p className="text-[12px] text-purple-light">✦ 5</p>
              </div>
            </div>
            {checkedIn ? (
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[12px] text-text-body"><Check className="size-3.5" /> 출석완료</span>
            ) : (
              <button onClick={() => { setCheckedIn(true); toast.success('출석 완료! 덕력 5DUK 획득'); }} className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-white">출석하기</button>
            )}
          </Card>
          <Card className="gra-primary flex items-center justify-between border-0 p-4">
            <div>
              <p className="text-[14px] font-semibold text-white">⭐ {ATTENDANCE.streak}일째 연속 출석 중</p>
              <p className="text-[12px] text-white/80">7일 달성시 보너스까지 D-{ATTENDANCE.bonusDday}</p>
            </div>
            <ChevronRight className="size-5 text-white" />
          </Card>
        </section>

        {/* 일일미션 */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[14px] font-semibold">
            일일미션 <span className="text-[12px] font-normal text-purple-light"><Sparkles className="mr-0.5 inline size-3" />모든 미션 완료시 25 DUK 지급!</span>
          </div>

          {/* 주간 캘린더 */}
          <Card className="mb-3 p-4">
            <div className="flex justify-between">
              {WEEK.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-2">
                  <span className={cn('text-[12px]', d.today ? 'font-bold text-foreground' : 'text-text-disabled')}>{d.day}</span>
                  <span className={cn('grid size-7 place-items-center rounded-full border', d.done ? 'border-primary bg-primary' : 'border-border-card')}>
                    {d.done && <Check className="size-4 text-white" />}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {allDone && <p className="mb-2 text-center text-[13px] font-medium text-purple-light">🎉 오늘의 할 일을 모두 완료했어요! +✦25</p>}

          <div className="space-y-2">
            {missions.map((m, i) => (
              <Card key={m.id} className="flex items-center justify-between p-3.5">
                <span className="flex items-center gap-2.5 text-[14px] font-medium">
                  {i === 0 ? <Gamepad2 className="size-4 text-primary" /> : <BookHeart className="size-4 text-primary" />}
                  {m.title}
                </span>
                {m.done ? (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[12px] text-text-body"><Check className="size-3.5" /> 미션완료</span>
                ) : (
                  <button onClick={() => setMissions((s) => s.map((x) => (x.id === m.id ? { ...x, done: true } : x)))} className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-white">미션하기</button>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
