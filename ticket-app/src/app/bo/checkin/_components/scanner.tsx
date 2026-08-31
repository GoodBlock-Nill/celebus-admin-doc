'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatDateTime } from '@/lib/format';
import { useTicketStore } from '@/lib/store';
import type { CheckInResult } from '@/lib/types';
import { Button, TextInput } from '../../_components/form';
import { useToast } from '../../_components/toast';
import { Badge, Card, EmptyState, InfoNote } from '../../_components/ui';
import { SCAN_VIEW, ScanResultCard } from './scan-result-card';

const HISTORY_LIMIT = 10;

interface ScanLog {
  id: string;
  code: string;
  kind: CheckInResult['kind'];
  at: string;
}

/** 현장 체크인 스캐너 모의 */
export function Scanner() {
  const concerts = useTicketStore((state) => state.concerts);
  const sessions = useTicketStore((state) => state.sessions);
  const tickets = useTicketStore((state) => state.tickets);
  const checkInTicket = useTicketStore((state) => state.checkInTicket);
  const now = useTicketStore((state) => state.now);
  const toast = useToast();

  const [code, setCode] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [history, setHistory] = useState<ScanLog[]>([]);

  const validTickets = tickets.filter((ticket) => ticket.status === 'VALID');

  const runCheck = (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase();
    if (!normalized) {
      toast.error('티켓 코드를 입력해 주세요.');
      return;
    }

    const outcome = checkInTicket(normalized);
    const at = now().toISOString();
    setResult(outcome);
    setHistory((current) =>
      [{ id: `${normalized}-${at}-${current.length}`, code: normalized, kind: outcome.kind, at }, ...current].slice(
        0,
        HISTORY_LIMIT,
      ),
    );

    if (outcome.kind === 'OK') toast.success(`${normalized} 입장 처리 완료`);
    else toast.error(`${normalized} — ${SCAN_VIEW[outcome.kind].title}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runCheck(code);
  };

  const handleSimulate = () => {
    const picked = validTickets[Math.floor(Math.random() * validTickets.length)];
    if (!picked) return;
    setCode(picked.code);
    runCheck(picked.code);
  };

  return (
    <Card title="체크인 스캐너 (모의)" description="QR 스캔 대신 티켓 코드를 입력해 입장 처리를 확인합니다.">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[#4A4E5A]">티켓 코드</span>
            <TextInput
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="예) A3K9PQ7M"
              maxLength={12}
              className="font-mono tracking-[0.12em]"
            />
          </div>
          <Button type="submit" variant="primary">
            확인
          </Button>
          <Button onClick={handleSimulate} disabled={validTickets.length === 0}>
            무작위 유효 티켓 스캔 시뮬
          </Button>
        </form>

        {validTickets.length === 0 ? (
          <InfoNote tone="warning">
            아직 입장 전 티켓이 없습니다. 입금 확인 또는 무상 발급으로 티켓을 먼저 지급하세요.
          </InfoNote>
        ) : null}

        <ScanResultCard result={result} concerts={concerts} sessions={sessions} />

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
                  <span className="font-mono text-[13px] tracking-[0.1em] text-[#1B1D22]">{log.code}</span>
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
