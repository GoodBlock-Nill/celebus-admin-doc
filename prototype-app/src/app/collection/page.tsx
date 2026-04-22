'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import { COLLECTION_PRESET_OPTIONS, applyCollectionPreset } from '@/lib/presets/collection';

type Category = 'artist' | 'event' | 'special';

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
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<Category>('artist');
  const [bives] = useState(MOCK_BIVES);
  const [preset, setPreset] = useState('partial');

  const handlePreset = async (key: string) => {
    setPreset(key);
    await applyCollectionPreset(key, queryClient);
  };

  const ownedCount = bives.filter((b) => b.owned).length;
  const filtered = bives.filter((b) => b.category === category);

  const ARTIST_GRADES = ['Gr.1', 'Gr.2', 'Gr.3', 'Gr.4', 'Gr.5'];
  const hasAllGrades = ARTIST_GRADES.every((grade) =>
    bives.some((b) => b.grade === grade && b.owned)
  );
  const firstMissingGrade = ARTIST_GRADES.find((grade) =>
    !bives.some((b) => b.grade === grade && b.owned)
  );

  const handleCardTap = (bive: BiveItem) => {
    if (!bive.owned) {
      addToast('info', '아직 보유하지 않은 BIVE입니다');
      return;
    }
    addToast('info', `${bive.name} 상세 보기 (준비 중)`);
  };

  return (
    <div className="min-h-dvh bg-white pb-8">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3 -ml-1 p-1"><span className="text-gray-900">←</span></button>
          <h1 className="text-base font-semibold text-gray-900 flex-1">컬렉션</h1>
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">전체 보유 {ownedCount}종</span>
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
            <button
              key={item.label}
              onClick={() => {
                if (item.label === '합성') {
                  if (hasAllGrades) {
                    addToast('info', '이미 합성을 완료했어요!');
                  } else if (firstMissingGrade) {
                    const gradeNum = firstMissingGrade.replace('Gr.', '');
                    addToast('info', `Grade ${gradeNum}을 아직 보유하지 않았어요. Quest를 완료하고 모아보세요!`);
                  } else {
                    addToast('info', '합성 (준비 중)');
                  }
                  return;
                }
                addToast('info', `${item.label} (준비 중)`);
              }}
              className="bg-gray-50 rounded-xl px-3 py-3 text-left active:scale-[0.97] transition-transform">
              <span className="text-lg">{item.icon}</span>
              <p className="text-xs font-semibold text-gray-700 mt-1">{item.label}</p>
              <p className="text-[9px] text-gray-400">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <PresetSelector presets={COLLECTION_PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}
