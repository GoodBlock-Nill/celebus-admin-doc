'use client';

import { MUTED } from '../../_components/ui';

interface VenueValueProps {
  venue: string;
  /** 등록 시 선택 입력이라 없을 수 있다 */
  address: string | null;
  mapUrl: string | null;
}

/** 공연 정보의 장소 값 — 이름 아래에 주소와 지도 링크를 덧붙인다. */
export function VenueValue({ venue, address, mapUrl }: VenueValueProps) {
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span>{venue}</span>
      {address ? <span className={`text-[13px] leading-snug ${MUTED}`}>{address}</span> : null}
      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] font-semibold text-[#D6336C] underline underline-offset-2"
        >
          네이버지도 보기
        </a>
      ) : null}
    </span>
  );
}
