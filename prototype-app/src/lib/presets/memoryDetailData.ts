export type PresetKey = 'photo' | 'letter' | 'memo' | 'privateLocked' | 'sharedGuest' | 'publicOther';

interface MemoryDetail {
  emojis: string[];
  emojiLabels: string[];
  type: 'photo' | 'letter' | 'memo';
  typeLabel: string;
  typeIcon: string;
  date: string;
  images: number;
  text: string;
  location?: string;
  isPublic: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const PRESETS: Record<PresetKey, MemoryDetail> = {
  photo: {
    emojis: ['😍', '🤩'], emojiLabels: ['설렘', '어마'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.14', images: 3,    text: 'V01D 콘서트 다녀왔다! 무대 위의 V01D는 정말 빛나고 있었어. 앵콜에서 우리 쪽을 봐줬을 때 심장이 멈추는 줄 알았다 💜 다음에 또 꼭 가고 싶다!',
    location: '잠실 올림픽홀', isPublic: false, isMine: true,
    createdAt: '2026.04.14 23:30 작성',
    updatedAt: '2026.04.15 10:12 수정',
  },
  letter: {
    emojis: ['💜'], emojiLabels: ['사랑'],
    type: 'letter', typeLabel: '편지', typeIcon: '✉️',
    date: '2026.04.07', images: 0,    text: '사랑하는 V01D에게,\n\n오늘도 너희 음악을 들으며 하루를 보냈어. 힘든 날이었는데 너희 노래가 위로가 됐어. 항상 곁에 있어줘서 고마워.\n\n너희의 팬이',
    isPublic: true, isMine: true,
    createdAt: '2026.04.07 21:15 작성',
  },
  memo: {
    emojis: ['✨', '🎉', '😭'], emojiLabels: ['행복', '신남', '감동'],
    type: 'memo', typeLabel: '메모', typeIcon: '📝',
    date: '2026.04.03', images: 0,    text: '오늘 V01D 노래 들으며 산책했다. 봄바람이 불어서 기분이 너무 좋았어. 이런 평범한 순간이 행복하다.',
    isPublic: false, isMine: true,
    createdAt: '2026.04.03 18:42 작성',
  },
  privateLocked: {
    emojis: ['💜'], emojiLabels: ['사랑'],
    type: 'memo', typeLabel: '메모', typeIcon: '📝',
    date: '2026.04.03', images: 0,    text: '',
    isPublic: false, isMine: false,
    createdAt: '',
  },
  sharedGuest: {
    emojis: ['🎉', '😍'], emojiLabels: ['신남', '설렘'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.10', images: 3,    text: 'V01D 음방 1위 축하! 🎉 정말 감격스러웠어요. 팬들 다 같이 울었다 ㅠㅠ',
    location: '상암 MBC', isPublic: true, isMine: false,
    createdAt: '2026.04.10 20:00 작성',
  },
  publicOther: {
    emojis: ['🎉', '😍'], emojiLabels: ['신남', '설렘'],
    type: 'photo', typeLabel: '사진 기록', typeIcon: '📸',
    date: '2026.04.10', images: 3,    text: 'V01D 음방 1위 축하! 🎉 정말 감격스러웠어요. 팬들 다 같이 울었다 ㅠㅠ',
    location: '상암 MBC', isPublic: true, isMine: false,
    createdAt: '2026.04.10 20:00 작성',
  },
};
