// 배포초기 프리뷰 — 폐지. 시연/테스트를 위해 dev·prod 모두 전체 데이터 상시 노출.
// (과거: dev에서 '오픈 첫날=공식만' 프리뷰 토글. 시연 환경 요구로 제거)
export function isLaunchPreview(): boolean {
  return false;
}
