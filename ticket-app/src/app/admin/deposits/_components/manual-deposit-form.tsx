'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, NumberInput, TextInput } from '../../_components/form';
import { DEPOSIT_STATUS_VIEW } from '../../_components/labels';
import { useToast } from '../../_components/toast';
import { Card, InfoNote } from '../../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { DepositStatus } from '@/lib/admin-types';
import { formatKrw } from '@/lib/format';

/** 수기 입금 등록 — 은행 입금 내역을 보고 운영자가 직접 입력한다. */
export function ManualDepositForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [depositorName, setDepositorName] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = depositorName.trim();
    const amountKrw = Number(amount);

    if (!name) {
      toast.error('입금자명을 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(amountKrw) || amountKrw <= 0) {
      toast.error('입금액을 확인해 주세요.');
      return;
    }

    setSubmitting(true);
    const result = await adminApi.registerDeposit(name, amountKrw);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.reason);
      return;
    }

    const status = result.data.status as DepositStatus;
    toast.success(
      `${name} · ${formatKrw(amountKrw)} 입금 등록 — 자동 대조 결과 ${DEPOSIT_STATUS_VIEW[status].label}`,
    );
    setDepositorName('');
    setAmount('');
    onDone();
  };

  return (
    <Card
      title="수기 입금 등록"
      description="은행 입금 내역을 확인해 입금 건을 등록합니다. 등록 즉시 금액·실명 기준으로 자동 대조됩니다."
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="입금자명" required>
            <TextInput
              value={depositorName}
              onChange={(event) => setDepositorName(event.target.value)}
              placeholder="예) 홍길동"
              maxLength={30}
            />
          </Field>
          <Field label="입금액 (원)" required>
            <NumberInput
              min={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="예) 55000"
            />
          </Field>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? '등록 중…' : '입금 등록'}
          </Button>
        </form>

        <InfoNote>
          자동 대조 규칙 — 금액이 완전히 일치하고 입금자명이 본인확인 실명(또는 실명 + 주문번호 끝 4자리)과 같으면
          <b> 자동 대조 완료</b>, 금액만 맞으면 <b>보류</b>, 마감 이후 입금이면 <b>반환 대상</b>, 그 외에는{' '}
          <b>미대조</b>로 분류됩니다.
        </InfoNote>
      </div>
    </Card>
  );
}
