'use client';

import { use, useState } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { getFandomById, computeLevelStatus, type FandomStatus } from '@/mock/fandom';
import CurveTab from './_components/CurveTab';
import RewardTab from './_components/RewardTab';
import HistoryTab from './_components/HistoryTab';

const TABS = [
  { key: 'curve', label: '레벨·곡선 설정' },
  { key: 'reward', label: '레벨별 보상 설정' },
  { key: 'history', label: '보상·레벨업 현황' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// 시즌 상태 뱃지 — [CEB-BO-EVT-201 v1.4] §2.1
function statusBadge(s: FandomStatus) {
  if (s === '진행중') return 'bg-emerald-500 text-white';
  if (s === '준비') return 'bg-gray-100 text-gray-600';
  return 'bg-gray-800 text-white'; // 종료
}

// 상태별 전환 액션 정의 — [CEB-BO-EVT-201] §2.1
type Transition = { label: string; next: FandomStatus; title: string; lines: string[]; toast: string };

export default function FandomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const fandom = getFandomById(parseInt(id, 10));
  const [tab, setTab] = useState<TabKey>('curve');
  const [status, setStatus] = useState<FandomStatus>(fandom?.status ?? '준비');
  const [transitionOpen, setTransitionOpen] = useState(false);
  // 미저장 이탈 가드 — 편집 중 탭 전환 시 확인
  const [childEditing, setChildEditing] = useState(false);

  const handleTabChange = (next: TabKey) => {
    if (childEditing && next !== tab) {
      if (!window.confirm('저장하지 않은 변경이 있습니다. 이동할까요?')) return;
      setChildEditing(false);
    }
    setTab(next);
  };

  if (!fandom) {
    return <div className="text-center py-20 text-gray-500">아티스트를 찾을 수 없습니다.</div>;
  }

  const levelStatus = computeLevelStatus(fandom.currentLevel, fandom.levels.length);
  const hasCurve = fandom.levels.length > 0;

  // 상태별 전환 액션 (확인 모달 → 상태 전환 → 완료 토스트)
  // 정산중 단계 제거 — [CEB-BO-EVT-000 v1.5] §4.1.1 / [CEB-BO-EVT-101 v1.3]
  const transition: Transition | null =
    status === '준비'
      ? {
          label: '게시',
          next: '진행중',
          title: '팬덤레벨을 게시할까요?',
          lines: ['게시하면 앱에 노출되고 운영이 시작됩니다.', '레벨 곡선이 1개 이상 설정되어 있어야 합니다.'],
          toast: `'${fandom.season}' 팬덤레벨을 게시했습니다.`,
        }
      : status === '진행중'
        ? {
            label: '강제 종료',
            next: '종료',
            title: '시즌을 강제 종료할까요?',
            lines: ['강제 종료 시 시즌이 즉시 마감됩니다.', '종료한 시즌은 수정할 수 없습니다.'],
            toast: `'${fandom.season}' 시즌을 종료했습니다.`,
          }
        : null;

  const handleTransition = () => {
    if (!transition) return;
    // 게시 전 곡선 설정 검증 — [CEB-BO-EVT-201] §3.5 / §5
    if (transition.next === '진행중' && !hasCurve) {
      setTransitionOpen(false);
      toast.error('레벨 곡선을 1개 이상 설정해야 게시할 수 있습니다.');
      return;
    }
    setStatus(transition.next);
    setTransitionOpen(false);
    toast.success(transition.toast);
  };

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={[{ label: '아티스트' }, { label: '팬덤레벨', href: '/artists/fandom' }, { label: fandom.groupName }]} />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-gray-900">{fandom.groupName}</h1>
            <span className="text-sm text-gray-500">{fandom.season}</span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(status)}`}>{status}</span>
            {hasCurve && (
              <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700">
                Lv.{fandom.currentLevel}{levelStatus === '최고레벨' ? ' MAX' : ''}
              </span>
            )}
          </div>
          {transition && (
            <button
              onClick={() => setTransitionOpen(true)}
              className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >{transition.label}</button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'curve' && <CurveTab fandom={fandom} onEditingChange={setChildEditing} />}
      {tab === 'reward' && <RewardTab fandom={fandom} onEditingChange={setChildEditing} />}
      {tab === 'history' && <HistoryTab fandom={fandom} />}

      {transition && (
        <ConfirmModal
          isOpen={transitionOpen}
          onClose={() => setTransitionOpen(false)}
          onConfirm={handleTransition}
          title={transition.title}
          lines={transition.lines}
          confirmLabel={transition.label}
        />
      )}
    </div>
  );
}
