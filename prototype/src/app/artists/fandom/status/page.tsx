'use client';

import { useMemo, useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import Link from 'next/link';
import {
  fandomLevels,
  FANDOM_GROUPS,
  FANDOM_SEASONS,
  MINT_STATUSES,
  type MintStatus,
} from '@/mock/fandom';

const PAGE_SIZE = 10;

// 레벨업 이력 통합 행 — [CEB-BO-EVT-401] §2.2
interface LevelUpRow {
  id: string;
  fandomId: number;
  groupName: string;
  season: string;
  level: number;
  achievedAt: string;
  targetMemberCount: number;
  rewardSummary: string;
}

// 디지털 굿즈(BIVE) 지급 연계 행 — [CEB-BO-EVT-401] §2.3
interface BiveGrantRow {
  id: string;
  fandomId: number;
  groupName: string;
  season: string;
  level: number;
  member: string;
  campaignName: string;
  mintStatus: MintStatus;
  date: string;
}

const mintBadge: Record<MintStatus, string> = {
  대기: 'bg-gray-100 text-gray-500',
  민팅중: 'bg-blue-100 text-blue-700',
  완료: 'bg-emerald-100 text-emerald-700',
};

export default function FandomStatusPage() {
  const [section, setSection] = useState<'levelup' | 'bive'>('levelup');
  const [groupFilter, setGroupFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [nickname, setNickname] = useState('');
  const [page, setPage] = useState(1);

  // 전체 시즌 레벨업 이력 집계
  const allLevelUps = useMemo<LevelUpRow[]>(() =>
    fandomLevels.flatMap((f) =>
      f.levelUpHistory.map((h, i) => ({
        id: `lu-${f.id}-${h.level}-${i}`,
        fandomId: f.id,
        groupName: f.groupName,
        season: f.season,
        level: h.level,
        achievedAt: h.achievedAt,
        targetMemberCount: h.targetMemberCount,
        rewardSummary: h.rewardSummary,
      })),
    ), []);

  // 전체 시즌 디지털 굿즈(BIVE) 지급 연계 집계
  const allBiveGrants = useMemo<BiveGrantRow[]>(() =>
    fandomLevels.flatMap((f) =>
      f.biveGrants.map((g) => ({
        id: `bg-${f.id}-${g.id}`,
        fandomId: f.id,
        groupName: f.groupName,
        season: f.season,
        level: g.level,
        member: g.member,
        campaignName: g.campaignName,
        mintStatus: g.mintStatus,
        date: g.date,
      })),
    ), []);

  const levelOptions = useMemo(
    () => Array.from(new Set([...allLevelUps, ...allBiveGrants].map((r) => r.level))).sort((a, b) => a - b),
    [allLevelUps, allBiveGrants],
  );

  // 기간 필터 (YYYY.MM.DD ~ 일시 문자열 비교)
  const inPeriod = (dt: string) => {
    const d = dt.slice(0, 10); // YYYY.MM.DD
    if (periodFrom && d < periodFrom.replace(/-/g, '.')) return false;
    if (periodTo && d > periodTo.replace(/-/g, '.')) return false;
    return true;
  };

  const filteredLevelUps = useMemo(() => allLevelUps
    .filter((r) => (groupFilter ? r.groupName === groupFilter : true))
    .filter((r) => (seasonFilter ? r.season === seasonFilter : true))
    .filter((r) => (levelFilter ? r.level === parseInt(levelFilter, 10) : true))
    .filter((r) => inPeriod(r.achievedAt))
    .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [allLevelUps, groupFilter, seasonFilter, levelFilter, periodFrom, periodTo]);

  const filteredBiveGrants = useMemo(() => allBiveGrants
    .filter((r) => (groupFilter ? r.groupName === groupFilter : true))
    .filter((r) => (seasonFilter ? r.season === seasonFilter : true))
    .filter((r) => (levelFilter ? r.level === parseInt(levelFilter, 10) : true))
    .filter((r) => (nickname ? r.member.toLowerCase().includes(nickname.toLowerCase()) : true))
    .filter((r) => inPeriod(r.date))
    .sort((a, b) => b.date.localeCompare(a.date)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [allBiveGrants, groupFilter, seasonFilter, levelFilter, nickname, periodFrom, periodTo]);

  const reset = () => {
    setGroupFilter(''); setSeasonFilter(''); setLevelFilter('');
    setPeriodFrom(''); setPeriodTo(''); setNickname(''); setPage(1);
  };

  const rows = section === 'levelup' ? filteredLevelUps : filteredBiveGrants;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pagedLevelUps = filteredLevelUps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedBiveGrants = filteredBiveGrants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const dd = (cb: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => { cb(e.target.value); setPage(1); };

  const hasFilter = !!(groupFilter || seasonFilter || levelFilter || periodFrom || periodTo || nickname);

  return (
    <div>
      <PageHeader title="보상·레벨업 현황" breadcrumbItems={[{ label: '아티스트' }, { label: '팬덤레벨', href: '/artists/fandom' }, { label: '보상·레벨업 현황' }]} />
      <p className="text-sm font-medium text-gray-500 mb-5">전체 시즌 통합 현황</p>

      {/* 섹션 전환 */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => { setSection('levelup'); setPage(1); }}
          className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${section === 'levelup' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
        >레벨업 이력</button>
        <button
          onClick={() => { setSection('bive'); setPage(1); }}
          className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${section === 'bive' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
        >디지털 굿즈(BIVE) 지급 연계</button>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <select value={groupFilter} onChange={dd(setGroupFilter)} className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">그룹(전체)</option>
            {FANDOM_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={seasonFilter} onChange={dd(setSeasonFilter)} className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">시즌(전체)</option>
            {FANDOM_SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={levelFilter} onChange={dd(setLevelFilter)} className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[110px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">레벨(전체)</option>
            {levelOptions.map((l) => <option key={l} value={l}>Lv.{l}</option>)}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {/* 기간 */}
        <div className="flex items-center gap-1.5">
          <input type="date" value={periodFrom} onChange={(e) => { setPeriodFrom(e.target.value); setPage(1); }} className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <span className="text-gray-400 text-sm">~</span>
          <input type="date" value={periodTo} onChange={(e) => { setPeriodTo(e.target.value); setPage(1); }} className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {/* 닉네임 (BIVE 지급 연계 조회 전용) */}
        {section === 'bive' && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={nickname} onChange={(e) => { setNickname(e.target.value); setPage(1); }} placeholder="닉네임 입력" className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}
        <div className="flex-1" />
        <button onClick={reset} className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">초기화</button>
      </div>

      {section === 'levelup' ? (
        <SimpleTable<LevelUpRow>
          columns={[
            { key: 'groupName', label: '그룹', width: '120px', render: (r) => (
              <Link href={`/artists/fandom/${r.fandomId}`} className="font-medium text-indigo-600 hover:underline">{r.groupName}</Link>
            )},
            { key: 'season', label: '시즌', width: '180px', render: (r) => (
              <Link href={`/artists/fandom/${r.fandomId}`} className="text-gray-600 hover:text-indigo-600 hover:underline">{r.season}</Link>
            )},
            { key: 'level', label: '레벨', width: '80px', render: (r) => `Lv.${r.level}` },
            { key: 'achievedAt', label: '달성 일시', width: '160px' },
            { key: 'targetMemberCount', label: '대상 회원 수', width: '120px', render: (r) => `${r.targetMemberCount.toLocaleString()} 명` },
            { key: 'rewardSummary', label: '연결 보상', render: (r) => <span className="text-gray-700">{r.rewardSummary}</span> },
          ]}
          rows={pagedLevelUps}
          emptyMessage={hasFilter ? '검색 결과가 없습니다.' : '조회된 내역이 없습니다.'}
        />
      ) : (
        <SimpleTable<BiveGrantRow>
          columns={[
            { key: 'groupName', label: '그룹', width: '120px', render: (r) => (
              <Link href={`/artists/fandom/${r.fandomId}`} className="font-medium text-indigo-600 hover:underline">{r.groupName}</Link>
            )},
            { key: 'season', label: '시즌', width: '180px', render: (r) => (
              <Link href={`/artists/fandom/${r.fandomId}`} className="text-gray-600 hover:text-indigo-600 hover:underline">{r.season}</Link>
            )},
            { key: 'level', label: '레벨', width: '80px', render: (r) => `Lv.${r.level}` },
            { key: 'member', label: '회원', width: '130px', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
            { key: 'campaignName', label: '캠페인', render: (r) => <span className="text-gray-700">{r.campaignName}</span> },
            { key: 'mintStatus', label: '지급 상태', width: '120px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${mintBadge[r.mintStatus]}`}>{r.mintStatus}</span>
            )},
            { key: 'date', label: '일시', width: '160px' },
          ]}
          rows={pagedBiveGrants}
          emptyMessage={hasFilter ? '검색 결과가 없습니다.' : '조회된 내역이 없습니다.'}
        />
      )}

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />

      <p className="mt-4 text-xs text-gray-400">읽기 전용 조회 화면입니다. 보상 설정 등 액션은 팬덤 레벨 상세에서 수행합니다. 디지털 굿즈는 BIVE 영역이 자동 민팅하며, 래플·서포트 예고는 각 영역(래플·서포트)에서 별도 운영합니다.</p>
    </div>
  );
}
