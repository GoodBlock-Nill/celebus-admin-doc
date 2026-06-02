// 기억저장소 감정 이모지 — 아티스트별 세트 (BO 등록·관리)
// 규격: [CEB-000] §7.5 — OS 유니코드 이모지 또는 커스텀 이미지, 아티스트별 세트, 등록 최대 40종/사용 최대 6종, 기본 6종 프리셋
// 프로토타입 100% mock. 새로고침 시 초기값 복귀.

export interface EmotionEmoji {
  id: number;
  artistGroupId: number;
  emoji: string; // 시스템 유니코드 이모지 (이미지 방식이면 빈 문자열)
  imageSrc?: string; // 커스텀 이미지 파일명 (있으면 이미지 방식)
  labelKO: string;
  labelEN: string;
  labelJA: string;
  order: number; // 앱 노출 순서 (1부터)
  active: boolean; // 사용 여부 (미사용 시 앱 선택지에서 숨김, 기존 기록 보존)
  inUse: boolean; // 회원 기억 게시물에서 사용 중 — true면 삭제 차단
}

// [CEB-000] §7.5 기본 6종 프리셋
interface Preset {
  emoji: string;
  labelKO: string;
  labelEN: string;
  labelJA: string;
}

export const DEFAULT_EMOJI_PRESETS: Preset[] = [
  { emoji: '😍', labelKO: '설렘', labelEN: 'Flutter', labelJA: 'ときめき' },
  { emoji: '😭', labelKO: '감동', labelEN: 'Moved', labelJA: '感動' },
  { emoji: '🎉', labelKO: '신남', labelEN: 'Excited', labelJA: 'ワクワク' },
  { emoji: '💜', labelKO: '사랑', labelEN: 'Love', labelJA: '愛' },
  { emoji: '🤩', labelKO: '어마', labelEN: 'Amazed', labelJA: 'びっくり' },
  { emoji: '✨', labelKO: '행복', labelEN: 'Happy', labelJA: '幸せ' },
];

export const MAX_EMOJI_PER_ARTIST = 40; // 세트당 등록 상한
export const MAX_ACTIVE_EMOJI = 6; // 사용(앱 노출) 상한

// 그룹 1·2에 기본 프리셋 세트 시드. 그 외 그룹은 빈 세트(미등록 상태 시연).
function seedSet(artistGroupId: number, inUseLabels: string[], startId: number): EmotionEmoji[] {
  return DEFAULT_EMOJI_PRESETS.map((p, idx) => ({
    id: startId + idx,
    artistGroupId,
    emoji: p.emoji,
    labelKO: p.labelKO,
    labelEN: p.labelEN,
    labelJA: p.labelJA,
    order: idx + 1,
    active: true,
    inUse: inUseLabels.includes(p.labelKO),
  }));
}

export const emotionEmojis: EmotionEmoji[] = [
  // 그룹 1 — 기본 6종 사용(정확히 6), 설렘·사랑은 사용 중(삭제 차단)
  ...seedSet(1, ['설렘', '사랑'], 101),
  // 그룹 2 — 기본 6종 사용 + 커스텀 2종(미사용, 사용 상한 6 보호), 감동 사용 중
  ...seedSet(2, ['감동'], 201),
  {
    id: 207,
    artistGroupId: 2,
    emoji: '🔥',
    labelKO: '열정',
    labelEN: 'Passion',
    labelJA: '情熱',
    order: 7,
    active: false,
    inUse: false,
  },
  // 커스텀 이미지 방식 예시 (그룹 2, 미사용)
  {
    id: 208,
    artistGroupId: 2,
    emoji: '',
    imageSrc: 'v01d-cheer.png',
    labelKO: '응원봉',
    labelEN: 'Lightstick',
    labelJA: 'ペンライト',
    order: 8,
    active: false,
    inUse: false,
  },
];
