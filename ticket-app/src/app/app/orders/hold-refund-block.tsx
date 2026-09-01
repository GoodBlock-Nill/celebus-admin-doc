'use client';

import { useState } from 'react';

import { DepositGuideCard } from '../_components/deposit-guide';
import { Field, TextInput } from '../_components/form-controls';
import { ChevronDownIcon } from '../_components/icons';
import { CARD } from '../_components/ui';
import { BlockError, BlockSubmitButton, ResolutionBlock, SubmittedNote } from './hold-resolution-parts';
import { useHoldInfoSubmit } from './use-hold-info';
import type { OrderDetailView } from '@/lib/api-types';

const NAME_MAX_LENGTH = 20;
const ACCOUNT_MAX_LENGTH = 30;
const ACCOUNT_MIN_DIGITS = 6;

/** 자주 쓰는 은행 — 눌러서 채우고, 목록에 없으면 직접 적을 수 있다 */
const QUICK_BANKS = ['국민', '신한', '우리', '하나', '농협', '카카오뱅크', '토스뱅크', '기업'];

const DESCRIPTION =
  '보내주신 금액을 돌려드릴 계좌를 알려주세요. 계좌번호는 안전하게 보관되며 환불에만 사용해요.';

const SUBMITTED_MESSAGE = '알려주신 계좌로 환불해 드릴게요. 계좌번호는 일부만 보여드려요.';

const RESEND_CAPTION =
  '이미 보내신 금액은 등록하신 계좌로 환불되며, 관람을 원하시면 아래 정보로 정확히 다시 송금해 주세요.';

function accountError(account: string): string {
  const trimmed = account.trim();
  if (trimmed.length === 0) return '계좌번호를 입력해 주세요.';
  if (!/^[0-9-]+$/.test(trimmed)) return '계좌번호는 숫자와 하이픈(-)만 입력할 수 있어요.';
  if (trimmed.replace(/-/g, '').length < ACCOUNT_MIN_DIGITS) return '계좌번호를 다시 확인해 주세요.';
  return '';
}

/** 오입금 환불 계좌 등록 블록 — 잘못 보낸 금액을 돌려받는 경로를 먼저 연다. */
export function HoldRefundBlock({
  order,
  step,
  onDone,
}: {
  order: OrderDetailView;
  /** 확인 보류 해결 순서에서 몇 번째인지 — 단독 사용 시에는 생략한다 */
  step?: number;
  onDone?: () => void;
}) {
  const { isSubmitting, errorMessage, setErrorMessage, submit } = useHoldInfoSubmit(order.id, onDone);

  const [saved, setSaved] = useState({
    bank: order.refundBank,
    accountMasked: order.refundAccountMasked,
    holder: order.refundHolder,
    at: order.holdInfoSubmittedAt,
  });
  const [isEditing, setEditing] = useState(false);
  const [bank, setBank] = useState(order.refundBank ?? '');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState(order.refundHolder ?? '');

  const isSaved = Boolean(saved.bank && saved.accountMasked && saved.holder);
  const showsForm = isEditing || !isSaved;
  const canSubmit = bank.trim().length > 0 && account.trim().length > 0 && holder.trim().length > 0;

  const handleSubmit = async () => {
    const message = accountError(account);
    if (message) {
      setErrorMessage(message);
      return;
    }

    const result = await submit({
      refundBank: bank.trim(),
      refundAccount: account.trim(),
      refundHolder: holder.trim(),
    });
    if (!result) return;

    setSaved({
      bank: bank.trim(),
      accountMasked: result.refundAccountMasked,
      holder: holder.trim(),
      at: result.holdInfoSubmittedAt,
    });
    setAccount('');
    setEditing(false);
  };

  return (
    <ResolutionBlock step={step} title="환불 계좌 등록" description={DESCRIPTION}>
      {showsForm ? (
        <div className="flex flex-col gap-3">
          <Field label="은행" hint="목록에 없으면 직접 입력해 주세요">
            <TextInput value={bank} onChange={setBank} placeholder="예: 국민" maxLength={NAME_MAX_LENGTH} />
          </Field>
          <div className="-mt-1 flex flex-wrap gap-1.5">
            {QUICK_BANKS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setBank(name)}
                className={`min-h-[34px] rounded-full border px-3 text-[13px] font-semibold transition ${
                  bank === name
                    ? 'border-[#D6336C] bg-[#FDF2F7] text-[#D6336C]'
                    : 'border-[#E5E8EB] bg-white text-[#4E5968]'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <Field label="계좌번호" hint="숫자와 하이픈(-)만 입력해 주세요">
            <TextInput
              value={account}
              onChange={setAccount}
              placeholder="예: 123456-01-234567"
              inputMode="numeric"
              maxLength={ACCOUNT_MAX_LENGTH}
              numeric
            />
          </Field>
          <Field label="예금주" hint="계좌에 등록된 이름 그대로 적어 주세요">
            <TextInput value={holder} onChange={setHolder} placeholder="예: 홍길동" maxLength={NAME_MAX_LENGTH} />
          </Field>
          <BlockSubmitButton
            label="환불 계좌 등록"
            busy={isSubmitting}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          />
          {isSaved ? (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                setEditing(false);
              }}
              className="min-h-[44px] text-[14px] font-semibold text-[#6B7684]"
            >
              수정 취소
            </button>
          ) : null}
          <BlockError message={errorMessage} />
        </div>
      ) : (
        <SubmittedNote
          rows={[
            { label: '은행', value: saved.bank ?? '' },
            { label: '계좌번호', value: saved.accountMasked ?? '' },
            { label: '예금주', value: saved.holder ?? '' },
          ]}
          submittedAt={saved.at}
          message={SUBMITTED_MESSAGE}
          onEdit={() => {
            setAccount('');
            setErrorMessage('');
            setEditing(true);
          }}
        />
      )}
    </ResolutionBlock>
  );
}

/**
 * 올바른 금액 다시 송금 — 환불 계좌 등록 다음 순서.
 * 관람을 이어가려는 회원만 펼쳐 보도록 접어 둔다.
 */
export function HoldResendFold({ order }: { order: OrderDetailView }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex min-h-[54px] w-full items-center justify-between px-4 py-3 text-left text-[15px] font-bold text-[#191F28]"
      >
        올바른 금액 다시 송금
        <ChevronDownIcon
          className={`h-5 w-5 text-[#8B95A1] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div className="flex flex-col gap-3 border-t border-[#F2F4F6] px-4 pb-4 pt-3.5">
          <p className="text-[13px] leading-relaxed text-[#4E5968]">{RESEND_CAPTION}</p>
          <DepositGuideCard order={order} />
        </div>
      ) : null}
    </section>
  );
}
