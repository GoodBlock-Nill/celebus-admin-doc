import { DefinitionRow } from '../../_components/ui';

interface MediaSummaryProps {
  posterUrl: string | null;
  description: string | null;
  detailImageUrls: string[];
}

/** 공연 상세의 포스터 · 공연 소개 · 상세 이미지 확인 영역 */
export function ConcertMediaSummary({ posterUrl, description, detailImageUrls }: MediaSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <DefinitionRow label="포스터">
        {posterUrl ? (
          <a href={posterUrl} target="_blank" rel="noreferrer" className="inline-block">
            <img
              src={posterUrl}
              alt="공연 포스터"
              className="aspect-[3/4] w-[108px] rounded-lg border border-[#E3E5EA] object-cover"
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : (
          <span className="text-[#6B7080]">미등록</span>
        )}
      </DefinitionRow>

      <DefinitionRow label="공연 소개">
        {description ? (
          <p className="whitespace-pre-line leading-relaxed text-[#4A4E5A]">{description}</p>
        ) : (
          <span className="text-[#6B7080]">미입력</span>
        )}
      </DefinitionRow>

      <DefinitionRow label="상세 이미지">
        {detailImageUrls.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="tabular-nums">{detailImageUrls.length}장</span>
            <div className="flex flex-wrap gap-2">
              {detailImageUrls.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`상세 이미지 ${index + 1}`}
                    className="h-14 w-24 rounded-md border border-[#E3E5EA] object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-[#6B7080]">미등록</span>
        )}
      </DefinitionRow>
    </div>
  );
}
