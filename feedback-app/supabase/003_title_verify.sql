-- ============================================================
-- 패치 003: 제목(title) 컬럼 + 비밀번호 검증(verify_post) RPC
-- Supabase SQL Editor에서 실행. (create/update_post는 시그니처가 바뀌므로 drop 후 재생성)
-- ============================================================

-- 1) title 컬럼
alter table posts add column if not exists title text not null default '';

-- 2) 공개 뷰 재생성 (+ title) — create or replace 는 끝에만 컬럼 추가 가능하므로 title을 맨 뒤에
create or replace view posts_public as
  select id, target, nickname, body, like_count, created_at, updated_at,
         (updated_at > created_at) as edited, title
  from posts
  where hidden = false;
grant select on posts_public to anon, authenticated;

-- 3) create_post 재생성 (p_title 추가)
drop function if exists create_post(text, text, text, text, text);
create or replace function create_post(
  p_target text, p_title text, p_nickname text, p_body text, p_password text, p_author_hash text
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  insert into posts (target, title, nickname, body, password_hash, author_hash)
  values (p_target, p_title, p_nickname, p_body, crypt(p_password, gen_salt('bf')), p_author_hash)
  returning id into v_id;
  return v_id;
end; $$;

-- 4) update_post 재생성 (p_title 추가)
drop function if exists update_post(uuid, text, text, text, text);
create or replace function update_post(
  p_id uuid, p_password text, p_target text, p_title text, p_nickname text, p_body text
) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash))
    into v_ok from posts where id = p_id and hidden = false;
  if v_ok is not true then return false; end if;
  update posts set target = p_target, title = p_title, nickname = p_nickname, body = p_body, updated_at = now()
    where id = p_id;
  return true;
end; $$;

-- 5) verify_post 신규 (비밀번호 검증만)
create or replace function verify_post(p_id uuid, p_password text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select coalesce(
    (select password_hash = crypt(p_password, password_hash) from posts where id = p_id and hidden = false),
    false
  );
$$;

-- 6) 실행 권한: anon/public 금지, service_role 만
revoke execute on function create_post(text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function update_post(uuid,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function verify_post(uuid,text)                    from public, anon, authenticated;
grant execute on function create_post(text,text,text,text,text,text) to service_role;
grant execute on function update_post(uuid,text,text,text,text,text) to service_role;
grant execute on function verify_post(uuid,text)                     to service_role;
