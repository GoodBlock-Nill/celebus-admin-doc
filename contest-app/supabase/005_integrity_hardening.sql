-- ============================================================
-- FanStage 005: 무결성 하드닝 (감사 발견사항 반영)
--   ① 신고에 상태 가드 (진행 중 콘테스트만) — 수상작 강제 숨김 방지
--   ② 인기상 확정 중복 방지 부분 유니크 인덱스 (경합 TOCTOU)
--   ③ 수정/삭제에 submit_end_at 가드 (마감 후 바꿔치기 방지)
--   ④ 인기상 0표 수상 방지 (having vote_count > 0)
-- Supabase SQL Editor에서 실행.
-- ============================================================

-- ① 신고 RPC: 진행 중(open/voting) 콘테스트에서만 접수·집계
create or replace function contest_report_entry(p_entry_id uuid, p_reporter_hash text, p_threshold int default 5)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_count int; v_status text;
begin
  select c.status into v_status
    from contest_entries e join contests c on c.id = e.contest_id
   where e.id = p_entry_id;
  if v_status is null or v_status not in ('open','voting') then return false; end if;
  insert into contest_reports (entry_id, reporter_hash)
  values (p_entry_id, p_reporter_hash)
  on conflict do nothing;
  if not found then return false; end if;
  update contest_entries set report_count = report_count + 1 where id = p_entry_id
    returning report_count into v_count;
  if v_count >= p_threshold then
    update contest_entries set hidden = true where id = p_entry_id;
  end if;
  return true;
end; $$;
revoke execute on function contest_report_entry(uuid,text,int) from public, anon, authenticated;
grant  execute on function contest_report_entry(uuid,text,int) to service_role;

-- ② 인기상 중복 확정 방지 — 콘테스트당 popular 수상은 유일 집합 (경합에도 두 번째 삽입 실패)
create unique index if not exists contest_awards_one_popular_set
  on contest_awards (contest_id, rank) where award_type = 'popular';

-- ③ 수정: 콘테스트 open + 접수 마감 전에만
create or replace function contest_update_entry(p_id uuid, p_password text, p_title text, p_description text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (e.password_hash = crypt(p_password, e.password_hash))
         and c.status = 'open'
         and (c.submit_end_at is null or now() <= c.submit_end_at)
    into v_ok
    from contest_entries e join contests c on c.id = e.contest_id
   where e.id = p_id and e.hidden = false;
  if v_ok is not true then return false; end if;
  update contest_entries set title = p_title, description = p_description, updated_at = now()
   where id = p_id;
  return true;
end; $$;
revoke execute on function contest_update_entry(uuid,text,text,text) from public, anon, authenticated;
grant  execute on function contest_update_entry(uuid,text,text,text) to service_role;

-- ③ 삭제: 콘테스트 open + 접수 마감 전에만
create or replace function contest_delete_entry(p_id uuid, p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (e.password_hash = crypt(p_password, e.password_hash))
         and c.status = 'open'
         and (c.submit_end_at is null or now() <= c.submit_end_at)
    into v_ok
    from contest_entries e join contests c on c.id = e.contest_id
   where e.id = p_id;
  if v_ok is not true then return false; end if;
  delete from contest_entries where id = p_id;
  return true;
end; $$;
revoke execute on function contest_delete_entry(uuid,text) from public, anon, authenticated;
grant  execute on function contest_delete_entry(uuid,text) to service_role;

-- ④ 인기상 확정: 0표 수상 방지 + for update 잠금
create or replace function contest_finalize_popular(p_contest_id uuid, p_awards jsonb)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_n int; v_count int := 0; r record; i int := 0;
begin
  v_n := jsonb_array_length(p_awards);
  if v_n is null or v_n < 1 then return 0; end if;
  -- 콘테스트 행 잠금으로 동시 확정 직렬화
  perform 1 from contests where id = p_contest_id for update;
  if exists (select 1 from contest_awards where contest_id = p_contest_id and award_type = 'popular') then
    return -1;
  end if;
  for r in
    select id, handle from contest_entries
     where contest_id = p_contest_id and hidden = false and disqualified = false and vote_count > 0
     order by vote_count desc, created_at asc
     limit v_n
  loop
    insert into contest_awards (contest_id, entry_id, handle, award_type, award_name, rank, prize)
    values (p_contest_id, r.id, r.handle, 'popular',
            coalesce(p_awards->i->>'award_name', '인기상 ' || (i + 1) || '위'),
            i + 1,
            coalesce(p_awards->i->>'prize', ''));
    i := i + 1; v_count := v_count + 1;
  end loop;
  return v_count;
end; $$;
revoke execute on function contest_finalize_popular(uuid,jsonb) from public, anon, authenticated;
grant  execute on function contest_finalize_popular(uuid,jsonb) to service_role;
