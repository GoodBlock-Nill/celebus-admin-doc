'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from '@/components/ui/Toast';
import SimplePagination from '@/components/clone/SimplePagination';
import {
  getAvailablePayoutMonths,
  getMonthlyPayouts,
  getMonthlyPayoutStats,
  isAutoPaidPrize,
  type DukPayoutStatus,
  type DukPrizeType,
  type DukRewardPayout,
  type DukRewardTargetType,
} from '@/mock/duk';
import PayoutStatusModal from './PayoutStatusModal';

// [CEB-BO-ART-401-DETAIL] §2.11~§2.13 — 월별 보상 내역 탭
// - 정산 완료된 월만 드롭다운에 등장 (최신순)
// - 한 행 = 한 상품 지급 건 (회원 × 상품 조합)
// - 수동 지급(배송·현장)만 [상태 변경] 버튼 노출

interface Props {
  seasonId: number;
  seasonName: string;
  groupName: string;
}

const PAGE_SIZE = 20;

const STATUS_STYLE: Record<DukPayoutStatus, string> = {
  지급완료: 'bg-emerald-100 text-emerald-700',
  지급대기: 'bg-gray-100 text-gray-600',
  지급실패: 'bg-rose-100 text-rose-700',
  재지급대기: 'bg-amber-100 text-amber-700',
};

const PRIZE_TYPE_STYLE: Record<DukPrizeType, string> = {
  '배송 수령': 'bg-indigo-50 text-indigo-700',
  '현장 수령': 'bg-sky-50 text-sky-700',
  'BIVE NFT': 'bg-violet-50 text-violet-700',
  응모권: 'bg-amber-50 text-amber-700',
  덕력: 'bg-rose-50 text-rose-700',
};

const RANK_BADGE: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300',
  2: 'bg-gray-200 text-gray-700 ring-1 ring-gray-300',
  3: 'bg-orange-100 text-orange-700 ring-1 ring-orange-300',
};

function describeTarget(type: DukRewardTargetType, value: string): string {
  if (type === '등수') return `${value}위`;
  if (type === '등수범위') {
    const [from, to] = value.split('-');
    return `${from}위~${to}위`;
  }
  if (type === '퍼센트') return `상위 ${value}%`;
  return value;
}

export default function HistoryTab({ seasonId, seasonName, groupName }: Props) {
  const availableMonths = useMemo(() => getAvailablePayoutMonths(seasonId), [seasonId]);
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] ?? '');
  const [page, setPage] = useState(1);
  const [payouts, setPayouts] = useState<DukRewardPayout[]>(() =>
    selectedMonth ? getMonthlyPayouts(seasonId, selectedMonth) : [],
  );
  const [editTarget, setEditTarget] = useState<DukRewardPayout | null>(null);

  const stats = useMemo(
    () => (selectedMonth ? getMonthlyPayoutStats(seasonId, selectedMonth) : null),
    [seasonId, selectedMonth, payouts],
  );

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setPayouts(getMonthlyPayouts(seasonId, month));
    setPage(1);
  };

  const handlePayoutSave = (updated: DukRewardPayout) => {
    setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditTarget(null);
    toast.success('지급 상태가 변경되었습니다.');
  };

  // 정산 완료 월 0개 — 빈 상태
  if (availableMonths.length === 0) {
    return (
      <section className="bg-white border border-gray-100 rounded-xl px-6 py-12 text-center">
        <p className="text-sm text-gray-500">정산 완료된 월이 없습니다.</p>
        <p className="text-xs text-gray-400 mt-1">매월 말일 23:59 자동 정산이 완료된 월의 지급 결과가 여기에 노출됩니다.</p>
      </section>
    );
  }

  const totalPages = Math.max(1, Math.ceil(payouts.length / PAGE_SIZE));
  const pageRows = payouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="space-y-4">
      {/* 월 드롭다운 */}
      <div className="flex items-end gap-3">
        <div>
          <label htmlFor="payout-month" className="block text-xs font-medium text-gray-600 mb-1">
            정산 완료 월
          </label>
          <select
            id="payout-month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">정산 회원 수</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.memberCount}명</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">총 지급 상품 수</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.totalPrizes}건</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">지급 상태 분포</p>
            <p className="mt-1 text-xs text-gray-700">
              지급완료 <span className="font-semibold text-emerald-700">{stats.byStatus.지급완료}</span> ·
              지급대기 <span className="font-semibold text-gray-700">{stats.byStatus.지급대기}</span> ·
              지급실패 <span className="font-semibold text-rose-700">{stats.byStatus.지급실패}</span> ·
              재지급대기 <span className="font-semibold text-amber-700">{stats.byStatus.재지급대기}</span>
            </p>
          </div>
        </div>
      )}

      {/* 내역 테이블 */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {payouts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">지급된 보상이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-16">순위</th>
                <th className="px-4 py-3 text-left font-medium">회원</th>
                <th className="px-4 py-3 text-left font-medium">등수 기준</th>
                <th className="px-4 py-3 text-left font-medium">상품 종류</th>
                <th className="px-4 py-3 text-left font-medium">상품명</th>
                <th className="px-4 py-3 text-left font-medium">지급 일시</th>
                <th className="px-4 py-3 text-left font-medium">지급 상태</th>
                <th className="px-4 py-3 text-left font-medium w-28">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((row) => {
                const isManual = !isAutoPaidPrize(row.prizeType);
                const rankClass = RANK_BADGE[row.rank] ?? 'bg-gray-50 text-gray-500';
                const titleTooltip = `${row.prizeTitle.en}\n${row.prizeTitle.ja}`;
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${rankClass}`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/members/${row.memberId}?tab=basic`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium"
                      >
                        {row.memberNickname}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{describeTarget(row.targetType, row.targetValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIZE_TYPE_STYLE[row.prizeType]}`}>
                        {row.prizeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900" title={titleTooltip}>
                      {row.prizeTitle.ko}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{row.paidAt ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[row.paidStatus]}`}>
                        {row.paidStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isManual ? (
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          className="h-8 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          상태 변경
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">자동 지급</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 (백오피스 공통 패턴) */}
      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      <PayoutStatusModal
        target={editTarget}
        groupName={groupName}
        seasonName={seasonName}
        onClose={() => setEditTarget(null)}
        onSave={handlePayoutSave}
      />
    </section>
  );
}
