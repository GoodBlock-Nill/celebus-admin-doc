'use client';

import PageHeader from '@/components/layout/PageHeader';
import NumberInput from '@/components/forms/NumberInput';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';

export default function ExchangeSettingsPage() {
  const { exchangeSettings, updateExchangeSettings, resetExchangeSettings } = useSettingsStore();
  const addToast = useUIStore((s) => s.addToast);

  return (
    <div>
      <PageHeader title="교환 설정" breadcrumbItems={[{ label: '게임존', href: '/game-zone' }, { label: 'GP 교환소', href: '/game-zone/exchange' }, { label: '교환 설정' }]} />
      <div className="max-w-[800px] space-y-6">
        <Card title="교환 비율">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-[130px]">GP → CELB 비율</span>
              <span className="text-sm text-gray-700">1 GP =</span>
              <input
                type="number"
                value={exchangeSettings.gpToCelbRate}
                onChange={(e) => updateExchangeSettings({ gpToCelbRate: Number(e.target.value) })}
                min={0.01}
                step={0.1}
                className="w-24 h-10 px-3 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">CELB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-[130px]">CELB → GP 비율</span>
              <span className="text-sm text-gray-700">1 CELB =</span>
              <input
                type="number"
                value={exchangeSettings.celbToGpRate}
                onChange={(e) => updateExchangeSettings({ celbToGpRate: Number(e.target.value) })}
                min={0.01}
                step={0.1}
                className="w-24 h-10 px-3 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">GP</span>
            </div>
          </div>
        </Card>
        <Card title="GP 가져오기 (CELB → GP)">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="최소 금액" value={exchangeSettings.chargeMinCelb} onChange={(v) => updateExchangeSettings({ chargeMinCelb: v })} min={1} unit="CELB" />
            <NumberInput label="최대 금액" value={exchangeSettings.chargeMaxCelb} onChange={(v) => updateExchangeSettings({ chargeMaxCelb: v })} min={1} unit="CELB" />
            <NumberInput label="일일 한도 (금액)" value={exchangeSettings.chargeDailyLimitCelb} onChange={(v) => updateExchangeSettings({ chargeDailyLimitCelb: v })} min={1} unit="CELB" />
            <NumberInput label="일일 한도 (횟수)" value={exchangeSettings.chargeDailyLimitCount} onChange={(v) => updateExchangeSettings({ chargeDailyLimitCount: v })} min={1} unit="회" />
          </div>
        </Card>
        <Card title="CELB으로 보내기 (GP → CELB)">
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="최소 금액" value={exchangeSettings.withdrawMinGP} onChange={(v) => updateExchangeSettings({ withdrawMinGP: v })} min={1} unit="GP" />
            <NumberInput label="최대 금액" value={exchangeSettings.withdrawMaxGP} onChange={(v) => updateExchangeSettings({ withdrawMaxGP: v })} min={1} unit="GP" />
            <NumberInput label="일일 한도 (금액)" value={exchangeSettings.withdrawDailyLimitGP} onChange={(v) => updateExchangeSettings({ withdrawDailyLimitGP: v })} min={1} unit="GP" />
            <NumberInput label="일일 한도 (횟수)" value={exchangeSettings.withdrawDailyLimitCount} onChange={(v) => updateExchangeSettings({ withdrawDailyLimitCount: v })} min={1} unit="회" />
          </div>
        </Card>
        <Card title="교환 기능">
          <div className="space-y-4">
            <Toggle label="GP 가져오기 활성화" checked={exchangeSettings.chargeEnabled} onChange={(v) => updateExchangeSettings({ chargeEnabled: v })} />
            <Toggle label="CELB으로 보내기 활성화" checked={exchangeSettings.withdrawEnabled} onChange={(v) => updateExchangeSettings({ withdrawEnabled: v })} />
          </div>
        </Card>
        <div className="flex justify-end gap-3">
          <button onClick={resetExchangeSettings} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">초기화</button>
          <button onClick={() => addToast('success', '교환 설정이 저장되었습니다.')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">저장</button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div className="bg-white border border-gray-200 rounded-lg p-6"><h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>{children}</div>);
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition-colors cursor-pointer"></div>
        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform cursor-pointer"></div>
      </div>
      <span className="text-sm text-gray-700">{label} ({checked ? 'ON' : 'OFF'})</span>
    </label>
  );
}
