'use client';

import { useMemo, useState } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  generateMockSeed,
  type Raffle,
  type RaffleEntry,
} from '@/mock/fanquest';

interface PreviewWinner {
  userId: number;
  nickname: string;
  phone: string;
  cumulativeTickets: number;
}

interface Props {
  raffle: Raffle;
  entries: RaffleEntry[];
  onCancel: () => void;
  onConfirm: (seed: string, winners: PreviewWinner[]) => void;
}

/**
 * 가중치 기반 가짜 셔플 — 시드를 PRNG로 단순화하여 결정론적 mock 추첨.
 * 운영의 SHA256+Fisher-Yates+ticket weight를 흉내낸 시연용.
 */
function pseudoDraw(seed: string, entries: RaffleEntry[], winnerCount: number): PreviewWinner[] {
  // mulberry32 PRNG with seed bytes
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pool = entries.flatMap((e) =>
    Array.from({ length: Math.max(1, e.cumulativeTickets) }).map(() => e),
  );
  const picked = new Set<number>();
  const winners: PreviewWinner[] = [];
  let guard = 0;
  while (winners.length < Math.min(winnerCount, entries.length) && guard < 10000) {
    guard++;
    const idx = Math.floor(rand() * pool.length);
    const entry = pool[idx];
    if (picked.has(entry.userId)) continue;
    picked.add(entry.userId);
    winners.push({
      userId: entry.userId,
      nickname: entry.nickname,
      phone: entry.phone,
      cumulativeTickets: entry.cumulativeTickets,
    });
  }
  return winners;
}

export default function DrawModal({ raffle, entries, onCancel, onConfirm }: Props) {
  const [seed, setSeed] = useState(() => generateMockSeed(raffle.id));
  const eligibleEntries = useMemo(() => entries.filter((e) => !e.excludedFromDraw), [entries]);
  const excludedCount = entries.length - eligibleEntries.length;
  const winners = useMemo(
    () => pseudoDraw(seed, eligibleEntries, raffle.winnerCount),
    [seed, eligibleEntries, raffle.winnerCount],
  );

  const reshuffle = () => setSeed(generateMockSeed(raffle.id));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Raffle 추첨하기</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[480px]">{raffle.titleKO}</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-3">
            <div className="text-[11px] flex-1">
              <div className="text-indigo-600 font-semibold mb-0.5">가추첨 시드</div>
              <div className="font-mono text-indigo-900 text-xs break-all">{seed}</div>
              <p className="text-indigo-700 mt-1 leading-relaxed">
                <strong>응모권 수에 정확 비례한 가중치 무작위 추첨</strong>. 응모권 10장 사용 회원은 1장 사용 회원보다 정확히 10배 높은 당첨 확률을 갖습니다. 본 래플 내에서 회원당 최대 1회 당첨. 동률은 시드 기반 무작위. 재추첨 시 새 시드로 다시 뽑습니다.
              </p>
            </div>
            <button
              onClick={reshuffle}
              className="h-8 px-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              재추첨
            </button>
          </div>

          <div className="text-xs text-gray-500">
            예상 당첨 <strong className="text-gray-900">{winners.length}</strong>명 / 목표 {raffle.winnerCount}명
            · 총 응모자 {raffle.totalParticipants}명
            · 추첨 풀 <strong className="text-gray-900">{eligibleEntries.length}</strong>명
            {excludedCount > 0 && <span className="text-rose-600"> (제외 {excludedCount}명 차감)</span>}
          </div>

          {eligibleEntries.length === 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700">
              제외 처리로 추첨 가능한 응모자가 0명입니다. 응모내역 탭에서 제외를 해제하거나 자동 종료를 진행해주세요.
            </div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-700 w-12">#</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-700">닉네임</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-700 w-36">전화번호</th>
                  <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-700 w-20">응모권</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {winners.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-gray-400">응모자가 없어 추첨이 불가능합니다.</td></tr>
                ) : winners.map((w, i) => (
                  <tr key={w.userId}>
                    <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{w.nickname}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 font-mono">{w.phone}</td>
                    <td className="px-3 py-2 text-xs text-right text-gray-700">{w.cumulativeTickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onCancel} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={() => onConfirm(seed, winners)}
            disabled={winners.length === 0}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed"
          >
            추첨 확정
          </button>
        </div>
      </div>
    </div>
  );
}
