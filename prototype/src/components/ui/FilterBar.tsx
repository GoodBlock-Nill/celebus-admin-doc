'use client';

import { MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    type: 'select' | 'date' | 'dateRange' | 'search';
    options?: FilterOption[];
    value: string;
    placeholder?: string;
    hideAllOption?: boolean;
  }[];
  onFilterChange: (key: string, value: string) => void;
  onReset?: () => void;
}

export default function FilterBar({ filters, onFilterChange, onReset }: FilterBarProps) {
  const hasActiveFilters = filters.some(f => f.value !== '');

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {filters.map((filter) => {
        if (filter.type === 'select') {
          return (
            <div key={filter.key} className="relative min-w-[160px]">
              <select
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="h-10 w-full pl-3 pr-9 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              >
                {!filter.hideAllOption && <option value="">{filter.label} 전체</option>}
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          );
        }

        if (filter.type === 'date') {
          return (
            <input
              key={filter.key}
              type="date"
              value={filter.value}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={filter.placeholder}
            />
          );
        }

        if (filter.type === 'search') {
          return (
            <div key={filter.key} className="flex items-center">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder || '검색'}
                  className="h-10 pl-9 pr-3 border border-gray-200 border-r-0 rounded-l-lg rounded-r-none text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[240px]"
                />
              </div>
              <button
                type="button"
                onClick={() => onFilterChange(filter.key, filter.value)}
                className="h-10 px-4 bg-blue-600 text-white text-sm font-medium rounded-l-none rounded-r-lg border border-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                검색
              </button>
            </div>
          );
        }

        return null;
      })}
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="h-10 px-3 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <XMarkIcon className="w-4 h-4" />
          초기화
        </button>
      )}
    </div>
  );
}
