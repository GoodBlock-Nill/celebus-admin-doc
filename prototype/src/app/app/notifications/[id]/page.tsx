'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowPathIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import NotificationForm, { fromNotification } from '@/components/app/NotificationForm';
import {
  getChannelLabel,
  getNotificationById,
  getStatusMeta,
  type Notification,
} from '@/mock/notifications';

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const n = getNotificationById(id);

  if (!n) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">알림을 찾을 수 없습니다. (ID: {id})</p>
        <button
          onClick={() => router.push('/app/notifications')}
          className="mt-3 text-sm text-indigo-600 hover:underline"
        >
          알림 관리로 돌아가기
        </button>
      </div>
    );
  }

  const status = getStatusMeta(n.status);

  return (
    <div>
      <PageHeader
        title={n.title.ko}
        breadcrumbItems={[
          { label: '앱' },
          { label: '알림 관리', href: '/app/notifications' },
          { label: n.title.ko },
        ]}
        actions={<ActionButtons n={n} />}
      />

      {/* 메타 Badge 영역 */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}>
          {status.label}
        </span>
        <span className="inline-flex rounded-md px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700">
          {getChannelLabel(n.channel)}
        </span>
        {n.status === 'SCHEDULED' && n.sendAt && (
          <span className="inline-flex rounded-md px-2 py-0.5 text-xs bg-amber-50 text-amber-700">
            예약 · {n.sendAt}
          </span>
        )}
        {(n.status === 'SENT' || n.status === 'PARTIAL_FAILED' || n.status === 'FAILED') && n.sendAt && (
          <span className="text-xs text-gray-600">발송 {n.sendAt}</span>
        )}
        <span className="text-xs text-gray-500 ml-2">
          최근 수정: {n.updatedAt} · {n.updatedBy}
        </span>
      </div>

      {/* 발송 결과 (조회) */}
      {(n.status === 'SENT' || n.status === 'PARTIAL_FAILED' || n.status === 'FAILED' || n.status === 'SENDING') && (
        <ResultSummary n={n} />
      )}

      <NotificationForm
        initial={fromNotification(n)}
        readOnly={n.status === 'SENT'}
      />
    </div>
  );
}

function ActionButtons({ n }: { n: Notification }) {
  const router = useRouter();
  const back = () => router.push('/app/notifications');

  const buttons: React.ReactNode[] = [];

  if (n.status === 'DRAFT') {
    buttons.push(
      <button key="del" onClick={() => confirm('삭제하시겠습니까?') && back()}
        className="h-10 px-4 flex items-center gap-1.5 border border-rose-200 bg-white text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-50">
        <TrashIcon className="w-4 h-4" />삭제
      </button>,
      <button key="schedule" onClick={() => alert('예약 발송 등록 (Mock)')}
        className="h-10 px-4 border border-amber-400 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100">
        예약 발송
      </button>,
      <button key="send" onClick={() => alert('발송 큐 등록 (Mock)')}
        className="h-10 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
        발송
      </button>,
    );
  } else if (n.status === 'SCHEDULED') {
    buttons.push(
      <button key="cancel" onClick={() => alert('예약 취소 (Mock)')}
        className="h-10 px-4 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
        예약 취소
      </button>,
    );
  } else if (n.status === 'SENT') {
    buttons.push(
      <button key="clone" onClick={() => alert('복제 (Mock)')}
        className="h-10 px-4 flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
        <DocumentDuplicateIcon className="w-4 h-4" />복제
      </button>,
    );
  } else if (n.status === 'PARTIAL_FAILED' || n.status === 'FAILED') {
    buttons.push(
      <button key="retry" onClick={() => alert('재발송 시도 (Mock)')}
        className="h-10 px-4 flex items-center gap-1.5 border border-amber-400 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100">
        <ArrowPathIcon className="w-4 h-4" />재발송 시도
      </button>,
      <button key="clone" onClick={() => alert('복제 (Mock)')}
        className="h-10 px-4 flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
        <DocumentDuplicateIcon className="w-4 h-4" />복제
      </button>,
    );
  }

  return <>{buttons}</>;
}

function ResultSummary({ n }: { n: Notification }) {
  const reach = n.reachCount ?? 0;
  const fail = n.failCount ?? 0;
  const pushOff = n.pushOffCount ?? 0;
  // 미도달 = 푸시 권한 OFF + 한도 초과 등 운영자 액션 불가 사유 합산 (mock에서는 pushOff만 집계)
  const undelivered = pushOff;
  const undeliveredTooltip = `세부 사유\n• 권한 OFF / 구독 없음 / iOS PWA 미설치: ${pushOff.toLocaleString('ko-KR')}\n• 일일 한도 초과: 0`;
  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
      <header className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">발송 결과</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {n.sendAt} 발송 · 5분 간격 갱신 · 운영자 액션 기준 분류
        </p>
      </header>
      <div className="grid grid-cols-4 gap-4">
        <ResultCard label="도달" value={reach} tone="success" />
        <ResultCard
          label="미도달"
          value={undelivered}
          tone="default"
          tooltip={undeliveredTooltip}
          hint="권한 OFF · 한도 초과 합산 (운영자 액션 불가)"
        />
        <ResultCard
          label="실패 (재시도 가능)"
          value={fail}
          tone={fail ? 'danger' : 'default'}
          hint="푸시 서비스 일시 오류"
        />
        <ResultCard
          label="상태"
          value={getStatusMeta(n.status).label}
          tone={n.status === 'SENT' ? 'success' : n.status === 'FAILED' ? 'danger' : 'warning'}
        />
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  tone,
  hint,
  tooltip,
}: {
  label: string;
  value: number | string;
  tone: 'success' | 'warning' | 'danger' | 'default';
  hint?: string;
  tooltip?: string;
}) {
  const colors = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-rose-700',
    default: 'text-gray-900',
  } as const;
  return (
    <div title={tooltip}>
      <p className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
        {label}
        {tooltip && <span className="text-gray-300 cursor-help">ⓘ</span>}
      </p>
      <p className={`text-2xl font-bold ${colors[tone]}`}>
        {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
      </p>
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
