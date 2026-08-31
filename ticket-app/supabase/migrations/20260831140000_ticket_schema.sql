-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 도메인 스키마
-- 설계서 [CEB-TKT-001-B] §4 데이터 모델 / §7 보안 구현
--
-- ⚠️ 공용 dev/prod Supabase 프로젝트에 편입되므로 모든 객체는 `ticket_` 접두어를 쓴다.
--    접두어 밖의 객체(테이블·함수·역할·스키마)는 절대 생성·수정하지 않는다.
-- ⚠️ 전 테이블 RLS 활성 + 정책 0건(deny-all). 접근 경로는 SECURITY DEFINER RPC 또는
--    service_role(서버 전용 키)뿐이며, 브라우저 anon 키의 직접 접근은 전면 차단된다.
--    익명 공개가 필요한 공연·회차·잔여 좌석은 하단 공개 뷰로만 노출한다.
--
-- 재실행 안전(idempotent) — create if not exists / create or replace 기반.
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 회원 · 본인확인
-- ══════════════════════════════════════════════════════════════════════════

-- CELEBUS 계정 연계 회원 (자체 회원가입 없음 — 최초 진입 시 지연 생성)
create table if not exists ticket_members (
  id            uuid primary key default gen_random_uuid(),
  celebus_uid   text not null unique,              -- 본앱 회원 식별자
  member_hash   text not null unique,              -- HASH_SALT 기반 결정론 해시 (예매 웹 전용 솔트)
  nickname      text not null default '',
  created_at    timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

-- 본인확인(간편인증) 결과. 실명·DI는 예매 웹의 실질 신원 기준(설계서 §3.1 ②)
-- phone_enc / di_hash: 애플리케이션 계층에서 암호화·해시한 값을 그대로 저장한다(원문 비저장).
create table if not exists ticket_identity_verifications (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null unique references ticket_members (id) on delete cascade,
  real_name   text not null,
  birth       text not null,
  phone_enc   text,
  di_hash     text not null unique,                -- 중복 가입 차단의 DB 층 보장
  provider    text,                                -- 인증 수단 (PASS·카카오·토스·네이버 등)
  verified_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 공연 · 회차 · 배정 풀
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists ticket_concerts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  artist         text not null,
  venue          text not null,
  price_krw      integer not null check (price_krw >= 0),
  max_per_user   integer not null default 4 check (max_per_user >= 1),
  seat_type      text not null default '자유석' check (seat_type in ('자유석', '구역제')),
  status         text not null default 'UPCOMING' check (status in ('UPCOMING', 'ON_SALE', 'CLOSED')),
  refund_policy  text not null default '',
  notice         text not null default '',
  sales_start_at timestamptz not null,
  sales_end_at   timestamptz not null,
  created_at     timestamptz not null default now()
);

create table if not exists ticket_concert_sessions (
  id                        uuid primary key default gen_random_uuid(),
  concert_id                uuid not null references ticket_concerts (id) on delete cascade,
  name                      text not null,                 -- 예: "1회차 10/15(목) 19:00"
  start_at                  timestamptz not null,
  entry_open_minutes_before integer not null default 60,   -- 입장(QR 활성화) 기준
  created_at                timestamptz not null default now()
);

create index if not exists ticket_concert_sessions_concert_idx
  on ticket_concert_sessions (concert_id, start_at);

-- 회차별 4분류 재고. reserved = 선점(입금대기·지급대기), issued = 발급 완료
create table if not exists ticket_session_pools (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references ticket_concert_sessions (id) on delete cascade,
  pool_type  text not null check (pool_type in ('PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD')),
  allocated  integer not null default 0 check (allocated >= 0),
  reserved   integer not null default 0,
  issued     integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint ticket_session_pools_unique unique (session_id, pool_type),
  constraint ticket_session_pools_stock_check
    check (reserved >= 0 and issued >= 0 and reserved + issued <= allocated)
);

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 주문 · 티켓
-- ══════════════════════════════════════════════════════════════════════════

-- 일자별 주문번호 채번 (T{YYMMDD}-{4자리}, KST 일자 기준)
create table if not exists ticket_order_seq (
  seq_date date primary key,
  last_seq integer not null default 0 check (last_seq >= 0)
);

-- DEPOSIT_CONFIRMED = 입금 확인 완료·티켓 지급 대기 (운영자 지급 처리 전)
create table if not exists ticket_orders (
  id                     uuid primary key default gen_random_uuid(),
  order_no               text not null unique,
  member_id              uuid not null references ticket_members (id) on delete restrict,
  concert_id             uuid not null references ticket_concerts (id) on delete restrict,
  session_id             uuid not null references ticket_concert_sessions (id) on delete restrict,
  qty                    integer not null check (qty >= 1),
  amount_krw             integer not null check (amount_krw >= 0),
  status                 text not null check (status in (
                           'AWAITING_DEPOSIT', 'ON_HOLD', 'DEPOSIT_CONFIRMED',
                           'PAID', 'EXPIRED', 'CANCEL_REQUESTED', 'REFUNDED')),
  created_at             timestamptz not null default now(),
  deposit_deadline       timestamptz not null,
  depositor_name_rule    text not null default '',
  wants_cash_receipt     boolean not null default false,
  cash_receipt_phone_enc text,
  hold_reason            text,
  confirmed_deposit_id   uuid,
  deposit_confirmed_at   timestamptz,
  cancel_requested_at    timestamptz,
  refunded_at            timestamptz
);

create index if not exists ticket_orders_member_idx   on ticket_orders (member_id, concert_id, status);
create index if not exists ticket_orders_overdue_idx  on ticket_orders (status, deposit_deadline);
create index if not exists ticket_orders_session_idx  on ticket_orders (session_id, status);
create index if not exists ticket_orders_amount_idx   on ticket_orders (amount_krw, status);

-- 실명 티켓. order_id NULL = 무상 발급(당첨자·초대·운영 보류분)
create table if not exists ticket_tickets (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,                  -- 체크인용 8자리 코드
  order_id   uuid references ticket_orders (id) on delete set null,
  member_id  uuid not null references ticket_members (id) on delete restrict,
  concert_id uuid not null references ticket_concerts (id) on delete restrict,
  session_id uuid not null references ticket_concert_sessions (id) on delete restrict,
  pool_type  text not null check (pool_type in ('PAID_SALE', 'CELEBUS_WINNER', 'IX_INVITATION', 'OPERATION_HOLD')),
  status     text not null default 'VALID' check (status in ('VALID', 'USED', 'REVOKED')),
  issued_at  timestamptz not null default now(),
  used_at    timestamptz
);

create index if not exists ticket_tickets_member_idx  on ticket_tickets (member_id, concert_id, status);
create index if not exists ticket_tickets_order_idx   on ticket_tickets (order_id);
create index if not exists ticket_tickets_session_idx on ticket_tickets (session_id, status);

-- ══════════════════════════════════════════════════════════════════════════
-- 4. 입금
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists ticket_deposits (
  id              uuid primary key default gen_random_uuid(),
  depositor_name  text not null,
  amount_krw      integer not null check (amount_krw > 0),
  deposited_at    timestamptz not null default now(),
  status          text not null check (status in (
                    'UNMATCHED', 'AUTO_MATCHED', 'CONFIRMED', 'HELD', 'REFUND_TARGET', 'REFUNDED')),
  matched_order_id uuid references ticket_orders (id) on delete set null,
  memo            text
);

create index if not exists ticket_deposits_status_idx on ticket_deposits (status, deposited_at desc);
create index if not exists ticket_deposits_order_idx  on ticket_deposits (matched_order_id);

-- ══════════════════════════════════════════════════════════════════════════
-- 5. 부정 거래 신고
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists ticket_reports (
  id                 uuid primary key default gen_random_uuid(),
  target_type        text not null check (target_type in ('게시물', '계정', '외부 링크')),
  reason             text not null,
  detail             text not null default '',
  evidence_url       text,
  source             text not null check (source in ('앱 신고', '외부 통보')),
  reporter_member_id uuid references ticket_members (id) on delete set null,
  created_at         timestamptz not null default now(),
  deadline_at        timestamptz not null,          -- 접수 +10시간 (법정 처리 기한)
  status             text not null default 'RECEIVED'
                       check (status in ('RECEIVED', 'BLOCKED', 'SUBMITTED', 'CLOSED'))
);

create index if not exists ticket_reports_status_idx on ticket_reports (status, deadline_at);

create table if not exists ticket_report_actions (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references ticket_reports (id) on delete cascade,
  action_type text not null,
  acted_at    timestamptz not null default now(),
  admin_name  text not null default '운영자'
);

create index if not exists ticket_report_actions_report_idx on ticket_report_actions (report_id, acted_at);

-- ══════════════════════════════════════════════════════════════════════════
-- 6. 활동 로그 · 운영 설정
-- ══════════════════════════════════════════════════════════════════════════

-- 관리자·시스템·회원 활동 로그 (프로토 ActivityLog 이식).
-- admin_id는 2차 관리자 계정제(Supabase Auth + 역할) 전환 여지로 미리 확보 (설계서 §3.3).
create table if not exists ticket_admin_logs (
  id         uuid primary key default gen_random_uuid(),
  actor      text not null,                         -- 처리자 표기 (운영자 이름 / 시스템 / 회원 닉네임)
  admin_id   uuid,
  action     text not null,
  detail     text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ticket_admin_logs_created_idx on ticket_admin_logs (created_at desc);

-- 운영 설정 단일 행 (입금 마감 기준·수납 계좌)
create table if not exists ticket_app_settings (
  id                    text primary key default 'default' check (id = 'default'),
  deposit_deadline_mode text not null default 'SAME_DAY' check (deposit_deadline_mode in ('SAME_DAY', 'NEXT_DAY')),
  bank_name             text not null default '',
  bank_account          text not null default '',
  bank_holder           text not null default '',
  updated_at            timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- 7. RLS — 전 테이블 활성 + 정책 0건(deny-all)
--    추가로 anon·authenticated의 테이블 권한 자체를 회수(실명·DI 취급 이중 방어)
-- ══════════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array[
    'ticket_members', 'ticket_identity_verifications', 'ticket_concerts',
    'ticket_concert_sessions', 'ticket_session_pools', 'ticket_order_seq',
    'ticket_orders', 'ticket_tickets', 'ticket_deposits', 'ticket_reports',
    'ticket_report_actions', 'ticket_admin_logs', 'ticket_app_settings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from anon, authenticated', t);
  end loop;
end $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 8. 공용 헬퍼 함수 (RPC 내부 전용 — 별도 grant 없음)
-- ══════════════════════════════════════════════════════════════════════════

-- KST 벽시계 기준 일자
create or replace function ticket_kst_date(p_at timestamptz)
returns date language sql stable as $$
  select (p_at at time zone 'Asia/Seoul')::date;
$$;

-- KST 기준 해당 일자(+가산일)의 23:59:59 — 프로토 endOfKstDayIso 이식
create or replace function ticket_kst_end_of_day(p_at timestamptz, p_add_days integer default 0)
returns timestamptz language sql stable as $$
  select ((ticket_kst_date(p_at) + p_add_days)::timestamp
          + interval '23 hours 59 minutes 59 seconds') at time zone 'Asia/Seoul';
$$;

-- 금액 표기 — 55,000원 (프로토 formatKrw 이식, 로그 문구 동일성 유지용)
create or replace function ticket_krw(p_amount integer)
returns text language sql immutable as $$
  select trim(to_char(p_amount, 'FM999,999,999,999')) || '원';
$$;

-- 배정 풀 한국어 표기 — 프로토 poolLabel 이식
create or replace function ticket_pool_label(p_pool_type text)
returns text language sql immutable as $$
  select case p_pool_type
    when 'PAID_SALE'      then '유상 판매'
    when 'CELEBUS_WINNER' then 'CELEBUS 당첨자'
    when 'IX_INVITATION'  then '소속사 초대'
    when 'OPERATION_HOLD' then '운영 보류분'
    else p_pool_type
  end;
$$;

-- 입금자명 정규화 (공백 제거) — 프로토 isDepositorNameMatched 이식
create or replace function ticket_norm_name(p_name text)
returns text language sql immutable as $$
  select regexp_replace(coalesce(p_name, ''), '\s', '', 'g');
$$;

-- 입금자명 안내 문구 — 프로토 depositorNameRuleText 이식
create or replace function ticket_depositor_name_rule(p_real_name text)
returns text language sql immutable as $$
  select p_real_name || ' (동명이인 등으로 확인이 어려우면 "' || p_real_name || '+주문번호 끝 4자리")';
$$;

-- 체크인 코드 생성 — 8자리, 혼동 문자(0/O/1/I) 제외 (프로토 generateTicketCode 이식)
create or replace function ticket_gen_code()
returns text language plpgsql volatile as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  i integer;
begin
  for i in 1..8 loop
    v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  return v_code;
end $$;

-- 로그 1건 기록
create or replace function ticket_log(p_actor text, p_action text, p_detail text)
returns void language sql volatile as $$
  insert into ticket_admin_logs (actor, action, detail)
  values (coalesce(nullif(btrim(p_actor), ''), '운영자'), p_action, coalesce(p_detail, ''));
$$;

-- 1인 구매 한도에 포함되는 수량 — 프로토 countHeldQty 이식
--   ① 유효 주문(입금대기·보류·지급대기·지급완료·취소요청)의 매수 합
--   ② 주문 없이 발급된 무상 티켓(무효화 제외) 매수
--   공연 단위 합산(회차 무관)
create or replace function ticket_held_qty(p_member_id uuid, p_concert_id uuid)
returns integer language sql stable as $$
  select coalesce((
    select sum(o.qty)::int from ticket_orders o
    where o.member_id = p_member_id
      and o.concert_id = p_concert_id
      and o.status in ('AWAITING_DEPOSIT', 'ON_HOLD', 'DEPOSIT_CONFIRMED', 'PAID', 'CANCEL_REQUESTED')
  ), 0) + coalesce((
    select count(*)::int from ticket_tickets t
    where t.member_id = p_member_id
      and t.concert_id = p_concert_id
      and t.order_id is null
      and t.status <> 'REVOKED'
  ), 0);
$$;

-- 체크인 응답용 티켓 표현 (스캐너 화면이 필요로 하는 회차명·회원 표시명 동봉)
create or replace function ticket_ticket_json(p_ticket ticket_tickets)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'id', p_ticket.id,
    'code', p_ticket.code,
    'order_id', p_ticket.order_id,
    'member_id', p_ticket.member_id,
    'concert_id', p_ticket.concert_id,
    'session_id', p_ticket.session_id,
    'pool_type', p_ticket.pool_type,
    'status', p_ticket.status,
    'issued_at', p_ticket.issued_at,
    'used_at', p_ticket.used_at,
    'session_name', (select name from ticket_concert_sessions where id = p_ticket.session_id),
    'member_nickname', (select nickname from ticket_members where id = p_ticket.member_id)
  );
$$;

-- 일자별 주문번호 채번 — T{YYMMDD}-{4자리}
create or replace function ticket_next_order_no(p_at timestamptz)
returns text language plpgsql volatile as $$
declare
  v_date date := ticket_kst_date(p_at);
  v_seq  integer;
begin
  insert into ticket_order_seq (seq_date, last_seq)
  values (v_date, 1)
  on conflict (seq_date) do update set last_seq = ticket_order_seq.last_seq + 1
  returning last_seq into v_seq;

  return 'T' || to_char(v_date, 'YYMMDD') || '-' || lpad(v_seq::text, 4, '0');
end $$;

-- 헬퍼는 RPC 내부 전용 — 외부 역할의 직접 실행을 전면 차단(기본 PUBLIC EXECUTE 회수).
do $$
declare v_sig text;
begin
  foreach v_sig in array array[
    'ticket_kst_date(timestamptz)',
    'ticket_kst_end_of_day(timestamptz, integer)',
    'ticket_krw(integer)',
    'ticket_pool_label(text)',
    'ticket_norm_name(text)',
    'ticket_depositor_name_rule(text)',
    'ticket_gen_code()',
    'ticket_log(text, text, text)',
    'ticket_held_qty(uuid, uuid)',
    'ticket_ticket_json(ticket_tickets)',
    'ticket_next_order_no(timestamptz)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', v_sig);
  end loop;
end $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 9. 공개 뷰 — 익명 읽기가 허용되는 유일한 경로
--    (뷰 소유자 권한으로 실행되므로 deny-all RLS 테이블을 안전하게 투영한다)
-- ══════════════════════════════════════════════════════════════════════════

drop view if exists ticket_public_sessions;
drop view if exists ticket_public_concerts;

create view ticket_public_concerts as
select
  c.id, c.title, c.artist, c.venue, c.price_krw, c.max_per_user,
  c.seat_type, c.status, c.refund_policy, c.notice,
  c.sales_start_at, c.sales_end_at
from ticket_concerts c;

-- 잔여 좌석 = 유상 판매 배정 - 선점 - 발급 + (마감이 지난 미정리 선점분)
-- 설계서 §5 "만료 처리 lazy 원칙" — 정리 작업(ticket_expire_overdue_orders)이 아직
-- 돌지 않았더라도 잔여 계산에서 만료 선점을 제외해 오버셀을 방지한다.
create view ticket_public_sessions as
select
  s.id,
  s.concert_id,
  s.name,
  s.start_at,
  s.entry_open_minutes_before,
  p.allocated,
  p.reserved,
  p.issued,
  greatest(p.allocated - p.reserved - p.issued + coalesce(x.overdue_qty, 0), 0) as remaining
from ticket_concert_sessions s
join ticket_session_pools p
  on p.session_id = s.id and p.pool_type = 'PAID_SALE'
left join lateral (
  select sum(o.qty)::int as overdue_qty
  from ticket_orders o
  where o.session_id = s.id
    and o.status in ('AWAITING_DEPOSIT', 'ON_HOLD')
    and o.deposit_deadline < now()
) x on true;

grant select on ticket_public_concerts to anon, authenticated;
grant select on ticket_public_sessions to anon, authenticated;
