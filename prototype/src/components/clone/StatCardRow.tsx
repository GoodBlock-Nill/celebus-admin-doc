/**
 * 운영 BO 아티스트 리스트 통계 카드 — 가로형 (라벨 좌 + 숫자 우, 컬러바 없음)
 * 클릭 시 상태 필터 + 선택 강조
 */
interface Props {
  label: string;
  count: number | string;
  active?: boolean;
  onClick?: () => void;
  countClassName?: string;
}

export default function StatCardRow({ label, count, active = false, onClick, countClassName = 'text-gray-900' }: Props) {
  const cls = `w-full flex items-center justify-between rounded-2xl border px-6 py-6 transition text-left ${
    active ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-200' : 'border-gray-200 bg-white hover:border-indigo-200'
  }`;
  const content = (
    <>
      <span className="text-[15px] text-gray-600">{label}</span>
      <span className={`text-3xl font-bold ${countClassName}`}>{typeof count === 'number' ? count.toLocaleString('ko-KR') : count}</span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>{content}</button>
  ) : (
    <div className={cls}>{content}</div>
  );
}
