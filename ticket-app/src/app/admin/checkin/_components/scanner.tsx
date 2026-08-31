'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, TextInput } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { Badge, Card, EmptyState, InfoNote } from '../../_components/ui';
import { SCAN_VIEW, ScanResultCard } from './scan-result-card';
import { adminApi } from '@/lib/admin-client';
import type { CheckInKind, CheckInResultView } from '@/lib/admin-types';
import { formatDateTime } from '@/lib/format';

const HISTORY_LIMIT = 10;
const MAX_INPUT_LENGTH = 400;

interface ScanLog {
  id: string;
  code: string;
  kind: CheckInKind;
  at: string;
}

/** 스캔 이력 표기 — 서명 토큰은 길어서 앞부분만 남긴다. */
function shortenInput(value: string): string {
  const MAX_DISPLAY = 16;
  return value.length > MAX_DISPLAY ? `${value.slice(0, MAX_DISPLAY)}…` : value;
}

/** 현장 체크인 스캐너 — QR 서명 토큰과 8자리 원시 코드를 모두 받는다. */
export function Scanner({ onCheckedIn }: { onCheckedIn: () => void }) {
  const toast = useToast();

  const [input, setInput] = useState('');
  const [result, setResult] = useState<CheckInResultView | null>(null);
  const [history, setHistory] = useState<ScanLog[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      toast.error('티켓 코드를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    const response = await adminApi.checkIn(value);
    setSubmitting(false);

    if (!response.ok) {
      toast.error(response.reason);
      return;
    }

    const outcome = response.data.result;
    const at = new Date().toISOString();
    setResult(outcome);
    setHistory((current) =>
      [
        { id: `${value}-${at}-${current.length}`, code: shortenInput(value), kind: outcome.kind, at },
        ...current,
      ].slice(0, HISTORY_LIMIT),
    );

    if (outcome.kind === 'OK') {
      toast.success(`${outcome.ticket?.code ?? ''} 입장 처리 완료`);
      onCheckedIn();
    } else {
      toast.error(SCAN_VIEW[outcome.kind].title);
    }
    setInput('');
  };

  return (
    <Card
      title="체크인 스캐너"
      description="QR에서 읽은 값을 그대로 붙여넣거나, 티켓 8자리 코드를 직접 입력합니다."
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#4A4E5A]">티켓 코드 또는 QR 값</span>
            <TextInput
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="예) A3K9PQ7M"
              maxLength={MAX_INPUT_LENGTH}
              autoComplete="off"
              className="font-mono tracking-[0.06em]"
            />
          </div>
          <Button type="submit" variant="primary" disabled={submitting}>
            확인
          </Button>
        </form>

        <InfoNote tone="neutral">
          QR 값은 짧은 시간만 유효합니다. 만료 안내가 뜨면 관람객에게 티켓 화면을 새로 열어 달라고 안내하고,
          기기 문제로 QR을 읽을 수 없으면 티켓 화면 하단의 8자리 코드를 직접 입력하세요.
        </InfoNote>

        <ScanResultCard result={result} />

        <div>
          <p className="mb-2 text-[13px] font-bold text-[#1B1D22]">최근 스캔 이력 (최대 {HISTORY_LIMIT}건)</p>
          {history.length === 0 ? (
            <EmptyState text="아직 스캔 기록이 없습니다." />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {history.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#E3E5EA] bg-white px-3 py-2"
                >
                  <span className="font-mono text-[13px] tracking-[0.06em] text-[#1B1D22]">{log.code}</span>
                  <Badge tone={SCAN_VIEW[log.kind].tone}>{SCAN_VIEW[log.kind].title}</Badge>
                  <span className="ml-auto text-[11px] tabular-nums text-[#6B7080]">
                    {formatDateTime(log.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
