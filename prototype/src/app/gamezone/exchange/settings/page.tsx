'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { EXCHANGE_SETTINGS_DEFAULT, type ExchangeSettings } from '@/mock/gamezone';

// [CEB-BO-GZ-502] v1.4 정합 — 4섹션 (교환 비율 / GP 충전 한도 / GP 출금 한도 /
// 교환 기능 토글) + 우하단 [초기화] [저장]
export default function ExchangeSettingsPage() {
  const [s, setS] = useState<ExchangeSettings>(EXCHANGE_SETTINGS_DEFAULT);
  const [resetOpen, setResetOpen] = useState(false);

  const update = <K extends keyof ExchangeSettings>(k: K, v: ExchangeSettings[K]) => setS((prev) => ({ ...prev, [k]: v }));

  const handleReset = () => {
    setS(EXCHANGE_SETTINGS_DEFAULT);
    setResetOpen(false);
    toast.info('설정이 기본값으로 복원되었습니다 (저장은 별도)');
  };

  const handleSave = () => {
    toast.success('교환 설정이 저장되었습니다.');
  };

  return (
    <div>
      <PageHeader
        title="교환 설정"
        breadcrumbItems={[
          { label: '게임존' },
          { label: 'GP 교환소', href: '/gamezone/exchange' },
          { label: '교환 설정' },
        ]}
      />

      <div className="mt-6 space-y-4 max-w-3xl">
        <SectionCard title="교환 비율">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 w-28">GP → CELB 비율</span>
              <span className="text-sm text-gray-500">1 GP =</span>
              <NumberField value={s.gpToCelbRate} onChange={(v) => update('gpToCelbRate', v)} step="0.1" />
              <span className="text-sm text-gray-500">CELB</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 w-28">CELB → GP 비율</span>
              <span className="text-sm text-gray-500">1 CELB =</span>
              <NumberField value={s.celbToGpRate} onChange={(v) => update('celbToGpRate', v)} step="0.1" />
              <span className="text-sm text-gray-500">GP</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="GP 충전 (CELB → GP)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="최소 금액" unit="CELB">
              <NumberField value={s.chargeMin} onChange={(v) => update('chargeMin', v)} />
            </Field>
            <Field label="최대 금액" unit="CELB">
              <NumberField value={s.chargeMax} onChange={(v) => update('chargeMax', v)} />
            </Field>
            <Field label="일일 한도 (금액)" unit="CELB">
              <NumberField value={s.chargeDailyAmount} onChange={(v) => update('chargeDailyAmount', v)} />
            </Field>
            <Field label="일일 한도 (횟수)" unit="회">
              <NumberField value={s.chargeDailyCount} onChange={(v) => update('chargeDailyCount', v)} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="GP 출금 (GP → CELB)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="최소 금액" unit="GP">
              <NumberField value={s.withdrawMin} onChange={(v) => update('withdrawMin', v)} />
            </Field>
            <Field label="최대 금액" unit="GP">
              <NumberField value={s.withdrawMax} onChange={(v) => update('withdrawMax', v)} />
            </Field>
            <Field label="일일 한도 (금액)" unit="GP">
              <NumberField value={s.withdrawDailyAmount} onChange={(v) => update('withdrawDailyAmount', v)} />
            </Field>
            <Field label="일일 한도 (횟수)" unit="회">
              <NumberField value={s.withdrawDailyCount} onChange={(v) => update('withdrawDailyCount', v)} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="교환 기능">
          <div className="space-y-3">
            <ToggleRow
              label="GP 충전 활성화"
              value={s.chargeEnabled}
              onChange={(v) => update('chargeEnabled', v)}
            />
            <ToggleRow
              label="GP 출금 활성화"
              value={s.withdrawEnabled}
              onChange={(v) => update('withdrawEnabled', v)}
            />
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={() => setResetOpen(true)}
          className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          초기화
        </button>
        <button
          onClick={handleSave}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          저장
        </button>
      </div>

      <Modal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        title="설정 초기화"
        width="max-w-md"
        footer={
          <>
            <button
              onClick={() => setResetOpen(false)}
              className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleReset}
              className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              복원
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">모든 설정을 기본값으로 복원하시겠습니까?</p>
        <p className="text-xs text-gray-500 mt-2">변경 사항은 저장되지 않습니다. 복원 후 별도 [저장] 클릭이 필요합니다.</p>
      </Modal>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, unit, children }: { label: string; unit: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        {children}
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

function NumberField({ value, onChange, step }: { value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <input
      type="number"
      value={value}
      step={step ?? '1'}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="h-10 w-32 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          value ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">
        {label} <span className="text-gray-400 text-xs">({value ? 'ON' : 'OFF'})</span>
      </span>
    </div>
  );
}
