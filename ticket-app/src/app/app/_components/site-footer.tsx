import Link from 'next/link';

/**
 * 사업자 정보 푸터 — 전 화면 공통.
 * 중괄호 표기 값은 사업자 등록 정보 확정 후 실제 값으로 교체한다.
 */
const COMPANY = {
  name: '(주)굿블록',
  ceo: '고경민',
  businessNo: '111-81-35074',
  mailOrderNo: '{제0000-서울OO-0000호}',
  address: '서울특별시 강남구 테헤란로25길 7, 7층(역삼동, 창성재단빌딩)',
  email: 'cs@celebus.xyz',
  officeHours: '평일 10:00~18:00',
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-[#E5E8EB] px-4 pb-7 pt-5 text-[12px] leading-[1.7] text-[#6B7684]">
      <p className="font-semibold text-[#4E5968]">
        {COMPANY.name} <span className="font-normal text-[#6B7684]">| 대표: {COMPANY.ceo}</span>
      </p>
      <p>
        사업자등록번호: {COMPANY.businessNo} | 통신판매업신고: {COMPANY.mailOrderNo}
      </p>
      <p>
        주소: {COMPANY.address} | 고객센터: {COMPANY.email} ({COMPANY.officeHours})
      </p>

      <p className="mt-2.5 flex items-center gap-2">
        <Link href="/app/terms" className="text-[#4E5968] underline underline-offset-2">
          이용약관
        </Link>
        <span aria-hidden="true" className="text-[#B0B8C1]">
          ·
        </span>
        <Link href="/app/privacy" className="font-semibold text-[#4E5968] underline underline-offset-2">
          개인정보처리방침
        </Link>
      </p>

      <p className="mt-2.5 text-[11.5px] leading-[1.6] text-[#8B95A1]">
        CELEBUS TICKET은 {COMPANY.name}이 운영하는 공연 예매 서비스이며, 입금 계좌의 예금주도 동일한
        {' '}
        {COMPANY.name}입니다.
      </p>
    </footer>
  );
}
