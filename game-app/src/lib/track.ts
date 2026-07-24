// 가입 퍼널 카운터 (fire-and-forget) — 실패 무시, 렌더 영향 없음.
// dedupDaily = 같은 기기에서 하루 1회만(유니크 근사) — KST 일자 키.
export type FunnelStep = "visit" | "gate_view" | "signup_start" | "first_game";

function kstDay(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function track(step: FunnelStep, dedupDaily = true): void {
  try {
    if (dedupDaily) {
      // first_game은 기기당 영구 1회, 나머지는 KST 일자별 1회
      const key = step === "first_game" ? `trk_${step}` : `trk_${step}_${kstDay()}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}
