'use client';

import { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import Toast from '@/components/ui/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

type DebugPreset = 'login-content' | 'login-empty' | 'guest-content' | 'guest-empty';

interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'raffle' | 'support' | 'event';
  emoji: string;
  dDay?: number;
  active: boolean;
}

const MOCK_EVENTS: EventItem[] = [
  { id: 'e1', title: 'V01D 사인앨범 래플', subtitle: '응모권 1장으로 참여', type: 'raffle', emoji: '🎁', dDay: 5, active: true },
  { id: 'e2', title: 'V01D 커피차 서포트', subtitle: '목표 70% 달성중 · 1,234명 참여', type: 'support', emoji: '☕', dDay: 12, active: true },
  { id: 'e3', title: '팬미팅 포토카드 래플', subtitle: '응모권 2장으로 참여', type: 'raffle', emoji: '📸', dDay: 3, active: true },
  { id: 'e4', title: 'V01D 컴백 스트리밍 이벤트', subtitle: '스트리밍 인증 시 응모', type: 'event', emoji: '🎵', dDay: 8, active: true },
  { id: 'e5', title: '봄맞이 스트리밍 이벤트', subtitle: '2026.03.01 ~ 03.31', type: 'event', emoji: '🌸', active: false },
  { id: 'e6', title: '데뷔 1주년 축하 래플', subtitle: '2026.02.14 마감', type: 'raffle', emoji: '🎂', active: false },
  { id: 'e7', title: 'V01D 생일카페 서포트', subtitle: '목표 달성 · 2,156명 참여', type: 'support', emoji: '🎉', active: false },
];

export default function EventsPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [tab, setTab] = useState<'active' | 'ended'>('active');
  const [preset, setPreset] = useState<DebugPreset>('login-content');
  const [debugOpen, setDebugOpen] = useState(false);

  const isLoggedIn = preset === 'login-content' || preset === 'login-empty';
  const hasContent = preset === 'login-content' || preset === 'guest-content';

  const events = hasContent ? MOCK_EVENTS : [];
  const filtered = events.filter((e) => tab === 'active' ? e.active : !e.active);

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      <SubPageHeader title="이벤트" />

      {/* 비로그인 배너 */}
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-1.5 text-[10px] font-medium">
          👀 비로그인 미리보기 — 이벤트 열람 가능, 응모 시 로그인 필요
        </div>
      )}

      {/* 필터 탭 */}
      <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-gray-100">
        {([
          { key: 'active' as const, label: '진행중' },
          { key: 'ended' as const, label: '마감됨' },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-semibold transition-colors',
              tab === t.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 이벤트 리스트 */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.length > 0 ? (
          filtered.map((event) => (
            <button key={event.id}
              onClick={() => {
                if (!isLoggedIn) addToast('info', '이벤트 상세는 열람 가능, 응모 시 로그인 필요');
                else addToast('info', `${event.title} 상세 (딥링크 이동)`);
              }}
              className="w-full flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <span className="text-xl">{event.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                  {event.active && event.dDay !== undefined && (
                    <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full shrink-0">D-{event.dDay}</span>
                  )}
                  {!event.active && (
                    <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">마감</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{event.subtitle}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">→</span>
            </button>
          ))
        ) : (
          <div className="text-center py-16">
            <span className="text-3xl">{tab === 'active' ? '📭' : '📋'}</span>
            <p className="text-sm text-gray-400 mt-3">
              {tab === 'active' ? '곧 새로운 이벤트가 찾아올 거예요!' : '마감된 이벤트가 없어요'}
            </p>
          </div>
        )}
      </div>

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'login-content' as const, label: '로그인+콘텐츠' },
              { key: 'login-empty' as const, label: '로그인+Empty' },
              { key: 'guest-content' as const, label: '비로그인+콘텐츠' },
              { key: 'guest-empty' as const, label: '비로그인+Empty' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('px-3 py-2 rounded-xl shadow-md text-[10px] font-semibold whitespace-nowrap', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="px-3 py-2.5 rounded-full bg-gray-900 text-white shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
          <span className="text-[10px] font-semibold">{preset === 'login-content' ? '로그인+콘텐츠' : preset === 'login-empty' ? '로그인+Empty' : preset === 'guest-content' ? '비로그인+콘텐츠' : '비로그인+Empty'}</span>
          <span className="text-[8px]">▲</span>
        </button>
      </div>
    </div>
  );
}
