'use client';

import PageHeader from '@/components/layout/PageHeader';
import NumberInput from '@/components/forms/NumberInput';
import Select from '@/components/ui/Select';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';

export default function RankingSettingsPage() {
  const { rankingSettings, updateRankingSettings, resetRankingSettings } = useSettingsStore();
  const addToast = useUIStore((s) => s.addToast);

  return (
    <div>
      <PageHeader title="랭킹 설정" breadcrumbItems={[{ label: '게임존', href: '/game-zone' }, { label: '랭킹', href: '/game-zone/ranking' }, { label: '랭킹 설정' }]} />
      <div className="max-w-[800px] space-y-6">
        <Card title="TOP 10 공개">
          <label className="flex items-center gap-3">
            <div className="relative">
              <input type="checkbox" checked={rankingSettings.top10Public} onChange={(e) => updateRankingSettings({ top10Public: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition-colors cursor-pointer"></div>
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform cursor-pointer"></div>
            </div>
            <span className="text-sm text-gray-700">{rankingSettings.top10Public ? 'ON' : 'OFF'}</span>
          </label>
        </Card>
        <Card title="랭킹 기준">
          <div className="space-y-2">
            {([['ACCUMULATED_GP', '누적 GP'], ['WIN_RATE', '승률'], ['PARTICIPATION_COUNT', '참여 횟수']] as const).map(([value, label]) => (
              <label key={value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${rankingSettings.rankingBasis === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="basis" value={value} checked={rankingSettings.rankingBasis === value} onChange={() => updateRankingSettings({ rankingBasis: value })} />
                <span className="text-sm text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </Card>
        <Card title="업데이트 주기">
          <Select
            value={rankingSettings.updateFrequency}
            onChange={(v) => updateRankingSettings({ updateFrequency: v as 'REALTIME' | '1_HOUR' | '1_DAY' })}
            options={[
              { value: 'REALTIME', label: '실시간' },
              { value: '1_HOUR', label: '1시간마다' },
              { value: '1_DAY', label: '1일마다' },
            ]}
            className="max-w-[300px]"
          />
        </Card>
        <Card title="최소 참여 횟수">
          <NumberInput label="최소 참여 횟수" value={rankingSettings.minParticipationCount} onChange={(v) => updateRankingSettings({ minParticipationCount: v })} min={1} max={100} unit="회" />
        </Card>
        <div className="flex justify-end gap-3">
          <button onClick={resetRankingSettings} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">초기화</button>
          <button onClick={() => addToast('success', '랭킹 설정이 저장되었습니다.')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">저장</button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
