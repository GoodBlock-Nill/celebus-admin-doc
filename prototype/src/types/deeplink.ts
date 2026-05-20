// 공통 딥링크 타입 — 배너(APP-201)·알림(APP-302) 등에서 공유
// v2.0: 소스 타입 드롭다운 폐지. URL 텍스트 1개 단일 입력
// - 빈 값 = 이동 없음 (표시 전용 배너 / 본문 클릭 비활성 알림)
// - URL 형식 검증: https:// · http:// · / 중 하나로 시작

export interface Deeplink {
  url: string;          // 빈 문자열이면 이동 없음
}

export const DEEPLINK_PLACEHOLDER = 'https:// 또는 /로 시작하는 URL (비우면 이동 없음)';

export function emptyDeeplink(): Deeplink {
  return { url: '' };
}

export function isDeeplinkEmpty(d: Deeplink): boolean {
  return !d.url.trim();
}

/** URL 형식 검증: https://, http://, / 중 하나로 시작해야 함. 빈 값은 허용 (이동 없음). */
export function isDeeplinkValid(d: Deeplink): boolean {
  const v = d.url.trim();
  if (!v) return true;
  return /^(https?:\/\/|\/)/.test(v);
}

/** 외부 URL 여부 (새 탭 열기 판정용) */
export function isExternalDeeplink(d: Deeplink): boolean {
  return /^https?:\/\//.test(d.url.trim());
}

export function getDeeplinkLabel(d: Deeplink): string {
  const v = d.url.trim();
  if (!v) return '이동 없음';
  return v;
}
