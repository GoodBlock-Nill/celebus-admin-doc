'use client';

import { MS_PER_HOUR } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import { ConfirmDialog } from './confirm-dialog';
import { Button, Select } from './form';
import { useConfirm, useNow } from './hooks';

const HOURS_PER_DAY = 24;
const SECOND_PAD = 2;

function withSeconds(now: Date): string {
  const seconds = String(now.getSeconds()).padStart(SECOND_PAD, '0');
  return `${formatDateTime(now.toISOString())}:${seconds}`;
}

function offsetText(offsetMs: number): string {
  if (offsetMs === 0) return '실제 시각과 동일';
  const hours = Math.round(offsetMs / MS_PER_HOUR);
  return `실제 시각 대비 ${hours >= 0 ? '+' : ''}${hours}시간`;
}

/** 사이드바 하단 데모 컨트롤 — 시간 이동·사용자 전환·초기화 */
export function DemoPanel() {
  const hydrated = useHydrated();
  const now = useNow();
  const users = useTicketStore((state) => state.users);
  const currentUserId = useTicketStore((state) => state.currentUserId);
  const demoOffsetMs = useTicketStore((state) => state.demoOffsetMs);
  const advanceTime = useTicketStore((state) => state.advanceTime);
  const resetTime = useTicketStore((state) => state.resetTime);
  const switchUser = useTicketStore((state) => state.switchUser);
  const resetDemo = useTicketStore((state) => state.resetDemo);
  const confirm = useConfirm();

  return (
    <div className="border-t border-[#E3E5EA] px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.08em] text-[#6B7080]">데모 컨트롤</p>

      <div className="mt-2 rounded-lg border border-[#E3E5EA] bg-[#FAFBFC] px-3 py-2">
        <p className="text-[13px] font-semibold tabular-nums text-[#1B1D22]">
          {hydrated ? withSeconds(now) : '불러오는 중…'}
        </p>
        <p className="mt-0.5 text-[11px] text-[#6B7080]">
          {hydrated ? offsetText(demoOffsetMs) : '데모 시각'}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button size="sm" onClick={() => advanceTime(MS_PER_HOUR)}>
          +1시간
        </Button>
        <Button size="sm" onClick={() => advanceTime(HOURS_PER_DAY * MS_PER_HOUR)}>
          +24시간
        </Button>
        <Button size="sm" className="col-span-2" onClick={resetTime}>
          시간 초기화
        </Button>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold text-[#6B7080]">데모 사용자</p>
        <Select
          value={hydrated ? currentUserId : ''}
          onChange={(event) => switchUser(event.target.value)}
          disabled={!hydrated}
          className="py-1.5 text-[12px]"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.nickname}
            </option>
          ))}
        </Select>
      </div>

      <Button
        variant="danger"
        size="sm"
        className="mt-3 w-full"
        onClick={() =>
          confirm.ask({
            title: '데모 데이터를 초기화할까요?',
            message: '주문·티켓·입금·신고 내역이 모두 삭제되고 처음 상태로 돌아갑니다.',
            confirmLabel: '초기화',
            confirmVariant: 'danger',
            onConfirm: resetDemo,
          })
        }
      >
        데모 초기화
      </Button>

      <ConfirmDialog request={confirm.request} onClose={confirm.close} />
    </div>
  );
}
