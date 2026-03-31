import type { NFTItem } from '@/lib/fq-types';

export const mockNFTCollection: NFTItem[] = [
  { id: 'nft-001', name: '유찬 디지털 포토카드', description: 'V01D 리더 유찬의 데뷔 기념 디지털 포카', imageEmoji: '🖼️', imageUrl: '/v01d/yuchan.jpg', artistName: 'V01D', type: 'PHOTOCARD', rarity: 'RARE', acquiredAt: '2026-04-03T14:30:00Z', source: '1장 퀘스트 클리어' },
  { id: 'nft-002', name: '주연 디지털 포토카드', description: 'V01D 메인보컬 주연의 데뷔 기념 디지털 포카', imageEmoji: '🖼️', imageUrl: '/v01d/juyeon.jpg', artistName: 'V01D', type: 'PHOTOCARD', rarity: 'RARE', acquiredAt: '2026-04-05T18:00:00Z', source: '2장 퀘스트 클리어' },
  { id: 'nft-003', name: '케빈 디지털 포토카드', description: 'V01D 메인래퍼 케빈박의 한정판 디지털 포카', imageEmoji: '🖼️', imageUrl: '/v01d/kevin.jpg', artistName: 'V01D', type: 'PHOTOCARD', rarity: 'EPIC', acquiredAt: '2026-04-10T12:00:00Z', source: '팬덤 Lv.2 달성' },
  { id: 'nft-004', name: '지섭 디지털 포토카드', description: 'V01D 메인댄서 지섭의 한정판 디지털 포카', imageEmoji: '🖼️', imageUrl: '/v01d/jisub.jpg', artistName: 'V01D', type: 'PHOTOCARD', rarity: 'COMMON', acquiredAt: '2026-04-12T15:00:00Z', source: 'PM 적중 보상' },
  { id: 'nft-005', name: '노스케 디지털 포토카드', description: 'V01D 막내 노스케의 한정판 디지털 포카', imageEmoji: '🖼️', imageUrl: '/v01d/shinnosuke.jpg', artistName: 'V01D', type: 'PHOTOCARD', rarity: 'COMMON', acquiredAt: '2026-04-14T20:00:00Z', source: 'Trivia 전문 정답' },
  { id: 'nft-006', name: '7일 스트릭 뱃지', description: '7일 연속 접속 달성 기념 뱃지', imageEmoji: '🔥', imageUrl: '', artistName: 'CELEBUS', type: 'BADGE', rarity: 'COMMON', acquiredAt: '2026-04-10T09:00:00Z', source: '출석 스트릭' },
  { id: 'nft-007', name: '슈퍼팬 뱃지', description: '덕력 시즌 TOP 10% 달성 뱃지', imageEmoji: '⭐', imageUrl: '', artistName: 'V01D', type: 'BADGE', rarity: 'EPIC', acquiredAt: '2026-04-15T00:00:00Z', source: '시즌 랭킹' },
  { id: 'nft-008', name: 'V01D [01] 스페셜 NFT', description: 'V01D 데뷔 앨범 [01] 발매 기념 한정 NFT', imageEmoji: '💎', imageUrl: '/v01d/group.jpg', artistName: 'V01D', type: 'SPECIAL', rarity: 'LEGENDARY', acquiredAt: '2026-03-11T00:00:00Z', source: '데뷔 기념 드랍' },
];
