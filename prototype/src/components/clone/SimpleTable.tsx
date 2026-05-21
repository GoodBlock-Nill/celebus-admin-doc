'use client';

import { InboxIcon } from '@heroicons/react/24/outline';

interface Props<T> {
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode; width?: string; align?: 'left' | 'right' | 'center'; wrap?: boolean }[];
  rows: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

// 기본은 1줄 표시(whitespace-nowrap). 명시적으로 wrap이 필요한 컬럼은 column.wrap=true 지정.
export default function SimpleTable<T>({ columns, rows, emptyMessage = '데이터가 없습니다.', onRowClick }: Props<T>) {
  return (
    <div className="bg-white overflow-x-auto">
      <table className="w-full">
        <thead className="bg-indigo-50/60 border-y border-indigo-100">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : {}}
                className={`px-6 py-3.5 text-${c.align || 'left'} text-xs font-semibold text-gray-700 whitespace-nowrap`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length > 0 ? (
            rows.map((row, ri) => (
              <tr
                key={ri}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'}
              >
                {columns.map((c) => {
                  const raw = (row as Record<string, unknown>)[c.key];
                  const value = c.render ? c.render(row) : (raw as React.ReactNode);
                  return (
                    <td
                      key={c.key}
                      className={`px-6 py-3.5 text-sm text-${c.align || 'left'} text-gray-700 ${c.wrap ? '' : 'whitespace-nowrap'}`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                <InboxIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">{emptyMessage}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
