'use client';

interface Props {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

function buildPages(page: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: (number | '...')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) result.push('...');
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) result.push('...');
  result.push(total);
  return result;
}

export default function SimplePagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) {
    return (
      <div className="mt-6 flex items-center justify-center gap-1">
        <button disabled className="w-9 h-9 rounded-lg border border-gray-200 text-gray-300">‹</button>
        <button className="w-9 h-9 rounded-lg bg-gray-900 text-white text-sm font-medium">1</button>
        <button disabled className="w-9 h-9 rounded-lg border border-gray-200 text-gray-300">›</button>
      </div>
    );
  }

  const pages = buildPages(page, totalPages);

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
      >‹</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`gap-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-medium ${
              page === p ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >{p}</button>
        ),
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
      >›</button>
    </div>
  );
}
