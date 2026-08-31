'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { formatKrw } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import { orderNoTail } from '@/lib/store-helpers';
import { Button, Field, NumberInput, TextInput } from '../../_components/form';
import { DEPOSIT_STATUS_VIEW } from '../../_components/labels';
import { useToast } from '../../_components/toast';
import { Card, InfoNote } from '../../_components/ui';
import { firstAwaitingOrder } from './deposit-rows';

/** 금액 불일치 시나리오에서 덜 입금하는 금액 */
const SHORT_AMOUNT_KRW = 10_000;
/** 이름 불일치 시나리오에 사용하는 타인 명의 */
const WRONG_DEPOSITOR_NAME = '김대리';

interface Preset {
  key: string;
  label: string;
  caption: string;
  build: (realName: string, amountKrw: number, orderNo: string) => { name: string; amount: number };
}

const PRESETS: Preset[] = [
  {
    key: 'normal',
    label: '① 정상 입금',
    caption: '실명 + 정확한 금액 → 자동 대조 완료',
    build: (realName, amountKrw) => ({ name: realName, amount: amountKrw }),
  },
  {
    key: 'name',
    label: '② 이름 불일치',
    caption: `"${WRONG_DEPOSITOR_NAME}" + 정확한 금액 → 보류`,
    build: (_realName, amountKrw) => ({ name: WRONG_DEPOSITOR_NAME, amount: amountKrw }),
  },
  {
    key: 'amount',
    label: '③ 금액 불일치',
    caption: `실명 + ${SHORT_AMOUNT_KRW.toLocaleString('ko-KR')}원 부족 → 미대조`,
    build: (realName, amountKrw) => ({
      name: realName,
      amount: Math.max(1, amountKrw - SHORT_AMOUNT_KRW),
    }),
  },
  {
    key: 'backup',
    label: '④ 백업 규칙 입금',
    caption: '실명 + 주문번호 끝 4자리 → 자동 대조 완료',
    build: (realName, amountKrw, orderNo) => ({
      name: `${realName}${orderNoTail(orderNo)}`,
      amount: amountKrw,
    }),
  },
];

/** 모의 입금 발생 패널 — 은행 입금 알림을 대신한다. */
export function MockDepositPanel() {
  const orders = useTicketStore((state) => state.orders);
  const verifications = useTicketStore((state) => state.verifications);
  const addDeposit = useTicketStore((state) => state.addDeposit);
  const toast = useToast();

  const [depositorName, setDepositorName] = useState('');
  const [amount, setAmount] = useState('');

  const target = useMemo(() => firstAwaitingOrder(orders), [orders]);
  const targetRealName = target
    ? verifications.find((item) => item.userId === target.userId)?.realName
    : undefined;
  const presetReady = Boolean(target && targetRealName);

  const submit = (name: string, amountKrw: number) => {
    const result = addDeposit({ depositorName: name, amountKrw });
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    toast.success(
      `${name} · ${formatKrw(amountKrw)} 입금 접수 — 자동 대조 결과 ${
        DEPOSIT_STATUS_VIEW[result.deposit.status].label
      }`,
    );
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(depositorName.trim(), Number(amount));
  };

  return (
    <Card
      title="모의 입금 발생"
      description="은행 입금 알림을 대신해 입금 건을 만들고 자동 대조 결과를 확인합니다."
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
          <Field label="입금자명">
            <TextInput
              value={depositorName}
              onChange={(event) => setDepositorName(event.target.value)}
              placeholder="예) 홍길동"
            />
          </Field>
          <Field label="입금액 (원)">
            <NumberInput
              min={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="예) 55000"
            />
          </Field>
          <Button type="submit" variant="primary">
            입금 발생
          </Button>
        </form>

        <div className="flex flex-col gap-3">
          {presetReady && target && targetRealName ? (
            <InfoNote>
              대상 주문 <b>{target.orderNo}</b> · 주문자 <b>{targetRealName}</b> · 청구액{' '}
              <b className="tabular-nums">{formatKrw(target.amountKrw)}</b> ({target.qty}매)
            </InfoNote>
          ) : (
            <InfoNote tone="warning">
              입금 대기 주문이 없습니다. 앱에서 주문을 먼저 생성하세요.
            </InfoNote>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                disabled={!presetReady}
                onClick={() => {
                  if (!target || !targetRealName) return;
                  const built = preset.build(targetRealName, target.amountKrw, target.orderNo);
                  submit(built.name, built.amount);
                }}
                className="rounded-lg border border-[#C9CDD6] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#3056D3] hover:bg-[#EDF1FD] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#C9CDD6] disabled:hover:bg-white"
              >
                <span className="block text-[13px] font-bold text-[#1B1D22]">{preset.label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-[#6B7080]">
                  {preset.caption}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
