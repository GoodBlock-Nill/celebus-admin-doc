import 'server-only';

// 공연장 검색 — 네이버 지역검색 오픈API를 관리자 화면 대신 서버에서 호출한다.
// 발급 키를 브라우저에 내리지 않기 위한 프록시이며, 키가 없으면 폼은 주소 직접 입력 모드로 동작한다.
import { naverMapUrl } from '@/lib/venue-map';
import type { VenueSearchItemView } from '@/lib/admin-types';

const NAVER_LOCAL_SEARCH_URL = 'https://openapi.naver.com/v1/search/local.json';
const RESULT_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 5000;

/** 키 미설정 안내 — 폼은 이 사유를 받으면 주소 직접 입력 모드로 전환한다. */
export const VENUE_SEARCH_UNAVAILABLE = '네이버 검색 미설정';
const VENUE_SEARCH_FAILURE = '공연장 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.';

export type VenueSearchResult =
  | { ok: true; items: VenueSearchItemView[] }
  | { ok: false; reason: string };

interface NaverCredentials {
  clientId: string;
  clientSecret: string;
}

interface NaverLocalItem {
  title?: unknown;
  address?: unknown;
  roadAddress?: unknown;
}

function readCredentials(): NaverCredentials | null {
  const clientId = process.env.NAVER_CLIENT_ID ?? '';
  const clientSecret = process.env.NAVER_CLIENT_SECRET ?? '';
  if (clientId === '' || clientSecret === '') return null;
  return { clientId, clientSecret };
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

/** 검색 결과 이름에는 강조 태그(<b>)와 이스케이프 문자가 섞여 있어 평문으로 되돌린다. */
function toPlainText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .trim();
}

function toItem(raw: NaverLocalItem): VenueSearchItemView {
  const name = toPlainText(raw.title);
  const roadAddress = toPlainText(raw.roadAddress);
  const address = toPlainText(raw.address);
  return { name, roadAddress, address, mapUrl: naverMapUrl(roadAddress || name) };
}

async function fetchLocalItems(keyword: string, auth: NaverCredentials): Promise<NaverLocalItem[] | null> {
  const url = `${NAVER_LOCAL_SEARCH_URL}?query=${encodeURIComponent(keyword)}&display=${RESULT_LIMIT}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'X-Naver-Client-Id': auth.clientId,
        'X-Naver-Client-Secret': auth.clientSecret,
      },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { items?: unknown };
    return Array.isArray(body.items) ? (body.items as NaverLocalItem[]) : [];
  } catch {
    return null;
  }
}

/**
 * 공연장 검색 — 키가 없으면 미설정 사유를 돌려준다.
 * 검색어가 비면 키 설정 여부만 확인하는 용도로 보고 빈 목록을 돌려준다(폼 진입 시 모드 판별).
 */
export async function searchVenues(keyword: string): Promise<VenueSearchResult> {
  const auth = readCredentials();
  if (!auth) return { ok: false, reason: VENUE_SEARCH_UNAVAILABLE };

  const trimmed = keyword.trim();
  if (trimmed === '') return { ok: true, items: [] };

  const items = await fetchLocalItems(trimmed, auth);
  if (items === null) return { ok: false, reason: VENUE_SEARCH_FAILURE };

  return { ok: true, items: items.slice(0, RESULT_LIMIT).map(toItem).filter((item) => item.name !== '') };
}
