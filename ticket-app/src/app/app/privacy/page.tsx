import { AppHeader } from '../_components/app-header';
import { LegalDocument } from '../_components/legal-doc';
import { PRIVACY_ARTICLES, PRIVACY_FOOT_NOTE, PRIVACY_NOTICE } from './privacy-content';

/** 개인정보처리방침 — 전문 (법무 검토 전 초안) */
export default function PrivacyPage() {
  return (
    <main>
      <AppHeader
        title="개인정보처리방침"
        description="CELEBUS TICKET 공연 예매 서비스 개인정보처리방침"
        backHref="/app"
      />
      <LegalDocument
        notice={PRIVACY_NOTICE}
        articles={PRIVACY_ARTICLES}
        footNote={PRIVACY_FOOT_NOTE}
      />
    </main>
  );
}
