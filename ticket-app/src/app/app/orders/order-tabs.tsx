'use client';

import type { OrderTabKey } from '../_components/status-meta';

export interface OrderTabItem {
  key: OrderTabKey;
  label: string;
  count: number;
}

interface OrderTabsProps {
  items: OrderTabItem[];
  activeKey: OrderTabKey;
  onChange: (key: OrderTabKey) => void;
}

/** 예매 내역 목록 상단 세그먼트 탭 — 진행중 / 완료 / 취소 */
export function OrderTabs({ items, activeKey, onChange }: OrderTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="예매 내역 구분"
      className="flex gap-1 rounded-xl bg-[#F2F4F6] p-1"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-[10px] text-[14px] font-semibold transition ${
              isActive
                ? 'bg-white text-[#D6336C] shadow-[0_1px_3px_rgba(25,31,40,0.08)]'
                : 'text-[#6B7684]'
            }`}
          >
            <span>{item.label}</span>
            {item.count > 0 ? (
              <span className={`text-[13px] tabular-nums ${isActive ? 'text-[#D6336C]' : 'text-[#8B95A1]'}`}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
