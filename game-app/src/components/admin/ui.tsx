"use client";

// 관리자 화면 공용 UI 조각 (내부 운영 도구 — 한국어 전용, 데스크톱 웹 우선)
export const BTN = "rounded-[10px] bg-primary px-3.5 py-2 text-[13.5px] font-bold text-white active:scale-95 disabled:opacity-40";
export const BTN_GHOST =
  "rounded-[10px] bg-surface-2 px-3.5 py-2 text-[13.5px] font-bold text-fg ring-1 ring-hairline active:scale-95 disabled:opacity-40";
export const BTN_DANGER =
  "rounded-[10px] bg-danger/15 px-3.5 py-2 text-[13.5px] font-bold text-danger ring-1 ring-danger/30 active:scale-95 disabled:opacity-40";
export const INPUT =
  "rounded-[10px] bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg ring-1 ring-hairline placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/60";

export function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-[14px] bg-surface-1 p-5 ring-1 ring-hairline">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-black text-fg">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] bg-surface-2 px-3.5 py-3">
      <div className="text-[12px] font-bold text-muted">{label}</div>
      <div className="mt-1 text-[20px] font-black tabular-nums text-fg">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

// 데이터 테이블 — 데스크톱 밀도 기본, 좁은 화면은 가로 스크롤
export function DataTable({ head, children }: { head: (string | React.ReactNode)[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[12px] ring-1 ring-hairline">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="bg-surface-2 text-left">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-3.5 py-3 text-[12.5px] font-bold text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr+tr]:border-t [&>tr]:border-hairline">{children}</tbody>
      </table>
    </div>
  );
}

export const TD = "px-3.5 py-2.5 align-middle";
export const TR_HOVER = "transition-colors hover:bg-surface-2/60";

export const fmtDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleString("ko-KR", { hour12: false }) : "-");
