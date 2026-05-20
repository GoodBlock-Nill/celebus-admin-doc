// 공통 딥링크 타입 — 배너(APP-201)·알림(APP-302) 등에서 공유
// v2.1: 드롭다운 + ID 검색 → 자유 텍스트 입력 2개 (소스 타입 + URL)
// - 소스 타입: 운영자가 분류용 라벨을 자유 텍스트로 입력 (예: "래플", "프로모션", "공지")
// - URL: 회원 앱에서 도달할 URL을 자유 텍스트로 입력 (https://·http://·/로 시작)
// - 둘 다 빈 값 = 이동 없음 (표시 전용 배너 / 본문 클릭 비활성 알림)

export interface Deeplink {
  sourceType: string;   // 운영자 자유 입력 분류 라벨 (예: "래플", "프로모션"). 빈 문자열 허용
  url: string;          // 도달 URL. 빈 문자열이면 이동 없음
}

export const SOURCE_TYPE_PLACEHOLDER = '소스 타입 입력 (예: 래플, 프로모션, 공지)';
export const URL_PLACEHOLDER = 'https:// 또는 /로 시작하는 URL (비우면 이동 없음)';

export function emptyDeeplink(): Deeplink {
  return { sourceType: '', url: '' };
}

export function isDeeplinkEmpty(d: Deeplink): boolean {
  return !d.url.trim();
}

/** URL 형식 검증: https://, http://, / 중 하나로 시작해야 함. 빈 값은 허용 (이동 없음). */
export function isUrlValid(url: string): boolean {
  const v = url.trim();
  if (!v) return true;
  return /^(https?:\/\/|\/)/.test(v);
}

export function isDeeplinkValid(d: Deeplink): boolean {
  return isUrlValid(d.url);
}

/** 외부 URL 여부 (새 탭 열기 판정용) */
export function isExternalDeeplink(d: Deeplink): boolean {
  return /^https?:\/\//.test(d.url.trim());
}

export function getDeeplinkLabel(d: Deeplink): string {
  const v = d.url.trim();
  if (!v) return '이동 없음';
  const src = d.sourceType.trim();
  return src ? `${src} · ${v}` : v;
}
