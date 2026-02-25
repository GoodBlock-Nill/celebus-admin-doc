'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import BottomSheet from '@/components/modals/BottomSheet';
import { formatNumber, formatTime, formatDate, cn } from '@/lib/utils';
import { GP_TYPE_CONFIG, EXCHANGE_DIRECTION_CONFIG, EXCHANGE_STATUS_CONFIG, GAME_TYPE_LABELS } from '@/lib/constants';
import { mockGPChanges, mockExchanges } from '@/mock/exchanges';
import type { GPChangeType, ExchangeDirection } from '@/lib/types';

type HistoryTab = 'PARTICIPATION' | 'EXCHANGE';
type ParticipationFilter = 'ALL' | GPChangeType;
type ExchangeFilter = 'ALL' | ExchangeDirection;

const PARTICIPATION_TYPES: GPChangeType[] = [
  'PARTICIPATION', 'BOOSTING', 'REWARD', 'REFUND', 'REFUND_CANCEL',
];

// 날짜별 그룹핑
function groupByDate<T extends { datetime: string }>(items: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  const sorted = [...items].sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  );
  for (const item of sorted) {
    const date = formatDate(item.datetime);
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  }
  return groups;
}

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HistoryTab>('PARTICIPATION');
  const [partFilter, setPartFilter] = useState<ParticipationFilter>('ALL');
  const [exchFilter, setExchFilter] = useState<ExchangeFilter>('ALL');
  const [showFilter, setShowFilter] = useState(false);

  // 참여내역 필터링 (EXCHANGE_IN, EXCHANGE_OUT 제외)
  const participationItems = mockGPChanges.filter((g) => PARTICIPATION_TYPES.includes(g.type));
  const filteredPart =
    partFilter === 'ALL'
      ? participationItems
      : participationItems.filter((g) => g.type === partFilter);

  // 교환내역 필터링
  const filteredExch =
    exchFilter === 'ALL'
      ? mockExchanges
      : mockExchanges.filter((e) => e.direction === exchFilter);

  const partGroups = groupByDate(filteredPart);
  const exchGroups = groupByDate(filteredExch);

  function handleTabSwitch(tab: HistoryTab) {
    setActiveTab(tab);
    setPartFilter('ALL');
    setExchFilter('ALL');
  }

  const currentFilterLabel =
    activeTab === 'PARTICIPATION'
      ? partFilter === 'ALL' ? '전체' : GP_TYPE_CONFIG[partFilter].label
      : exchFilter === 'ALL' ? '전체' : EXCHANGE_DIRECTION_CONFIG[exchFilter].label;

  const totalCount = activeTab === 'PARTICIPATION' ? filteredPart.length : filteredExch.length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Game Point History" />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* 탭 */}
        <div className="flex bg-white border-b border-gray-100">
          <button
            onClick={() => handleTabSwitch('PARTICIPATION')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'PARTICIPATION'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            )}
          >
            참여내역
          </button>
          <button
            onClick={() => handleTabSwitch('EXCHANGE')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'EXCHANGE'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            )}
          >
            교환내역
          </button>
        </div>

        {/* 필터 바 */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-gray-500">전체 {totalCount}건</p>
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            {currentFilterLabel}
            <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 참여내역 리스트 */}
        {activeTab === 'PARTICIPATION' && (
          <div className="px-4 space-y-4">
            {Object.keys(partGroups).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">내역이 없습니다</p>
              </div>
            ) : (
              Object.entries(partGroups).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{date}</p>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const cfg = GP_TYPE_CONFIG[item.type];
                      const isPositive = cfg.sign === '+';
                      const isReward = item.type === 'REWARD';

                      return (
                        <button
                          key={item.id}
                          onClick={() => router.push(`/history/participation/${item.id}`)}
                          className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 text-left hover:shadow-md transition-shadow"
                        >
                          {isReward ? (
                            // 보상은 2행 레이아웃
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={item.gameType === 'SURVIVAL_TRIVIA' ? 'text-purple-500' : 'text-blue-500'}>
                                  {item.gameType === 'SURVIVAL_TRIVIA' ? '🎮' : '⚡'}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                                  {cfg.label}
                                </span>
                                <span className="text-sm text-gray-900 flex-1 truncate">
                                  {item.relatedGameTitle ?? '(삭제된 게임)'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pl-6">
                                <span className="text-xs text-gray-400">
                                  {formatTime(item.datetime)} (UTC+9) · {GAME_TYPE_LABELS[item.gameType ?? 'PREDICTION_MARKET']}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-semibold text-green-600">
                                    +{formatNumber(item.amount)} GP
                                  </span>
                                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // 나머지는 1행 레이아웃
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={item.gameType === 'SURVIVAL_TRIVIA' ? 'text-purple-500' : 'text-blue-500'}>
                                  {item.gameType === 'SURVIVAL_TRIVIA' ? '🎮' : '⚡'}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.bg} ${cfg.text}`}>
                                  {cfg.label}
                                </span>
                                <span className="text-sm text-gray-900 flex-1 truncate">
                                  {item.relatedGameTitle ?? '(삭제된 게임)'}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                    {isPositive ? '+' : ''}{formatNumber(item.amount)} GP
                                  </span>
                                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 pl-6">
                                {formatTime(item.datetime)} (UTC+9) · {GAME_TYPE_LABELS[item.gameType ?? 'PREDICTION_MARKET']}
                              </p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 교환내역 리스트 */}
        {activeTab === 'EXCHANGE' && (
          <div className="px-4 space-y-4">
            {Object.keys(exchGroups).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">내역이 없습니다</p>
              </div>
            ) : (
              Object.entries(exchGroups).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{date}</p>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const dirCfg = EXCHANGE_DIRECTION_CONFIG[item.direction];
                      const statusCfg = EXCHANGE_STATUS_CONFIG[item.status];
                      const isCharge = item.direction === 'CHARGE';
                      const isFailed = item.status === 'FAILED';
                      const isSuccess = item.status === 'SUCCESS';

                      return (
                        <button
                          key={item.txid}
                          onClick={() => router.push(`/history/exchange/${item.txid}`)}
                          className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 text-left hover:shadow-md transition-shadow"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={isCharge ? 'text-blue-500' : 'text-orange-500'}>
                                {isCharge ? '⬇' : '⬆'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dirCfg.bg} ${dirCfg.text}`}>
                                {dirCfg.label}
                              </span>
                              {isFailed && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                  {statusCfg.label}
                                </span>
                              )}
                              <div className="flex-1" />
                              <div className="flex items-center gap-1 shrink-0">
                                {isFailed ? (
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatNumber(item.gpAmount)} GP
                                  </span>
                                ) : (
                                  <span className={`text-sm font-semibold ${isCharge ? 'text-green-600' : 'text-red-500'}`}>
                                    {isCharge ? '+' : '-'}{formatNumber(item.gpAmount)} GP
                                  </span>
                                )}
                                <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 pl-6">
                              {formatTime(item.datetime)} (UTC+9)
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 필터 바텀시트 */}
      <BottomSheet
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="필터"
      >
        <div className="px-5 py-3 pb-8 space-y-2">
          {activeTab === 'PARTICIPATION' ? (
            <>
              {(['ALL', ...PARTICIPATION_TYPES] as ParticipationFilter[]).map((f) => {
                const label = f === 'ALL' ? '전체' : GP_TYPE_CONFIG[f].label;
                const isActive = partFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => { setPartFilter(f); setShowFilter(false); }}
                    className={cn(
                      'w-full py-3 rounded-xl text-sm font-medium text-left px-4 transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {(['ALL', 'CHARGE', 'WITHDRAW'] as ExchangeFilter[]).map((f) => {
                const label =
                  f === 'ALL' ? '전체' : EXCHANGE_DIRECTION_CONFIG[f].label;
                const isActive = exchFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => { setExchFilter(f); setShowFilter(false); }}
                    className={cn(
                      'w-full py-3 rounded-xl text-sm font-medium text-left px-4 transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
