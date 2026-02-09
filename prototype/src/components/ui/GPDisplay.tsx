import { formatNumber } from '@/lib/utils';

interface GPDisplayProps {
  amount: number;
  showSign?: boolean;
}

export default function GPDisplay({ amount, showSign = false }: GPDisplayProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-900';
  const sign = showSign && isPositive ? '+' : '';

  return (
    <span className={`inline-flex items-center gap-1 ${colorClass}`}>
      <span className="font-semibold">{sign}{formatNumber(Math.abs(amount))}</span>
      <span className="text-sm font-normal text-gray-500">GP</span>
    </span>
  );
}
