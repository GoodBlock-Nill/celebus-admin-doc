'use client';

import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import EmptyState from './EmptyState';

interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  rowNumber?: { page: number; perPage: number };
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  emptyMessage = '데이터가 없습니다.',
  rowNumber,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return <ChevronUpDownIcon className="w-4 h-4 text-gray-300" />;
    return sortOrder === 'asc'
      ? <ChevronUpIcon className="w-4 h-4 text-blue-600" />
      : <ChevronDownIcon className="w-4 h-4 text-blue-600" />;
  };

  const alignClass = (align?: string) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {rowNumber && (
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[60px]">No</th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-sm font-semibold text-gray-700 ${alignClass(col.align)} ${col.width || ''} ${col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && onSort && getSortIcon(col.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'} ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {rowNumber && (
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {(rowNumber.page - 1) * rowNumber.perPage + i + 1}
                </td>
              )}
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-sm text-gray-900 ${alignClass(col.align)}`}>
                  {col.render ? col.render(item, i) : String(item[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
