import { LEGAL_DRAFT_NOTICE, type LegalArticle } from '../_components/legal-doc';
import { PRIVACY_COLLECT } from './privacy-articles-collect';
import { PRIVACY_RIGHTS } from './privacy-articles-rights';

/** 상단 초안 고지 — 공통 문구에 방침 전용 안내를 덧붙인다. */
export const PRIVACY_NOTICE = `${LEGAL_DRAFT_NOTICE} 수탁자·국외 이전 대상·개인정보 보호책임자 등 확정이 필요한 항목은 중괄호로 표시했습니다.`;

/** 개인정보처리방침 전문 — 수집·이용 → 정보주체 권리·안전조치 순 */
export const PRIVACY_ARTICLES: readonly LegalArticle[] = [...PRIVACY_COLLECT, ...PRIVACY_RIGHTS];

export const PRIVACY_FOOT_NOTE =
  '본인확인 단계에서 수집하는 항목과 이용 목적은 본인확인 화면의 수집 항목 안내에서도 확인할 수 있습니다. 지급된 티켓의 확인·발권과 현장 입장에는 CELEBUS 앱의 개인정보처리방침이 함께 적용됩니다.';
