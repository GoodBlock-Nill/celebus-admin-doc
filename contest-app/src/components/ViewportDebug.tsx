"use client";

// [임시] iOS 26 standalone 하단 갭 진단용 오버레이 — 기기가 계산하는 뷰포트 실측값 표시.
// 원인 확정 후 이 컴포넌트와 Shell 내 사용처를 함께 제거한다. 탭하면 숨김.
import { useEffect, useState } from "react";

const UNIT_PROBES = ["100lvh", "100dvh", "100svh", "100vh"] as const;
const UA_TAIL_LENGTH = 70;

function measureLines(): string[] {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:-9999px;top:0;width:10px;";
  document.body.appendChild(probe);

  const units: string[] = [];
  for (const value of UNIT_PROBES) {
    probe.style.height = value;
    units.push(`${value.replace("100", "")} ${probe.offsetHeight}`);
  }

  probe.style.height = "0";
  probe.style.paddingTop = "env(safe-area-inset-top)";
  const safeTop = probe.offsetHeight;
  probe.style.paddingTop = "0";
  probe.style.paddingBottom = "env(safe-area-inset-bottom)";
  const safeBottom = probe.offsetHeight;
  probe.remove();

  const vv = window.visualViewport;
  const nav = navigator as Navigator & { standalone?: boolean };
  return [
    `inner ${window.innerWidth}x${window.innerHeight} / outer ${window.outerHeight}`,
    `screen ${screen.width}x${screen.height} dpr ${window.devicePixelRatio}`,
    `vv ${vv ? `${Math.round(vv.height)} top ${Math.round(vv.offsetTop)}` : "-"}`,
    units.join(" · "),
    `safeArea top ${safeTop} bottom ${safeBottom}`,
    `standalone ${String(nav.standalone)} / ${matchMedia("(display-mode: standalone)").matches}`,
    navigator.userAgent.slice(-UA_TAIL_LENGTH),
  ];
}

export default function ViewportDebug() {
  const [lines, setLines] = useState<string[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const update = () => setLines(measureLines());
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  if (isHidden || lines.length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => setIsHidden(true)}
      className="fixed left-2 top-24 z-[9999] rounded-lg bg-black/80 p-2 text-left font-mono text-[10px] leading-4 text-green-400"
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </button>
  );
}
