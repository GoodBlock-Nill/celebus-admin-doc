// 메모리 프리셋: 클라이언트 사이드 시뮬레이션 (DB 무영향)
// 시드 데이터를 그대로 두고 화면 표시 상태만 토글한다.
// 다른 세션·테스트와 격리되며, 프리셋 토글로 시드 데이터가 손상되지 않는다.

export const MEMORY_PRESET_OPTIONS = [
  { key: 'many', label: '다수 기억 (5개)' },
  { key: 'single', label: '단일 기억' },
  { key: 'empty', label: 'Empty' },
  { key: 'limitReached', label: '한도 초과 (50개)' },
];

export interface MemoryPresetState {
  forceEmpty: boolean;
  forceSingle: boolean;
  forceLimit: boolean;
}

export function getMemoryPresetState(preset: string): MemoryPresetState {
  return {
    forceEmpty: preset === 'empty',
    forceSingle: preset === 'single',
    forceLimit: preset === 'limitReached',
  };
}
