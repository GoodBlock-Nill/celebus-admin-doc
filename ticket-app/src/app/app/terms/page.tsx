import { AppHeader } from '../_components/app-header';
import { LegalDocument } from '../_components/legal-doc';
import { TERMS_ARTICLES, TERMS_FOOT_NOTE, TERMS_NOTICE } from './terms-content';

/** 이용약관 — 조문 전문 (법무 검토 전 초안) */
export default function TermsPage() {
  return (
    <main>
      <AppHeader
        title="이용약관"
        description="CELEBUS TICKET 공연 예매 서비스 이용약관"
        backHref="/app"
      />
      <LegalDocument
        notice={TERMS_NOTICE}
        articles={TERMS_ARTICLES}
        footNote={TERMS_FOOT_NOTE}
      />
    </main>
  );
}
