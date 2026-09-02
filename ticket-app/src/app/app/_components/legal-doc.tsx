import { CARD, MUTED, NUMERIC } from './ui';

/** 법무 검토 전 초안임을 알리는 공통 문구 */
export const LEGAL_DRAFT_NOTICE =
  '본 문서는 서비스 정식 오픈 준비를 위한 초안입니다. 법무 검토를 거쳐 확정·시행되며, 시행일과 사업자 정보 등 중괄호로 표시한 항목은 확정 후 실제 값으로 교체됩니다.';

/** 조문 본문을 이루는 표시 단위 */
export type LegalBlock =
  /** 항 단위 문단 */
  | { kind: 'text'; value: string }
  /** 호 단위 열거 */
  | { kind: 'items'; values: readonly string[] }
  /** 기준표 (수수료 단계·보유 기간·위탁 현황 등) */
  | { kind: 'table'; head: readonly string[]; rows: readonly (readonly string[])[] };

/** 조(또는 방침 항목) 하나 */
export interface LegalArticle {
  /** 목차에서 이동할 때 쓰는 고정 이름 */
  anchor: string;
  /** 조 제목 (예: 제1조 (목적)) */
  title: string;
  /** 조 본문 */
  blocks: readonly LegalBlock[];
}

interface LegalDocumentProps {
  /** 상단 안내 문구 */
  notice: string;
  /** 조문 전문 */
  articles: readonly LegalArticle[];
  /** 문서 하단 보조 안내 */
  footNote: string;
}

/** 항 문단 */
function TextBlock({ value }: { value: string }) {
  return <p className="text-[14.5px] leading-[1.75] text-[#333D4B]">{value}</p>;
}

/** 호 열거 */
function ItemsBlock({ values }: { values: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {values.map((value) => (
        <li key={value} className="flex gap-2 text-[14.5px] leading-[1.7] text-[#333D4B]">
          <span aria-hidden="true" className="shrink-0 text-[#B0B8C1]">
            ·
          </span>
          <span className="min-w-0">{value}</span>
        </li>
      ))}
    </ul>
  );
}

/** 표 최소 너비 — 두 칸짜리 짧은 표도 이 너비는 확보한다. */
const TABLE_MIN_WIDTH = 420;
/** 열 하나가 읽히려면 필요한 최소 너비 — 열이 많은 표는 좌우로 밀어 본다. */
const COLUMN_MIN_WIDTH = 156;

/** 기준표 — 좁은 화면에서는 좌우로 밀어 볼 수 있다. */
function TableBlock({
  head,
  rows,
}: {
  head: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth: Math.max(TABLE_MIN_WIDTH, head.length * COLUMN_MIN_WIDTH) }}
      >
        <thead>
          <tr>
            {head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="border-b border-[#E5E8EB] bg-[#F7F7FA] px-2.5 py-2 text-[12.5px] font-semibold text-[#4E5968]"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, index) => (
                <td
                  key={`${row.join('|')}-${index}`}
                  className={`border-b border-[#F2F4F6] px-2.5 py-2 align-top text-[13px] leading-[1.6] text-[#333D4B] ${
                    index === 0 ? 'font-semibold text-[#191F28]' : ''
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 조 본문 한 덩어리 */
function ArticleBlock({ block }: { block: LegalBlock }) {
  if (block.kind === 'text') return <TextBlock value={block.value} />;
  if (block.kind === 'items') return <ItemsBlock values={block.values} />;
  return <TableBlock head={block.head} rows={block.rows} />;
}

/**
 * 이용약관·개인정보처리방침 공통 렌더러.
 * 상단 안내 → 목차(조 제목 이동) → 조문 전문 순으로 보여 준다.
 */
export function LegalDocument({ notice, articles, footNote }: LegalDocumentProps) {
  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4">
      <div className="rounded-xl bg-[#FFFAEB] px-3.5 py-3 text-[13.5px] leading-[1.65] text-[#B54708]">
        {notice}
      </div>

      <nav aria-label="문서 목차" className={`${CARD} p-4`}>
        <h2 className="text-[16px] font-bold text-[#191F28]">목차</h2>
        <ol className="mt-3 flex flex-col">
          {articles.map((article, index) => (
            <li
              key={article.anchor}
              className="flex gap-2.5 border-b border-[#F2F4F6] py-2.5 last:border-b-0 last:pb-0"
            >
              <span className={`w-5 shrink-0 text-[14px] text-[#B0B8C1] ${NUMERIC}`}>
                {index + 1}
              </span>
              <a
                href={`#${article.anchor}`}
                className="text-[14.5px] leading-[1.5] text-[#191F28] underline underline-offset-2 decoration-[#E5E8EB]"
              >
                {article.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {articles.map((article) => (
        <section key={article.anchor} id={article.anchor} className={`${CARD} scroll-mt-16 p-4`}>
          <h2 className="text-[15.5px] font-bold leading-[1.5] text-[#191F28]">{article.title}</h2>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {article.blocks.map((block, index) => (
              <ArticleBlock key={`${article.anchor}-${index}`} block={block} />
            ))}
          </div>
        </section>
      ))}

      <p className={`px-1 text-[12.5px] leading-relaxed ${MUTED}`}>{footNote}</p>
    </div>
  );
}
