'use client';

import { useCallback, useMemo, useState } from 'react';

import { DataTable } from '../_components/data-table';
import type { Column } from '../_components/data-table';
import { Field, Select } from '../_components/form';
import { useAdminResource } from '../_components/hooks';
import { Card, PageHeader } from '../_components/ui';
import { adminApi } from '@/lib/admin-client';
import type { AdminLogView } from '@/lib/admin-types';
import { formatDateTime } from '@/lib/format';

const ALL_ACTIONS = 'ALL';

const COLUMNS: Array<Column<AdminLogView>> = [
  {
    key: 'at',
    header: '시각',
    width: '150px',
    render: (log) => (
      <span className="whitespace-nowrap tabular-nums text-[12px] text-[#4A4E5A]">
        {formatDateTime(log.createdAt)}
      </span>
    ),
  },
  { key: 'actor', header: '처리자', width: '100px', render: (log) => log.actor },
  {
    key: 'action',
    header: '액션',
    width: '150px',
    render: (log) => <span className="font-semibold">{log.action}</span>,
  },
  { key: 'detail', header: '상세', render: (log) => <span className="text-[#4A4E5A]">{log.detail}</span> },
];

export default function AdminLogsPage() {
  const loadLogs = useCallback(() => adminApi.logs(), []);
  const { state } = useAdminResource(loadLogs);
  const [action, setAction] = useState(ALL_ACTIONS);

  const logs: AdminLogView[] = state.status === 'READY' ? state.data.items : [];

  const actionTypes = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort((a, b) => a.localeCompare(b, 'ko-KR')),
    [logs],
  );

  const rows = useMemo(
    () => (action === ALL_ACTIONS ? logs : logs.filter((log) => log.action === action)),
    [logs, action],
  );

  return (
    <>
      <PageHeader
        title="활동 로그"
        description="회원·운영자·시스템이 수행한 처리를 최신순으로 남깁니다. 최대 300건까지 조회합니다."
      />

      <Card>
        {state.status !== 'READY' ? (
          <p className="text-[13px] text-[#6B7080]">
            {state.status === 'LOADING' ? '활동 로그를 불러오는 중입니다…' : state.reason}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="액션 유형" className="max-w-[260px]">
              <Select value={action} onChange={(event) => setAction(event.target.value)}>
                <option value={ALL_ACTIONS}>전체 ({logs.length}건)</option>
                {actionTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <DataTable
              columns={COLUMNS}
              rows={rows}
              rowKey={(log) => log.id}
              emptyText="활동 로그가 없습니다."
              minWidth="760px"
            />
          </div>
        )}
      </Card>
    </>
  );
}
