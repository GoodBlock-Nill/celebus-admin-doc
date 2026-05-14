/**
 * 운영 사이트 통계 카드 — 상단 컬러 바 + 라벨(배지) + 큰 숫자
 * v2.2: 일관된 파스텔 톤 (bar-300 / badge-100 + text-700)
 */
interface Props {
  label: string;
  count: number | string;
  variant?: 'default' | 'active' | 'pending' | 'locked' | 'inactive';
  showBar?: boolean;
}

const VARIANTS = {
  default: { bar: 'bg-gray-200', badge: 'bg-gray-100 text-gray-700' },
  active: { bar: 'bg-emerald-300', badge: 'bg-emerald-100 text-emerald-700' },
  pending: { bar: 'bg-amber-300', badge: 'bg-amber-100 text-amber-700' },
  locked: { bar: 'bg-rose-300', badge: 'bg-rose-100 text-rose-700' },
  inactive: { bar: 'bg-gray-200', badge: 'bg-gray-100 text-gray-500' },
};

export default function StatCardWithBar({ label, count, variant = 'default', showBar = true }: Props) {
  const v = VARIANTS[variant];
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {showBar && <div className={`h-1 ${v.bar}`} />}
      <div className="p-5">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium mb-3 ${v.badge}`}>{label}</span>
        <p className="text-3xl font-bold text-gray-900">{count.toLocaleString?.('ko-KR') ?? count}</p>
      </div>
    </div>
  );
}
