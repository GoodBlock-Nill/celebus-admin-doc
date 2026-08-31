/**
 * 실물 티켓 절취선 — 좌우 노치(그라운드색 원) + 가운데 점선.
 * 공연 카드와 티켓 카드에만 사용하는 시그니처 장식이다.
 */
export function TicketPerforation({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-4 ${className}`}>
      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F7F7FA]" />
      <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F7F7FA]" />
      <span className="absolute left-4 right-4 top-1/2 border-t border-dashed border-[#E5E8EB]" />
    </div>
  );
}
