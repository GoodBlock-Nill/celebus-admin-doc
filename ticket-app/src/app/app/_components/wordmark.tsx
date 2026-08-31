/** 서비스 워드마크 — 모든 화면 상단에 같은 크기·색으로 노출한다. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`select-none text-[14.5px] font-extrabold tracking-[0.05em] text-[#191F28] ${className}`}
    >
      CELEBUS TICKET
    </span>
  );
}

/**
 * 포스터가 없는 공연·티켓 자리에 쓰는 단색 자리표시.
 * 그라디언트 대신 잉크색 단색 위에 워드마크만 얹는다.
 */
export function PosterPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-[#191F28] px-1 text-center ${className}`}
    >
      <span className="text-[8.5px] font-extrabold leading-[1.35] tracking-[0.08em] text-white/80">
        CELEBUS
        <br />
        TICKET
      </span>
    </div>
  );
}
