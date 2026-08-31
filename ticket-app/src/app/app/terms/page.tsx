import { AppHeader } from '../_components/app-header';
import { LEGAL_PLACEHOLDER_NOTICE, LegalDocument } from '../_components/legal-doc';

/** 이용약관 조 구성 골격 */
const ARTICLES = [
  '제1조 (목적)',
  '제2조 (용어의 정의)',
  '제3조 (약관의 게시와 개정)',
  '제4조 (서비스의 제공 및 변경)',
  '제5조 (이용계약의 성립)',
  '제6조 (회원 정보의 관리)',
  '제7조 (예매 신청과 계약의 성립)',
  '제8조 (대금의 납입과 입금 확인)',
  '제9조 (예매 취소·환불 및 수수료)',
  '제10조 (티켓의 발급과 양도 금지)',
  '제11조 (회사의 의무)',
  '제12조 (이용자의 의무)',
  '제13조 (개인정보의 보호)',
  '제14조 (책임의 제한)',
  '제15조 (분쟁의 해결 및 준거법)',
  '부칙 (시행일)',
] as const;

const FOOT_NOTE =
  '약관 확정 전까지는 각 공연 상세 화면의 환불 정책과 유의사항, 입금 안내 화면의 고지 내용이 적용됩니다.';

/** 이용약관 — 서비스 오픈 전 자리표시 문서 */
export default function TermsPage() {
  return (
    <main>
      <AppHeader
        title="이용약관"
        description="CELEBUS TICKET 공연 예매 서비스 이용약관"
        backHref="/app"
      />
      <LegalDocument
        notice={LEGAL_PLACEHOLDER_NOTICE}
        articles={ARTICLES}
        footNote={FOOT_NOTE}
      />
    </main>
  );
}
