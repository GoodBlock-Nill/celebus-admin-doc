'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { getSupportById, cheererCount, type SupportStatus } from '@/mock/support';
import { statusBadge } from '../page';
import InfoTab from './_components/InfoTab';
import CheerListTab from './_components/CheerListTab';
import ResultRefundTab from './_components/ResultRefundTab';

const TABS = [
  { key: 'info', label: '기본 정보' },
  { key: 'cheerers', label: '응원자 내역' },
  { key: 'result', label: '결과물·반환' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// 상태별 헤더 전환 액션 — [CEB-BO-SUP-201] §2.5
type ActionDef = { key: string; label: string; next: SupportStatus; primary?: boolean; title: string; lines: string[]; toast: string };

function actionsFor(status: SupportStatus, refundCount: number, refundDuk: number): ActionDef[] {
  switch (status) {
    case '임시저장':
      return [
        { key: 'publish', label: '게시', next: '모집중', primary: true, title: '이벤트를 게시할까요?',
          lines: ['게시하면 시작일시 도달 시 앱에 노출되어 응원이 시작됩니다.', '목표 응원량·기간이 설정되어 있어야 합니다.'], toast: '서포트 이벤트를 게시했습니다.' },
      ];
    case '모집중':
      return [
        { key: 'forceEnd', label: '강제 종료', next: '미달성종료', title: '이벤트를 강제 종료할까요?',
          lines: [`응원 회원 ${refundCount}명에게 ${refundDuk.toLocaleString()} 덕력이 전액 반환됩니다.`, '종료한 이벤트는 되돌릴 수 없습니다.'], toast: '이벤트를 강제 종료하고 전액 반환했습니다.' },
      ];
    case '달성':
      return [
        { key: 'execute', label: '집행 시작', next: '집행중', primary: true, title: '서포트 집행을 시작할까요?',
          lines: ['집행을 시작하면 응원 덕력이 서포트에 사용되며 반환되지 않습니다.'], toast: '서포트 집행을 시작했습니다.' },
        { key: 'cancel', label: '집행 취소', next: '집행취소', title: '집행을 취소할까요?',
          lines: [`응원 회원 ${refundCount}명에게 ${refundDuk.toLocaleString()} 덕력이 전액 반환됩니다.`], toast: '집행을 취소하고 전액 반환했습니다.' },
      ];
    case '집행중':
      return [
        { key: 'complete', label: '결과물 등록·완료', next: '완료', primary: true, title: '결과물을 등록하고 완료 처리할까요?',
          lines: ['결과물·반환 탭에 입력한 결과 메시지와 사진·영상이 회원 앱에 공개됩니다.', '응원 회원에게 결과물 알림이 발송됩니다.'], toast: '결과물을 등록하고 완료 처리했습니다.' },
        { key: 'cancel', label: '집행 취소', next: '집행취소', title: '집행을 취소할까요?',
          lines: [`응원 회원 ${refundCount}명에게 ${refundDuk.toLocaleString()} 덕력이 전액 반환됩니다.`], toast: '집행을 취소하고 전액 반환했습니다.' },
      ];
    default:
      return [];
  }
}

export default function SupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const event = getSupportById(parseInt(id, 10));
  const [tab, setTab] = useState<TabKey>('info');
  const [status, setStatus] = useState<SupportStatus>(event?.status ?? '임시저장');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [childEditing, setChildEditing] = useState(false);

  if (!event) {
    return <div className="text-center py-20 text-gray-500">서포트 이벤트를 찾을 수 없습니다.</div>;
  }

  const handleTabChange = (next: TabKey) => {
    if (childEditing && next !== tab) {
      if (!window.confirm('저장하지 않은 변경이 있습니다. 이동할까요?')) return;
      setChildEditing(false);
    }
    setTab(next);
  };

  const actions = actionsFor(status, cheererCount(event), event.accumulatedDuk);
  const active = actions.find((a) => a.key === openKey) ?? null;

  const confirmAction = () => {
    if (!active) return;
    setStatus(active.next);
    setOpenKey(null);
    toast.success(active.toast);
  };

  const handleDelete = () => {
    setDeleteOpen(false);
    toast.success('서포트 이벤트를 삭제했습니다.');
    setTimeout(() => router.push('/artists/support'), 600);
  };

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={[{ label: '아티스트' }, { label: '서포트 관리', href: '/artists/support' }, { label: event.titleKo }]} />
        <div className="flex items-start justify-between mt-2 gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[28px] font-bold text-gray-900">{event.titleKo}</h1>
            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700">{event.groupName}</span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(status)}`}>{status}</span>
            <span className="text-sm text-gray-500">{event.startAt} ~ {event.endAt}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((a) => (
              <button key={a.key} onClick={() => setOpenKey(a.key)}
                className={`h-10 px-4 text-sm font-medium rounded-lg ${
                  a.primary ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}>{a.label}</button>
            ))}
            {status === '임시저장' && (
              <button onClick={() => setDeleteOpen(true)}
                className="h-10 px-4 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50">삭제</button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'info' && <InfoTab event={event} status={status} onEditingChange={setChildEditing} />}
      {tab === 'cheerers' && <CheerListTab event={event} status={status} />}
      {tab === 'result' && <ResultRefundTab event={event} status={status} />}

      {active && (
        <ConfirmModal isOpen onClose={() => setOpenKey(null)} onConfirm={confirmAction}
          title={active.title} lines={active.lines} confirmLabel={active.label} />
      )}
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="이벤트를 삭제할까요?" lines={['삭제된 서포트 이벤트는 복구할 수 없습니다.']} confirmLabel="삭제" />
    </div>
  );
}
