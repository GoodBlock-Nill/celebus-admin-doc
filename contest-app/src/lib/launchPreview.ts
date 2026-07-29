// 배포초기 프리뷰 (dev 전용) — 오픈 첫날 = "공식 시드만" 상태로 화면을 렌더.
// 팬 업로드(is_official=false)를 읽기에서 숨겨 첫날처럼 보이게 한다. 데이터는 DB에 그대로 보존.
// 기본: 개발(dev)에서 ON. localStorage 'launch_preview'='off'로 전체 데이터 복귀(토글).
// 프로덕션에서는 항상 OFF(실제 사용자에겐 절대 적용 안 됨).
export function isLaunchPreview(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (typeof window === "undefined") return true; // dev 기본 ON
  try {
    return localStorage.getItem("launch_preview") !== "off";
  } catch {
    return true;
  }
}

// dev 토글용 — 현재 값을 반대로 저장하고 새 값을 반환(호출부에서 reload)
export function toggleLaunchPreview(): boolean {
  const next = !isLaunchPreview();
  try {
    localStorage.setItem("launch_preview", next ? "on" : "off");
  } catch {
    /* noop */
  }
  return next;
}
