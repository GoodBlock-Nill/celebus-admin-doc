'use client';

import { useMemo, useState } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import {
  dukActiveGroups,
  DUK_POLICY_ACTIVITIES,
  getDukPolicy,
  type DukPolicyRow,
} from '@/mock/duk';

// [CEB-BO-ART-401-POLICY] 덕력 지급 정책 — 아티스트 그룹별 자동 적립 활동 덕력 지급량·사용 여부
// Quest·게임 참여는 콘텐츠별 직접 입력 → 매트릭스 제외. 신규 아티스트는 권장값 기본 정책 자동 생성(미설정 부재)

const tierBadge: Record<string, string> = {
  T1: 'bg-sky-50 text-sky-700',
  T2: 'bg-amber-50 text-amber-700',
  T3: 'bg-indigo-50 text-indigo-700',
  보너스: 'bg-rose-50 text-rose-700',
};

export default function PolicyTab() {
  const [groupId, setGroupId] = useState(dukActiveGroups[0].id);
  const initial = getDukPolicy(groupId);
  const [rows, setRows] = useState<DukPolicyRow[]>(initial.rows);
  const [saveOpen, setSaveOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(`${initial.updatedAt} · ${initial.updatedBy}`);

  // 그룹 전환 — 미저장 변경 가드
  const changeGroup = (id: number) => {
    if (hasChanged && !window.confirm('저장하지 않은 변경이 있습니다. 이동할까요?')) return;
    const p = getDukPolicy(id);
    setGroupId(id);
    setRows(p.rows);
    setLastSaved(`${p.updatedAt} · ${p.updatedBy}`);
  };

  const baseline = useMemo(() => getDukPolicy(groupId).rows, [groupId]);
  const hasChanged = useMemo(
    () => rows.some((r, i) => r.duk !== baseline[i].duk || r.enabled !== baseline[i].enabled),
    [rows, baseline],
  );

  const setDuk = (key: string, v: string) => {
    const n = v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0);
    setRows(rows.map((r) => (r.activityKey === key ? { ...r, duk: n } : r)));
  };
  const toggle = (key: string) =>
    setRows(rows.map((r) => (r.activityKey === key ? { ...r, enabled: !r.enabled } : r)));

  const applyRecommended = () => {
    setRows(DUK_POLICY_ACTIVITIES.map((a) => ({ activityKey: a.key, duk: a.recommended, enabled: true })));
    toast.success('권장값을 적용했습니다. 저장하면 반영됩니다.');
  };

  const confirmSave = () => {
    setSaveOpen(false);
    setLastSaved('2026.06.10 14:30 · nill');
    toast.success('지급 정책이 저장되었습니다.');
  };

  const actMap = useMemo(() => Object.fromEntries(DUK_POLICY_ACTIVITIES.map((a) => [a.key, a])), []);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        아티스트 그룹별 자동 적립 활동의 덕력 지급량을 설정합니다. Quest·게임 참여는 각 콘텐츠 생성 시 직접 입력합니다.
      </p>

      {/* 그룹 선택 + 액션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <select
            value={groupId}
            onChange={(e) => changeGroup(parseInt(e.target.value, 10))}
            className="h-10 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {dukActiveGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={applyRecommended} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">권장값 적용</button>
          <button
            onClick={() => setSaveOpen(true)}
            disabled={!hasChanged}
            className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >저장</button>
        </div>
      </div>

      {/* 정책 매트릭스 */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="px-4 py-3 text-left font-medium">활동</th>
              <th className="px-4 py-3 text-left font-medium w-[90px]">티어</th>
              <th className="px-4 py-3 text-right font-medium w-[90px]">권장값</th>
              <th className="px-4 py-3 text-right font-medium w-[140px]">지급 덕력</th>
              <th className="px-4 py-3 text-center font-medium w-[100px]">사용</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const a = actMap[r.activityKey];
              const changed = r.duk !== a.recommended;
              return (
                <tr key={r.activityKey} className={r.enabled ? '' : 'bg-gray-50/60'}>
                  <td className="px-4 py-3 text-gray-900">{a.label}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${tierBadge[a.tier]}`}>{a.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{a.recommended.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      value={r.duk}
                      onChange={(e) => setDuk(r.activityKey, e.target.value)}
                      disabled={!r.enabled}
                      className={`w-[100px] h-9 px-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 ${changed ? 'font-semibold text-indigo-600' : 'text-gray-900'}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggle(r.activityKey)}
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                    >{r.enabled ? '사용' : '미사용'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">마지막 수정 {lastSaved}</p>

      <ConfirmModal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        onConfirm={confirmSave}
        title="지급 정책을 저장할까요?"
        lines={['변경한 덕력 지급량·사용 여부가 이후 적립부터 반영됩니다.']}
        confirmLabel="저장"
      />
    </div>
  );
}
