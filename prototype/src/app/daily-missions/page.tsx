'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import { toast } from '@/components/ui/Toast';
import ConfirmModal from '@/app/fanquest/_components/ConfirmModal';
import MissionFormModal from './_components/MissionFormModal';
import { useDailyMissionStore } from '@/stores/dailyMissionStore';
import { targetLabel, type DailyMission } from '@/mock/dailyMission';

export default function DailyMissionsPage() {
  const { missions, settings, streak, addMission, updateMission, removeMission, toggleMissionActive, saveSettings } =
    useDailyMissionStore();

  // 설정값 입력 상태 (저장 전까지 미반영) — 하루 제시 미션 수만. 덕력 지급량은 지급 정책 소관.
  const [dailyCountInput, setDailyCountInput] = useState(String(settings.dailyCount));

  // 모달 상태
  const [missionModal, setMissionModal] = useState<{ mode: 'add' | 'edit'; mission?: DailyMission } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyMission | null>(null);
  const [toggleZeroTarget, setToggleZeroTarget] = useState<DailyMission | null>(null); // 마지막 사용 미션 미사용 전환 확인
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  // 검증 — 하루 제시 미션 수만
  const dailyCountNum = Number(dailyCountInput);
  const isDailyCountValid = Number.isInteger(dailyCountNum) && dailyCountNum >= 1;
  const allValid = isDailyCountValid;

  // 변경 감지
  const hasUnsaved = dailyCountNum !== settings.dailyCount;
  const canSave = allValid && hasUnsaved;

  const activeCount = missions.filter((m) => m.active).length;
  // 수급 경고: 하루 제시 수가 사용 중인 미션 수보다 큼
  const supplyWarning =
    isDailyCountValid && dailyCountNum > activeCount
      ? `사용 중인 미션이 ${activeCount}건이라 매일 최대 ${activeCount}건만 제시됩니다.`
      : undefined;

  // 미저장 이탈 가드 (브라우저 새로고침·닫기·외부 이동)
  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  const confirmMessage = useMemo(() => {
    if (dailyCountNum !== settings.dailyCount)
      return `하루 제시 미션 수를 ${settings.dailyCount}건 → ${dailyCountNum}건으로 변경합니다.`;
    return '';
  }, [dailyCountNum, settings]);

  const handleSaveConfirm = () => {
    saveSettings({ dailyCount: dailyCountNum });
    setSaveConfirmOpen(false);
    toast.success('일일미션 설정이 저장되었습니다.');
  };

  const handleMissionSubmit = (data: Parameters<typeof addMission>[0]) => {
    if (missionModal?.mode === 'edit' && missionModal.mission) {
      updateMission(missionModal.mission.id, data);
      toast.success('일일미션이 수정되었습니다.');
    } else {
      addMission(data);
      toast.success('일일미션이 추가되었습니다.');
    }
    setMissionModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    removeMission(deleteTarget.id);
    toast.success('일일미션이 삭제되었습니다.');
    setDeleteTarget(null);
  };

  // 사용여부 토글 — 마지막 사용 미션을 미사용으로 끄면 확인
  const doToggle = (id: number) => {
    const next = toggleMissionActive(id);
    toast.success(next ? '미션을 사용으로 전환했습니다.' : '미션을 미사용으로 전환했습니다.');
  };
  const handleToggleClick = (m: DailyMission) => {
    if (m.active && activeCount === 1) {
      setToggleZeroTarget(m);
      return;
    }
    doToggle(m.id);
  };

  return (
    <div>
      <PageHeader
        title="일일미션 관리"
        breadcrumbItems={[{ label: '일일미션' }, { label: '일일미션 관리' }]}
      />

      <p className="text-sm text-gray-600 -mt-2 mb-5">
        미션 풀과 하루 제시 미션 수를 운영합니다. 데일리 루프 미션은 계정 단위로 1일 1회 수행하며, 적립 덕력은 선택 아티스트 그룹의 덕력 지급 정책([CEB-BO-ART-401-POLICY])을 따릅니다(본 화면에서 지급량을 설정하지 않음).
      </p>

      {/* 자정 리셋 안내 */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-4 py-3 mb-6 flex items-start gap-2.5">
        <ClockIcon className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong className="font-semibold">1일 기준</strong>: KST 자정(00:00 ~ 23:59:59). 매일 자정에 출석·일일미션 진행 상태가 리셋되며, 미션 풀에서 그날 제시할 미션이 자동 선택됩니다.
        </div>
      </div>

      {/* ───── §1 일일미션 설정 ───── */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">일일미션 설정</h2>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <NumberField
            label="하루 제시 미션 수"
            suffix="건"
            value={dailyCountInput}
            onChange={setDailyCountInput}
            valid={isDailyCountValid}
            error="1 이상의 정수만 입력 가능합니다."
            hint="미션 풀에서 매일 자동 선택해 제시하는 미션 개수."
            warning={supplyWarning}
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
          출석 체크·일일미션 완료의 덕력 지급량은 본 화면에서 설정하지 않습니다. 선택 아티스트 그룹의 덕력 지급 정책([CEB-BO-ART-401-POLICY])을 따릅니다.
        </p>
      </div>

      {/* ───── §2 미션 풀 ───── */}
      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-base font-semibold text-gray-900">
          미션 풀 <span className="text-sm font-normal text-gray-500">(사용 {activeCount}종 / 전체 {missions.length}종)</span>
        </h2>
        <button
          onClick={() => setMissionModal({ mode: 'add' })}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />미션 추가
        </button>
      </div>

      <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg px-4 py-3 mb-3">
        <p className="text-xs text-indigo-900 leading-relaxed">
          <strong className="font-semibold">미션 선택은 시스템 자동입니다.</strong> 매일 사용 중인 미션 중 설정한 개수만큼 자동 선택되며, 전일과 중복을 피하고 당일 미션은 서로 다르게 제시됩니다. 사용 중인 미션이 부족하면 그날 미션 카드는 노출되지 않습니다. (운영자는 미션 풀 구성만 관리)
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">미션명</th>
              <th className="text-left px-4 py-2.5 font-medium w-40">이동 대상</th>
              <th className="text-center px-4 py-2.5 font-medium w-28">사용여부</th>
              <th className="text-right px-4 py-2.5 font-medium w-28">관리</th>
            </tr>
          </thead>
          <tbody>
            {missions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                  등록된 미션이 없습니다. [미션 추가]로 미션 풀을 구성하세요.
                </td>
              </tr>
            )}
            {missions.map((m) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <span className="text-gray-900 font-medium">{m.labelKO}</span>
                  {m.descKO && <span className="block text-xs text-gray-500 mt-0.5">{m.descKO}</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{targetLabel(m.targetScreen)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleClick(m)}
                    className="inline-flex items-center cursor-pointer"
                    aria-label="사용여부 전환"
                  >
                    <span className={`relative w-9 h-5 rounded-full transition-colors ${m.active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${m.active ? 'translate-x-4' : ''}`} />
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setMissionModal({ mode: 'edit', mission: m })}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                      aria-label="수정"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-rose-500 hover:bg-rose-50"
                      aria-label="삭제"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───── §3 스트릭 안내 (읽기 전용) ───── */}
      <h2 className="text-base font-semibold text-gray-900 mt-8 mb-3">연속 출석(스트릭) 안내</h2>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <p className="text-xs text-gray-500 mb-4">
          출석을 연속으로 달성한 마일스톤에서 보너스를 지급합니다. 마일스톤(연속 일수)은 정책 고정입니다. 스트릭은 28일 주기(4주)로 순환하여, 28일 도달 시 보너스 지급 후 다음날 1일차로 초기화되어 주기마다 반복 지급됩니다. 출석이 하루라도 끊기면 연속 일수는 0으로 초기화됩니다.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {streak.map((m) => (
            <span key={m.days} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
              연속 {m.days}일
            </span>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          스트릭 보너스의 덕력 지급량·사용 여부는 본 화면에서 설정하지 않습니다. 선택 아티스트 그룹의 덕력 지급 정책([CEB-BO-ART-401-POLICY])을 따릅니다.
        </p>
      </div>

      {/* 저장 버튼 — 하루 제시 미션 수 */}
      <div className="flex items-center justify-end mt-5">
        <button
          type="button"
          onClick={() => canSave && setSaveConfirmOpen(true)}
          disabled={!canSave}
          className="h-11 px-6 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed"
        >
          변경사항 저장
        </button>
      </div>

      {/* 모달 */}
      {missionModal && (
        <MissionFormModal
          mode={missionModal.mode}
          mission={missionModal.mission}
          missions={missions}
          onClose={() => setMissionModal(null)}
          onSubmit={handleMissionSubmit}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="미션을 삭제하시겠어요?"
          message={
            `'${deleteTarget.labelKO}' 미션을 미션 풀에서 삭제합니다. 다음날 미션 선택부터 제외되며, 오늘 이미 배정된 회원의 미션은 유지됩니다.` +
            (deleteTarget.active && activeCount === 1
              ? '\n\n⚠ 삭제 후 사용 중인 미션이 0건이 되어 앱에 일일미션이 표시되지 않습니다.'
              : '')
          }
          confirmLabel="삭제하기"
          size="sm"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {toggleZeroTarget && (
        <ConfirmModal
          title="미사용으로 전환하시겠어요?"
          message={`'${toggleZeroTarget.labelKO}'을(를) 미사용으로 전환하면 사용 중인 미션이 0건이 되어 앱에 일일미션이 표시되지 않습니다. 계속할까요?`}
          confirmLabel="전환하기"
          size="sm"
          onCancel={() => setToggleZeroTarget(null)}
          onConfirm={() => {
            doToggle(toggleZeroTarget.id);
            setToggleZeroTarget(null);
          }}
        />
      )}

      {saveConfirmOpen && (
        <ConfirmModal
          title="일일미션 설정을 변경하시겠어요?"
          message={confirmMessage}
          confirmLabel="변경하기"
          size="md"
          onCancel={() => setSaveConfirmOpen(false)}
          onConfirm={handleSaveConfirm}
        />
      )}
    </div>
  );
}

function NumberField({
  label, suffix, value, onChange, valid, error, hint, warning,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  valid: boolean;
  error: string;
  hint?: string;
  warning?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            !valid ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
          }`}
        />
        <span className="text-sm text-gray-600 shrink-0">{suffix}</span>
      </div>
      {!valid && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      {valid && warning && <p className="text-xs text-amber-600 mt-1 leading-relaxed">{warning}</p>}
      {hint && valid && !warning && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}
