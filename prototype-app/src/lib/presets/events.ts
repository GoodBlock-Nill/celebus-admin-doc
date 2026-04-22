export const EVENTS_PRESET_OPTIONS = [
  { key: 'content', label: '콘텐츠' },
  { key: 'emptyActive', label: 'Empty (진행중)' },
  { key: 'emptyClosed', label: 'Empty (마감)' },
];

export function getEventsPresetState(preset: string) {
  return {
    forceEmpty: preset === 'emptyActive' || preset === 'emptyClosed',
    emptyTab: preset === 'emptyActive' ? 'active' : preset === 'emptyClosed' ? 'closed' : null,
  };
}
