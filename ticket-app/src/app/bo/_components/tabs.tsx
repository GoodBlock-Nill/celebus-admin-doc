'use client';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  activeKey,
  onChange,
}: {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-[#E3E5EA] pb-2">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              active
                ? 'bg-[#3056D3] text-white'
                : 'bg-transparent text-[#4A4E5A] hover:bg-[#EDF1FD] hover:text-[#3056D3]'
            }`}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' ? (
              <span
                className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-[#E9EBF0] text-[#4A4E5A]'
                }`}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
