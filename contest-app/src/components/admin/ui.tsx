"use client";

// 관리자 공통 UI 키트 — 라이트 테마 토큰으로 통일(패널마다 제각각이던 스타일·다크토큰 불일치 해소).
// 카드/버튼/뱃지/검색/빈상태/확인모달을 한 곳에서 제공해 전 패널이 동일한 룩앤필을 갖도록 한다.
import { useCallback, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";

// ── 카드 ──
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-border bg-card ${className}`}>{children}</div>;
}

// ── 버튼 ──
type BtnVariant = "primary" | "outline" | "ghost" | "danger";
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" };
const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-strong",
  outline: "border border-border bg-card text-fg hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  danger: "border border-[#f3c9c9] bg-[#fdeeee] text-[#c0392b] hover:bg-[#fbe0e0]",
};
export function Btn({ variant = "outline", size = "md", className = "", ...props }: BtnProps) {
  const sz = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]";
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${sz} ${BTN_VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}

// ── 상태 뱃지 ──
type Tone = "neutral" | "primary" | "green" | "amber" | "gray";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary-strong",
  green: "bg-[#eaf7f0] text-[#21845f]",
  amber: "bg-[#fef3c7] text-[#b45309]",
  gray: "bg-surface-2 text-subtle",
};
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-extrabold ${TONE[tone]}`}>{children}</span>;
}

// ── 검색 입력 ──
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-9 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-primary/50"
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="지우기" className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── 필드 라벨 ──
export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-bold text-fg/80">{children}</label>;
}

// ── 공통 인풋 클래스(폼 통일) ──
export const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

// ── 빈 상태 ──
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-[13px] text-muted">{children}</p>;
}

// ── 확인 모달 훅 ──
type ConfirmOpts = { title: string; body?: string; confirmLabel?: string; danger?: boolean };
export function useConfirm() {
  const [state, setState] = useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null);
  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ opts, resolve })), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  const confirmEl = state ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => close(false)}>
      <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-black text-fg">{state.opts.title}</h3>
        {state.opts.body && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{state.opts.body}</p>}
        <div className="mt-4 flex gap-2">
          <Btn variant="ghost" className="flex-1" onClick={() => close(false)}>취소</Btn>
          <Btn variant={state.opts.danger ? "danger" : "primary"} className="flex-1" onClick={() => close(true)}>
            {state.opts.confirmLabel ?? "확인"}
          </Btn>
        </div>
      </div>
    </div>
  ) : null;
  return { confirm, confirmEl };
}
