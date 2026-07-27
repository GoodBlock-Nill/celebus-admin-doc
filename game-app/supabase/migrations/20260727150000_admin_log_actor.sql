-- ─────────────────────────────────────────────────────────────
-- 020: 감사 로그 운영자 친화 — actor(관리자/시스템) 구분 + 닉네임 조인 조회
--   actor: 시스템 자동 이벤트(suspect_score·sso_diag)와 관리자 행동을 구분.
--   라이브 점수 함수(game_submit_score)는 건드리지 않고 트리거로 actor 자동 채움(안전).
-- ─────────────────────────────────────────────────────────────

alter table game_admin_log add column if not exists actor text;

-- 기존 행 분류 backfill
update game_admin_log
   set actor = case when action in ('suspect_score', 'sso_diag') then 'system' else 'admin' end
 where actor is null;

-- 신규 insert 시 actor 미지정이면 액션 종류로 자동 분류(DB측 suspect_score insert 포함)
create or replace function game_admin_log_actor() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.actor is null then
    new.actor := case when new.action in ('suspect_score', 'sso_diag') then 'system' else 'admin' end;
  end if;
  return new;
end $$;

drop trigger if exists trg_admin_log_actor on game_admin_log;
create trigger trg_admin_log_actor before insert on game_admin_log
  for each row execute function game_admin_log_actor();

-- 로그 조회 — 대상 player_hash를 닉네임으로 조인(운영자 가독). 대상이 계정이 아니면 nickname null.
create or replace function admin_logs(p_limit int default 200)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select l.action, l.target, l.detail, l.actor, l.created_at,
           p.nickname as target_nickname
    from game_admin_log l
    left join game_profiles p on p.player_hash = l.target
    order by l.created_at desc
    limit least(greatest(p_limit, 1), 500)
  ) t;
$$;
revoke execute on function admin_logs(int) from public, anon, authenticated;
grant  execute on function admin_logs(int) to service_role;
