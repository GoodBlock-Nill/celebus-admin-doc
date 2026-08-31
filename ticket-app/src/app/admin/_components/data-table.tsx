import { Fragment } from 'react';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  /** 숫자 열 — 우측 정렬 + 자릿수 고정 */
  numeric?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render: (row: T, index: number) => ReactNode;
}

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

function alignOf<T>(column: Column<T>): 'left' | 'center' | 'right' {
  if (column.align) return column.align;
  return column.numeric ? 'right' : 'left';
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyText = '표시할 내역이 없습니다.',
  minWidth = '640px',
  renderSubRow,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyText?: string;
  minWidth?: string;
  /** 행 아래에 펼쳐지는 보조 영역 (수동 매칭 폼 등). null이면 표시하지 않는다. */
  renderSubRow?: (row: T) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-[#E3E5EA] bg-[#FAFBFC]">
            {columns.map((column) => (
              <th
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
                className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold text-[#6B7080] ${ALIGN_CLASS[alignOf(column)]}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-[13px] text-[#6B7080]">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = rowKey(row, index);
              const subRow = renderSubRow ? renderSubRow(row) : null;
              return (
                <Fragment key={key}>
                  <tr className="border-b border-[#F0F1F4] align-top">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 py-3 text-[#1B1D22] ${ALIGN_CLASS[alignOf(column)]} ${
                          column.numeric ? 'tabular-nums' : ''
                        }`}
                      >
                        {column.render(row, index)}
                      </td>
                    ))}
                  </tr>
                  {subRow ? (
                    <tr className="border-b border-[#F0F1F4] bg-[#FAFBFC]">
                      <td colSpan={columns.length} className="px-3 py-3">
                        {subRow}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
