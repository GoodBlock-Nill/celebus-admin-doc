'use client';

import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/utils';

interface GPBalanceProps {
  amount: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function GPBalance({ amount, onClick, size = 'md' }: GPBalanceProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/history');
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 font-semibold text-amber-600 active:opacity-70 transition-opacity`}
    >
      <span className={isSmall ? 'text-sm' : 'text-base'}>GP</span>
      <span className={isSmall ? 'text-sm' : 'text-base'}>{formatNumber(amount)}</span>
    </button>
  );
}
