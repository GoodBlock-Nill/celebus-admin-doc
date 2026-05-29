'use client';

import { useState } from 'react';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  isRefundedStatus, cheerTotal, cheerCount, firstCheerAt, lastCheerAt,
  cheererCount, totalCheerCount,
  type Cheerer, type SupportEvent, type SupportStatus,
} from '@/mock/support';

export default function CheerListTab({ event, status }: { event: SupportEvent; status: SupportStatus }) {
  const refundedAll = isRefundedStatus(status);
  const rows = [...event.cheerers].sort((a, b) => cheerTotal(b) - cheerTotal(a));
  const [detail, setDetail] = useState<Cheerer | null>(null);

  return (
    <div>
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Summary label="응원자 수" value={`${cheererCount(event).toLocaleString()}명`} />
        <Summary label="총 응원 횟수" value={`${totalCheerCount(event).toLocaleString()}회`} />
        <Summary label="누적 응원" value={`${event.accumulatedDuk.toLocaleString()} 덕력`} />
      </div>

      <p className="text-sm text-gray-500 mb-3">
        한 회원이 여러 번 응원할 수 있습니다. 행을 클릭하면 회차별 응원 내역을 볼 수 있어요. 누적 응원량 많은 순으로 정렬됩니다.
      </p>

      <SimpleTable<Cheerer>
        columns={[
          { key: 'member', label: '닉네임', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
          { key: 'total', label: '누적 응원량(덕력)', width: '150px', align: 'right', render: (r) => cheerTotal(r).toLocaleString() },
          { key: 'count', label: '응원 횟수', width: '100px', align: 'right', render: (r) => (
            <span className={cheerCount(r) > 1 ? 'text-indigo-600 font-medium' : 'text-gray-700'}>{cheerCount(r)}회</span>
          )},
          { key: 'first', label: '최초 응원', width: '160px', render: (r) => <span className="text-gray-500">{firstCheerAt(r)}</span> },
          { key: 'last', label: '최근 응원', width: '160px', render: (r) => <span className="text-gray-500">{lastCheerAt(r)}</span> },
          { key: 'refunded', label: '반환 여부', width: '110px', render: (r) => (
            refundedAll || r.refunded
              ? <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-700">반환 완료</span>
              : <span className="text-gray-400">-</span>
          )},
        ]}
        rows={rows}
        onRowClick={(r) => setDetail(r)}
        emptyMessage="아직 응원한 회원이 없습니다."
      />

      {detail && (
        <CheerDetailModal cheerer={detail} refundedAll={refundedAll} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function CheerDetailModal({ cheerer, refundedAll, onClose }: { cheerer: Cheerer; refundedAll: boolean; onClose: () => void }) {
  const refunded = refundedAll || cheerer.refunded;
  const ordered = [...cheerer.cheers].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{cheerer.member} 응원 내역</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              총 {cheerCount(cheerer)}회 · 누적 {cheerTotal(cheerer).toLocaleString()} 덕력
              {refunded && <span className="text-rose-600"> · 전액 반환 완료{cheerer.refundedAt ? ` (${cheerer.refundedAt})` : ''}</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="py-2 w-16">회차</th>
                <th className="py-2 text-right">응원량(덕력)</th>
                <th className="py-2 text-right">응원 시점</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((c, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-500">{i + 1}회차</td>
                  <td className="py-2 text-right font-medium text-gray-900">{c.amount.toLocaleString()}</td>
                  <td className="py-2 text-right text-gray-500">{c.at}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td className="py-2 font-semibold text-gray-700">누적</td>
                <td className="py-2 text-right font-bold text-indigo-600">{cheerTotal(cheerer).toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  );
}
