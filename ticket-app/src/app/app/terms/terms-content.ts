import { LEGAL_DRAFT_NOTICE, type LegalArticle } from '../_components/legal-doc';
import { TERMS_DUTY } from './terms-articles-duty';
import { TERMS_GENERAL } from './terms-articles-general';
import { TERMS_REFUND } from './terms-articles-refund';
import { TERMS_TICKET } from './terms-articles-ticket';
import { TERMS_TRADE } from './terms-articles-trade';

/** 상단 초안 고지 — 공통 문구에 약관 전용 안내를 덧붙인다. */
export const TERMS_NOTICE = `${LEGAL_DRAFT_NOTICE} 확정 전까지는 각 공연 상세 화면의 환불 정책·유의사항과 예매 신청 화면의 안내가 함께 적용됩니다.`;

/** 이용약관 전문 — 총칙 → 예매·대금 → 취소·환불 → 티켓·부정거래 → 의무·책임·분쟁 순 */
export const TERMS_ARTICLES: readonly LegalArticle[] = [
  ...TERMS_GENERAL,
  ...TERMS_TRADE,
  ...TERMS_REFUND,
  ...TERMS_TICKET,
  ...TERMS_DUTY,
];

export const TERMS_FOOT_NOTE =
  '이 약관은 CELEBUS TICKET 공연 예매 서비스에 적용됩니다. 지급된 티켓의 확인·발권과 현장 입장은 CELEBUS 앱에서 이루어지며, 해당 화면에는 CELEBUS 앱의 이용약관이 함께 적용됩니다.';
