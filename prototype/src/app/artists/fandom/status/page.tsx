'use client';

import { useMemo, useState } from 'react';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  fandomLevels,
  FANDOM_GROUPS,
  FANDOM_SEASONS,
  REWARD_TYPES,
  REWARD_GRANT_STATUSES,
  type RewardType,
  type RewardGrantStatus,
  type LevelUpProcessStatus,
  type LotteryStatus,
} from '@/mock/fandom';

const PAGE_SIZE = 10;

// 보상 지급 현황 통합 행 — [CEB-BO-EVT-401] §2.2
interface GrantRow {
  id: string;
  groupName: string;
  season: string;
  level: number;
  member: string;
  rewardName: string;
  rewardType: RewardType;
  payout: '전체 지급' | '추첨';
  winnerYn?: boolean;
  grantStatus: RewardGrantStatus;
  date: string;
}

// 레벨업·추첨 작업 모니터링 행 — [CEB-BO-EVT-401] §2.3
interface JobRow {
  id: string;
  groupName: string;
  season: string;
  jobType: '레벨업 보상 지급' | '래플 추첨';
  level: number;
  processStatus: LevelUpProcessStatus;
  retryCount: number;
  admin: string;
  date: string;
}

const grantBadge: Record<RewardGrantStatus, string> = {
  '지급 대기': 'bg-gray-100 text-gray-500',
  '자동 지급 완료': 'bg-emerald-100 text-emerald-700',
  '추첨 대기': 'bg-amber-100 text-amber-700',
  당첨: 'bg-indigo-100 text-indigo-700',
  '지급 완료': 'bg-emerald-500 text-white',
  '지급 실패': 'bg-red-100 text-red-700',
};

const processBadge: Record<LevelUpProcessStatus, string> = {
  대기: 'bg-gray-100 text-gray-500',
  처리중: 'bg-blue-100 text-blue-700',
  완료: 'bg-emerald-100 text-emerald-700',
  실패: 'bg-red-100 text-red-700',
};

// 추첨 작업 상태 → 처리 상태 매핑
function lotteryToProcess(s: LotteryStatus): LevelUpProcessStatus {
  if (s === '추첨 완료') return '완료';
  if (s === '추첨 대기') return '대기';
  return '대기';
}

export default function FandomStatusPage() {
  const [section, setSection] = useState<'grant' | 'job'>('grant');
  const [groupFilter, setGroupFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nickname, setNickname] = useState('');
  const [page, setPage] = useState(1);

  // 전체 시즌 보상 지급 현황 집계
  const allGrants = useMemo<GrantRow[]>(() =>
    fandomLevels.flatMap((f) =>
      f.rewardGrants.map((g) => ({
        id: `${f.id}-${g.id}`,
        groupName: f.groupName,
        season: f.season,
        level: g.level,
        member: g.member,
        rewardName: g.rewardName,
        rewardType: g.rewardType,
        payout: g.payout,
        winnerYn: g.winnerYn,
        grantStatus: g.grantStatus,
        date: g.date,
      })),
    ), []);

  // 전체 시즌 레벨업·추첨 작업 집계
  const allJobs = useMemo<JobRow[]>(() => {
    const rows: JobRow[] = [];
    fandomLevels.forEach((f) => {
      f.levelUpHistory.forEach((h, i) => {
        rows.push({
          id: `lu-${f.id}-${h.level}-${i}`,
          groupName: f.groupName, season: f.season,
          jobType: '레벨업 보상 지급', level: h.level,
          processStatus: h.processStatus,
          retryCount: h.processStatus === '실패' ? 1 : 0,
          admin: '-', date: h.achievedAt,
        });
      });
      f.rewards.filter((r) => r.payout === '추첨').forEach((r, i) => {
        rows.push({
          id: `lo-${f.id}-${r.level}-${i}`,
          groupName: f.groupName, season: f.season,
          jobType: '래플 추첨', level: r.level,
          processStatus: lotteryToProcess(r.lotteryStatus ?? '미실행'),
          retryCount: 0,
          admin: r.lotteryStatus === '추첨 완료' ? 'nill' : '-',
          date: f.updatedAt,
        });
      });
    });
    return rows;
  }, []);

  const levelOptions = useMemo(
    () => Array.from(new Set(allGrants.map((g) => g.level))).sort((a, b) => a - b),
    [allGrants],
  );

  const filteredGrants = useMemo(() => allGrants
    .filter((g) => (groupFilter ? g.groupName === groupFilter : true))
    .filter((g) => (seasonFilter ? g.season === seasonFilter : true))
    .filter((g) => (levelFilter ? g.level === parseInt(levelFilter, 10) : true))
    .filter((g) => (typeFilter ? g.rewardType === typeFilter : true))
    .filter((g) => (statusFilter ? g.grantStatus === statusFilter : true))
    .filter((g) => (nickname ? g.member.toLowerCase().includes(nickname.toLowerCase()) : true))
    .sort((a, b) => b.date.localeCompare(a.date)),
  [allGrants, groupFilter, seasonFilter, levelFilter, typeFilter, statusFilter, nickname]);

  const filteredJobs = useMemo(() => allJobs
    .filter((j) => (groupFilter ? j.groupName === groupFilter : true))
    .filter((j) => (seasonFilter ? j.season === seasonFilter : true))
    .filter((j) => (levelFilter ? j.level === parseInt(levelFilter, 10) : true))
    .sort((a, b) => b.date.localeCompare(a.date)),
  [allJobs, groupFilter, seasonFilter, levelFilter]);

  const reset = () => {
    setGroupFilter(''); setSeasonFilter(''); setLevelFilter(''); setTypeFilter('');
    setStatusFilter(''); setNickname(''); setPage(1);
  };

  const rows = section === 'grant' ? filteredGrants : filteredJobs;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pagedGrants = filteredGrants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const dd = (cb: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => { cb(e.target.value); setPage(1); };

  return (
    <div>
      <PageHeader title="보상·레벨업 현황" breadcrumbItems={[{ label: '아티스트' }, { label: '팬덤레벨', href: '/artists/fandom' }, { label: '보상·레벨업 현황' }]} />

      {/* 섹션 전환 */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => { setSection('grant'); setPage(1); }}
          className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${section === 'grant' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
        >보상 지급 현황</button>
        <button
          onClick={() => { setSection('job'); setPage(1); }}
          className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${section === 'job' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
        >레벨업·추첨 작업 모니터링</button>
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
        {section === 'grant' && (
          <>
            <div className="relative">
              <select value={typeFilter} onChange={dd(setTypeFilter)} className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">보상 타입(전체)</option>
                {REWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={dd(setStatusFilter)} className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">지급 상태(전체)</option>
                {REWARD_GRANT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={nickname} onChange={(e) => { setNickname(e.target.value); setPage(1); }} placeholder="닉네임 입력" className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </>
        )}
        <div className="flex-1" />
        <button onClick={reset} className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">초기화</button>
      </div>

      {section === 'grant' ? (
        <SimpleTable<GrantRow>
          columns={[
            { key: 'groupName', label: '그룹', width: '120px', render: (r) => <span className="font-medium text-gray-900">{r.groupName}</span> },
            { key: 'season', label: '시즌', width: '180px', render: (r) => <span className="text-gray-600">{r.season}</span> },
            { key: 'level', label: '레벨', width: '80px', render: (r) => `Lv.${r.level}` },
            { key: 'member', label: '회원', width: '130px', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
            { key: 'rewardName', label: '보상명', render: (r) => <span className="text-gray-700">{r.rewardName}</span> },
            { key: 'payout', label: '지급 방식', width: '100px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.payout === '추첨' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{r.payout}</span>
            )},
            { key: 'winnerYn', label: '당첨 여부', width: '100px', render: (r) => (
              r.payout === '전체 지급' ? <span className="text-gray-400">-</span> : (r.winnerYn ? <span className="text-indigo-600 font-medium">당첨</span> : <span className="text-gray-500">미당첨</span>)
            )},
            { key: 'grantStatus', label: '지급 상태', width: '140px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${grantBadge[r.grantStatus]}`}>{r.grantStatus}</span>
            )},
            { key: 'date', label: '일시', width: '160px' },
          ]}
          rows={pagedGrants}
          emptyMessage={groupFilter || seasonFilter || levelFilter || typeFilter || statusFilter || nickname ? '검색 결과가 없습니다.' : '조회된 내역이 없습니다.'}
        />
      ) : (
        <SimpleTable<JobRow>
          columns={[
            { key: 'groupName', label: '그룹', width: '120px', render: (r) => <span className="font-medium text-gray-900">{r.groupName}</span> },
            { key: 'season', label: '시즌', width: '180px', render: (r) => <span className="text-gray-600">{r.season}</span> },
            { key: 'jobType', label: '작업 종류', width: '150px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.jobType === '래플 추첨' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{r.jobType}</span>
            )},
            { key: 'level', label: '레벨', width: '80px', render: (r) => `Lv.${r.level}` },
            { key: 'processStatus', label: '처리 상태', width: '110px', render: (r) => (
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${processBadge[r.processStatus]}`}>{r.processStatus}</span>
            )},
            { key: 'retryCount', label: '재시도 횟수', width: '110px', render: (r) => `${r.retryCount}회` },
            { key: 'admin', label: '처리 관리자', width: '120px' },
            { key: 'date', label: '시작·완료 일시', width: '160px' },
          ]}
          rows={pagedJobs}
          emptyMessage={groupFilter || seasonFilter || levelFilter ? '검색 결과가 없습니다.' : '조회된 작업이 없습니다.'}
        />
      )}

      <SimplePagination page={page} totalPages={totalPages || 1} onChange={setPage} />

      <p className="mt-4 text-xs text-gray-400">읽기 전용 조회 화면입니다. 보상 재지급·추첨 재시도 등 액션은 팬덤 레벨 상세에서 수행합니다.</p>
    </div>
  );
}
