'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import type { ServiceCardData } from '@/lib/types';

interface ServiceCardProps {
  card: ServiceCardData;
  fullWidth?: boolean;
}

export default function ServiceCard({ card, fullWidth = false }: ServiceCardProps) {
  const addToast = useUIStore((s) => s.addToast);

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    addToast('info', '곧 만나요! 기대해 주세요');
  };

  const content = (
    <div
      className={cn(
        'relative rounded-2xl p-4 flex flex-col gap-2 transition-transform active:scale-[0.97]',
        'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200',
        'min-h-[120px]',
        fullWidth ? 'col-span-2' : ''
      )}
    >
      {card.comingSoon && (
        <div className="absolute inset-0 rounded-2xl bg-gray-900/40 z-10 flex items-center justify-center">
          <span className="text-white text-xs font-semibold bg-gray-800/80 px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </div>
      )}
      <span className="text-2xl">{card.icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{card.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{card.statusText}</p>
      </div>
    </div>
  );

  if (card.comingSoon) {
    return (
      <button onClick={handleComingSoon} className={cn('text-left', fullWidth ? 'col-span-2' : '')}>
        {content}
      </button>
    );
  }

  const IMPLEMENTED_ROUTES = ['/quest', '/daily-mission', '/support', '/virtue', '/fandom-level', '/raffle', '/collection', '/info', '/memory'];

  if (IMPLEMENTED_ROUTES.includes(card.href)) {
    return (
      <Link href={card.href} className={cn(fullWidth ? 'col-span-2' : '')}>
        {content}
      </Link>
    );
  }

  const handleSubScreenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addToast('info', '곧 만나요! 기대해 주세요');
  };

  return (
    <Link
      href={card.href}
      onClick={handleSubScreenClick}
      className={cn(fullWidth ? 'col-span-2' : '')}
    >
      {content}
    </Link>
  );
}
