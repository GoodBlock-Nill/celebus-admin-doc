// KST 주간 헬퍼 — 주 시작 = 월요일 (서버 game_period_bounds와 동일 규칙)
export function kstWeekStart(): string {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  const day = (now.getUTCDay() + 6) % 7; // 월=0 … 일=6
  now.setUTCDate(now.getUTCDate() - day);
  return now.toISOString().slice(0, 10);
}

// 'YYYY-MM-DD' 주 시작 → "M.D ~ M.D" 표기
export function weekRangeLabel(weekStart: string): string {
  const s = new Date(`${weekStart}T00:00:00Z`);
  const e = new Date(s);
  e.setUTCDate(e.getUTCDate() + 6);
  const f = (d: Date) => `${d.getUTCMonth() + 1}.${d.getUTCDate()}`;
  return `${f(s)} ~ ${f(e)}`;
}
