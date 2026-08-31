import { isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, ok } from '@/lib/server/api';
import { VENUE_SEARCH_UNAVAILABLE, searchVenues } from '@/lib/server/venue-search';

/** 검색어 상한 — 공연장 이름 입력란과 같은 길이 제한 */
const MAX_KEYWORD_LENGTH = 60;

/**
 * 공연장 검색 — 관리자 등록 폼 전용 프록시.
 * 검색어가 없으면 키 설정 여부만 확인하는 호출로 보고 빈 목록을 돌려준다.
 */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const keyword = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, MAX_KEYWORD_LENGTH);

  const result = await searchVenues(keyword);
  if (!result.ok) {
    const status =
      result.reason === VENUE_SEARCH_UNAVAILABLE
        ? HTTP_STATUS.serviceUnavailable
        : HTTP_STATUS.serverError;
    return fail(result.reason, status);
  }

  return ok({ items: result.items });
}
