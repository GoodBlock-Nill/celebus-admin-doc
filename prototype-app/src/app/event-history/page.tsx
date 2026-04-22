'use client';

import { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import EmptyState from '@/components/ui/EmptyState';
import ArtistAvatar from '@/components/artist/ArtistAvatar';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

type Tab = 'quest' | 'raffle';
type QuestFilter = '전체' | '지급완료' | '검토중' | '반려';
type RaffleFilter = '전체' | '진행중' | '집계중' | '당첨' | '미당첨';

interface QuestItem {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  reward: string;
  date: string;
  status: '지급완료' | '검토중' | '반려';
}

interface RaffleItem {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  date: string;
  tickets: number;
  status: '진행중' | '집계중' | '당첨' | '미당첨';
}

const MOCK_QUESTS: QuestItem[] = [
  { id: 'q1', artistId: 'v01d', artistName: 'V01D', title: 'V01D 공식 X 팔로우', reward: '🎫 ×1 · ❤️ 50pt', date: '2026.04.20', status: '지급완료' },
  { id: 'q2', artistId: 'v01d', artistName: 'V01D', title: 'V01D 공식 IG 팔로우', reward: '🎫 ×1 · ❤️ 50pt', date: '2026.04.19', status: '검토중' },
  { id: 'q3', artistId: 'v01d', artistName: 'V01D', title: '"Tug of War" 스트리밍 인증', reward: '❤️ 80pt', date: '2026.04.18', status: '반려' },
  { id: 'q4', artistId: 'v01d', artistName: 'V01D', title: 'V01D 앨범 감상 소감 인증', reward: '🎫 ×1', date: '2026.04.15', status: '지급완료' },
  { id: 'q5', artistId: 'v01d', artistName: 'V01D', title: 'V01D YouTube 구독 인증', reward: '🎫 ×1 · ❤️ 50pt', date: '2026.04.14', status: '지급완료' },
];

const MOCK_RAFFLES: RaffleItem[] = [
  { id: 'r1', artistId: 'v01d', artistName: 'V01D', title: 'V01D 싸인앨범 래플', date: '2026.04.18', tickets: 2, status: '진행중' },
  { id: 'r2', artistId: 'v01d', artistName: 'V01D', title: 'V01D 포토카드 세트', date: '2026.04.15', tickets: 1, status: '집계중' },
  { id: 'r3', artistId: 'v01d', artistName: 'V01D', title: '팬미팅 초대권', date: '2026.03.28', tickets: 3, status: '미당첨' },
  { id: 'r4', artistId: 'v01d', artistName: 'V01D', title: 'V01D 데뷔 기념 굿즈', date: '2026.03.20', tickets: 1, status: '당첨' },
];

const QUEST_STATUS_STYLE: Record<QuestItem['status'], { color: string; icon: string }> = {
  '지급완료': { color: 'text-green-600 bg-green-50', icon: '✅' },
  '검토중': { color: 'text-amber-600 bg-amber-50', icon: '⏳' },
  '반려': { color: 'text-red-600 bg-red-50', icon: '❌' },
};

const RAFFLE_STATUS_STYLE: Record<RaffleItem['status'], { color: string; icon: string }> = {
  '진행중': { color: 'text-blue-600 bg-blue-50', icon: '🎯' },
  '집계중': { color: 'text-amber-600 bg-amber-50', icon: '⏳' },
  '당첨': { color: 'text-green-600 bg-green-50', icon: '🎉' },
  '미당첨': { color: 'text-gray-500 bg-gray-100', icon: '😢' },
};

const PRESET_OPTIONS = [
  { key: 'default', label: '기본 (혼합)' },
  { key: 'questOnly', label: 'QUEST만' },
  { key: 'raffleOnly', label: 'RAFFLE만' },
  { key: 'empty', label: 'Empty' },
];

export default function EventHistoryPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [tab, setTab] = useState<Tab>('quest');
  const [questFilter, setQuestFilter] = useState<QuestFilter>('전체');
  const [raffleFilter, setRaffleFilter] = useState<RaffleFilter>('전체');
  const [preset, setPreset] = useState('default');

  const handlePreset = (key: string) => {
    setPreset(key);
    if (key === 'questOnly') setTab('quest');
    else if (key === 'raffleOnly') setTab('raffle');
  };

  const isEmpty = preset === 'empty';

  const quests = isEmpty ? [] : MOCK_QUESTS.filter((q) => questFilter === '전체' || q.status === questFilter);
  const raffles = isEmpty ? [] : MOCK_RAFFLES.filter((r) => raffleFilter === '전체' || r.status === raffleFilter);

  const handleQuestTap = (item: QuestItem) => {
    if (item.status === '반려') addToast('info', '반려 사유 모달 (CEB-FQ-201-MD)');
    else if (item.status === '검토중') addToast('info', '현재 검토 진행 중입니다.');
  };

  const handleRaffleTap = (item: RaffleItem) => {
    if (item.status === '진행중') addToast('info', 'Raffle 상세 (CEB-FQ-202)');
    else if (item.status === '집계중') addToast('info', '현재 집계중입니다');
    else if (item.status === '당첨') addToast('success', '🎉 당첨! Raffle 상세 (CEB-FQ-203)');
    else if (item.status === '미당첨') addToast('info', 'Raffle 상세 (CEB-FQ-204)');
  };

  return (
    <div className="min-h-dvh bg-white pb-20">
      <SubPageHeader title="Event" />

      {/* 2단 탭 (Sticky) */}
      <div className="sticky top-12 z-30 bg-white border-b border-gray-100">
        <div className="flex">
          {(['quest', 'raffle'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-3 text-sm font-bold text-center transition-colors relative',
                tab === t ? 'text-violet-700' : 'text-gray-400'
              )}
            >
              {t === 'quest' ? 'QUEST' : 'RAFFLE'}
              {tab === t && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-violet-600 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* 필터 칩 */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {tab === 'quest' ? (
          (['전체', '지급완료', '검토중', '반려'] as QuestFilter[]).map((f) => (
            <button key={f} onClick={() => setQuestFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                questFilter === f ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
              )}>
              {f}
            </button>
          ))
        ) : (
          (['전체', '진행중', '집계중', '당첨', '미당첨'] as RaffleFilter[]).map((f) => (
            <button key={f} onClick={() => setRaffleFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                raffleFilter === f ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
              )}>
              {f}
            </button>
          ))
        )}
      </div>

      {/* 리스트 */}
      <div className="px-4">
        {tab === 'quest' ? (
          quests.length === 0 ? (
            <EmptyState
              emoji="📋"
              title="참여한 퀘스트 내역이 없습니다."
              ctaLabel="퀘스트 하러 가기"
              ctaHref="/quest"
            />
          ) : (
            <div className="space-y-2">
              {quests.map((item) => {
                const style = QUEST_STATUS_STYLE[item.status];
                return (
                  <button key={item.id} onClick={() => handleQuestTap(item)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left active:bg-gray-100 transition-colors">
                    <ArtistAvatar artistId={item.artistId} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500">{item.reward}</span>
                        <span className="text-[10px] text-gray-400">· {item.date}</span>
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full shrink-0', style.color)}>
                      {style.icon} {item.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          raffles.length === 0 ? (
            <EmptyState
              emoji="🎁"
              title="응모한 래플 내역이 없습니다."
              ctaLabel="래플 보러 가기"
              ctaHref="/raffle"
            />
          ) : (
            <div className="space-y-2">
              {raffles.map((item) => {
                const style = RAFFLE_STATUS_STYLE[item.status];
                return (
                  <button key={item.id} onClick={() => handleRaffleTap(item)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left active:bg-gray-100 transition-colors">
                    <ArtistAvatar artistId={item.artistId} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500">🎫 ×{item.tickets}</span>
                        <span className="text-[10px] text-gray-400">· {item.date}</span>
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full shrink-0', style.color)}>
                      {style.icon} {item.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>

      <PresetSelector presets={PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
