'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  FIXED_REWARD_MAX,
  type RewardMethod,
  editions,
  getEditionTokens,
  type BiveToken,
  LINKED_FEATURES,
} from '@/mock/bive';

// [CEB-BO-BIVE-203-CREATE] 캠페인 생성 v1.6 — 연결 기능 7종 (운영 BO 정합)
// 라우트: /bive/minting/create?type=EVENT|TICKET|MIX|PICK
// 모든 캠페인 유형 공통 7종 연결 기능 (LINKED_FEATURES @/mock/bive)

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'bive', label: 'BIVE 보상' },
] as const;

function CreateCampaignContent() {
  const router = useRouter();
  const search = useSearchParams();
  const type = (search.get('type') as 'EVENT' | 'TICKET' | 'MIX' | 'PICK') || 'EVENT';
  const typeLabel = type.charAt(0) + type.slice(1).toLowerCase();

  const [tab, setTab] = useState<'info' | 'bive'>('info');
  const [name, setName] = useState('');
  const [linked, setLinked] = useState('');
  const [rewardMethod, setRewardMethod] = useState<RewardMethod>('WEIGHTED');
  // BIVE 보상 행 (생성 시점에서 누적, [생성하기] 시 함께 저장)
  // [CEB-BO-BIVE-203-CREATE] §2-3 v1.5 — [+ 추가하기] 운영 BO 정합 (항상 활성)
  const [rewards, setRewards] = useState<Array<{ token: BiveToken; weight: string }>>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const canSubmit = !!name.trim() && !!linked;
  const weightSum = rewards.reduce((acc, r) => acc + (parseInt(r.weight || '0', 10) || 0), 0);
  const fixedFull = rewardMethod === 'FIXED' && rewards.length >= FIXED_REWARD_MAX;

  const updateWeight = (id: number, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 3);
    setRewards((prev) => prev.map((r) => (r.token.id === id ? { ...r, weight: sanitized } : r)));
  };
  const removeRow = (id: number) => {
    setRewards((prev) => prev.filter((r) => r.token.id !== id));
  };
  const addSelected = (tokens: BiveToken[]) => {
    setRewards((prev) => {
      const existing = new Set(prev.map((r) => r.token.id));
      const next = tokens
        .filter((t) => !existing.has(t.id))
        .map((t) => ({ token: t, weight: '' }));
      const merged = [...prev, ...next];
      // 지정 보상 시 10종 상한 컷
      return rewardMethod === 'FIXED' ? merged.slice(0, FIXED_REWARD_MAX) : merged;
    });
    setModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={`${typeLabel} 캠페인 생성`}
          breadcrumbItems={[
            { label: 'BIVE' },
            { label: '민팅 관리', href: '/bive/minting' },
            { label: '캠페인 생성' },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/bive/minting')}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소하기
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              alert(`[Mock] 캠페인 생성\n${name} (${linked})`);
              router.push('/bive/minting');
            }}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            생성하기
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm">
              캠페인 식별을 위한 캠페인 명을 입력하고, 연결기능을 선택해 주세요.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">캠페인 명</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="캠페인 명을 입력하세요"
                className="w-full h-12 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">연결 기능</label>
              <div className="relative">
                <select
                  value={linked}
                  onChange={(e) => setLinked(e.target.value)}
                  className="w-full h-12 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
                >
                  <option value="">연결 기능을 선택해주세요</option>
                  {LINKED_FEATURES.map((f) => <option key={f}>{f}</option>)}
                </select>
                <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* 보상 방식 선택 — 라디오 + 설명 ([CEB-BO-BIVE-203-CREATE] §2-3 v1.4) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900">보상 방식 선택</h4>
              <p className="text-xs text-gray-500 mt-0.5">두 가지 방식 중 한 가지를 선택하여 캠페인을 활성화합니다.</p>
            </div>
            <div className="space-y-2">
              {([
                { key: 'WEIGHTED' as const, label: '가중치 보상', desc: '등록된 BIVE 중 가중치 확률로 1개를 추첨하여 회원에게 발행합니다.' },
                { key: 'FIXED' as const, label: '지정 보상', desc: `등록된 모든 BIVE를 회원에게 동시에 발행합니다. 최대 ${FIXED_REWARD_MAX}종까지 등록 가능합니다.` },
              ]).map((m) => {
                const selected = rewardMethod === m.key;
                return (
                  <label
                    key={m.key}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                      selected ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rewardMethod"
                      checked={selected}
                      onChange={() => setRewardMethod(m.key)}
                      className="mt-1 w-4 h-4 accent-indigo-600"
                    />
                    <div>
                      <div className={`text-sm font-medium ${selected ? 'text-indigo-700' : 'text-gray-900'}`}>{m.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              {rewardMethod === 'WEIGHTED'
                ? '보상으로 지급되는 BIVE를 추가하고 각 항목에 가중치를 입력하세요.'
                : `캠페인 트리거 시 등록된 모든 BIVE가 동시에 지급됩니다. 최대 ${FIXED_REWARD_MAX}종까지 등록 가능합니다.`}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {rewardMethod === 'WEIGHTED' ? (
                  <>가중치 합: <span className="font-semibold text-gray-900">{weightSum}</span></>
                ) : (
                  <>등록 BIVE: <span className="font-semibold text-gray-900">{rewards.length}</span> / {FIXED_REWARD_MAX}</>
                )}
              </span>
              <button
                onClick={() => setModalOpen(true)}
                disabled={fixedFull}
                className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-4 h-4" />추가하기
              </button>
            </div>
          </div>
          <SimpleTable
            columns={[
              { key: 'name', label: 'BIVE 명칭', wrap: true },
              { key: 'group', label: '아티스트 그룹', width: '130px' },
              { key: 'artist', label: '아티스트', width: '100px' },
              { key: 'grade', label: '등급', width: '80px' },
              { key: 'gradeNumber', label: '등급번호', width: '90px' },
              ...(rewardMethod === 'WEIGHTED' ? [
                { key: 'weight', label: '가중치', width: '110px' },
                { key: 'pct', label: '가중치 비중', width: '110px' },
              ] : []),
              { key: 'manage', label: '관리', width: '60px' },
            ]}
            rows={rewards.map((r) => {
              const w = parseInt(r.weight || '0', 10) || 0;
              return {
                name: r.token.name,
                group: r.token.artistGroup,
                artist: r.token.artist,
                grade: r.token.grade,
                gradeNumber: r.token.gradeNumber,
                ...(rewardMethod === 'WEIGHTED'
                  ? {
                      weight: (
                        <input
                          value={r.weight}
                          onChange={(e) => updateWeight(r.token.id, e.target.value)}
                          placeholder="1-999"
                          className="w-20 h-8 px-2 border border-gray-200 rounded text-sm"
                        />
                      ),
                      pct: weightSum > 0 ? `${w}/${weightSum}` : '—',
                    }
                  : {}),
                manage: (
                  <button
                    onClick={() => removeRow(r.token.id)}
                    aria-label="행 삭제"
                    className="inline-flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                ),
              };
            })}
            emptyMessage="+ 추가 버튼을 눌러 BIVE를 등록하세요."
          />
          {modalOpen && (
            <AddBiveRewardModal
              alreadyAddedIds={rewards.map((r) => r.token.id)}
              rewardMethod={rewardMethod}
              remainingSlots={rewardMethod === 'FIXED' ? FIXED_REWARD_MAX - rewards.length : Infinity}
              onClose={() => setModalOpen(false)}
              onAdd={addSelected}
            />
          )}
        </div>
      )}
    </div>
  );
}

// [CEB-BO-BIVE-203-MD-ADD] BIVE 보상 추가 모달 (Mock)
function AddBiveRewardModal({
  alreadyAddedIds,
  rewardMethod,
  remainingSlots,
  onClose,
  onAdd,
}: {
  alreadyAddedIds: number[];
  rewardMethod: RewardMethod;
  remainingSlots: number;
  onClose: () => void;
  onAdd: (tokens: BiveToken[]) => void;
}) {
  const [editionId, setEditionId] = useState<number | ''>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const tokens = useMemo(() => {
    if (!editionId) return [];
    return getEditionTokens(Number(editionId)).filter((t) => t.status === 'Active');
  }, [editionId]);

  const toggle = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const overLimit = rewardMethod === 'FIXED' && selectedIds.length > remainingSlots;
  const canAdd = selectedIds.length > 0 && !overLimit;

  const handleAdd = () => {
    const picked = tokens.filter((t) => selectedIds.includes(t.id));
    onAdd(picked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">보상으로 지급될 BIVE를 추가해주세요.</h3>
            {rewardMethod === 'FIXED' && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                지정 보상 — 잔여 {Math.max(remainingSlots - selectedIds.length, 0)}/{FIXED_REWARD_MAX}
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="닫기" className="w-8 h-8 inline-flex items-center justify-center rounded text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-hidden flex-1 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">에디션 <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={editionId}
                onChange={(e) => {
                  setEditionId(e.target.value === '' ? '' : Number(e.target.value));
                  setSelectedIds([]);
                }}
                className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
              >
                <option value="">에디션을 선택해주세요</option>
                {editions.map((e) => (
                  <option key={e.id} value={e.id}>{e.nameKR}</option>
                ))}
              </select>
              <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-auto flex-1">
            {!editionId ? (
              <div className="p-8 text-center text-sm text-gray-500">에디션을 선택해 등록된 BIVE를 확인하세요.</div>
            ) : tokens.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">조건에 맞는 BIVE가 없습니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="w-10 p-3"></th>
                    <th className="text-left p-3 font-medium">BIVE 명칭</th>
                    <th className="text-left p-3 font-medium w-28">아티스트</th>
                    <th className="text-left p-3 font-medium w-20">등급</th>
                    <th className="text-left p-3 font-medium w-20">등급번호</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => {
                    const already = alreadyAddedIds.includes(t.id);
                    const checked = already || selectedIds.includes(t.id);
                    return (
                      <tr key={t.id} className={`border-t border-gray-100 ${already ? 'opacity-60' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={already}
                            onChange={() => toggle(t.id)}
                            className="w-4 h-4 accent-indigo-600"
                          />
                        </td>
                        <td className="p-3 text-gray-900">{t.name}</td>
                        <td className="p-3 text-gray-700">{t.artist}</td>
                        <td className="p-3 text-gray-700">{t.grade}</td>
                        <td className="p-3 text-gray-700">{t.gradeNumber}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {overLimit && (
            <div className="text-xs text-red-600">최대 {FIXED_REWARD_MAX}종까지 등록 가능합니다.</div>
          )}
        </div>
        <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            닫기
          </button>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            추가하기 {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={null}>
      <CreateCampaignContent />
    </Suspense>
  );
}
