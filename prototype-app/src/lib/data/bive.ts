export interface BivePreviewItem {
  name: string;
  grade: string;
  emoji: string;
  howToGet: string;
}

export const BIVE_PREVIEW_LIST: BivePreviewItem[] = [
  { name: 'V01D 데뷔 포토', grade: 'Grade 1', emoji: '📸', howToGet: 'Quest 1장 완료 시 획득' },
  { name: 'V01D 콘서트 메모리', grade: 'Grade 2', emoji: '🎤', howToGet: 'Quest 2장 완료 시 획득' },
  { name: 'V01D 음방 1위', grade: 'Grade 3', emoji: '🏆', howToGet: 'Quest 3장 완료 시 획득' },
  { name: 'V01D 스페셜 에디션', grade: '스페셜', emoji: '✨', howToGet: 'Grade 1~5 전체 합성으로 획득' },
];
