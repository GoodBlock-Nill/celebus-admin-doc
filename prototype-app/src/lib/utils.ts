import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return format(parseISO(dateStr), 'yyyy.MM.dd');
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return format(parseISO(dateStr), 'yyyy.MM.dd HH:mm');
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  return format(parseISO(dateStr), 'MM.dd');
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '-';
  return format(parseISO(dateStr), 'HH:mm');
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

export function formatGP(amount: number): string {
  return `${formatNumber(amount)} GP`;
}

export function formatGPWithSign(amount: number): string {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${formatNumber(amount)} GP`;
}

export function formatCELB(amount: number, decimals?: number): string {
  if (decimals !== undefined) {
    return `${amount.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} CELB`;
  }
  return `${formatNumber(amount)} CELB`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatPeriod(start: string | null, end: string): string {
  if (!start || !end) return '-';
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return `${format(startDate, 'yyyy.MM.dd')} ~ ${format(endDate, 'yyyy.MM.dd')}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function truncateHash(hash: string, front = 6, back = 4): string {
  if (!hash || hash.length <= front + back + 3) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
}

export function getRemainingTime(targetDate: string): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = Math.max(0, target - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}
