'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getRaffleEntryEvents, type RaffleEntry } from '@/mock/fanquest';

const PAGE_SIZE = 10;

function buildModalPages(page: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: (number | '...')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) result.push('...');
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) result.push('...');
  result.push(total);
  return result;
}

interface Props {
  entry: RaffleEntry;
  onClose: () => void;
}

export default function EntryDetailModal({ entry, onClose }: Props) {
  const events = getRaffleEntryEvents(entry.raffleId, entry.userId);
  const sum = events.reduce((s, e) => s + e.ticketsUsed, 0);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(events.length / PAGE_SIZE) || 1;
  const pageStart = (page - 1) * PAGE_SIZE;
  const paged = events.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">응모내역 상세</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-medium text-gray-900">{entry.nickname}</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-mono">{entry.phone}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 flex items-center justify-between text-xs">
            <span className="text-gray-500">누적 응모권</span>
            <span className="font-semibold text-gray-900">{entry.cumulativeTickets}장</span>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-700 w-12">#</th>
                  <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-700 w-24">사용 응모권</th>
                  <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-700">응모일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-xs text-gray-400">응모 이력이 없습니다.</td></tr>
                ) : paged.map((e, i) => (
                  <tr key={e.entryId}>
                    <td className="px-3 py-2 text-xs text-gray-400">{pageStart + i + 1}</td>
                    <td className="px-3 py-2 text-xs text-right text-gray-900 font-medium">{e.ticketsUsed}</td>
                    <td className="px-3 py-2 text-xs text-right text-gray-700 font-mono">{e.entryAt}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr>
                  <td className="px-3 py-2 text-[11px] font-semibold text-gray-700 whitespace-nowrap" colSpan={1}>합계 (전체)</td>
                  <td className="px-3 py-2 text-xs text-right font-semibold text-indigo-700">{sum}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              aria-label="이전 페이지"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
            {buildModalPages(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`gap-${i}`} className="px-1 text-gray-400">...</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p as number)}
                  className={`w-7 h-7 inline-flex items-center justify-center rounded text-xs font-medium ${
                    page === p ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >{p}</button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 inline-flex items-center justify-center rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              aria-label="다음 페이지"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  );
}
