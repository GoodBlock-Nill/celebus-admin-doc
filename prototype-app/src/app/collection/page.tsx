'use client';

import { useState } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import Toast from '@/components/ui/Toast';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

type Category = 'artist' | 'event' | 'special';
type DebugPreset = 'has-items' | 'empty' | 'all-unlocked';

interface BiveItem {
  id: string;
  name: string;
  grade: string;
  image: string;
  owned: boolean;
  category: Category;
}

const MOCK_BIVES: BiveItem[] = [
  { id: 'b1', name: '스토리의 시작', grade: 'Gr.1', image: '/v01d/logo.png', owned: true, category: 'artist' },
  { id: 'b2', name: '성장 스토리', grade: 'Gr.2', image: '/v01d/logo.png', owned: true, category: 'artist' },
  { id: 'b3', name: '아티스트의 꿈', grade: 'Gr.3', image: '/v01d/logo.png', owned: false, category: 'artist' },
  { id: 'b4', name: '아티스트의 준비', grade: 'Gr.4', image: '/v01d/logo.png', owned: false, category: 'artist' },
  { id: 'b5', name: '아티스트의 데뷔', grade: 'Gr.5', image: '/v01d/logo.png', owned: false, category: 'artist' },
  { id: 'b6', name: '봄 한정 포카', grade: 'Event', image: '/v01d/logo.png', owned: true, category: 'event' },
  { id: 'b7', name: '데뷔 기념 포카', grade: 'Event', image: '/v01d/logo.png', owned: true, category: 'event' },
  { id: 'b8', name: '크리스마스 에디션', grade: 'Event', image: '/v01d/logo.png', owned: false, category: 'event' },
  { id: 'b9', name: '스페셜 에디션', grade: 'Special', image: '/v01d/logo.png', owned: false, category: 'special' },
];

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'artist', label: '아티스트' },
  { key: 'event', label: '이벤트' },
  { key: 'special', label: '스페셜' },
];

export default function CollectionPage() {
  const addToast = useUIStore((s) => s.addToast);
  const [category, setCategory] = useState<Category>('artist');
  const [bives, setBives] = useState(MOCK_BIVES);
  const [preset, setPreset] = useState<DebugPreset>('has-items');
  const [debugOpen, setDebugOpen] = useState(false);

  const ownedCount = bives.filter((b) => b.owned).length;
  const filtered = bives.filter((b) => b.category === category);

  const handleCardTap = (bive: BiveItem) => {
    if (!bive.owned) {
      addToast('info', '아직 보유하지 않은 BIVE입니다');
      return;
    }
    addToast('info', `${bive.name} 상세 보기 (준비 중)`);
  };

  const switchPreset = (p: DebugPreset) => {
    setPreset(p);
    setDebugOpen(false);
    if (p === 'has-items') setBives(MOCK_BIVES);
    else if (p === 'empty') setBives(MOCK_BIVES.map((b) => ({ ...b, owned: false })));
    else setBives(MOCK_BIVES.map((b) => ({ ...b, owned: true })));
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <Toast />
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <a href="/artist" className="mr-3 -ml-1 p-1"><span className="text-gray-900">←</span></a>
          <h1 className="text-base font-semibold text-gray-900 flex-1">컬렉션</h1>
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">보유 {ownedCount}종</span>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="px-4 mt-3 flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={cn('px-4 py-2 rounded-full text-xs font-semibold transition-colors', category === cat.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* BIVE 그리드 */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {filtered.map((bive) => (
          <button
            key={bive.id}
            onClick={() => handleCardTap(bive)}
            className={cn(
              'relative rounded-2xl border overflow-hidden text-left active:scale-[0.97] transition-transform',
              bive.owned ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
            )}
          >
            <div className={cn('aspect-square bg-gray-100 flex items-center justify-center', !bive.owned && 'opacity-30')}>
              <img src={bive.image} alt={bive.name} className="w-full h-full object-cover" />
            </div>
            {!bive.owned && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">🔒</span>
              </div>
            )}
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                  bive.grade.startsWith('Gr') ? 'bg-violet-100 text-violet-700' :
                  bive.grade === 'Special' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                )}>{bive.grade}</span>
              </div>
              <p className={cn('text-xs font-medium mt-1 truncate', bive.owned ? 'text-gray-900' : 'text-gray-400')}>{bive.name}</p>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <span className="text-3xl">🃏</span>
            <p className="text-sm font-semibold text-gray-900 mt-3">이 카테고리에 BIVE가 없습니다</p>
          </div>
        )}
      </div>

      {/* 바로가기 섹션 */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">바로가기</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '🔄', label: 'Pick', desc: 'BIVE 뽑기' },
            { icon: '🔀', label: '합성', desc: 'Gr.1~5 → 스페셜' },
            { icon: '📋', label: '히스토리', desc: 'BIVE 이력' },
            { icon: '🎁', label: 'BIVE 혜택', desc: '혜택 확인' },
          ].map((item) => (
            <button key={item.label} onClick={() => addToast('info', `${item.label} (준비 중)`)}
              className="bg-gray-50 rounded-xl px-3 py-3 text-left active:scale-[0.97] transition-transform">
              <span className="text-lg">{item.icon}</span>
              <p className="text-xs font-semibold text-gray-700 mt-1">{item.label}</p>
              <p className="text-[9px] text-gray-400">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 플로팅 디버그 */}
      <div className="fixed bottom-20 right-4 z-50">
        {debugOpen && (
          <div className="mb-2 flex flex-col gap-1.5 animate-slideInUp">
            {[
              { key: 'has-items' as const, icon: '🃏', label: '일부보유' },
              { key: 'empty' as const, icon: '🔒', label: '전체잠금' },
              { key: 'all-unlocked' as const, icon: '✅', label: '전체해금' },
            ].map((p) => (
              <button key={p.key} onClick={() => switchPreset(p.key)}
                className={cn('w-12 h-10 rounded-xl shadow-md flex items-center justify-center text-sm', p.key === preset ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200')}>
                {p.icon}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setDebugOpen(!debugOpen)} className="w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform">
          <span className="text-base">{preset === 'has-items' ? '🃏' : preset === 'empty' ? '🔒' : '✅'}</span>
          <span className="text-[8px] leading-none">{preset === 'has-items' ? '일부' : preset === 'empty' ? '잠금' : '해금'}</span>
        </button>
      </div>
    </div>
  );
}
