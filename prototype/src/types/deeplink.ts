// 공통 딥링크 타입 — 배너(APP-201)·알림(APP-302) 등에서 공유
// 알림 관리 기준 통일 (v1.0)
// - 소스 타입 7종 + "이동 없음"
// - 소스 타입별 힌트·placeholder 보존 (배너 폼이 가진 풍부한 가이드 유지)

export type DeeplinkSourceType =
  | 'NONE'              // 이동 없음 (기본)
  | 'RAFFLE'            // 래플
  | 'SUPPORT_EVENT'     // 응원하기
  | 'QUEST'             // 퀘스트
  | 'BIVE_CAMPAIGN'     // BIVE
  | 'INF_NEWS'          // 소식
  | 'ARTIST_HOME'       // 아티스트 홈
  | 'PROMO';            // 프로모션

export interface Deeplink {
  source: DeeplinkSourceType;
  value: string;        // source가 NONE이면 빈 문자열
}

interface DeeplinkSourceMeta {
  label: string;
  hint: string;
  placeholder: string;
}

export const DEEPLINK_SOURCE_META: Record<DeeplinkSourceType, DeeplinkSourceMeta> = {
  NONE:           { label: '이동 없음',     hint: '클릭 시 이동하지 않음', placeholder: '소스 타입 선택 시 활성화' },
  RAFFLE:         { label: '래플',          hint: '래플 ID 검색',          placeholder: '/raffle/{id}' },
  SUPPORT_EVENT:  { label: '응원하기',      hint: '서포트 이벤트 ID 검색', placeholder: '/support_event/{id}' },
  QUEST:          { label: '퀘스트',        hint: 'Quest ID 검색',         placeholder: '/quest/{id}' },
  BIVE_CAMPAIGN:  { label: 'BIVE',          hint: 'BIVE 에디션 ID 검색',   placeholder: '/bive_campaign/{id}' },
  INF_NEWS:       { label: '소식',          hint: '소식 ID 검색',          placeholder: '/inf_news/{id}' },
  ARTIST_HOME:    { label: '아티스트 홈',   hint: '아티스트 선택',         placeholder: '/artists/{group}' },
  PROMO:          { label: '프로모션',      hint: '내부/외부 URL 자유 입력', placeholder: 'https://… 또는 /event/…' },
};

export const DEEPLINK_SOURCES: DeeplinkSourceType[] = [
  'NONE',
  'RAFFLE',
  'SUPPORT_EVENT',
  'QUEST',
  'BIVE_CAMPAIGN',
  'INF_NEWS',
  'ARTIST_HOME',
  'PROMO',
];

export function emptyDeeplink(): Deeplink {
  return { source: 'NONE', value: '' };
}

export function getDeeplinkLabel(d: Deeplink): string {
  if (d.source === 'NONE') return '이동 없음';
  return `${DEEPLINK_SOURCE_META[d.source].label} · ${d.value || '—'}`;
}
