import { z } from 'zod';

import {
  HTTP_STATUS,
  fail,
  guardMutation,
  isResponse,
  ok,
  readFailure,
  requireMember,
  type RpcResult,
} from '@/lib/server/api';
import { decryptText, encryptText } from '@/lib/server/crypto';
import { admin } from '@/lib/server/db-admin';
import { loadConcertBriefs, loadSessionBriefs, toOrderSummary } from '@/lib/server/mappers';
import { ORDER_COLUMNS, type OrderRow, type VerificationRow } from '@/lib/server/rows';

const MAX_QTY_PER_ORDER = 10;

const PHONE_PATTERN = /^01\d{8,9}$/;

const VERIFIED_PHONE_FAILURE =
  '본인확인 휴대폰 번호를 확인하지 못했습니다. 다른 번호로 발급을 선택해 주세요.';

const createSchema = z
  .object({
    sessionId: z.string().uuid(),
    qty: z.number().int().min(1).max(MAX_QTY_PER_ORDER),
    wantsCashReceipt: z.boolean(),
    /** 발급 번호 출처 — 본인확인 번호(기본) / 직접 입력 */
    cashReceiptSource: z.enum(['verified', 'manual']).default('verified'),
    cashReceiptPhone: z.string().regex(PHONE_PATTERN).optional(),
  })
  .refine(
    (input) =>
      !input.wantsCashReceipt ||
      input.cashReceiptSource === 'verified' ||
      Boolean(input.cashReceiptPhone),
    { path: ['cashReceiptPhone'] },
  );

type CreateOrderInput = z.infer<typeof createSchema>;

type CashReceiptCipher = { ok: true; cipher: string | null } | { ok: false };

/**
 * 현금영수증 발급 번호를 저장용 암호문으로 준비한다.
 *
 * 본인확인 번호로 발급하는 경우 화면에서 번호를 받지 않고 서버가 보관 중인 본인확인 번호를
 * 복호해 다시 암호화한다. 번호 원문은 서버 밖으로 나가지 않으며, 예매 기록에는 본인확인 기록과
 * 별개의 암호문이 남는다.
 */
async function resolveCashReceiptCipher(
  memberId: string,
  input: CreateOrderInput,
): Promise<CashReceiptCipher> {
  if (!input.wantsCashReceipt) return { ok: true, cipher: null };

  if (input.cashReceiptSource === 'manual') {
    return { ok: true, cipher: input.cashReceiptPhone ? encryptText(input.cashReceiptPhone) : null };
  }

  const { data } = await admin()
    .from('ticket_identity_verifications')
    .select('phone_enc')
    .eq('member_id', memberId)
    .maybeSingle<Pick<VerificationRow, 'phone_enc'>>();

  const phone = decryptText(data?.phone_enc);
  if (!phone) return { ok: false };
  return { ok: true, cipher: encryptText(phone) };
}

/** 내 예매 목록 — 조회 전에 입금 마감이 지난 예매를 먼저 정리한다(설계서 §5 lazy 만료). */
export async function GET(req: Request) {
  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const client = admin();
  await client.rpc('ticket_expire_overdue_orders');

  const { data, error } = await client
    .from('ticket_orders')
    .select(ORDER_COLUMNS)
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })
    .returns<OrderRow[]>();

  if (error) return readFailure();

  const rows = data ?? [];
  const [concerts, sessions] = await Promise.all([
    loadConcertBriefs(client, [...new Set(rows.map((row) => row.concert_id))]),
    loadSessionBriefs(client, [...new Set(rows.map((row) => row.session_id))]),
  ]);

  return ok({
    orders: rows.map((row) => toOrderSummary(row, concerts.get(row.concert_id), sessions.get(row.session_id))),
  });
}

/** 예매 신청 — 한도·판매기간·잔여 좌석 검증과 좌석 선점은 전부 서버에서 원자적으로 처리된다. */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'order');
  if (blocked) return blocked;

  const member = await requireMember(req);
  if (isResponse(member)) return member;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('예매 정보를 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  const { sessionId, qty, wantsCashReceipt } = parsed.data;
  const cashReceipt = await resolveCashReceiptCipher(member.id, parsed.data);
  if (!cashReceipt.ok) return fail(VERIFIED_PHONE_FAILURE, HTTP_STATUS.badRequest);

  const { data, error } = await admin().rpc('ticket_create_order', {
    p_member_id: member.id,
    p_session_id: sessionId,
    p_qty: qty,
    p_wants_cash_receipt: wantsCashReceipt,
    p_cash_receipt_phone: cashReceipt.cipher,
  });

  const result = data as RpcResult | null;
  if (error || !result) return fail('예매 신청 처리에 실패했습니다.', HTTP_STATUS.serverError);
  if (!result.ok) return fail(String(result.reason ?? '예매 신청에 실패했습니다.'), HTTP_STATUS.badRequest);

  return ok({ orderId: String(result.order_id), orderNo: String(result.order_no) });
}
