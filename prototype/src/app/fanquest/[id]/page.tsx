'use client';

import { use, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  getQuestById,
  getQuestSubmissions,
  formatReward,
  formatQuestKind,
  type QuestSubmission,
  type QuestStatus,
  type RejectionReason,
} from '@/mock/fanquest';
import { QUEST_STATUS_BADGE } from '@/app/sq/quests/page';
import ConfirmModal from '../_components/ConfirmModal';
import SubmissionRejectModal from '../_components/SubmissionRejectModal';
import EpisodeUsagePanel from '../_components/EpisodeUsagePanel';
import { getFanQuestUsages } from '@/mock/fanquest';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'pending', label: '대기내역' },
  { key: 'history', label: '처리내역' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const questId = parseInt(id, 10);
  const quest = getQuestById(questId);
  const router = useRouter();
  const search = useSearchParams();
  const tab = (search.get('tab') as TabKey) || 'info';

  const [pendingModal, setPendingModal] = useState<null | 'publish' | 'close' | 'delete'>(null);
  const [toast, setToast] = useState<string | null>(null);

  const usages = useMemo(() => (quest ? getFanQuestUsages(quest.id) : []), [quest]);

  if (!quest) return <div className="p-8 text-sm text-gray-500">Quest를 찾을 수 없습니다.</div>;

  const setTab = (k: TabKey) => router.push(`/fanquest/${questId}?tab=${k}`);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div>
      <PageHeader title="" breadcrumbItems={[{ label: '팬퀘스트', href: '/fanquest' }, { label: 'Quest 상세' }]} />

      <div className="flex items-start justify-between -mt-2 mb-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center mt-1">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <h1 className="text-[24px] font-bold text-gray-900 leading-tight max-w-[640px]">{quest.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${QUEST_STATUS_BADGE[quest.status]}`}>{quest.status}</span>
          <StatusCTA
            status={quest.status}
            onEdit={() => router.push(`/fanquest/${questId}/edit`)}
            onClose={() => setPendingModal('close')}
            onPublish={() => setPendingModal('publish')}
            onDelete={() => setPendingModal('delete')}
          />
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                tab === t.key ? 'border-gray-900 text-gray-900 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.key === 'pending' && quest.pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-700">
                  {quest.pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'info' && <InfoTab quest={quest} />}
      {tab === 'pending' && <PendingTab questId={questId} onShowToast={showToast} />}
      {tab === 'history' && <HistoryTab questId={questId} />}

      {pendingModal === 'close' && (
        <ConfirmModal
          title="Quest 종료"
          message={'확인 버튼을 누르면 Quest가 조기 종료됩니다.\n계속 진행하시겠습니까?'}
          extra={usages.length > 0 ? <EpisodeUsagePanel fanQuestId={quest.id} variant="modal-list" /> : null}
          size={usages.length > 0 ? 'md' : 'sm'}
          confirmLabel="확인"
          danger
          onCancel={() => setPendingModal(null)}
          onConfirm={() => { setPendingModal(null); showToast('Quest가 종료되었습니다.'); }}
        />
      )}
      {pendingModal === 'publish' && (
        <ConfirmModal
          title="Quest 게시"
          message={'확인 버튼을 누르면 Quest가 진행중 상태로 게시됩니다.\n계속 진행하시겠습니까?'}
          onCancel={() => setPendingModal(null)}
          onConfirm={() => { setPendingModal(null); showToast('Quest가 게시되었습니다.'); }}
        />
      )}
      {pendingModal === 'delete' && (
        <ConfirmModal
          title="Quest 삭제"
          message={'삭제한 Quest는 복구할 수 없습니다.\n계속 진행하시겠습니까?'}
          extra={usages.length > 0 ? <EpisodeUsagePanel fanQuestId={quest.id} variant="modal-list" /> : null}
          size={usages.length > 0 ? 'md' : 'sm'}
          confirmLabel="삭제"
          danger
          onCancel={() => setPendingModal(null)}
          onConfirm={() => { setPendingModal(null); router.push('/fanquest'); }}
        />
      )}

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 헤더 우측 CTA — 상태별 분기
// ─────────────────────────────────────────────

function StatusCTA({
  status, onEdit, onClose, onPublish, onDelete,
}: {
  status: QuestStatus;
  onEdit: () => void;
  onClose: () => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
  if (status === '종료') return null;

  if (status === '임시저장') {
    return (
      <>
        <button onClick={onDelete} className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
          삭제하기
        </button>
        <button onClick={onEdit} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          수정하기
        </button>
        <button onClick={onPublish} className="h-10 px-4 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100">
          게시하기
        </button>
      </>
    );
  }

  // 진행중
  return (
    <>
      <button onClick={onEdit} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
        수정하기
      </button>
      <button onClick={onClose} className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
        종료하기
      </button>
    </>
  );
}

// ─────────────────────────────────────────────
// 기본정보 탭
// ─────────────────────────────────────────────

function InfoTab({ quest }: { quest: NonNullable<ReturnType<typeof getQuestById>> }) {
  const reward = formatReward(quest.reward);
  const kindLabel = formatQuestKind(quest.kind, quest.repeatCycle);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="총 제출 수" value={quest.totalSubmitted} />
        <StatCard label="승인" value={quest.approvedCount} />
        <StatCard label="반려" value={quest.rejectedCount} />
        <StatCard label="대기" value={quest.pendingCount} />
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-5 items-start">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">대표 이미지</h4>
          <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden">
            {quest.imageSrc ? (
              <Image src={quest.imageSrc} alt="Quest 대표 이미지" fill className="object-cover" />
            ) : (
              <span>{quest.artist}</span>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Quest 정보</h4>
            <div className="space-y-3 text-sm">
              <Row label="아티스트" value={quest.artist} />
              <Row label="타입" value={quest.questType} />
              <Row label="진행 방식" value={kindLabel} />
              <Row label="보상" value={reward} />
              <Row label="시작일시" value={quest.startAt} />
              <Row label="마감일시" value={quest.endAt} />
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500 shrink-0">연관 링크</span>
                <div className="flex flex-wrap gap-2 justify-end">
                  {quest.relatedLinks.length === 0 ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    quest.relatedLinks.map((l, i) => (
                      <a
                        key={i}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {l.labelKO || l.labelEN || l.labelJA}
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">관리 정보</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">상태</span>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${QUEST_STATUS_BADGE[quest.status]}`}>{quest.status}</span>
              </div>
              <Row label="생성 관리자" value={quest.createdBy} />
              <Row label="생성 일시" value={quest.createdAt} />
              <Row label="최근 수정자" value={quest.updatedBy} />
              <Row label="최근 수정 일시" value={quest.updatedAt} />
            </div>
          </div>
        </div>
      </div>

      <EpisodeUsagePanel fanQuestId={quest.id} variant="card" />

      <MultiLangSection title="Quest 타이틀" ko={quest.titleKO} en={quest.titleEN} ja={quest.titleJA} />
      <MultiLangSection title="Quest 설명" ko={quest.descKO} en={quest.descEN} ja={quest.descJA} />
      <MultiLangSection title="Quest 유저 가이드" ko={quest.guideKO} en={quest.guideEN} ja={quest.guideJA} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="text-xs font-medium text-gray-500 mb-2">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right break-keep">{value}</span>
    </div>
  );
}

function MultiLangSection({ title, ko, en, ja }: { title: string; ko: string; en: string; ja: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      {([['KO', ko], ['EN', en], ['JA', ja]] as const).map(([lang, text]) => (
        <div key={lang} className="grid grid-cols-[40px_1fr] gap-3 items-start">
          <span className="inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600">{lang}</span>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{text || <span className="text-gray-400">-</span>}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 대기내역 탭 — 카드 그리드 + 일괄 승인 + 행별 반려/승인
// ─────────────────────────────────────────────

function PendingTab({ questId, onShowToast }: { questId: number; onShowToast: (msg: string) => void }) {
  const initial = getQuestSubmissions(questId, '대기');
  const [items, setItems] = useState<QuestSubmission[]>(initial);
  const [rejectTarget, setRejectTarget] = useState<QuestSubmission | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (items.length === 0) {
    return <div className="text-center py-16 text-sm text-gray-500">검수할 제출이 없습니다.</div>;
  }

  const approve = (submitId: number) => {
    setItems(items.filter((i) => i.submitId !== submitId));
    onShowToast('승인 처리되었습니다.');
  };

  const reject = (target: QuestSubmission, reason: RejectionReason) => {
    setItems(items.filter((i) => i.submitId !== target.submitId));
    setRejectTarget(null);
    onShowToast(`반려 처리되었습니다. (${reason.displayName})`);
  };

  const approveAll = () => {
    const onPage = paged.map((p) => p.submitId);
    setItems(items.filter((i) => !onPage.includes(i.submitId)));
    onShowToast(`${onPage.length}건 일괄 승인되었습니다.`);
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={approveAll}
          className="h-10 px-4 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
        >
          현재 페이지 모두 승인
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {paged.map((s) => (
          <div key={s.submitId} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            {/* 이미지 영역 — 카드 상단 가득, aspect-square */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span className="text-xs">제출 이미지</span>
              </div>
              <button
                type="button"
                aria-label="이미지 확대"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-600 hover:bg-white"
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* 정보 영역 */}
            <div className="px-4 pt-3 pb-3 flex-1">
              <div className="text-base font-semibold text-gray-900 mb-1.5 truncate">{s.nickname}</div>
              <div className="text-xs text-gray-500 leading-relaxed">
                <div><span className="text-gray-400">User ID:</span> {s.userId}</div>
                <div><span className="text-gray-400">Submit ID:</span> {s.submitId}</div>
                <div>{s.submittedAt}</div>
              </div>
            </div>

            {/* 액션 버튼 — 카드 하단 가로 2분할 */}
            <div className="grid grid-cols-2 border-t border-gray-100">
              <button
                onClick={() => setRejectTarget(s)}
                className="py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border-r border-gray-100"
              >
                반려
              </button>
              <button
                onClick={() => approve(s.submitId)}
                className="py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              >
                승인
              </button>
            </div>
          </div>
        ))}
      </div>

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      {rejectTarget && (
        <SubmissionRejectModal
          submitId={rejectTarget.submitId}
          onClose={() => setRejectTarget(null)}
          onSubmit={(reason) => reject(rejectTarget, reason)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 처리내역 탭
// ─────────────────────────────────────────────

type HistorySearchType = 'nickname' | 'submitId';

function HistoryTab({ questId }: { questId: number }) {
  const [statusFilter, setStatusFilter] = useState<'all' | '승인' | '반려'>('all');
  const [searchType, setSearchType] = useState<HistorySearchType>('nickname');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const rows = useMemo(() => {
    let r = getQuestSubmissions(questId).filter((s) => s.status !== '대기');
    if (statusFilter !== 'all') r = r.filter((s) => s.status === statusFilter);
    if (keyword) {
      const k = keyword.toLowerCase();
      r = r.filter((s) => searchType === 'submitId' ? String(s.submitId).includes(k) : s.nickname.toLowerCase().includes(k));
    }
    return r;
  }, [questId, statusFilter, keyword, searchType]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1;
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">상태(전체)</option>
            <option value="승인">승인</option>
            <option value="반려">반려</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select
            value={searchType}
            onChange={(e) => { setSearchType(e.target.value as HistorySearchType); setKeyword(''); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[110px] cursor-pointer"
          >
            <option value="nickname">닉네임</option>
            <option value="submitId">제출ID</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder={searchType === 'submitId' ? '제출ID 입력' : '닉네임 입력'}
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setStatusFilter('all'); setSearchType('nickname'); setKeyword(''); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <SimpleTable<QuestSubmission>
        columns={[
          { key: 'status', label: '상태', width: '80px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              r.status === '승인' ? 'bg-emerald-100 text-emerald-700' :
              r.status === '반려' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>{r.status}</span>
          )},
          { key: 'submitId', label: '제출ID', width: '90px', render: (r) => <span className="font-medium">{r.submitId}</span> },
          { key: 'nickname', label: '유저닉네임', width: '160px' },
          { key: 'rejectReason', label: '반려사유', width: '120px', render: (r) => r.rejectReason || '-' },
          { key: 'image', label: '이미지', width: '70px', align: 'center', render: () => (
            <button className="text-gray-400 hover:text-gray-600">
              <MagnifyingGlassPlusIcon className="w-5 h-5 mx-auto" />
            </button>
          )},
          { key: 'submittedAt', label: '제출일시', width: '140px' },
          { key: 'processedAt', label: '처리일시', width: '140px', render: (r) => r.processedAt || '-' },
          { key: 'processedBy', label: '처리자', width: '90px', render: (r) => r.processedBy || '-' },
        ]}
        rows={paged}
        emptyMessage="처리내역이 없습니다."
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
