'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BellAlertIcon,
  BoltIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import {
  ACTIVE_ARTISTS,
  NOTIFICATIONS,
  TRIGGER_CATEGORY_LABEL,
  TRIGGER_POLICIES,
  getChannelLabel,
  getManualStats,
  getSendTimingLabel,
  getStatusMeta,
  getTargetLabel,
  type ManualNotiStatus,
  type Notification,
  type NotiChannel,
  type TriggerCategory,
  type TriggerPolicy,
} from '@/mock/notifications';

type TabId = 'manual' | 'auto';
type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all';

const PERIODS: { id: PeriodFilter; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
  { id: 'year', label: '올해' },
  { id: 'all', label: '전체' },
];

const TABS: { id: TabId; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'manual', label: '수동 알림', icon: ClipboardDocumentListIcon },
  { id: 'auto', label: '자동 트리거', icon: BoltIcon },
];

function NotificationsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId | null) ?? 'manual';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [period, setPeriod] = useState<PeriodFilter>('all');

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', id);
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <div>
      <PageHeader
        title="알림 관리"
        breadcrumbItems={[{ label: '앱' }, { label: '알림 관리' }]}
        actions={
          activeTab === 'manual' ? (
            <Link
              href="/app/notifications/new"
              className="h-10 px-4 flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="w-4 h-4" />새 알림
            </Link>
          ) : null
        }
      />

      {/* 발송 방식 탭 */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === activeTab;
            const count = t.id === 'manual' ? NOTIFICATIONS.length : TRIGGER_POLICIES.length;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition flex items-center gap-1.5 ${
                  active
                    ? 'text-indigo-700 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span
                  className={`ml-1 inline-flex items-center justify-center min-w-[20px] px-1.5 rounded-full text-xs ${
                    active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'manual' ? (
        <>
          <div className="mb-4 flex items-center gap-1.5">
            {PERIODS.map((p) => {
              const active = p.id === period;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`h-9 px-3.5 text-sm rounded-lg border transition ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            <span className="ml-2 text-xs text-gray-400">통계·인벤토리 집계 범위</span>
          </div>
          <ManualTab list={NOTIFICATIONS} router={router} />
        </>
      ) : (
        <AutoTab list={TRIGGER_POLICIES} />
      )}
    </div>
  );
}

export default function NotificationsListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">불러오는 중…</div>}>
      <NotificationsListInner />
    </Suspense>
  );
}

// ---------------- 수동 알림 탭 ----------------

function ManualTab({ list, router }: { list: Notification[]; router: ReturnType<typeof useRouter> }) {
  const stats = getManualStats();
  const [targetFilter, setTargetFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState<NotiChannel | ''>('');
  const [statusFilter, setStatusFilter] = useState<ManualNotiStatus | ''>('');
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();
    return list.filter((n) => {
      if (statusFilter && n.status !== statusFilter) return false;
      if (channelFilter && n.channel !== channelFilter) return false;
      if (targetFilter) {
        if (targetFilter === 'GLOBAL' && n.targetType !== 'GLOBAL') return false;
        else if (targetFilter === 'MEMBER_GROUP' && n.targetType !== 'MEMBER_GROUP') return false;
        else if (targetFilter.startsWith('ARTIST:')) {
          const artist = targetFilter.slice('ARTIST:'.length);
          if (n.targetType !== 'ARTIST_FANDOM' || n.targetArtist !== artist) return false;
        }
      }
      if (q) {
        const txt = `${n.title.ko} ${n.title.en} ${n.title.jp}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [list, targetFilter, channelFilter, statusFilter, keyword]);

  const reset = () => {
    setTargetFilter('');
    setChannelFilter('');
    setStatusFilter('');
    setKeyword('');
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-2">
        <StatCardWithBar label="전체 (수동)" count={stats.total} variant="default" />
        <StatCardWithBar label="임시저장" count={stats.draft} variant="inactive" />
        <StatCardWithBar label="예약" count={stats.scheduled} variant="pending" />
        <StatCardWithBar label="발송 완료" count={stats.sent} variant="active" />
      </div>
      {stats.failed > 0 && (
        <p className="mb-4 text-xs text-rose-600">
          ⚠ 실패/부분 실패 알림이 {stats.failed}건 있습니다. 상태 필터에서 확인해 주세요.
        </p>
      )}

      <div className="flex items-center gap-2 mb-4 mt-4 flex-wrap">
        <FilterSelect
          value={targetFilter}
          onChange={setTargetFilter}
          options={[
            { value: '', label: '대상(전체)' },
            { value: 'GLOBAL', label: '전역' },
            ...ACTIVE_ARTISTS.map((a) => ({ value: `ARTIST:${a}`, label: `팬덤 · ${a}` })),
            { value: 'MEMBER_GROUP', label: '회원 그룹' },
          ]}
          minWidth="180px"
        />
        <FilterSelect
          value={channelFilter}
          onChange={(v) => setChannelFilter(v as NotiChannel | '')}
          options={[
            { value: '', label: '채널(전체)' },
            { value: 'BASIC_ONLY', label: '기본만' },
            { value: 'BASIC_PUSH', label: '기본 + 푸시' },
          ]}
          minWidth="150px"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as ManualNotiStatus | '')}
          options={[
            { value: '', label: '상태(전체)' },
            { value: 'DRAFT', label: '임시저장' },
            { value: 'SCHEDULED', label: '예약' },
            { value: 'SENDING', label: '발송중' },
            { value: 'SENT', label: '발송 완료' },
            { value: 'PARTIAL_FAILED', label: '부분 실패' },
            { value: 'FAILED', label: '실패' },
          ]}
          minWidth="150px"
        />
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="제목 검색 (KO/EN/JP)"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={reset}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              <th className="w-24 px-4 py-3 text-left">상태</th>
              <th className="w-28 px-4 py-3 text-left">채널</th>
              <th className="px-4 py-3 text-left">제목 (KO)</th>
              <th className="w-44 px-4 py-3 text-left">대상</th>
              <th className="w-48 px-4 py-3 text-left">발송 시점</th>
              <th className="w-28 px-4 py-3 text-right">도달 수</th>
              <th className="w-24 px-4 py-3 text-left">작성자</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <BellAlertIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">조건에 맞는 수동 알림이 없습니다.</p>
                  <button onClick={reset} className="mt-3 text-xs text-indigo-600 hover:underline">
                    필터 초기화
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((n) => (
                <ManualRow key={n.id} n={n} onClick={() => router.push(`/app/notifications/${n.id}`)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>전체 {filtered.length}건 / 20건씩</span>
        <span className="opacity-60">1 / 1</span>
      </div>
    </>
  );
}

function ManualRow({ n, onClick }: { n: Notification; onClick: () => void }) {
  const status = getStatusMeta(n.status);
  return (
    <tr onClick={onClick} className="cursor-pointer hover:bg-gray-50 whitespace-nowrap">
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}>
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">
        <span className={`inline-flex rounded-md px-2 py-0.5 ${
          n.channel === 'BASIC_PUSH' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {getChannelLabel(n.channel)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <p className="text-gray-900 font-medium truncate max-w-[420px]" title={n.title.ko}>
          {n.title.ko}
        </p>
        <p className="text-[11px] text-gray-400 truncate max-w-[420px]">{n.body.ko}</p>
      </td>
      <td className="px-4 py-3 text-xs text-gray-700">{getTargetLabel(n)}</td>
      <td className="px-4 py-3 text-xs text-gray-700">{getSendTimingLabel(n)}</td>
      <td className="px-4 py-3 text-xs text-right">
        {n.status === 'SENDING' ? (
          <span className="text-amber-600">처리 중…</span>
        ) : n.reachCount != null ? (
          <span className="font-medium text-gray-900">{n.reachCount.toLocaleString('ko-KR')}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">{n.updatedBy}</td>
      <td className="px-2 py-3 text-right">
        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
      </td>
    </tr>
  );
}

// ---------------- 자동 트리거 카탈로그 (조회 전용) ----------------

function AutoTab({ list }: { list: TriggerPolicy[] }) {
  const [categoryFilter, setCategoryFilter] = useState<TriggerCategory | ''>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'on' | 'off'>('all');
  const [keyword, setKeyword] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();
    return list.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (activeFilter === 'on' && !p.active) return false;
      if (activeFilter === 'off' && p.active) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, categoryFilter, activeFilter, keyword]);

  const reset = () => {
    setCategoryFilter('');
    setActiveFilter('all');
    setKeyword('');
  };

  const preview = previewId ? list.find((p) => p.id === previewId) : null;

  return (
    <>
      <div className="mb-4 px-4 py-3 rounded-lg bg-violet-50 border border-violet-100 text-sm text-violet-900 flex gap-2 items-start">
        <InformationCircleIcon className="w-5 h-5 shrink-0 mt-0.5 text-violet-600" />
        <div>
          <p className="font-semibold mb-0.5">자동 트리거는 시스템이 이벤트 발생 시 자동으로 발송하는 알림입니다.</p>
          <p className="text-violet-800">
            <strong>메시지·대상·활성 상태 변경은 개발팀에 별도 요청</strong>해 주세요. 이 화면은 현재 등록된 트리거 정책 목록을 조회만 할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterSelect
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as TriggerCategory | '')}
          options={[
            { value: '', label: '카테고리(전체)' },
            ...(Object.keys(TRIGGER_CATEGORY_LABEL) as TriggerCategory[]).map((k) => ({
              value: k,
              label: TRIGGER_CATEGORY_LABEL[k],
            })),
          ]}
          minWidth="180px"
        />
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
          {(['all', 'on', 'off'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setActiveFilter(k)}
              className={`h-9 px-3 text-sm rounded-md ${
                activeFilter === k ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {k === 'all' ? '활성(전체)' : k === 'on' ? '사용중' : '미사용'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="트리거명 검색"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={reset}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              <th className="w-24 px-4 py-3 text-left">활성</th>
              <th className="w-32 px-4 py-3 text-left">카테고리</th>
              <th className="w-28 px-4 py-3 text-left">채널</th>
              <th className="w-72 px-4 py-3 text-left">트리거</th>
              <th className="px-4 py-3 text-left">제목 (KO)</th>
              <th className="w-40 px-4 py-3 text-left">최근 발송</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <BoltIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">조건에 맞는 트리거 정책이 없습니다.</p>
                  <button onClick={reset} className="mt-3 text-xs text-indigo-600 hover:underline">
                    필터 초기화
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <TriggerRow key={p.id} p={p} onClick={() => setPreviewId(p.id)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>전체 {filtered.length}건 · 행 클릭 시 상세 미리보기</span>
        <span className="opacity-60">조회 전용</span>
      </div>

      {preview && <PreviewModal policy={preview} onClose={() => setPreviewId(null)} />}
    </>
  );
}

function TriggerRow({ p, onClick }: { p: TriggerPolicy; onClick: () => void }) {
  return (
    <tr onClick={onClick} className="cursor-pointer hover:bg-gray-50 whitespace-nowrap">
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {p.active ? '사용중' : '미사용'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700">
          <BoltIcon className="w-3 h-3" />
          {TRIGGER_CATEGORY_LABEL[p.category]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">
        <span className={`inline-flex rounded-md px-2 py-0.5 ${
          p.channel === 'BASIC_PUSH' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {getChannelLabel(p.channel)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <p className="text-gray-900 font-medium truncate max-w-[280px]" title={p.name}>{p.name}</p>
        <p className="text-[11px] text-gray-500 truncate max-w-[280px]" title={p.triggerCondition}>
          {p.triggerCondition}
        </p>
      </td>
      <td className="px-4 py-3 text-sm">
        <p className="text-gray-900 font-medium truncate max-w-[420px]" title={p.title.ko}>
          {p.title.ko}
        </p>
        <p className="text-[11px] text-gray-400 truncate max-w-[420px]">{p.body.ko}</p>
      </td>
      <td className="px-4 py-3 text-xs text-gray-700">{p.lastFiredAt ?? '—'}</td>
      <td className="px-2 py-3 text-right">
        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
      </td>
    </tr>
  );
}

function PreviewModal({ policy, onClose }: { policy: TriggerPolicy; onClose: () => void }) {
  const [lang, setLang] = useState<'ko' | 'en' | 'jp'>('ko');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
      >
        <header className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-600 font-medium">자동 트리거 정책 · {TRIGGER_CATEGORY_LABEL[policy.category]}</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-0.5">{policy.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">
            ×
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">활성 상태</p>
              <p className={`text-sm font-semibold ${policy.active ? 'text-emerald-700' : 'text-gray-500'}`}>
                {policy.active ? '사용중' : '미사용'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">채널</p>
              <p className="text-sm font-medium text-gray-800">{getChannelLabel(policy.channel)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">트리거 조건</p>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-md p-3">{policy.triggerCondition}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">메시지 미리보기</p>
              <div className="flex bg-gray-100 rounded-md p-0.5">
                {(['ko', 'en', 'jp'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded uppercase ${
                      lang === l ? 'bg-white text-gray-900 shadow' : 'text-gray-500'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <p className="text-sm font-semibold text-gray-900">{policy.title[lang]}</p>
              <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-line">{policy.body[lang]}</p>
              {policy.pushShort && (
                <p className="text-xs text-emerald-700 mt-2">푸시: {policy.pushShort[lang]}</p>
              )}
            </div>
          </div>

          {policy.deeplinkLabel && (
            <div>
              <p className="text-xs text-gray-500 mb-1">딥링크</p>
              <p className="text-sm text-gray-800">{policy.deeplinkLabel}</p>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
            메시지·대상·활성 상태 변경은 백오피스에서 불가합니다. 개발팀에 별도 요청해 주세요.
          </div>
        </div>

        <footer className="px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
          >
            닫기
          </button>
        </footer>
      </div>
    </div>
  );
}

// ---------------- 공통 ----------------

function FilterSelect({
  value,
  onChange,
  options,
  minWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  minWidth: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ minWidth }}
        className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
