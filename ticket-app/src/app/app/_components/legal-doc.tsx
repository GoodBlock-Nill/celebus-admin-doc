import { CARD, MUTED, NUMERIC } from './ui';

/** 문서 게시 전 자리표시 문구 */
export const LEGAL_PLACEHOLDER_NOTICE = '서비스 오픈 시 확정 약관이 게시됩니다.';

interface LegalDocumentProps {
  /** 상단 안내 문구 */
  notice: string;
  /** 조·항 제목 목차 */
  articles: readonly string[];
  /** 문서 하단 보조 안내 */
  footNote: string;
}

/** 이용약관·개인정보처리방침 공통 골격 — 목차와 게시 예정 안내를 함께 보여 준다. */
export function LegalDocument({ notice, articles, footNote }: LegalDocumentProps) {
  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4">
      <div className="rounded-xl bg-[#FFFAEB] px-3.5 py-3 text-[13.5px] leading-[1.65] text-[#B54708]">
        {notice}
      </div>

      <section className={`${CARD} p-4`}>
        <h2 className="text-[16px] font-bold text-[#191F28]">목차</h2>
        <ol className="mt-3 flex flex-col">
          {articles.map((article, index) => (
            <li
              key={article}
              className="flex gap-2.5 border-b border-[#F2F4F6] py-2.5 last:border-b-0 last:pb-0"
            >
              <span className={`w-5 shrink-0 text-[14px] text-[#B0B8C1] ${NUMERIC}`}>
                {index + 1}
              </span>
              <span className="text-[14.5px] leading-[1.5] text-[#191F28]">{article}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>{footNote}</p>
    </div>
  );
}
