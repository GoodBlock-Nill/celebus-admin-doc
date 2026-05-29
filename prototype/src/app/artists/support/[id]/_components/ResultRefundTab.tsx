'use client';

import { useState } from 'react';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  cheererCount, isRefundedStatus, refundedCheerers, refundReasonOf,
  cheerTotal, cheerCount,
  type Cheerer, type SupportEvent, type SupportStatus,
} from '@/mock/support';

export default function ResultRefundTab({ event, status }: { event: SupportEvent; status: SupportStatus }) {
  const isExecuting = status === '집행중';
  const isCompleted = status === '완료';
  const isRefunded = isRefundedStatus(status);

  const [msgKo, setMsgKo] = useState(event.result?.messageKo ?? '');
  const [msgEn, setMsgEn] = useState(event.result?.messageEn ?? '');
  const [msgJp, setMsgJp] = useState(event.result?.messageJp ?? '');

  return (
    <div className="space-y-6">
      {/* 결과물 영역 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">결과물</h3>
        <p className="text-xs text-gray-500 mb-4">
          집행 완료 후 결과 메시지(다국어)와 사진·영상을 등록합니다. 상단 [결과물 등록·완료] 시 회원 앱에 공개됩니다.
        </p>

        {!isExecuting && !isCompleted ? (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            집행중 상태에서 결과물을 등록할 수 있습니다.
          </div>
        ) : (
          <div className="space-y-4">
            <ResultField label="결과 메시지 (한국어)" value={msgKo} onChange={setMsgKo} disabled={isCompleted} max={200} />
            <ResultField label="결과 메시지 (영어)" value={msgEn} onChange={setMsgEn} disabled={isCompleted} max={200} />
            <ResultField label="결과 메시지 (일본어)" value={msgJp} onChange={setMsgJp} disabled={isCompleted} max={200} />
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">결과 사진·영상 (최대 10장)</div>
              <div className="flex flex-wrap gap-2">
                {(event.result?.mediaUrls ?? []).map((m) => (
                  <div key={m} className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] text-gray-400 text-center px-1">{m}</div>
                ))}
                {!isCompleted && (
                  <button className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-sm hover:border-indigo-400">+ 추가</button>
                )}
                {isCompleted && (event.result?.mediaUrls ?? []).length === 0 && (
                  <span className="text-sm text-gray-400">등록된 사진·영상이 없습니다.</span>
                )}
              </div>
            </div>
            {isExecuting && (
              <p className="text-xs text-gray-400">입력 후 상단 [결과물 등록·완료] 버튼으로 완료 처리하면 회원 앱에 공개됩니다.</p>
            )}
          </div>
        )}
      </div>

      {/* 반환 현황 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">반환 현황</h3>
        <p className="text-xs text-gray-500 mb-4">
          미달성종료·집행취소·강제 종료 시 응원 덕력은 전액 자동 반환됩니다. 운영자 수동 반환은 없습니다.
        </p>
        {isRefunded ? (
          <div className="space-y-5">
            {/* 요약 */}
            <div className="grid grid-cols-3 gap-4">
              <RefundCell label="반환 사유" value={refundReasonOf(event) ?? '-'} badge />
              <RefundCell label="반환 방식" value="서버 자동 · 즉시 전액" />
              <RefundCell label="반환율" value="100%" highlight />
              <RefundCell label="반환 대상" value={`${cheererCount(event).toLocaleString()}명`} />
              <RefundCell label="반환 총 덕력" value={`${event.accumulatedDuk.toLocaleString()} 덕력`} highlight />
              <RefundCell label="반환 완료 시점" value={event.updatedAt} />
            </div>

            {/* 회원별 반환 내역 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-800">회원별 반환 내역</h4>
                <span className="text-xs text-gray-400">회차별 응원 내역은 “응원자 내역” 탭 참조</span>
              </div>
              <SimpleTable<Cheerer>
                columns={[
                  { key: 'member', label: '닉네임', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
                  { key: 'refundDuk', label: '반환 덕력', width: '150px', align: 'right', render: (r) => (
                    <span className="text-rose-600 font-medium">{cheerTotal(r).toLocaleString()}</span>
                  )},
                  { key: 'count', label: '원 응원 횟수', width: '120px', align: 'right', render: (r) => `${cheerCount(r)}회` },
                  { key: 'refundedAt', label: '반환 시점', width: '180px', render: (r) => <span className="text-gray-500">{r.refundedAt ?? event.updatedAt}</span> },
                  { key: 'state', label: '상태', width: '110px', render: () => (
                    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-700">반환 완료</span>
                  )},
                ]}
                rows={[...refundedCheerers(event)].sort((a, b) => cheerTotal(b) - cheerTotal(a))}
                emptyMessage="반환 대상 회원이 없습니다."
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            반환된 응원이 없습니다. (정상 집행·완료 이벤트는 반환 없음)
          </div>
        )}
      </div>
    </div>
  );
}

function ResultField({ label, value, onChange, disabled, max }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; max: number;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-1">{label} <span className="text-gray-400">(최대 {max}자)</span></div>
      <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, max))} disabled={disabled} rows={2}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 resize-none" />
    </div>
  );
}

function RefundCell({ label, value, highlight, badge }: { label: string; value: string; highlight?: boolean; badge?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {badge ? (
        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-700">{value}</span>
      ) : (
        <div className={`text-sm font-semibold ${highlight ? 'text-rose-600' : 'text-gray-900'}`}>{value}</div>
      )}
    </div>
  );
}
