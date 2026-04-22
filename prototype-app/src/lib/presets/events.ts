export const EVENTS_PRESET_OPTIONS = [
  { key: 'content', label: '콘텐츠' },
  { key: 'emptyActive', label: 'Empty (진행중)' },
  { key: 'emptyClosed', label: 'Empty (마감)' },
  { key: 'guest', label: '비로그인' },
  { key: 'guestEmpty', label: '비로그인+Empty' },
];

export function getEventsPresetState(preset: string) {
  return {
    forceEmpty: preset === 'emptyActive' || preset === 'emptyClosed' || preset === 'guestEmpty',
    emptyTab: preset === 'emptyActive' || preset === 'guestEmpty' ? 'active' : preset === 'emptyClosed' ? 'closed' : null,
  };
}
