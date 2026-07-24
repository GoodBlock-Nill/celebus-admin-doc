"use client";

// 관리자 화면 공용 UI 조각 (내부 운영 도구 — 한국어 전용)
export const BTN = "rounded-[10px] bg-primary px-3 py-2 text-[12.5px] font-bold text-white active:scale-95 disabled:opacity-40";
export const BTN_GHOST =
  "rounded-[10px] bg-surface-2 px-3 py-2 text-[12.5px] font-bold text-fg ring-1 ring-hairline active:scale-95 disabled:opacity-40";
export const BTN_DANGER =
  "rounded-[10px] bg-danger/15 px-3 py-2 text-[12.5px] font-bold text-danger ring-1 ring-danger/30 active:scale-95 disabled:opacity-40";
export const INPUT =
  "rounded-[10px] bg-surface-1 px-3 py-2 text-[13px] font-bold text-fg ring-1 ring-hairline placeholder:font-normal placeholder:text-subtle focus:outline-none focus:ring-primary/50";

export function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-[14px] bg-surface-1 p-4 ring-1 ring-hairline">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-black text-fg">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] bg-surface-2 px-3 py-2.5">
      <div className="text-[10.5px] font-bold text-subtle">{label}</div>
      <div className="mt-0.5 text-[18px] font-black tabular-nums text-fg">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

export const fmtDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleString("ko-KR", { hour12: false }) : "-");
