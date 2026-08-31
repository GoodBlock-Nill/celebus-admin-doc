'use client';

import { useState } from 'react';

import { ChevronDownIcon } from './icons';
import { CARD, MUTED, NUMERIC } from './ui';

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** 제목 + 내용을 담는 기본 섹션 카드 */
export function SectionCard({ title, description, children, className = '' }: SectionCardProps) {
  return (
    <section className={`${CARD} p-4 ${className}`}>
      {title ? <h2 className="text-[14px] font-bold">{title}</h2> : null}
      {description ? <p className={`mt-1 text-[12px] ${MUTED}`}>{description}</p> : null}
      <div className={title || description ? 'mt-3' : ''}>{children}</div>
    </section>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}

/** 라벨-값 한 줄 */
export function InfoRow({ label, value, emphasis = false }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className={`shrink-0 text-[13px] ${MUTED}`}>{label}</span>
      <span
        className={`${NUMERIC} text-right text-[13px] ${emphasis ? 'font-bold text-[#F1F0EC]' : 'text-[#F1F0EC]'}`}
      >
        {value}
      </span>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/** 접이식 섹션 — 환불 정책·유의사항처럼 긴 안내에 사용 */
export function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left text-[14px] font-bold"
      >
        {title}
        <ChevronDownIcon
          className={`h-5 w-5 text-[#9A9AA4] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div className="whitespace-pre-line border-t border-[#2A2C34] px-4 py-3.5 text-[12.5px] leading-relaxed text-[#C9C8CE]">
          {children}
        </div>
      ) : null}
    </section>
  );
}

interface NoticeBoxProps {
  tone?: 'warning' | 'accent' | 'muted';
  children: React.ReactNode;
}

const NOTICE_TONE: Record<'warning' | 'accent' | 'muted', string> = {
  warning: 'border-[#F5B34155] bg-[#F5B3410F] text-[#F5B341]',
  accent: 'border-[#F0426E55] bg-[#F0426E0F] text-[#F0426E]',
  muted: 'border-[#2A2C34] bg-[#20222A] text-[#9A9AA4]',
};

/** 강조 안내 박스 */
export function NoticeBox({ tone = 'muted', children }: NoticeBoxProps) {
  return (
    <div className={`rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed ${NOTICE_TONE[tone]}`}>
      {children}
    </div>
  );
}
