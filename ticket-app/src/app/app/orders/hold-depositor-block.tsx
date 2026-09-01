'use client';

import { useState } from 'react';

import { Field, TextInput } from '../_components/form-controls';
import { BlockError, BlockSubmitButton, ResolutionBlock, SubmittedNote } from './hold-resolution-parts';
import { useHoldInfoSubmit } from './use-hold-info';
import type { OrderDetailView } from '@/lib/api-types';

const NAME_MAX_LENGTH = 20;

const DESCRIPTION =
  '실제로 입금하신 이름을 알려주시면 운영자가 그 이름으로 은행 내역을 대조해요. 예매를 다시 하실 필요는 없어요.';

const SUBMITTED_MESSAGE = '운영자가 알려주신 이름으로 은행 내역을 대조합니다.';

/**
 * 입금자명이 어긋난 경우의 해결 블록.
 * 회원은 이미 송금을 마쳤으므로 "다시 보내라"가 아니라 "실제로 쓴 이름을 알려달라"고 요청한다.
 */
export function HoldDepositorBlock({
  order,
  step,
  onDone,
}: {
  order: OrderDetailView;
  step: number;
  onDone?: () => void;
}) {
  const { isSubmitting, errorMessage, setErrorMessage, submit } = useHoldInfoSubmit(order.id, onDone);

  const [savedName, setSavedName] = useState(order.holdActualDepositor);
  const [savedAt, setSavedAt] = useState(order.holdInfoSubmittedAt);
  const [isEditing, setEditing] = useState(false);
  const [name, setName] = useState(order.holdActualDepositor ?? '');

  const showsForm = isEditing || !savedName;

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setErrorMessage('실제로 입금하신 이름을 입력해 주세요.');
      return;
    }

    const result = await submit({ actualDepositor: trimmed });
    if (!result) return;

    setSavedName(trimmed);
    setSavedAt(result.holdInfoSubmittedAt);
    setEditing(false);
  };

  return (
    <ResolutionBlock step={step} title="실제 입금자명 알려주기" description={DESCRIPTION}>
      {showsForm ? (
        <div className="flex flex-col gap-3">
          <Field
            label="실제로 입금한 이름"
            hint={`송금 내역에 찍힌 이름 그대로 적어 주세요 (최대 ${NAME_MAX_LENGTH}자)`}
          >
            <TextInput
              value={name}
              onChange={setName}
              placeholder="예: 홍길동"
              maxLength={NAME_MAX_LENGTH}
            />
          </Field>
          <BlockSubmitButton
            label="알려주기"
            busy={isSubmitting}
            disabled={name.trim().length === 0}
            onClick={() => void handleSubmit()}
          />
          {savedName ? (
            <button
              type="button"
              onClick={() => {
                setName(savedName);
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
          rows={[{ label: '실제 입금자명', value: savedName }]}
          submittedAt={savedAt}
          message={SUBMITTED_MESSAGE}
          onEdit={() => {
            setName(savedName);
            setErrorMessage('');
            setEditing(true);
          }}
        />
      )}
    </ResolutionBlock>
  );
}
