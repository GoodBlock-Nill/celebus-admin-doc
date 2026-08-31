-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — dev 시드
-- 프로토타입 seed.ts와 동일한 공연 1건 + 회차 2건 + 운영 설정.
-- 멱등(on conflict do nothing) — 이미 있으면 건드리지 않는다(운영 중 수량 덮어쓰기 방지).
-- ─────────────────────────────────────────────────────────────────────────────

-- 운영 설정 — 입금 마감 당일 자정(SAME_DAY) + 수납 계좌
insert into ticket_app_settings (id, deposit_deadline_mode, bank_name, bank_account, bank_holder)
values ('default', 'SAME_DAY', '국민은행', '123456-04-567890', '(주)굿블록')
on conflict (id) do nothing;

-- 공연 — V01D 1st SHOWCASE
insert into ticket_concerts (
  id, title, artist, venue, price_krw, max_per_user, seat_type, status,
  refund_policy, notice, sales_start_at, sales_end_at
) values (
  'c0000000-0000-4000-8000-000000000001',
  'V01D 1st SHOWCASE : Dream In Our V01D',
  'V01D',
  '예스24 라이브홀',
  55000,
  4,
  '자유석',
  'ON_SALE',
  concat_ws(E'\n',
    '취소 요청은 마이티켓에서 접수하며, 접수 후 24시간 이내에 운영자가 환불을 처리합니다.',
    '환불 수수료는 관람일 기준으로 단계별 적용됩니다.',
    '· 관람일 10일 전까지: 수수료 없음',
    '· 관람일 9일 전 ~ 7일 전: 티켓 금액의 10%',
    '· 관람일 6일 전 ~ 3일 전: 티켓 금액의 20%',
    '· 관람일 2일 전 ~ 1일 전: 티켓 금액의 30%',
    '· 관람일 당일 및 공연 시작 이후: 환불 불가',
    '입금 확인 전(입금대기) 주문은 수수료 없이 취소할 수 있습니다.'
  ),
  concat_ws(E'\n',
    '[입금 안내]',
    '· 주문 후 안내되는 계좌로 입금 마감 시각까지 입금해 주세요.',
    '· 입금자명은 본인확인 실명과 반드시 일치해야 하며, 동명이인 등으로 확인이 어려운 경우 실명 뒤에 주문번호 끝 4자리를 붙여 입금해 주세요.',
    '· 마감 시각까지 입금이 확인되지 않으면 주문은 자동 취소되고 좌석이 반환됩니다.',
    '',
    '[양도·재판매 금지]',
    '· 본 티켓은 본인 확인 후 발급되는 실명 티켓으로, 타인에게 양도하거나 웃돈을 받고 재판매할 수 없습니다.',
    '· 재판매·양도 정황이 확인되면 티켓은 사전 통보 없이 무효 처리되며, 향후 예매가 제한될 수 있습니다.',
    '· 부정 거래 게시물을 발견하면 앱 내 신고 기능으로 알려 주세요.'
  ),
  timestamptz '2026-08-20 10:00:00+09',
  timestamptz '2026-10-14 23:59:59+09'
)
on conflict (id) do nothing;

-- 회차 2건
insert into ticket_concert_sessions (id, concert_id, name, start_at, entry_open_minutes_before)
values
  ('50000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   '1회차 10/15(목) 19:00', timestamptz '2026-10-15 19:00:00+09', 60),
  ('50000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001',
   '2회차 10/16(금) 19:00', timestamptz '2026-10-16 19:00:00+09', 60)
on conflict (id) do nothing;

-- 회차별 배정 풀 — 유상 300 / 당첨자 30 / 초대 50 / 운영 보류 20
insert into ticket_session_pools (session_id, pool_type, allocated)
select s.id, p.pool_type, p.allocated
  from (values
    ('50000000-0000-4000-8000-000000000001'::uuid),
    ('50000000-0000-4000-8000-000000000002'::uuid)
  ) as s(id)
  cross join (values
    ('PAID_SALE', 300),
    ('CELEBUS_WINNER', 30),
    ('IX_INVITATION', 50),
    ('OPERATION_HOLD', 20)
  ) as p(pool_type, allocated)
on conflict (session_id, pool_type) do nothing;
