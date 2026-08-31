'use client';

import { useState } from 'react';

import { ChevronDownIcon } from './icons';
import { CARD, CARD_TITLE, MUTED, NUMERIC } from './ui';

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
      {title ? <h2 className={CARD_TITLE}>{title}</h2> : null}
      {description ? <p className={`mt-1 text-[13px] leading-relaxed ${MUTED}`}>{description}</p> : null}
      <div className={title || description ? 'mt-3' : ''}>{children}</div>
    </section>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}

/** 라벨-값 한 줄 — 라벨은 좌측 보조색, 값은 우측 잉크색 */
export function InfoRow({ label, value, emphasis = false }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className={`shrink-0 text-[14px] ${MUTED}`}>{label}</span>
      <span
        className={`${NUMERIC} text-right text-[14px] text-[#191F28] ${emphasis ? 'font-bold' : ''}`}
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
        className="flex min-h-[54px] w-full items-center justify-between px-4 py-3 text-left text-[15px] font-bold text-[#191F28]"
      >
        {title}
        <ChevronDownIcon
          className={`h-5 w-5 text-[#8B95A1] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div className="whitespace-pre-line border-t border-[#E5E8EB] px-4 py-3.5 text-[14px] leading-[1.7] text-[#4E5968]">
          {children}
        </div>
      ) : null}
    </section>
  );
}

type NoticeTone = 'warning' | 'accent' | 'muted';

interface NoticeBoxProps {
  tone?: NoticeTone;
  children: React.ReactNode;
}

const NOTICE_TONE: Record<NoticeTone, string> = {
  warning: 'bg-[#FFFAEB] text-[#B54708]',
  accent: 'bg-[#FDF2F7] text-[#A61E4D]',
  muted: 'border border-[#E5E8EB] bg-white text-[#4E5968]',
};

/** 강조 안내 박스 */
export function NoticeBox({ tone = 'muted', children }: NoticeBoxProps) {
  return (
    <div className={`rounded-xl px-3.5 py-3 text-[13.5px] leading-[1.65] ${NOTICE_TONE[tone]}`}>
      {children}
    </div>
  );
}
