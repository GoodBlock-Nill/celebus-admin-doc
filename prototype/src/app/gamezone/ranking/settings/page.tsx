'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import {
  RANKING_SETTINGS_DEFAULT,
  type RankingCriterion,
  type RankingSettings,
  type RankingUpdateInterval,
} from '@/mock/gamezone';

// [CEB-BO-GZ-402] v1.1 정합 — TOP 10 공개 토글 / 랭킹 기준 라디오 3종 /
// 업데이트 주기 드롭다운 3종 / 최소 참여 횟수 number / [초기화] [저장]
export default function RankingSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<RankingSettings>(RANKING_SETTINGS_DEFAULT);
  const [resetOpen, setResetOpen] = useState(false);

  const handleReset = () => {
    setSettings(RANKING_SETTINGS_DEFAULT);
    setResetOpen(false);
    toast.info('설정이 기본값으로 복원되었습니다 (저장은 별도)');
  };

  const handleSave = () => {
    toast.success(
      `랭킹 설정을 변경했습니다. (TOP 10 공개: ${settings.top10Visible ? 'ON' : 'OFF'}, 기준: ${settings.criterion}, 주기: ${settings.updateInterval}, 최소 참여: ${settings.minPlayCount}회)`,
    );
  };

  return (
    <div>
      <PageHeader
        title="랭킹 설정"
        breadcrumbItems={[
          { label: '게임존' },
          { label: '랭킹', href: '/gamezone/ranking' },
          { label: '랭킹 설정' },
        ]}
      />

      <div className="mt-6 space-y-4 max-w-3xl">
        <SectionCard title="TOP 10 공개">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettings({ ...settings, top10Visible: !settings.top10Visible })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.top10Visible ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  settings.top10Visible ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">{settings.top10Visible ? 'ON' : 'OFF'}</span>
            <span className="text-xs text-gray-500">
              ON: 회원 앱 게임존에 TOP 10 섹션 노출 / OFF: 앱 섹션 숨김 (백오피스는 항상 조회 가능)
            </span>
          </div>
        </SectionCard>

        <SectionCard title="랭킹 기준">
          <div className="space-y-2">
            {(['누적 GP', '승률', '참여 횟수'] as RankingCriterion[]).map((c) => (
              <label
                key={c}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${
                  settings.criterion === c
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  checked={settings.criterion === c}
                  onChange={() => setSettings({ ...settings, criterion: c })}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900">{c}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="업데이트 주기">
          <div className="relative inline-block">
            <select
              value={settings.updateInterval}
              onChange={(e) => setSettings({ ...settings, updateInterval: e.target.value as RankingUpdateInterval })}
              className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>실시간</option>
              <option>1시간마다</option>
              <option>1일마다</option>
            </select>
          </div>
        </SectionCard>

        <SectionCard title="최소 참여 횟수">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={settings.minPlayCount}
              onChange={(e) => setSettings({ ...settings, minPlayCount: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })}
              className="h-10 w-32 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">회</span>
            <span className="text-xs text-gray-500 ml-2">
              결과 확정된 게임 참여 횟수가 본 값 미만인 사용자는 랭킹에서 제외
            </span>
          </div>
        </SectionCard>
      </div>

      {/* 액션 버튼 — 하단 우측 */}
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

      {/* 초기화 확인 모달 */}
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
