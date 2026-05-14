/**
 * CSV 다운로드 유틸리티
 *
 * - UTF-8 with BOM 인코딩 (엑셀에서 한글 깨짐 방지)
 * - 모든 셀 큰따옴표 감싸기 (전화번호 앞자리 0 보호, 콤마 안전)
 * - 윈도우/엑셀 호환 \r\n 줄바꿈
 */
export function downloadCSV(rows: (string | number)[][], filename: string): void {
  const BOM = '﻿';
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
