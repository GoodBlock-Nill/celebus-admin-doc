'use client';

import { useFQStore } from '@/stores/useFQStore';
import type { NFTRarity } from '@/lib/fq-types';

const RARITY_COLORS: Record<
  NFTRarity,
  { bg: string; text: string; border: string; label: string }
> = {
  COMMON: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Common' },
  RARE: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'Rare' },
  EPIC: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', label: 'Epic' },
  LEGENDARY: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    label: 'Legendary',
  },
};

export default function CollectionPage() {
  const nftCollection = useFQStore((s) => s.nftCollection);

  const photocards = nftCollection.filter((n) => n.type === 'PHOTOCARD');
  const badges = nftCollection.filter((n) => n.type === 'BADGE');
  const specials = nftCollection.filter((n) => n.type === 'SPECIAL');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-[#0F0A1A] via-violet-900 to-violet-700 px-5 pt-10 pb-6">
        <p className="text-violet-300 text-xs font-medium tracking-wider">🗂️ 컬렉션</p>
        <h1 className="text-2xl font-black text-white mt-1">내 NFT 보관함</h1>
        <p className="text-violet-200/70 text-xs mt-1">수집한 디지털 포토카드와 뱃지</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
            {nftCollection.length}개 보유
          </span>
        </div>
      </div>

      <div className="space-y-6 -mt-2 pt-4 px-4">
        {/* Specials */}
        {specials.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-600 mb-2">💎 스페셜</p>
            <div className="grid grid-cols-2 gap-3">
              {specials.map((nft) => {
                const r = RARITY_COLORS[nft.rarity];
                return (
                  <div key={nft.id} className={`p-3 rounded-xl border-2 ${r.border} ${r.bg}`}>
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                    ) : (
                      <div className="text-4xl text-center mb-2">{nft.imageEmoji}</div>
                    )}
                    <p className="text-xs font-bold text-gray-900 text-center truncate">{nft.name}</p>
                    <p className={`text-[10px] text-center font-semibold mt-0.5 ${r.text}`}>
                      {r.label}
                    </p>
                    <p className="text-[10px] text-gray-400 text-center mt-1">{nft.source}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photocards */}
        {photocards.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-violet-600 mb-2">
              🖼️ 포토카드 ({photocards.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photocards.map((nft) => {
                const r = RARITY_COLORS[nft.rarity];
                return (
                  <div key={nft.id} className={`p-2.5 rounded-xl border ${r.border} ${r.bg}`}>
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.name} className="w-full h-20 object-cover rounded-lg mb-1" />
                    ) : (
                      <div className="text-3xl text-center mb-1">{nft.imageEmoji}</div>
                    )}
                    <p className="text-[10px] font-bold text-gray-900 text-center truncate">
                      {nft.name}
                    </p>
                    <p className={`text-[9px] text-center font-semibold ${r.text}`}>{r.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-pink-600 mb-2">🏅 뱃지 ({badges.length})</p>
            <div className="grid grid-cols-3 gap-2">
              {badges.map((nft) => {
                const r = RARITY_COLORS[nft.rarity];
                return (
                  <div key={nft.id} className={`p-2.5 rounded-xl border ${r.border} ${r.bg}`}>
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.name} className="w-full h-20 object-cover rounded-lg mb-1" />
                    ) : (
                      <div className="text-3xl text-center mb-1">{nft.imageEmoji}</div>
                    )}
                    <p className="text-[10px] font-bold text-gray-900 text-center truncate">
                      {nft.name}
                    </p>
                    <p className={`text-[9px] text-center font-semibold ${r.text}`}>{r.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {nftCollection.length === 0 && (
          <div className="py-16 text-center">
            <span className="text-4xl">🗂️</span>
            <p className="text-sm text-gray-500 mt-3">아직 수집한 NFT가 없어요</p>
            <p className="text-xs text-gray-400 mt-1">퀘스트와 래플에 참여해서 수집해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
