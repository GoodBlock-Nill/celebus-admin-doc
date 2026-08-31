'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';

import { DataTable } from '../../_components/data-table';
import type { Column } from '../../_components/data-table';
import { useAdminResource } from '../../_components/hooks';
import { CONCERT_STATUS_VIEW } from '../../_components/labels';
import {
  Card,
  Collapsible,
  DefinitionRow,
  EmptyState,
  PageHeader,
  StatusBadge,
} from '../../_components/ui';
import { CompIssueForm } from '../_components/comp-issue-form';
import { ConcertStatusActions } from '../_components/concert-status-actions';
import { PoolStockTable } from '../_components/pool-stock-table';
import { ReallocateForm } from '../_components/reallocate-form';
import { adminApi } from '@/lib/admin-client';
import type { AdminLogView } from '@/lib/admin-types';
import { formatDateTime, formatKrw } from '@/lib/format';

const LOG_COLUMNS: Array<Column<AdminLogView>> = [
  {
    key: 'at',
    header: '시각',
    width: '150px',
    render: (log) => (
      <span className="whitespace-nowrap tabular-nums text-[12px] text-[#6B7080]">
        {formatDateTime(log.createdAt)}
      </span>
    ),
  },
  { key: 'actor', header: '처리자', width: '90px', render: (log) => log.actor },
  {
    key: 'action',
    header: '액션',
    width: '140px',
    render: (log) => <span className="font-semibold">{log.action}</span>,
  },
  { key: 'detail', header: '상세', render: (log) => <span className="text-[#4A4E5A]">{log.detail}</span> },
];

export default function AdminConcertDetailPage() {
  const params = useParams();
  const concertId = typeof params.concertId === 'string' ? params.concertId : '';

  const loadConcert = useCallback(() => adminApi.concert(concertId), [concertId]);
  const { state, reload } = useAdminResource(loadConcert);

  if (state.status !== 'READY') {
    return (
      <>
        <PageHeader title="공연 상세" />
        <Card>
          {state.status === 'LOADING' ? (
            <p className="text-[13px] text-[#6B7080]">공연 정보를 불러오는 중입니다…</p>
          ) : (
            <>
              <EmptyState text={state.reason} />
              <div className="mt-3">
                <Link href="/admin/concerts" className="text-[13px] font-semibold text-[#3056D3] hover:underline">
                  공연 목록으로 돌아가기
                </Link>
              </div>
            </>
          )}
        </Card>
      </>
    );
  }

  const concert = state.data.concert;
  const sessions = concert.sessions;

  return (
    <>
      <PageHeader
        title={concert.title}
        description={`${concert.artist} · ${concert.venue}`}
        actions={
          <Link
            href="/admin/concerts"
            className="rounded-lg border border-[#C9CDD6] bg-white px-3 py-2 text-[13px] font-semibold text-[#1B1D22] hover:bg-[#F2F3F6]"
          >
            공연 목록
          </Link>
        }
      />

      <Card title="공연 정보">
        <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
          <div>
            <DefinitionRow label="판매 상태">
              <StatusBadge view={CONCERT_STATUS_VIEW[concert.status]} />
            </DefinitionRow>
            <DefinitionRow label="공연장">{concert.venue}</DefinitionRow>
            <DefinitionRow label="공연장 주소">
              {concert.venueAddress ?? <span className="text-[#6B7080]">미입력</span>}
            </DefinitionRow>
            <DefinitionRow label="지도 링크">
              {concert.venueMapUrl ? (
                <a
                  href={concert.venueMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#3056D3] hover:underline"
                >
                  네이버지도 보기
                </a>
              ) : (
                <span className="text-[#6B7080]">미입력</span>
              )}
            </DefinitionRow>
            <DefinitionRow label="좌석 방식">{concert.seatType}</DefinitionRow>
          </div>
          <div>
            <DefinitionRow label="티켓 가격">
              <span className="tabular-nums">{formatKrw(concert.priceKrw)}</span>
            </DefinitionRow>
            <DefinitionRow label="1인 예매 한도">
              <span className="tabular-nums">{concert.maxPerUser}매</span>
            </DefinitionRow>
            <DefinitionRow label="판매 기간">
              <span className="tabular-nums">
                {formatDateTime(concert.salesStartAt)} ~ {formatDateTime(concert.salesEndAt)}
              </span>
            </DefinitionRow>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Collapsible summary="예매 유의사항 원문">
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#4A4E5A]">{concert.notice}</p>
          </Collapsible>
          <Collapsible summary="취소·환불 규정 원문">
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#4A4E5A]">{concert.refundPolicy}</p>
          </Collapsible>
        </div>
      </Card>

      <Card title="판매 상태" description="판매를 시작하면 앱에 공개되고, 종료하면 되돌릴 수 없습니다.">
        <ConcertStatusActions
          concertId={concertId}
          concertTitle={concert.title}
          status={concert.status}
          onDone={() => void reload()}
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sessions.map((session) => (
          <Card
            key={session.id}
            title={session.name}
            description={`공연 시작 ${formatDateTime(session.startAt)} · 입장 확인은 시작 ${session.entryOpenMinutesBefore}분 전부터`}
          >
            <PoolStockTable session={session} />
          </Card>
        ))}
      </div>

      <Card title="배정 수량 재조정" description="분류 사이에서 배정 수량을 옮깁니다.">
        {sessions.length > 0 ? (
          <ReallocateForm concertId={concertId} sessions={sessions} onDone={() => void reload()} />
        ) : (
          <EmptyState text="등록된 회차가 없습니다." />
        )}
      </Card>

      <Card title="무상 티켓 발급" description="래플 당첨자 지급·IX 초대 명단 지급">
        {sessions.length > 0 ? (
          <CompIssueForm concertId={concertId} sessions={sessions} onDone={() => void reload()} />
        ) : (
          <EmptyState text="등록된 회차가 없습니다." />
        )}
      </Card>

      <Card title="최근 활동 로그" description="이 공연과 관련된 최근 10건입니다.">
        <DataTable
          columns={LOG_COLUMNS}
          rows={state.data.logs}
          rowKey={(log) => log.id}
          emptyText="관련 활동 로그가 아직 없습니다."
          minWidth="720px"
        />
      </Card>
    </>
  );
}
