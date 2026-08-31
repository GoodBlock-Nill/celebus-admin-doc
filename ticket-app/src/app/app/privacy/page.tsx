import { AppHeader } from '../_components/app-header';
import { LEGAL_PLACEHOLDER_NOTICE, LegalDocument } from '../_components/legal-doc';

/** 개인정보처리방침 항목 골격 */
const ARTICLES = [
  '수집하는 개인정보의 항목',
  '개인정보의 수집 및 이용 목적',
  '개인정보의 보유 및 이용 기간',
  '개인정보의 제3자 제공',
  '개인정보 처리의 위탁',
  '정보주체의 권리·의무 및 행사 방법',
  '개인정보의 파기 절차 및 방법',
  '개인정보의 안전성 확보 조치',
  '개인정보 자동 수집 장치의 설치·운영 및 거부',
  '개인정보 보호책임자 및 담당 부서',
  '권익침해 구제 방법',
  '개인정보처리방침의 변경',
] as const;

const FOOT_NOTE =
  '본인확인 시 수집하는 항목과 이용 목적은 본인확인 화면의 수집 항목 안내에서 확인할 수 있습니다.';

/** 개인정보처리방침 — 서비스 오픈 전 자리표시 문서 */
export default function PrivacyPage() {
  return (
    <main>
      <AppHeader
        title="개인정보처리방침"
        description="CELEBUS TICKET 공연 예매 서비스 개인정보처리방침"
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
