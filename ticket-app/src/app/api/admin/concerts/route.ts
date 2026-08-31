import { z } from 'zod';

import { callAdminRpc, isGuardFailure, requireAdmin } from '@/lib/server/admin-api';
import { HTTP_STATUS, fail, guardMutation, ok, readFailure } from '@/lib/server/api';
import { admin } from '@/lib/server/db-admin';
import { CONCERT_COLUMNS, type ConcertRow } from '@/lib/server/rows';
import type { AdminConcertRowView } from '@/lib/admin-types';

interface SessionPoolRow {
  session_id: string;
  allocated: number;
  reserved: number;
  issued: number;
}

interface SessionConcertRow {
  id: string;
  concert_id: string;
}

/** 공연 목록 — 공연별 회차 수와 4분류 합산 재고를 함께 내려준다. */
export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const client = admin();
  const [concerts, sessions, pools] = await Promise.all([
    client
      .from('ticket_concerts')
      .select(CONCERT_COLUMNS)
      .order('sales_start_at', { ascending: false })
      .returns<ConcertRow[]>(),
    client.from('ticket_concert_sessions').select('id, concert_id').returns<SessionConcertRow[]>(),
    client
      .from('ticket_session_pools')
      .select('session_id, allocated, reserved, issued')
      .returns<SessionPoolRow[]>(),
  ]);

  if (concerts.error || sessions.error || pools.error) return readFailure();

  const sessionToConcert = new Map((sessions.data ?? []).map((row) => [row.id, row.concert_id]));

  const items: AdminConcertRowView[] = (concerts.data ?? []).map((concert) => {
    const ownSessions = (sessions.data ?? []).filter((row) => row.concert_id === concert.id);
    const totals = (pools.data ?? [])
      .filter((pool) => sessionToConcert.get(pool.session_id) === concert.id)
      .reduce(
        (acc, pool) => ({
          allocated: acc.allocated + pool.allocated,
          reserved: acc.reserved + pool.reserved,
          issued: acc.issued + pool.issued,
        }),
        { allocated: 0, reserved: 0, issued: 0 },
      );

    return {
      id: concert.id,
      title: concert.title,
      artist: concert.artist,
      status: concert.status,
      priceKrw: concert.price_krw,
      salesStartAt: concert.sales_start_at,
      salesEndAt: concert.sales_end_at,
      sessionCount: ownSessions.length,
      ...totals,
    };
  });

  return ok({ items });
}

/** 입력 상한 — 실수 입력이 그대로 재고가 되는 것을 막는 안전 상한 */
const MAX_TITLE_LENGTH = 120;
const MAX_NAME_LENGTH = 60;
const MAX_LONG_TEXT_LENGTH = 4000;
const MAX_PRICE_KRW = 10000000;
const MAX_PER_USER_LIMIT = 10;
const MAX_ENTRY_OPEN_MINUTES = 1440;
const MAX_ALLOCATED = 100000;
const MAX_SESSIONS = 20;
const MAX_VENUE_ADDRESS_LENGTH = 200;
const MAX_VENUE_MAP_URL_LENGTH = 500;
const MAX_IMAGE_URL_LENGTH = 1000;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_DETAIL_IMAGE_COUNT = 10;

const datetime = z.string().datetime({ offset: true });
const allocated = z.number().int().min(0).max(MAX_ALLOCATED);

const sessionSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  startAt: datetime,
  entryOpenMinutesBefore: z.number().int().min(0).max(MAX_ENTRY_OPEN_MINUTES),
  pools: z.object({
    PAID_SALE: allocated,
    CELEBUS_WINNER: allocated,
    IX_INVITATION: allocated,
    OPERATION_HOLD: allocated,
  }),
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  artist: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  venue: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  // 주소·지도 링크는 선택 입력이라 미입력(빈 값)도 허용한다.
  venueAddress: z.string().trim().max(MAX_VENUE_ADDRESS_LENGTH).optional(),
  venueMapUrl: z.string().trim().max(MAX_VENUE_MAP_URL_LENGTH).optional(),
  // 포스터는 신규 등록 필수 항목이라 주소가 반드시 있어야 한다.
  posterUrl: z.string().trim().min(1).max(MAX_IMAGE_URL_LENGTH),
  // 공연 소개·상세 이미지는 선택 입력이다.
  description: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  detailImageUrls: z
    .array(z.string().trim().min(1).max(MAX_IMAGE_URL_LENGTH))
    .max(MAX_DETAIL_IMAGE_COUNT)
    .optional(),
  priceKrw: z.number().int().min(1).max(MAX_PRICE_KRW),
  maxPerUser: z.number().int().min(1).max(MAX_PER_USER_LIMIT),
  seatType: z.enum(['자유석', '구역제', '현장배정']),
  refundPolicy: z.string().max(MAX_LONG_TEXT_LENGTH),
  notice: z.string().max(MAX_LONG_TEXT_LENGTH),
  salesStartAt: datetime,
  salesEndAt: datetime,
  sessions: z.array(sessionSchema).min(1).max(MAX_SESSIONS),
});

/** 공연 등록 — 공연·회차·분류별 배정을 한 번에 생성한다(판매 시작은 별도 액션). */
export async function POST(req: Request) {
  const blocked = guardMutation(req, 'admin-concert');
  if (blocked) return blocked;

  const guard = requireAdmin(req);
  if (isGuardFailure(guard)) return guard;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('공연 등록 값을 다시 확인해 주세요.', HTTP_STATUS.badRequest);

  const input = parsed.data;
  return callAdminRpc(
    'ticket_create_concert',
    {
      p_payload: {
        title: input.title,
        artist: input.artist,
        venue: input.venue,
        venue_address: input.venueAddress ?? '',
        venue_map_url: input.venueMapUrl ?? '',
        poster_url: input.posterUrl,
        description: input.description ?? '',
        detail_image_urls: input.detailImageUrls ?? [],
        price_krw: input.priceKrw,
        max_per_user: input.maxPerUser,
        seat_type: input.seatType,
        refund_policy: input.refundPolicy,
        notice: input.notice,
        sales_start_at: input.salesStartAt,
        sales_end_at: input.salesEndAt,
        sessions: input.sessions.map((session) => ({
          name: session.name,
          start_at: session.startAt,
          entry_open_minutes_before: session.entryOpenMinutesBefore,
          pools: session.pools,
        })),
      },
      p_admin: guard,
    },
    '공연 등록에 실패했습니다.',
  );
}
