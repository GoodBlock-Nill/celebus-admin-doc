import { HTTP_STATUS, fail, isResponse, ok, readFailure, requireMember } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { loadConcertBriefs, loadSessionBriefs, maskedCashReceiptPhone, toOrderSummary } from '@/lib/server/mappers';
import { ORDER_COLUMNS, type OrderRow, type SettingsRow, type VerificationRow } from '@/lib/server/rows';
import type { OrderDetailView } from '@/lib/api-types';

const SETTINGS_COLUMNS = 'bank_name, bank_account, bank_holder';

interface IssuedAtRow {
  issued_at: string;
}

/**
 * 주문 상세 — 본인 주문만 조회된다(신원은 서명 쿠키에서만 읽는다).
 * 입금 안내에 필요한 수납 계좌·입금자명 규칙을 함께 내려준다.
 */
export async function GET(req: Request, context: { params: Promise<{ orderId: string }> }) {
  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const { orderId } = await context.params;
  const client = admin();
  await client.rpc('ticket_expire_overdue_orders');

  const order = await client
    .from('ticket_orders')
    .select(ORDER_COLUMNS)
    .eq('id', orderId)
    .eq('member_id', member.id)
    .maybeSingle<OrderRow>();

  if (order.error) return readFailure();
  if (!order.data) return fail('주문 정보를 찾을 수 없습니다.', HTTP_STATUS.notFound);

  const row = order.data;
  const [concerts, sessions, settings, verification, issued] = await Promise.all([
    loadConcertBriefs(client, [row.concert_id]),
    loadSessionBriefs(client, [row.session_id]),
    client.from('ticket_app_settings').select(SETTINGS_COLUMNS).eq('id', 'default').maybeSingle<SettingsRow>(),
    client
      .from('ticket_identity_verifications')
      .select('real_name, birth, phone_enc, provider, verified_at')
      .eq('member_id', member.id)
      .maybeSingle<VerificationRow>(),
    client
      .from('ticket_tickets')
      .select('issued_at')
      .eq('order_id', row.id)
      .order('issued_at', { ascending: true })
      .limit(1)
      .maybeSingle<IssuedAtRow>(),
  ]);

  const concert = concerts.get(row.concert_id);
  const detail: OrderDetailView = {
    ...toOrderSummary(row, concert, sessions.get(row.session_id)),
    venue: concert?.venue ?? '',
    depositorNameRule: row.depositor_name_rule,
    depositorName: verification.data?.real_name ?? '',
    wantsCashReceipt: row.wants_cash_receipt,
    cashReceiptPhoneMasked: maskedCashReceiptPhone(row),
    holdReason: row.hold_reason,
    depositConfirmedAt: row.deposit_confirmed_at,
    cancelRequestedAt: row.cancel_requested_at,
    refundedAt: row.refunded_at,
    ticketIssuedAt: issued.data?.issued_at ?? null,
    bank: {
      name: settings.data?.bank_name ?? '',
      account: settings.data?.bank_account ?? '',
      holder: settings.data?.bank_holder ?? '',
    },
  };

  return ok({ order: detail });
}
