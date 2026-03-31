'use client';

import Link from 'next/link';
import { useFQStore } from '@/stores/useFQStore';

interface TicketBalanceProps {
  size?: 'sm' | 'md';
  linkToHistory?: boolean;
}

export default function TicketBalance({ size = 'md', linkToHistory = true }: TicketBalanceProps) {
  const ticketBalance = useFQStore((s) => s.ticketBalance);

  const content = (
    <div
      className={`inline-flex items-center gap-1.5 bg-pink-50 border border-pink-200 rounded-full ${
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
      }`}
    >
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>🎫</span>
      <span className={`font-bold text-pink-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {ticketBalance}
      </span>
    </div>
  );

  if (linkToHistory) {
    return (
      <Link href="/ticket-history" className="active:opacity-70 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
