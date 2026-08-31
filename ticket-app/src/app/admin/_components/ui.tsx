import type { ReactNode } from 'react';
import type { StatusView, Tone } from './labels';

const TONE_STYLE: Record<Tone, string> = {
  neutral: 'border-[#E3E5EA] bg-[#F2F3F6] text-[#6B7080]',
  accent: 'border-[#C6D2F5] bg-[#EDF1FD] text-[#3056D3]',
  success: 'border-[#BEE2D2] bg-[#EAF6F0] text-[#188A5B]',
  warning: 'border-[#F0DFB6] bg-[#FBF3E1] text-[#B97D10]',
  danger: 'border-[#F2C7BD] bg-[#FBEDEA] text-[#C2402A]',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONE_STYLE[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ view }: { view: StatusView }) {
  return <Badge tone={view.tone}>{view.label}</Badge>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold text-[#1B1D22]">{title}</h1>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-[#6B7080]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[#E3E5EA] bg-[#FFFFFF] shadow-[0_1px_2px_rgba(27,29,34,0.04)] ${className}`}
    >
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E3E5EA] px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-bold text-[#1B1D22]">{title}</h2>
            {description ? (
              <p className="mt-1 text-[12px] leading-relaxed text-[#6B7080]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#E3E5EA] bg-[#FAFBFC] px-4 py-8 text-center text-[13px] text-[#6B7080]">
      {text}
    </div>
  );
}

export function InfoNote({ tone = 'accent', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`rounded-lg border px-3.5 py-2.5 text-[12px] leading-relaxed ${TONE_STYLE[tone]}`}>
      {children}
    </div>
  );
}

/** 접이식 영역 — 처리 완료 이력 등 보조 정보에 사용 */
export function Collapsible({
  summary,
  defaultOpen = false,
  children,
}: {
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-xl border border-[#E3E5EA] bg-[#FFFFFF] shadow-[0_1px_2px_rgba(27,29,34,0.04)]"
    >
      <summary className="cursor-pointer list-none px-5 py-3.5 text-[14px] font-bold text-[#1B1D22] marker:hidden">
        <span className="mr-1.5 text-[#6B7080]">▸</span>
        {summary}
      </summary>
      <div className="border-t border-[#E3E5EA] p-5">{children}</div>
    </details>
  );
}

/** 라벨 + 값 한 줄 (정보 카드용) */
export function DefinitionRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-[#F0F1F4] py-2 last:border-b-0">
      <span className="w-[110px] shrink-0 text-[12px] text-[#6B7080]">{label}</span>
      <span className="flex-1 text-[13px] text-[#1B1D22]">{children}</span>
    </div>
  );
}
