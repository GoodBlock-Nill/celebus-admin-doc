/**
 * 공연장 지도 링크 규칙 — 관리자 등록 폼(브라우저)과 검색 프록시(서버)가 함께 쓴다.
 * 좌표 대신 검색어를 넘겨 네이버 지도가 스스로 위치를 찾도록 한다(주소 표기 변경에 강함).
 */

const NAVER_MAP_SEARCH_PREFIX = 'https://map.naver.com/p/search/';

/** 도로명 주소(없으면 공연장 이름)로 지도 검색 링크를 만든다. 빈 검색어는 링크 없음. */
export function naverMapUrl(keyword: string): string {
  const trimmed = keyword.trim();
  return trimmed === '' ? '' : `${NAVER_MAP_SEARCH_PREFIX}${encodeURIComponent(trimmed)}`;
}
