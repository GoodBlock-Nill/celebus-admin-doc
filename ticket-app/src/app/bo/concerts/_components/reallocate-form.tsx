'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTicketStore } from '@/lib/store';
import { poolLabel } from '@/lib/store-ticket';
import type { ConcertSession, PoolType } from '@/lib/types';
import { Button, Field, NumberInput, Select } from '../../_components/form';
import { POOL_TYPES } from '../../_components/pools';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';

const DEFAULT_QTY = '10';

function isPoolType(value: string): value is PoolType {
  return (POOL_TYPES as string[]).includes(value);
}

/** 분류 간 배정 수량 이동 폼 */
export function ReallocateForm({ sessions }: { sessions: ConcertSession[] }) {
  const reallocatePool = useTicketStore((state) => state.reallocatePool);
  const toast = useToast();

  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '');
  const [from, setFrom] = useState<PoolType>('PAID_SALE');
  const [to, setTo] = useState<PoolType>('CELEBUS_WINNER');
  const [qty, setQty] = useState(DEFAULT_QTY);

  const session = sessions.find((item) => item.id === sessionId) ?? sessions[0];
  const fromStock = session?.pools[from];
  const fromRemaining = fromStock ? fromStock.allocated - fromStock.reserved - fromStock.issued : 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(qty);
    const result = reallocatePool(session?.id ?? sessionId, from, to, parsed);
    toast.fromResult(
      result,
      `${session?.name ?? ''} · ${poolLabel(from)} → ${poolLabel(to)} ${parsed}매 이동했습니다.`,
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Field label="회차">
          <Select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
            {sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="이동 출발 분류" hint={`현재 잔여 ${fromRemaining.toLocaleString('ko-KR')}매`}>
          <Select
            value={from}
            onChange={(event) => {
              if (isPoolType(event.target.value)) setFrom(event.target.value);
            }}
          >
            {POOL_TYPES.map((poolType) => (
              <option key={poolType} value={poolType}>
                {poolLabel(poolType)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="이동 도착 분류">
          <Select
            value={to}
            onChange={(event) => {
              if (isPoolType(event.target.value)) setTo(event.target.value);
            }}
          >
            {POOL_TYPES.map((poolType) => (
              <option key={poolType} value={poolType}>
                {poolLabel(poolType)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="이동 수량">
          <NumberInput min={1} value={qty} onChange={(event) => setQty(event.target.value)} />
        </Field>
      </div>

      <InfoNote>
        선점·발급된 수량은 이동할 수 없으며 잔여 범위 안에서만 조정됩니다. 분류 간 이동은 활동 로그에 기록됩니다.
      </InfoNote>

      <div>
        <Button type="submit" variant="primary">
          배정 수량 이동
        </Button>
      </div>
    </form>
  );
}
