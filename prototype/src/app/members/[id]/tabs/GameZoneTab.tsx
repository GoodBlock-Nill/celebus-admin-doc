'use client';

import { useState } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import type { Member } from '@/mock/members';
import { getGPChangesByMember, getGPSummary } from '@/mock/members';

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-2">
        {label} {sub && <span className="text-gray-400">{sub}</span>}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

const GP_TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  CHARGE: { label: 'GP 충전', bg: 'bg-green-100', text: 'text-green-700' },
  WITHDRAW: { label: 'GP 출금', bg: 'bg-orange-100', text: 'text-orange-700' },
};

export default function GameZoneTab({ member }: { member: Member }) {
  const summary = getGPSummary(member.id);
  const changes = getGPChangesByMember(member.id);
  const [gameTab, setGameTab] = useState<'PM' | 'ST'>('PM');

  return (
    <div className="space-y-6">
      {/* 4카드 GP */}
      <div className="grid grid-cols-4 gap-4">
        <Card label="현재 GP 잔액" value={`${summary.balance} GP`} />
        <Card label="누적 획득 GP" value={`${summary.earned} GP`} sub="(보상+환급+충전+환불)" />
        <Card label="누적 사용 GP" value={`${summary.used} GP`} sub="(참여+부스팅+출금)" />
        <Card label="랭킹" value="-" sub="(랭킹 없음)" />
      </div>

      {/* 4카드 게임 성과 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">게임 성과 요약</h3>
        <div className="grid grid-cols-4 gap-4">
          <Card label="PM 참여" value="0회" />
          <Card label="PM 승률" value="0%" />
          <Card label="ST 참여" value="0회" />
          <Card label="ST 생존율" value="-" />
        </div>
      </div>

      {/* 게임 참여 내역 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">게임 참여 내역</h3>
        <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-4">
          {[
            { k: 'PM', label: 'Prediction Market' },
            { k: 'ST', label: 'Survival Trivia' },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setGameTab(t.k as 'PM' | 'ST')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                gameTab === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <select className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
            <option>게임상태 전체</option>
          </select>
          <select className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
            <option>조회기간 전체</option>
          </select>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['게임타이틀', '참여일시', '선택', '참여GP', '부스팅GP', '게임결과', '보상GP', '환급GP', '게임상태'].map((c) => (
                  <th key={c} className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                  게임 참여 내역이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">총 0건</p>
      </div>

      {/* GP 변동 내역 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            GP 변동 내역 <span className="text-sm font-normal text-gray-500">총 {changes.length}건</span>
          </h3>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <select className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
            <option>변동 유형 전체</option>
          </select>
          <select className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
            <option>조회기간 전체</option>
          </select>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">변동일시</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">유형</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">GP 변동량</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">변동후잔액</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {changes.map((c) => {
                const badge = GP_TYPE_BADGE[c.type];
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{c.occurredAt}</td>
                    <td className="px-4 py-3 text-sm">
                      {badge ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      ) : null}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${c.amount > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {c.amount > 0 ? '+' : ''}
                      {c.amount} GP
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{c.balanceAfter} GP</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
