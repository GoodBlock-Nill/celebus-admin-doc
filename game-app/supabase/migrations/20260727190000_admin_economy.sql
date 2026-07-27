-- 023: 관리자 경제 개요 — CP 발행/소진/유통 + 발생원(미션·출석·관리자)·사용처(아이템 구매) 분석
--   additive(신 RPC) — 구 프로드 무영향. game_point_ledger·game_wallet 집계.
create or replace function admin_economy()
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'circulating', (select coalesce(sum(celeb_point), 0) from game_wallet),
    'holders',     (select count(*) from game_wallet where celeb_point > 0),
    'minted',      (select coalesce(sum(delta), 0) from game_point_ledger where delta > 0),
    'burned',      (select coalesce(sum(-delta), 0) from game_point_ledger where delta < 0),
    -- 발생원(+): 미션·출석·관리자 지급
    'sources', (select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) from (
        select case when reason like 'mission%' then 'mission'
                    when reason like 'daily%' then 'daily'
                    else 'admin' end as kind,
               sum(delta)::bigint as total, count(*)::int as cnt
        from game_point_ledger where delta > 0
        group by 1 order by 2 desc) s),
    -- 사용처(-): 아이템 구매(종류별)
    'sinks', (select coalesce(jsonb_agg(row_to_json(k)), '[]'::jsonb) from (
        select nullif(split_part(reason, ':', 2), '') as item,
               sum(-delta)::bigint as total, count(*)::int as cnt
        from game_point_ledger where delta < 0 and reason like 'buy:%'
        group by 1 order by 2 desc) k),
    -- 관리자 회수 등 기타 차감
    'sink_other', (select coalesce(sum(-delta), 0) from game_point_ledger where delta < 0 and reason not like 'buy:%')
  );
$$;
revoke execute on function admin_economy() from public, anon, authenticated;
grant  execute on function admin_economy() to service_role;
