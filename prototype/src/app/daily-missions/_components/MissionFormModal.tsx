'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { MISSION_TARGETS, type DailyMission } from '@/mock/dailyMission';
import type { MissionInput } from '@/stores/dailyMissionStore';

const LANGS = ['KO', 'EN', 'JA'] as const;
type Lang = (typeof LANGS)[number];
const LANG_LABEL: Record<Lang, string> = { KO: '한국어(기본값)', EN: '영어', JA: '일본어' };

interface Props {
  mode: 'add' | 'edit';
  mission?: DailyMission; // edit 시 초기값
  missions: DailyMission[]; // 이동 대상 중복 검증용
  onClose: () => void;
  onSubmit: (data: MissionInput) => void;
}

export default function MissionFormModal({ mode, mission, missions, onClose, onSubmit }: Props) {
  const [labelLang, setLabelLang] = useState<Lang>('KO');
  const [descLang, setDescLang] = useState<Lang>('KO');
  const [label, setLabel] = useState<Record<Lang, string>>({
    KO: mission?.labelKO ?? '',
    EN: mission?.labelEN ?? '',
    JA: mission?.labelJA ?? '',
  });
  const [desc, setDesc] = useState<Record<Lang, string>>({
    KO: mission?.descKO ?? '',
    EN: mission?.descEN ?? '',
    JA: mission?.descJA ?? '',
  });
  const [targetScreen, setTargetScreen] = useState<string>(mission?.targetScreen ?? '');
  const [active, setActive] = useState<boolean>(mission?.active ?? true);

  // 이동 대상 중복 검증 — 미션 풀 8종은 서로 다른 대상이 원칙(같은 화면 중복 금지)
  const duplicateTarget =
    targetScreen.length > 0 &&
    missions.some((m) => m.targetScreen === targetScreen && m.id !== mission?.id);

  const allLangLabelFilled = label.KO.trim() && label.EN.trim() && label.JA.trim();
  const canSubmit = !!allLangLabelFilled && targetScreen.length > 0 && !duplicateTarget;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      labelKO: label.KO.trim(),
      labelEN: label.EN.trim(),
      labelJA: label.JA.trim(),
      descKO: desc.KO.trim(),
      descEN: desc.EN.trim(),
      descJA: desc.JA.trim(),
      targetScreen,
      active,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? '일일미션 추가' : '일일미션 수정'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* 미션명 (3언어 필수) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              미션명 <span className="text-red-500">*</span>
            </label>
            <LangRadioGroup active={labelLang} onChange={setLabelLang} values={label} />
            <div>
              <input
                value={label[labelLang]}
                onChange={(e) => setLabel({ ...label, [labelLang]: e.target.value.slice(0, 50) })}
                placeholder="미션명 입력 (예: 게임존 방문)"
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{label[labelLang].length}/50자</div>
            </div>
            <LangProgress values={label} />
            <p className="text-[11px] text-gray-500 mt-1">한국어·영어·일본어 3개 언어를 모두 입력해야 합니다.</p>
          </div>

          {/* 설명 (3언어 선택) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">설명 (선택)</label>
            <LangRadioGroup active={descLang} onChange={setDescLang} values={desc} />
            <div>
              <textarea
                value={desc[descLang]}
                onChange={(e) => setDesc({ ...desc, [descLang]: e.target.value.slice(0, 60) })}
                placeholder="미션 카드에 노출할 안내 문구 (예: 게임존을 둘러봐요)"
                rows={2}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{desc[descLang].length}/60자</div>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">미션 카드에서 미션명과 함께 노출됩니다. 미입력 시 미션명만 노출됩니다.</p>
          </div>

          {/* 이동 대상 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              이동 대상 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={targetScreen}
                onChange={(e) => setTargetScreen(e.target.value)}
                className={`w-full h-11 pl-3 pr-9 border rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  duplicateTarget ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                }`}
              >
                <option value="">이동 대상 선택</option>
                {MISSION_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {duplicateTarget && (
              <p className="text-xs text-rose-600 mt-1.5">이미 같은 이동 대상을 사용하는 미션이 있습니다. 다른 대상을 선택하세요.</p>
            )}
            <p className="text-[11px] text-gray-500 mt-1">회원이 미션 카드를 누르면 이동하는 앱 화면입니다. 1회 진입 시 미션 완료로 처리됩니다.</p>
          </div>

          {/* 사용여부 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">사용여부</label>
            <div className="flex items-center gap-5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={active} onChange={() => setActive(true)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-gray-900">사용</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!active} onChange={() => setActive(false)} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-gray-900">미사용</span>
              </label>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">미사용 미션은 매일 미션 선택 대상(미션 풀)에서 제외됩니다.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            취소하기
          </button>
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {mode === 'add' ? '추가하기' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LangRadioGroup({ active, onChange, values }: { active: Lang; onChange: (l: Lang) => void; values: Record<Lang, string> }) {
  return (
    <div className="flex items-center gap-4 mb-3">
      {LANGS.map((l) => (
        <label key={l} className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={active === l} onChange={() => onChange(l)} className="w-4 h-4 accent-indigo-600" />
          <span className="text-sm text-gray-700">{LANG_LABEL[l]}</span>
        </label>
      ))}
    </div>
  );
}

function LangProgress({ values }: { values: Record<Lang, string> }) {
  return (
    <div className="flex items-center gap-2 mt-2 text-[11px] font-medium">
      {LANGS.map((l) => (
        <span key={l} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
          values[l].trim() ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 bg-gray-50'
        }`}>
          {l}{values[l].trim() && ' ✓'}
        </span>
      ))}
    </div>
  );
}
