'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTicketStore } from '@/lib/store';
import { poolLabel } from '@/lib/store-ticket';
import type { CompPoolType } from '@/lib/store-types';
import type { ConcertSession } from '@/lib/types';
import { Button, Field, NumberInput, Select, TextInput } from '../../_components/form';
import { COMP_POOL_TYPES } from '../../_components/pools';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';

const DEFAULT_QTY = '1';

function isCompPoolType(value: string): value is CompPoolType {
  return (COMP_POOL_TYPES as string[]).includes(value);
}

/** 래플 당첨자·초대 명단 무상 발급 폼 */
export function CompIssueForm({ sessions }: { sessions: ConcertSession[] }) {
  const users = useTicketStore((state) => state.users);
  const issueCompTickets = useTicketStore((state) => state.issueCompTickets);
  const toast = useToast();

  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '');
  const [poolType, setPoolType] = useState<CompPoolType>('CELEBUS_WINNER');
  const [userId, setUserId] = useState(users[0]?.id ?? '');
  const [qty, setQty] = useState(DEFAULT_QTY);
  const [reason, setReason] = useState('');

  const reasonRequired = poolType === 'OPERATION_HOLD';
  const session = sessions.find((item) => item.id === sessionId) ?? sessions[0];
  const targetUser = users.find((item) => item.id === userId) ?? users[0];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(qty);
    const result = issueCompTickets({
      sessionId: session?.id ?? sessionId,
      poolType,
      userId: targetUser?.id ?? userId,
      qty: parsed,
      reason,
    });
    toast.fromResult(
      result,
      `${poolLabel(poolType)} ${parsed}매를 ${targetUser?.nickname ?? ''}에게 발급했습니다.`,
    );
    if (result.ok) setReason('');
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
        <Field label="발급 분류">
          <Select
            value={poolType}
            onChange={(event) => {
              if (isCompPoolType(event.target.value)) setPoolType(event.target.value);
            }}
          >
            {COMP_POOL_TYPES.map((item) => (
              <option key={item} value={item}>
                {poolLabel(item)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="지급 대상 회원">
          <Select value={userId} onChange={(event) => setUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nickname}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="발급 매수">
          <NumberInput min={1} value={qty} onChange={(event) => setQty(event.target.value)} />
        </Field>
      </div>

      <Field
        label="발급 사유"
        required={reasonRequired}
        hint={
          reasonRequired
            ? '운영 보류분은 사유 입력이 필수입니다. (예: 현장 운영 인력 좌석)'
            : '당첨 회차·초대 명단 근거 등을 남겨 두면 활동 로그에서 추적할 수 있습니다.'
        }
      >
        <TextInput
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={reasonRequired ? '예) 현장 운영 인력 좌석' : '예) 9월 래플 1차 당첨자 지급'}
        />
      </Field>

      <InfoNote tone="neutral">
        래플 당첨자 지급·IX 초대 명단 지급을 모의하는 화면입니다. 발급 즉시 대상 회원의 티켓함에 실명 티켓이 생성되고
        해당 분류의 발급 수량이 증가합니다.
      </InfoNote>

      <div>
        <Button type="submit" variant="primary">
          무상 티켓 발급
        </Button>
      </div>
    </form>
  );
}
