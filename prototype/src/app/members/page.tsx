'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { UsersIcon, UserIcon, NoSymbolIcon, UserMinusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { members, getMemberStats, STATUS_LABEL } from '@/mock/members';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: '상태(전체)' },
  { value: 'ACTIVE', label: '정상' },
  { value: 'SUSPENDED', label: '정지' },
  { value: 'WITHDRAWAL_PENDING', label: '탈퇴대기' },
  { value: 'WITHDRAWAL_COMPLETED', label: '탈퇴완료' },
];

const SORT_OPTIONS = [
  { value: 'joined-desc', label: '유저명' }, // 운영 사이트는 dropdown 라벨이 "유저명"
  { value: 'joined-asc', label: '가입일 오래된순' },
];

function StatCard({
  label,
  count,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{count.toLocaleString('ko-KR')}</p>
      </div>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

function truncateAddr(addr: string | null) {
  if (!addr) return '-';
  return addr;
}

export default function MembersListPage() {
  const router = useRouter();
  const stats = getMemberStats();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sort, setSort] = useState<string>('joined-desc');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = members;
    if (statusFilter) list = list.filter((m) => m.accountStatus === statusFilter);
    if (keyword) list = list.filter((m) => m.nickname.toLowerCase().includes(keyword.toLowerCase()));
    // 정렬은 가입일 기준 (운영 동일)
    return list;
  }, [statusFilter, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReset = () => {
    setStatusFilter('');
    setSort('joined-desc');
    setKeyword('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="회원 관리" breadcrumbItems={[{ label: '회원' }]} />

      {/* 5카드 대시보드 — 운영 디자인 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="전체" count={stats.total} icon={UsersIcon} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard label="정상" count={stats.active} icon={UserPlusIcon} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard label="정지" count={stats.suspended} icon={NoSymbolIcon} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard label="탈퇴대기" count={stats.withdrawalPending} icon={UserMinusIcon} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
        <StatCard label="탈퇴완료" count={stats.withdrawalCompleted} icon={UserIcon} iconBg="bg-gray-100" iconColor="text-gray-500" />
      </div>

      {/* 필터·검색·액션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex-1" />

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="유저명 입력"
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleReset}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          초기화
        </button>

        <Link
          href="/members/suspension-reasons"
          className="h-10 px-4 inline-flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100"
        >
          정지사유 설정
        </Link>
      </div>

      {/* 회원 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">계정상태</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">유저명</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">전화번호</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">지갑주소</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">가입일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map((m) => {
              const cfg = STATUS_LABEL[m.accountStatus];
              return (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/members/${m.id}?tab=basic`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      ● {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-indigo-600 font-medium">{m.nickname}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {m.phoneCountry} {m.phone}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{truncateAddr(m.walletAddress)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{m.joinedAt}</td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="mt-6 flex items-center justify-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
        >
          ‹
        </button>
        {[1, 2].map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium ${
              page === p ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 3 && <span className="px-2 text-gray-400">...</span>}
        {totalPages > 2 && (
          <button
            onClick={() => setPage(totalPages)}
            className={`w-9 h-9 rounded-lg text-sm font-medium ${
              page === totalPages ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {totalPages}
          </button>
        )}
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
        >
          ›
        </button>
      </div>
    </div>
  );
}
