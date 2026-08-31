'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTicketStore } from '@/lib/store';
import type { TicketReport } from '@/lib/types';
import { Button, Field, Select, TextInput, Textarea } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { InfoNote } from '../../_components/ui';

const TARGET_TYPES: Array<TicketReport['targetType']> = ['게시물', '계정', '외부 링크'];

function isTargetType(value: string): value is TicketReport['targetType'] {
  return (TARGET_TYPES as string[]).includes(value);
}

/** 문화체육관광부·수사기관 등 외부 통보 건을 수기로 접수한다. */
export function ManualReportForm() {
  const submitReport = useTicketStore((state) => state.submitReport);
  const toast = useToast();

  const [targetType, setTargetType] = useState<TicketReport['targetType']>('외부 링크');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim()) {
      toast.error('신고 사유를 입력해 주세요.');
      return;
    }

    submitReport({
      targetType,
      reason: reason.trim(),
      detail: detail.trim(),
      evidenceUrl: evidenceUrl.trim() || undefined,
      source: '외부 통보',
    });
    toast.success('외부 통보 건을 접수했습니다. 처리 기한 10시간이 시작됩니다.');
    setReason('');
    setDetail('');
    setEvidenceUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="신고 대상">
          <Select
            value={targetType}
            onChange={(event) => {
              if (isTargetType(event.target.value)) setTargetType(event.target.value);
            }}
          >
            {TARGET_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="신고 사유" required className="md:col-span-2">
          <TextInput
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="예) 정가 초과 재판매"
          />
        </Field>
      </div>

      <Field label="상세 내용">
        <Textarea
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="통보 기관·게시 위치·요구 조치 등을 적어 주세요."
        />
      </Field>

      <Field label="증빙 링크" hint="게시물 주소 등 확인 가능한 링크가 있으면 남겨 주세요.">
        <TextInput
          value={evidenceUrl}
          onChange={(event) => setEvidenceUrl(event.target.value)}
          placeholder="https://"
        />
      </Field>

      <InfoNote tone="neutral">
        외부 통보로 접수한 건도 앱 신고와 동일하게 처리 기한 타이머가 적용됩니다.
      </InfoNote>

      <div>
        <Button type="submit" variant="primary">
          외부 통보 접수
        </Button>
      </div>
    </form>
  );
}
