-- 좋아요 무결성: 서명 쿠키 신원 + IP당 신규 식별자 발급 캡
-- dedup 키를 클라이언트 localStorage voter → 서버 서명 쿠키 anonId로 전환하면서,
-- 쿠키 삭제 반복 어뷰징을 IP당 발급 한도로 억제한다.

create table if not exists anon_issuance (
  ip_hash    text not null,
  anon_id    text not null,
  created_at timestamptz not null default now(),
  primary key (ip_hash, anon_id)
);

create index if not exists anon_issuance_ip_idx on anon_issuance (ip_hash, created_at desc);

-- 윈도 내 해당 IP의 발급 수가 cap 미만이면 발급(insert) 후 true, 초과면 false.
create or replace function claim_anon_id(p_ip_hash text, p_anon_id text, p_cap int, p_window_secs int)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare
  v_count int;
begin
  select count(*) into v_count
    from anon_issuance
    where ip_hash = p_ip_hash
      and created_at > now() - make_interval(secs => p_window_secs);
  if v_count >= p_cap then
    return false;
  end if;
  insert into anon_issuance (ip_hash, anon_id) values (p_ip_hash, p_anon_id)
    on conflict do nothing;
  return true;
end $$;

revoke execute on function claim_anon_id(text, text, int, int) from public, anon, authenticated;
grant execute on function claim_anon_id(text, text, int, int) to service_role;
