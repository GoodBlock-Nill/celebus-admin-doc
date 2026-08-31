'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, NumberInput, Select, TextInput } from '../../_components/form';
import { COMP_POOL_TYPES, isCompPoolType } from '../../_components/pools';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { AdminMemberOptionView, AdminSessionView, CompPoolType } from '@/lib/admin-types';
import { poolLabel } from '@/lib/api-types';

const DEFAULT_QTY = '1';

function memberLabel(member: AdminMemberOptionView): string {
  return member.nickname ? `${member.realNameMasked} (${member.nickname})` : member.realNameMasked;
}

/** 당첨자·초대 명단 무상 발급 폼 — 대상은 본인확인을 마친 회원만 선택할 수 있다. */
export function CompIssueForm({
  concertId,
  sessions,
  onDone,
}: {
  concertId: string;
  sessions: AdminSessionView[];
  onDone: () => void;
}) {
  const toast = useToast();

  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '');
  const [poolType, setPoolType] = useState<CompPoolType>('CELEBUS_WINNER');
  const [qty, setQty] = useState(DEFAULT_QTY);
  const [reason, setReason] = useState('');
  const [keyword, setKeyword] = useState('');
  const [members, setMembers] = useState<AdminMemberOptionView[]>([]);
  const [memberId, setMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const searchMembers = useCallback(async (query: string) => {
    const result = await adminApi.members(query);
    if (!result.ok) {
      setMembers([]);
      return;
    }
    setMembers(result.data.items);
    setMemberId((current) =>
      result.data.items.some((item) => item.id === current) ? current : (result.data.items[0]?.id ?? ''),
    );
  }, []);

  useEffect(() => {
    void searchMembers('');
  }, [searchMembers]);

  const reasonRequired = poolType === 'OPERATION_HOLD';
  const session = sessions.find((item) => item.id === sessionId) ?? sessions[0];
  const targetMember = members.find((item) => item.id === memberId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberId) {
      toast.error('지급 대상 회원을 선택해 주세요.');
      return;
    }

    const parsed = Number(qty);
    setSubmitting(true);
    const result = await adminApi.issueCompTickets({
      concertId,
      sessionId: session?.id ?? sessionId,
      poolType,
      memberId,
      qty: parsed,
      reason: reason.trim(),
    });
    setSubmitting(false);

    toast.fromResult(
      result,
      `${poolLabel(poolType)} ${parsed}매를 ${targetMember ? memberLabel(targetMember) : ''}에게 발급했습니다.`,
    );
    if (result.ok) {
      setReason('');
      onDone();
    }
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
        <Field label="회원 검색" hint="실명 또는 닉네임 일부를 입력해 검색합니다.">
          <div className="flex gap-1.5">
            <TextInput
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="예) 홍길동"
              maxLength={20}
            />
            <Button onClick={() => void searchMembers(keyword.trim())}>검색</Button>
          </div>
        </Field>
        <Field label="발급 매수">
          <NumberInput min={1} value={qty} onChange={(event) => setQty(event.target.value)} />
        </Field>
      </div>

      <Field
        label="지급 대상 회원"
        required
        hint="본인확인을 마친 회원만 선택할 수 있으며, 실명은 마스킹해 표시합니다."
      >
        <Select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
          {members.length === 0 ? <option value="">검색 결과가 없습니다</option> : null}
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {memberLabel(member)}
            </option>
          ))}
        </Select>
      </Field>

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
          maxLength={100}
        />
      </Field>

      <InfoNote tone="neutral">
        발급 즉시 대상 회원의 티켓함에 실명 티켓이 생성되고 해당 분류의 발급 수량이 증가합니다.
      </InfoNote>

      <div>
        <Button type="submit" variant="primary" disabled={submitting || sessions.length === 0}>
          무상 티켓 발급
        </Button>
      </div>
    </form>
  );
}
