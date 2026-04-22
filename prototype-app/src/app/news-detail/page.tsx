'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PresetSelector from '@/components/dev/PresetSelector';
import ImageGallery from '@/components/memory/ImageGallery';
import { useUIStore } from '@/stores/useUIStore';
import { useActiveArtist } from '@/lib/hooks/useActiveArtist';
import ArtistAvatar from '@/components/artist/ArtistAvatar';
import { cn } from '@/lib/utils';

interface NewsArticle {
  id: string;
  title: string;
  date: string;
  body: string;
  images: string[];
  exclusive: boolean;
  relatedLinks: { label: string; url: string }[];
  likes: number;
  liked: boolean;
  prevId: string | null;
  nextId: string | null;
  prevTitle: string | null;
  nextTitle: string | null;
}

const PRESET_OPTIONS = [
  { key: 'default', label: '기본 (이미지+링크)' },
  { key: 'exclusive', label: 'CELEBUS 단독' },
  { key: 'textOnly', label: '텍스트만' },
  { key: 'deleted', label: '삭제된 소식' },
  { key: 'guest', label: '비로그인' },
];

const MOCK_ARTICLES: Record<string, NewsArticle> = {
  default: {
    id: 'news-1',
    title: 'V01D 신곡 "Tug of War" 뮤직비디오 공개',
    date: '2026.04.22',
    body: 'V01D가 신곡 "Tug of War"의 뮤직비디오를 공개했습니다.\n\n이번 뮤직비디오는 서울 도심 곳곳에서 촬영되었으며, V01D 멤버들의 강렬한 퍼포먼스와 감각적인 영상미가 돋보입니다.\n\n"Tug of War"는 데뷔 이후 첫 번째 타이틀곡으로, 팬들의 뜨거운 관심을 받고 있습니다. 발매 24시간 만에 스트리밍 100만 회를 돌파하며 글로벌 차트에서도 좋은 성적을 거두고 있습니다.\n\nV01D는 "팬분들의 응원 덕분에 좋은 결과를 얻을 수 있었다"며 "앞으로도 더 좋은 음악과 무대로 보답하겠다"고 전했습니다.',
    images: ['/v01d/logo.png', '/v01d/logo.png', '/v01d/logo.png'],
    exclusive: false,
    relatedLinks: [
      { label: 'YouTube MV 보기', url: 'https://youtube.com' },
      { label: 'Spotify에서 듣기', url: 'https://open.spotify.com' },
    ],
    likes: 342,
    liked: false,
    prevId: 'news-0',
    nextId: 'news-2',
    prevTitle: 'V01D 콘셉트 포토 공개',
    nextTitle: 'V01D 일본 데뷔 확정',
  },
  exclusive: {
    id: 'news-ex',
    title: '[CELEBUS 단독] V01D 멤버 인터뷰 — "팬들이 우리의 원동력"',
    date: '2026.04.24',
    body: '이 인터뷰는 CELEBUS에서만 볼 수 있는 단독 콘텐츠입니다.\n\nV01D 멤버들이 데뷔 후 처음으로 솔직한 이야기를 나눴습니다.\n\n"처음엔 긴장했지만, CELEBUS에서 팬분들의 응원 메시지를 보면서 힘을 얻었어요. 퀘스트에 참여해주시는 분들 한 분 한 분이 정말 소중합니다."\n\n멤버들은 앞으로의 계획에 대해 "더 다양한 음악적 시도를 하고 싶다"며 "팬분들과 함께 성장하는 아티스트가 되겠다"고 포부를 밝혔습니다.\n\n전체 인터뷰는 아래 링크에서 확인하세요.',
    images: ['/v01d/logo.png'],
    exclusive: true,
    relatedLinks: [
      { label: '전체 인터뷰 영상 보기', url: 'https://youtube.com' },
    ],
    likes: 891,
    liked: true,
    prevId: null,
    nextId: 'news-1',
    prevTitle: null,
    nextTitle: 'V01D 신곡 뮤직비디오 공개',
  },
  textOnly: {
    id: 'news-txt',
    title: 'V01D, 음악방송 1위 수상 — 데뷔 첫 1위의 감격',
    date: '2026.04.17',
    body: 'V01D가 데뷔 후 처음으로 음악방송 1위를 차지했습니다.\n\nMBC 음악중심에서 "Tug of War"로 1위를 수상한 V01D는 수상 소감에서 눈물을 보이며 팬들에게 감사의 마음을 전했습니다.\n\n"이 상은 저희가 아니라 팬분들의 것입니다. 항상 응원해주셔서 감사합니다. 더 열심히 하겠습니다!"\n\n데뷔 2주 만에 1위를 차지한 V01D는 K-pop 신인 그룹 중 역대 최단 기간 1위 기록을 세우며 화제를 모으고 있습니다.',
    images: [],
    exclusive: false,
    relatedLinks: [],
    likes: 1204,
    liked: false,
    prevId: 'news-0',
    nextId: null,
    prevTitle: 'V01D 콘셉트 포토 공개',
    nextTitle: null,
  },
};

function NewsDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeArtist, activeArtistId } = useActiveArtist();
  const addToast = useUIStore((s) => s.addToast);

  const [preset, setPreset] = useState(searchParams.get('preset') ?? 'default');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const handlePreset = (key: string) => {
    setPreset(key);
    setIsLoggedIn(key !== 'guest');
    const article = MOCK_ARTICLES[key];
    if (article) {
      setLiked(article.liked);
      setLikeCount(article.likes);
    }
  };

  // 초기 데이터 설정
  const article = MOCK_ARTICLES[preset] ?? MOCK_ARTICLES.default;
  const isDeleted = preset === 'deleted';

  if (!liked && likeCount === 0 && article) {
    // 첫 렌더 시 초기화 (side effect 아님, 렌더 중 상태 동기화)
  }

  const handleLike = () => {
    if (!isLoggedIn) { addToast('info', '로그인 화면으로 이동합니다'); return; }
    setLiked(!liked);
    setLikeCount((c) => liked ? c - 1 : c + 1);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addToast('success', '링크가 복사되었어요');
      }
    } catch {
      addToast('info', '공유가 취소되었어요');
    }
  };

  // 삭제된 소식
  if (isDeleted) {
    return (
      <div className="min-h-dvh bg-white pb-20">
        <SubPageHeader title="소식" backHref="/info" />
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <span className="text-4xl">📰</span>
          <p className="text-sm font-semibold text-gray-900 mt-4">삭제된 소식이에요</p>
          <p className="text-xs text-gray-500 mt-1">이 소식은 더 이상 확인할 수 없습니다</p>
          <button onClick={() => router.back()} className="mt-5 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-semibold">
            돌아가기
          </button>
        </div>
        <PresetSelector presets={PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-20">
      {!isLoggedIn && (
        <div className="bg-violet-600 text-white text-center py-2 text-[11px] font-medium">
          👀 비로그인 미리보기 — 열람 가능, 좋아요 시 로그인 필요
        </div>
      )}

      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="mr-3 -ml-1 p-2" aria-label="뒤로가기">
            <span className="text-gray-900">←</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900 flex-1">소식</h1>
          <button onClick={handleShare} className="p-2" aria-label="공유">
            <span className="text-lg">↗️</span>
          </button>
        </div>
      </div>

      {/* 소식 헤더 */}
      <div className="px-4 pt-5">
        {article.exclusive && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold inline-block mb-2">
            ⭐ CELEBUS 단독
          </span>
        )}
        <h2 className="text-lg font-bold text-gray-900 leading-snug">{article.title}</h2>
        <div className="flex items-center gap-2 mt-3">
          <ArtistAvatar artistId={activeArtistId} size="sm" />
          <div>
            <p className="text-xs font-semibold text-gray-900">{activeArtist.name}</p>
            <p className="text-[10px] text-gray-400">{article.date}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 mx-4 my-4" />

      {/* 이미지 갤러리 */}
      {article.images.length > 0 && (
        <div className="px-4 mb-4">
          <div className="space-y-2">
            {article.images.map((img, i) => (
              <button key={i} onClick={() => setFullscreenImage(img)} className="w-full rounded-xl overflow-hidden bg-gray-100 active:scale-[0.99] transition-transform">
                <img src={img} alt={`소식 이미지 ${i + 1}`} className="w-full h-48 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 본문 */}
      <div className="px-4 mb-6">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{article.body}</p>
      </div>

      {/* 관련 링크 */}
      {article.relatedLinks.length > 0 && (
        <div className="px-4 mb-6">
          <p className="text-xs font-bold text-gray-400 mb-2">관련 링크</p>
          <div className="space-y-2">
            {article.relatedLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm text-violet-600 font-medium active:bg-gray-100 transition-colors">
                <span>🔗</span>
                <span>{link.label}</span>
                <span className="ml-auto text-gray-300">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 이전/다음 네비게이션 */}
      <div className="px-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => article.prevId && addToast('info', `이전 소식: ${article.prevTitle}`)}
            disabled={!article.prevId}
            className={cn('flex-1 py-3 px-4 rounded-xl text-xs font-medium text-left', article.prevId ? 'bg-gray-50 text-gray-700 active:bg-gray-100' : 'bg-gray-50 text-gray-300 cursor-default')}
          >
            <span className="text-[10px] text-gray-400 block">← 이전</span>
            <span className="truncate block mt-0.5">{article.prevTitle ?? '없음'}</span>
          </button>
          <button
            onClick={() => article.nextId && addToast('info', `다음 소식: ${article.nextTitle}`)}
            disabled={!article.nextId}
            className={cn('flex-1 py-3 px-4 rounded-xl text-xs font-medium text-right', article.nextId ? 'bg-gray-50 text-gray-700 active:bg-gray-100' : 'bg-gray-50 text-gray-300 cursor-default')}
          >
            <span className="text-[10px] text-gray-400 block">다음 →</span>
            <span className="truncate block mt-0.5">{article.nextTitle ?? '없음'}</span>
          </button>
        </div>
      </div>

      {/* 하단 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-[430px] mx-auto bg-white border-t border-gray-100 safe-bottom">
        <div className="flex items-center justify-around h-14 px-4">
          <button onClick={handleLike} className="flex items-center gap-1.5 px-4 py-2 rounded-lg active:bg-gray-50 transition-colors">
            <span className={cn('text-lg', liked ? 'text-red-500' : 'text-gray-300')}>{liked ? '❤️' : '🤍'}</span>
            <span className={cn('text-xs font-semibold', liked ? 'text-red-500' : 'text-gray-500')}>{likeCount || article.likes}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 rounded-lg active:bg-gray-50 transition-colors">
            <span className="text-lg">↗️</span>
            <span className="text-xs font-semibold text-gray-500">공유</span>
          </button>
        </div>
      </div>

      {/* 전체화면 이미지 뷰어 */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setFullscreenImage(null)}
          role="dialog" aria-modal="true" aria-label="이미지 전체화면" style={{ touchAction: 'pinch-zoom' }}>
          <button className="absolute top-4 right-4 text-white text-2xl z-10" aria-label="닫기">✕</button>
          <img src={fullscreenImage} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <PresetSelector presets={PRESET_OPTIONS} current={preset} onSelect={handlePreset} />
    </div>
  );
}

export default function NewsDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <NewsDetailContent />
    </Suspense>
  );
}
