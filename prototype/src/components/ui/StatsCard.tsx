interface StatsCardProps {
  label: string;
  value: string;
  subtitle?: string;
  variant?: 'gp' | 'celb' | 'count' | 'warning';
}

const VALUE_COLORS = {
  gp: 'text-blue-600',
  celb: 'text-purple-600',
  count: 'text-gray-900',
  warning: 'text-orange-600',
};

export default function StatsCard({ label, value, subtitle, variant = 'count' }: StatsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-2xl font-bold ${VALUE_COLORS[variant]}`}>{value}</span>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  );
}
