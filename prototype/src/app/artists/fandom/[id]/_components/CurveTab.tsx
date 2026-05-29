'use client';

import { useMemo, useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import { RECOMMENDED_CURVE, computeLevelStatus, type FandomLevel, type FandomLevelStep } from '@/mock/fandom';

export default function CurveTab({ fandom, onEditingChange }: { fandom: FandomLevel; onEditingChange?: (v: boolean) => void }) {
  const [levels, setLevels] = useState<FandomLevelStep[]>(fandom.levels);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // 레벨별 달성 일시 맵 (레벨업 이력 기반)
  const achievedMap = useMemo(() => {
    const m = new Map<number, string>();
    fandom.levelUpHistory.forEach((h) => m.set(h.level, h.achievedAt));
    return m;
  }, [fandom.levelUpHistory]);

  const isAchieved = (level: number) => level <= fandom.currentLevel;
  const levelStatus = computeLevelStatus(fandom.currentLevel, levels.length);
  // 종료 시즌 또는 최고레벨이면 읽기 전용 잠금
  const isLocked = fandom.status === '종료' || levelStatus === '최고레벨';

  const setEditingWithNotify = (v: boolean) => {
    setEditing(v);
    onEditingChange?.(v);
  };

  const updateTarget = (i: number, v: string) => {
    const num = parseInt(v.replace(/[^0-9]/g, ''), 10) || 0;
    setLevels(levels.map((l, idx) => (idx === i ? { ...l, targetDuk: num } : l)));
  };
  const addLevel = () => {
    if (levels.length >= 10) { toast.error('레벨은 최대 10단계까지 설정할 수 있습니다.'); return; }
    const next = levels.length + 1;
    setLevels([...levels, { level: next, targetDuk: RECOMMENDED_CURVE[next - 1] ?? 0 }]);
  };
  const removeLevel = (i: number, level: number) => {
    // 이미 달성된 레벨은 삭제 불가 — [CEB-BO-EVT-201] §2.3 / §5
    if (isAchieved(level)) { toast.error('이미 달성된 레벨은 수정·삭제할 수 없습니다.'); return; }
    const next = levels.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, level: idx + 1 }));
    setLevels(next);
  };
  const applyRecommended = () => {
    setLevels(levels.map((l, idx) => ({ ...l, targetDuk: RECOMMENDED_CURVE[idx] ?? l.targetDuk })));
    toast.success('권장 곡선값을 적용했습니다.');
  };

  const handleCancel = () => {
    setLevels(fandom.levels);
    setEditingWithNotify(false);
  };

  // 저장 전 입력 검증 — 레벨업 목표 덕력 1 이상 정수 필수
  const handleSaveClick = () => {
    const invalid = levels.find((l) => !Number.isInteger(l.targetDuk) || l.targetDuk < 1);
    if (invalid) {
      toast.error('레벨업 목표 덕력은 1 이상이어야 합니다.');
      return;
    }
    setSaveOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
      {/* 시즌 정보 */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 h-fit">
        <h2 className="text-base font-bold text-gray-900 mb-4">시즌 정보</h2>
        <dl className="space-y-2.5 text-sm">
          {[
            ['시즌명', fandom.season],
            ['기간', fandom.seasonPeriod],
            ['현재 팬덤 레벨', `Lv.${fandom.currentLevel}`],
            ['누적 덕력', `${fandom.accumulatedDuk.toLocaleString()} DUK`],
            ['참여 팬 수', `${fandom.participants.toLocaleString()} 명`],
            ['최고레벨 도달', levelStatus === '최고레벨' ? '도달 (MAX)' : '미도달'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium text-gray-900 text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 레벨 곡선 테이블 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">레벨 곡선 <span className="text-gray-400 font-normal text-sm">(최대 10레벨)</span></h2>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={applyRecommended} className="h-9 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">권장 곡선 적용</button>
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
          <p className="mb-4 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            {fandom.status === '종료' ? '종료된 시즌 — 읽기 전용' : '최고 레벨 도달 — 시즌 곡선·보상이 확정되어 수정할 수 없습니다.'}
          </p>
        )}

        <table className="w-full text-sm">
          <thead className="bg-indigo-50/60 border-y border-indigo-100">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 w-[80px]">레벨</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">레벨업 목표 덕력 (DUK)</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700 w-[120px]">권장값</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-700 w-[90px]">달성 여부</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 w-[150px]">달성 일시</th>
              {editing && <th className="px-4 py-2.5 w-[48px]" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {levels.map((l, i) => {
              const achieved = isAchieved(l.level);
              const isMax = l.level === levels.length;
              return (
                <tr key={i} className={achieved ? 'bg-gray-50/60' : ''}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    Lv.{l.level}
                    {isMax && <span className="ml-1.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700">MAX</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {editing ? (
                      <input
                        value={l.targetDuk.toLocaleString()}
                        onChange={(e) => updateTarget(i, e.target.value)}
                        disabled={achieved}
                        className="w-[200px] h-9 px-3 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    ) : (
                      <span className={`text-sm ${achieved ? 'text-gray-400' : 'text-gray-900'}`}>{l.targetDuk.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-400">{(RECOMMENDED_CURVE[i] ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    {achieved ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-700">달성</span>
                    ) : (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500">미달성</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{achievedMap.get(l.level) ?? '-'}</td>
                  {editing && (
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => removeLevel(i, l.level)}
                        disabled={achieved}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
                      ><XMarkIcon className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {editing && levels.length < 10 && (
          <button onClick={addLevel} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
            <PlusIcon className="w-4 h-4" />레벨 추가
          </button>
        )}
        <p className="mt-3 text-xs text-gray-400">진행중 시즌에도 미달성 레벨(현재 레벨 초과)을 추가할 수 있습니다. 신규 레벨 보상은 추가 이후 달성 시점부터 적용되며 기존 지급분은 변경되지 않습니다.</p>
      </div>

      <ConfirmModal isOpen={saveOpen} onClose={() => setSaveOpen(false)} onConfirm={() => { setSaveOpen(false); setEditingWithNotify(false); toast.success(`'${fandom.groupName}'의 팬덤 레벨 곡선을 저장했습니다.`); }} title="곡선을 저장할까요?" lines={['변경된 레벨 곡선이 앱에 반영됩니다.']} confirmLabel="저장" />
    </div>
  );
}
