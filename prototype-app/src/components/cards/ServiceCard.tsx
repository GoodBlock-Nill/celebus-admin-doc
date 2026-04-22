'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import type { ServiceCardData } from '@/lib/types';

interface ServiceCardProps {
  card: ServiceCardData;
  fullWidth?: boolean;
  disabled?: boolean;
}

const GROUP_COLORS: Record<string, { bg: string; iconBg: string; accent: string }> = {
  mission: {
    bg: 'from-violet-50 to-purple-50 border-violet-100',
    iconBg: 'bg-violet-100',
    accent: 'text-violet-600',
  },
  record: {
    bg: 'from-blue-50 to-indigo-50 border-blue-100',
    iconBg: 'bg-blue-100',
    accent: 'text-blue-600',
  },
  more: {
    bg: 'from-gray-50 to-slate-50 border-gray-150',
    iconBg: 'bg-gray-100',
    accent: 'text-gray-600',
  },
};

export default function ServiceCard({ card, fullWidth = false, disabled = false }: ServiceCardProps) {
  const addToast = useUIStore((s) => s.addToast);
  const colors = GROUP_COLORS[card.group] ?? GROUP_COLORS.more;

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    addToast('info', '곧 만나요! 기대해 주세요');
  };

  const content = (
    <div
      className={cn(
        'relative rounded-2xl p-4 flex flex-col gap-3 transition-all active:scale-[0.97]',
        'bg-gradient-to-br border',
        colors.bg,
        'min-h-[110px]',
        fullWidth ? 'col-span-2 flex-row items-center' : ''
      )}
    >
      {card.comingSoon && (
        <div className="absolute inset-0 rounded-2xl bg-gray-900/40 z-10 flex items-center justify-center">
          <span className="text-white text-xs font-semibold bg-gray-800/80 px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </div>
      )}
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors.iconBg)}>
        <span className="text-xl">{card.icon}</span>
      </div>
      <div className={fullWidth ? 'flex-1' : ''}>
        <h3 className="text-[13px] font-bold text-gray-900 leading-tight">{card.title}</h3>
        <p className={cn('text-[11px] font-medium mt-0.5', colors.accent)}>{card.statusText}</p>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div className={cn('cursor-default opacity-90', fullWidth ? 'col-span-2' : '')}>
        {content}
      </div>
    );
  }

  if (card.comingSoon) {
    return (
      <button onClick={handleComingSoon} className={cn('text-left w-full', fullWidth ? 'col-span-2' : '')}>
        {content}
      </button>
    );
  }

  const IMPLEMENTED_ROUTES = ['/quest', '/daily-mission', '/support', '/virtue', '/fandom-level', '/raffle', '/collection', '/info', '/memory'];

  if (IMPLEMENTED_ROUTES.includes(card.href)) {
    return (
      <Link href={card.href} className={cn('block', fullWidth ? 'col-span-2' : '')}>
        {content}
      </Link>
    );
  }

  const handleSubScreenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addToast('info', '곧 만나요! 기대해 주세요');
  };

  return (
    <Link href={card.href} onClick={handleSubScreenClick} className={cn('block', fullWidth ? 'col-span-2' : '')}>
      {content}
    </Link>
  );
}
