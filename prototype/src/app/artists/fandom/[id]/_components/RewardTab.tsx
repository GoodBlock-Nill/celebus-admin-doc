'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import {
  REWARD_TYPES,
  REWARD_TYPE_RULES,
  type FandomLevel,
  type FandomReward,
  type RewardType,
  type RewardRefType,
  type LotteryStatus,
} from '@/mock/fandom';

// 추첨 상태 뱃지 — [CEB-BO-EVT-201] §2.4
function lotteryBadge(s: LotteryStatus) {
  if (s === '추첨 완료') return 'bg-emerald-100 text-emerald-700';
  if (s === '추첨 대기') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-500'; // 미실행
}

export default function RewardTab({ fandom }: { fandom: FandomLevel }) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [rewards, setRewards] = useState<FandomReward[]>(fandom.rewards);
  const [drawTarget, setDrawTarget] = useState<FandomReward | null>(null);
  const [retryTarget, setRetryTarget] = useState<FandomReward | null>(null);

  const levelRewards = rewards
    .filter((r) => r.level === selectedLevel)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const idxOf = (r: FandomReward) => rewards.indexOf(r);
  const isAchieved = (level: number) => level <= fandom.currentLevel;

  const addReward = () => {
    const rule = REWARD_TYPE_RULES['독점 콘텐츠'];
    const nextOrder = Math.max(0, ...rewards.filter((r) => r.level === selectedLevel).map((r) => r.sortOrder)) + 1;
    setRewards([
      ...rewards,
      { level: selectedLevel, type: '독점 콘텐츠', nameKo: '', nameEn: '', nameJp: '', payout: rule.payout, sortOrder: nextOrder },
    ]);
  };

  // 보상 타입 변경 시 지급 방식 자동 고정 + 무효 참조/필드 초기화 — [CEB-BO-EVT-201] §2.4
  const changeType = (r: FandomReward, type: RewardType) => {
    const rule = REWARD_TYPE_RULES[type];
    const i = idxOf(r);
    setRewards(rewards.map((x, idx) => (idx === i ? {
      ...x,
      type,
      payout: rule.payout,
      refType: rule.refTypes[0],
      winners: rule.needsWinners ? (x.winners ?? 0) : undefined,
      shippingDeadline: rule.needsShipping ? x.shippingDeadline : undefined,
      fileUrl: rule.needsFile ? x.fileUrl : undefined,
      lotteryStatus: rule.payout === '추첨' ? (x.lotteryStatus ?? '미실행') : undefined,
    } : x)));
  };

  const updateField = (r: FandomReward, key: keyof FandomReward, v: string) => {
    const i = idxOf(r);
    const numeric = key === 'winners' || key === 'sortOrder';
    setRewards(rewards.map((x, idx) => (idx === i ? { ...x, [key]: numeric ? (parseInt(v, 10) || 0) : v } : x)));
  };

  const removeReward = (r: FandomReward) => { const i = idxOf(r); setRewards(rewards.filter((_, idx) => idx !== i)); };

  const setLottery = (r: FandomReward, status: LotteryStatus) => {
    const i = idxOf(r);
    setRewards(rewards.map((x, idx) => (idx === i ? { ...x, lotteryStatus: status } : x)));
  };

  return (
    <div>
      {/* 레벨 선택 스텝퍼 */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {fandom.levels.map((l) => (
          <button
            key={l.level}
            onClick={() => setSelectedLevel(l.level)}
            className={`h-9 min-w-[44px] px-3 rounded-lg text-sm font-medium border transition-colors ${
              selectedLevel === l.level ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >Lv.{l.level}</button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Lv.{selectedLevel} 보상
            {isAchieved(selectedLevel)
              ? <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-700">달성</span>
              : <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500">미달성</span>}
          </h2>
          <button onClick={addReward} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"><PlusIcon className="w-4 h-4" />보상 추가</button>
        </div>

        {levelRewards.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">등록된 보상이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {levelRewards.map((r) => {
              const rule = REWARD_TYPE_RULES[r.type];
              const achieved = isAchieved(r.level);
              return (
                <div key={idxOf(r)} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    {/* 보상 타입 */}
                    <div className="relative">
                      <select value={r.type} onChange={(e) => changeType(r, e.target.value as RewardType)} className="h-10 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {REWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {/* 지급 방식 (자동 고정, 변경 불가) */}
                    <span className={`h-10 inline-flex items-center px-3 rounded-lg text-sm font-medium ${rule.payout === '추첨' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {rule.payout}
                    </span>
                    {/* 노출 순서 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">순서</span>
                      <input value={r.sortOrder} onChange={(e) => updateField(r, 'sortOrder', e.target.value)} className="w-[60px] h-10 px-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex-1" />
                    <button onClick={() => removeReward(r)} className="p-1.5 text-gray-400 hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>
                  </div>

                  {/* 다국어 보상명 */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <input value={r.nameKo} onChange={(e) => updateField(r, 'nameKo', e.target.value)} placeholder="보상명 (한국어)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input value={r.nameEn} onChange={(e) => updateField(r, 'nameEn', e.target.value)} placeholder="Reward name (EN)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input value={r.nameJp} onChange={(e) => updateField(r, 'nameJp', e.target.value)} placeholder="報酬名 (日本語)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  {/* 타입별 추가 입력 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 참조 연결 (타입별 제약) */}
                    {rule.refTypes.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">참조 연결</span>
                        <div className="relative">
                          <select value={r.refType ?? rule.refTypes[0]} onChange={(e) => updateField(r, 'refType', e.target.value as RewardRefType)} className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[110px] focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {rule.refTypes.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                          </select>
                          <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}
                    {/* 당첨 인원 (실물·이벤트) */}
                    {rule.needsWinners && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">당첨 인원</span>
                        <input value={r.winners ?? ''} onChange={(e) => updateField(r, 'winners', e.target.value)} placeholder="0" className="w-[80px] h-9 px-3 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    )}
                    {/* 배송지 입력 마감 (실물) */}
                    {rule.needsShipping && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">배송지 마감</span>
                        <input value={r.shippingDeadline ?? ''} onChange={(e) => updateField(r, 'shippingDeadline', e.target.value)} placeholder="YYYY.MM.DD" className="w-[130px] h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    )}
                    {/* 다운로드 파일 (다운로드) */}
                    {rule.needsFile && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">다운로드 파일</span>
                        <input value={r.fileUrl ?? ''} onChange={(e) => updateField(r, 'fileUrl', e.target.value)} placeholder="파일명" className="w-[180px] h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    )}
                  </div>

                  {/* 래플 추첨 실행 (추첨 보상 한정) */}
                  {rule.payout === '추첨' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">추첨 상태</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${lotteryBadge(r.lotteryStatus ?? '미실행')}`}>
                        {r.lotteryStatus ?? '미실행'}
                      </span>
                      {/* 활성: 레벨 달성 후 + 추첨 대기 */}
                      {achieved && r.lotteryStatus === '추첨 대기' && (
                        <button onClick={() => setDrawTarget(r)} className="h-9 px-3 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">래플 추첨 실행</button>
                      )}
                      {/* 미달성 안내 */}
                      {!achieved && (
                        <span className="text-xs text-gray-400">레벨 달성 후 실행 가능</span>
                      )}
                      {/* 실패 시 재시도 */}
                      {r.lotteryStatus === '추첨 대기' && achieved && (
                        <button onClick={() => setRetryTarget(r)} className="h-9 px-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">재시도</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400">디지털 보상(독점 콘텐츠·디지털 굿즈·다운로드)은 전체 지급(기여 회원 전원), 실물·이벤트 보상은 추첨(당첨자만)으로 지급 방식이 자동 고정됩니다. 지급 방식은 운영자가 변경할 수 없습니다.</p>
      </div>

      <ConfirmModal
        isOpen={drawTarget !== null}
        onClose={() => setDrawTarget(null)}
        onConfirm={() => { const t = drawTarget; setDrawTarget(null); if (t) { setLottery(t, '추첨 완료'); toast.success(`Lv.${t.level} '${t.nameKo}' 래플 추첨을 실행했습니다. (당첨: ${t.winners ?? 0}명)`); } }}
        title="래플 추첨을 실행할까요?"
        lines={[`Lv.${drawTarget?.level} '${drawTarget?.nameKo}' — 당첨 ${drawTarget?.winners ?? 0}명`, '기여도 비례 가중치로 당첨자를 추첨합니다.']}
        confirmLabel="추첨 실행"
      />

      <ConfirmModal
        isOpen={retryTarget !== null}
        onClose={() => setRetryTarget(null)}
        onConfirm={() => { const t = retryTarget; setRetryTarget(null); if (t) { setLottery(t, '추첨 완료'); toast.success(`Lv.${t.level} '${t.nameKo}' 래플 추첨을 재시도했습니다.`); } }}
        title="래플 추첨을 재시도할까요?"
        lines={[`Lv.${retryTarget?.level} '${retryTarget?.nameKo}' 추첨을 다시 실행합니다.`]}
        confirmLabel="재시도"
      />
    </div>
  );
}
