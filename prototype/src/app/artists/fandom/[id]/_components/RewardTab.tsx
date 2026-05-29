'use client';

import { useState } from 'react';
import { ChevronUpDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import {
  REWARD_TYPES,
  BIVE_CAMPAIGNS,
  getBiveCampaignById,
  computeLevelStatus,
  type FandomLevel,
  type FandomReward,
  type RewardType,
} from '@/mock/fandom';

// 보상 종류 뱃지 — [CEB-BO-EVT-201] §2.4
function kindBadge(kind: RewardType) {
  if (kind === '디지털 굿즈') return 'bg-indigo-50 text-indigo-700';
  if (kind === '래플 예고') return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700'; // 서포트 예고
}

const hasActiveCampaign = BIVE_CAMPAIGNS.length > 0;

export default function RewardTab({ fandom, onEditingChange }: { fandom: FandomLevel; onEditingChange?: (v: boolean) => void }) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [rewards, setRewards] = useState<FandomReward[]>(fandom.rewards);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const isMaxSeason = computeLevelStatus(fandom.currentLevel, fandom.levels.length) === '최고레벨';
  // 종료 시즌 또는 최고레벨이면 읽기 전용 잠금
  const isLocked = fandom.status === '종료' || isMaxSeason;

  const setEditingWithNotify = (v: boolean) => {
    setEditing(v);
    onEditingChange?.(v);
  };

  const levelRewards = rewards
    .filter((r) => r.level === selectedLevel)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const idxOf = (r: FandomReward) => rewards.indexOf(r);
  const isAchieved = (level: number) => level <= fandom.currentLevel;

  const addReward = () => {
    if (isAchieved(selectedLevel)) { toast.error('이미 달성된 레벨의 보상은 수정·삭제할 수 없습니다.'); return; }
    const nextOrder = Math.max(0, ...rewards.filter((r) => r.level === selectedLevel).map((r) => r.sortOrder)) + 1;
    setRewards([
      ...rewards,
      // 기본값: 활성 캠페인이 있으면 디지털 굿즈 + 첫 캠페인, 없으면 래플 예고
      hasActiveCampaign
        ? { level: selectedLevel, kind: '디지털 굿즈', biveCampaignId: BIVE_CAMPAIGNS[0].id, titleKo: '', titleEn: '', titleJp: '', sortOrder: nextOrder }
        : { level: selectedLevel, kind: '래플 예고', announceKo: '', announceEn: '', announceJp: '', sortOrder: nextOrder },
    ]);
  };

  // 보상 종류 변경 시 무효 필드 초기화 — [CEB-BO-EVT-201] §2.4
  const changeKind = (r: FandomReward, kind: RewardType) => {
    if (isAchieved(r.level)) { toast.error('이미 달성된 레벨의 보상은 수정·삭제할 수 없습니다.'); return; }
    const i = idxOf(r);
    setRewards(rewards.map((x, idx) => {
      if (idx !== i) return x;
      if (kind === '디지털 굿즈') {
        return { level: x.level, kind, sortOrder: x.sortOrder, biveCampaignId: x.biveCampaignId ?? BIVE_CAMPAIGNS[0]?.id, titleKo: x.titleKo ?? '', titleEn: x.titleEn ?? '', titleJp: x.titleJp ?? '' };
      }
      // 래플·서포트 예고
      return { level: x.level, kind, sortOrder: x.sortOrder, announceKo: x.announceKo ?? '', announceEn: x.announceEn ?? '', announceJp: x.announceJp ?? '' };
    }));
  };

  const updateField = (r: FandomReward, key: keyof FandomReward, v: string) => {
    if (isAchieved(r.level)) { toast.error('이미 달성된 레벨의 보상은 수정·삭제할 수 없습니다.'); return; }
    const i = idxOf(r);
    const numeric = key === 'sortOrder';
    setRewards(rewards.map((x, idx) => (idx === i ? { ...x, [key]: numeric ? (parseInt(v, 10) || 0) : v } : x)));
  };

  const removeReward = (r: FandomReward) => {
    if (isAchieved(r.level)) { toast.error('이미 달성된 레벨의 보상은 수정·삭제할 수 없습니다.'); return; }
    const i = idxOf(r);
    setRewards(rewards.filter((_, idx) => idx !== i));
  };

  const handleCancel = () => {
    setRewards(fandom.rewards);
    setEditingWithNotify(false);
  };

  // 저장 전 입력 검증 — 디지털 굿즈 한국어 타이틀 필수
  const handleSaveClick = () => {
    const missing = rewards.find((r) => r.kind === '디지털 굿즈' && !r.titleKo?.trim());
    if (missing) {
      toast.error('디지털 굿즈 보상 타이틀(한국어)을 입력해주세요.');
      return;
    }
    setSaveOpen(true);
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
          <div className="flex gap-2">
            {editing ? (
              <>
                {!isAchieved(selectedLevel) && (
                  <button onClick={addReward} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"><PlusIcon className="w-4 h-4" />보상 추가</button>
                )}
                <button onClick={handleSaveClick} className="h-9 px-3 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">저장</button>
                <button onClick={handleCancel} className="h-9 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
              </>
            ) : isLocked ? (
              <button disabled className="h-9 px-3 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">수정</button>
            ) : (
              <button onClick={() => setEditingWithNotify(true)} className="h-9 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">수정</button>
            )}
          </div>
        </div>

        {isLocked && (
          <p className="mb-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            {fandom.status === '종료' ? '종료된 시즌 — 읽기 전용' : '최고 레벨 도달 — 시즌 곡선·보상이 확정되어 수정할 수 없습니다.'}
          </p>
        )}

        {editing && isAchieved(selectedLevel) && (
          <p className="mb-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">이미 달성된 레벨의 보상은 수정·삭제할 수 없습니다.</p>
        )}

        {levelRewards.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">등록된 보상이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {levelRewards.map((r) => {
              const campaign = getBiveCampaignById(r.biveCampaignId);
              const locked = isAchieved(r.level);
              // 조회 모드: 모든 컨트롤 비활성
              const readOnly = !editing;
              return (
                <div key={idxOf(r)} className={`border rounded-xl p-4 ${locked ? 'border-gray-100 bg-gray-50/60' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-2 mb-3">
                    {/* 보상 종류 */}
                    <div className="relative">
                      <select
                        value={r.kind}
                        onChange={(e) => changeKind(r, e.target.value as RewardType)}
                        disabled={locked || readOnly}
                        className="h-10 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {REWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {/* 종류 뱃지 — 디지털 굿즈일 때만 BIVE 자동 민팅 뱃지 표시 */}
                    {r.kind === '디지털 굿즈' && (
                      <span className={`h-10 inline-flex items-center px-3 rounded-lg text-sm font-medium ${kindBadge(r.kind)}`}>
                        BIVE 자동 민팅
                      </span>
                    )}
                    {/* 노출 순서 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">순서</span>
                      <input
                        value={r.sortOrder}
                        onChange={(e) => updateField(r, 'sortOrder', e.target.value)}
                        readOnly={locked || readOnly}
                        className="w-[60px] h-10 px-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-100 read-only:text-gray-400"
                      />
                    </div>
                    <div className="flex-1" />
                    {editing && (
                      <button
                        onClick={() => removeReward(r)}
                        disabled={locked}
                        className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                      ><XMarkIcon className="w-4 h-4" /></button>
                    )}
                  </div>

                  {/* 디지털 굿즈 — 보상 타이틀(다국어) + BIVE 캠페인 선택 */}
                  {r.kind === '디지털 굿즈' && (
                    <div className="space-y-3">
                      {/* 보상 타이틀 (한/영/일) — 앱 표시명 */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1.5">보상 타이틀 (앱 표시명, 다국어 필수)</p>
                        <div className="grid grid-cols-1 gap-2">
                          <input value={r.titleKo ?? ''} onChange={(e) => updateField(r, 'titleKo', e.target.value)} readOnly={locked || readOnly} placeholder="보상 타이틀 (한국어)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-100 read-only:text-gray-400" />
                          <input value={r.titleEn ?? ''} onChange={(e) => updateField(r, 'titleEn', e.target.value)} readOnly={locked || readOnly} placeholder="Reward title (EN)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-100 read-only:text-gray-400" />
                          <input value={r.titleJp ?? ''} onChange={(e) => updateField(r, 'titleJp', e.target.value)} readOnly={locked || readOnly} placeholder="報酬タイトル (日本語)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-100 read-only:text-gray-400" />
                        </div>
                      </div>
                      {hasActiveCampaign ? (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-xs text-gray-400">BIVE 민팅 캠페인</span>
                            <div className="relative">
                              <select
                                value={r.biveCampaignId ?? ''}
                                onChange={(e) => updateField(r, 'biveCampaignId', e.target.value)}
                                disabled={locked || readOnly}
                                className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[280px] focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                {BIVE_CAMPAIGNS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          {/* 등록 BIVE 미리보기 */}
                          {campaign && (
                            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                              <p className="text-[11px] text-gray-400 mb-1.5">연결 기능 · {campaign.trigger} / 등록 BIVE 미리보기</p>
                              <div className="flex flex-wrap gap-1.5">
                                {campaign.biveNames.map((n) => (
                                  <span key={n} className="inline-flex items-center rounded-md bg-white border border-gray-200 px-2 py-1 text-xs text-gray-700">{n}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="mt-2 text-[11px] text-gray-400">레벨 달성 시 BIVE 영역이 기여 회원(1DUK 이상)에게 자동 민팅합니다.</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-3">
                          <p className="text-sm text-amber-700">BIVE 영역에서 캠페인을 먼저 생성·활성화해주세요.</p>
                          <p className="mt-1 text-[11px] text-amber-600">디지털 굿즈 보상은 "아티스트 키우기 보상" 연결 기능 캠페인을 선택해야 합니다.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 래플·서포트 예고 — 안내 텍스트 (한/영/일) */}
                  {(r.kind === '래플 예고' || r.kind === '서포트 예고') && (
                    <div>
                      <div className="grid grid-cols-1 gap-2">
                        <input value={r.announceKo ?? ''} onChange={(e) => updateField(r, 'announceKo', e.target.value)} readOnly={locked || readOnly} placeholder="안내 텍스트 (한국어) — 예: Lv.5 달성 시 사인 굿즈 래플 진행 예정" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-100 read-only:text-gray-400" />
                        <input value={r.announceEn ?? ''} onChange={(e) => updateField(r, 'announceEn', e.target.value)} readOnly={locked || readOnly} placeholder="Announcement text (EN)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-100 read-only:text-gray-400" />
                        <input value={r.announceJp ?? ''} onChange={(e) => updateField(r, 'announceJp', e.target.value)} readOnly={locked || readOnly} placeholder="案内テキスト (日本語)" className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:bg-gray-100 read-only:text-gray-400" />
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400">
                        앱 예고 표시 전용입니다. 실제 {r.kind === '래플 예고' ? '래플은 래플 영역' : '서포트는 서포트 영역'}에서 별도 운영합니다.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400">디지털 굿즈(BIVE)는 레벨 달성 시 BIVE 영역이 기여 회원 전원에게 자동 민팅합니다. 래플·서포트 예고는 앱 안내 표시 전용이며, 실제 운영은 각 영역(래플·서포트)에서 별도 진행합니다.</p>
      </div>

      <ConfirmModal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        onConfirm={() => { setSaveOpen(false); setEditingWithNotify(false); toast.success(`'${fandom.groupName}' 레벨 보상을 저장했습니다.`); }}
        title="보상을 저장할까요?"
        lines={['변경된 레벨 보상이 앱에 반영됩니다.']}
        confirmLabel="저장"
      />
    </div>
  );
}
