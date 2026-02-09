import { format, parseISO } from 'date-fns';

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

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
