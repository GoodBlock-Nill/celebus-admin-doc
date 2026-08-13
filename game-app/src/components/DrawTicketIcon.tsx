// 드로우 티켓 아이콘 — 사용자 제공 3D 티켓 배지 이미지 (lucide Ticket 라인 아이콘 대체, 2026-08-13).
// 내비(/nav-draw.png)와 동일 아트지만 자산을 분리해 내비 아이콘 교체가 티켓 표기에 번지지 않게 한다.
export default function DrawTicketIcon({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/draw-ticket.png" alt="" className={`inline-block shrink-0 object-contain ${className}`} />;
}
