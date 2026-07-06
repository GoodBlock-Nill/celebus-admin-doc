-- ============================================================
-- 패치: pgcrypto(crypt/gen_salt)가 extensions 스키마에 있어
--       함수 search_path에 extensions 추가. Supabase SQL Editor에서 실행.
--       (create or replace 이므로 기존 함수를 안전하게 갱신)
-- ============================================================

create or replace function create_post(
  p_target text, p_nickname text, p_body text, p_password text, p_author_hash text
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  insert into posts (target, nickname, body, password_hash, author_hash)
  values (p_target, p_nickname, p_body, crypt(p_password, gen_salt('bf')), p_author_hash)
  returning id into v_id;
  return v_id;
end; $$;

create or replace function update_post(
  p_id uuid, p_password text, p_target text, p_nickname text, p_body text
) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash))
    into v_ok from posts where id = p_id and hidden = false;
  if v_ok is not true then return false; end if;
  update posts set target = p_target, nickname = p_nickname, body = p_body, updated_at = now()
    where id = p_id;
  return true;
end; $$;

create or replace function delete_post(p_id uuid, p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash))
    into v_ok from posts where id = p_id;
  if v_ok is not true then return false; end if;
  delete from posts where id = p_id;
  return true;
end; $$;

revoke execute on function create_post(text,text,text,text,text) from public, anon, authenticated;
revoke execute on function update_post(uuid,text,text,text,text) from public, anon, authenticated;
revoke execute on function delete_post(uuid,text)                from public, anon, authenticated;
grant execute on function create_post(text,text,text,text,text)  to service_role;
grant execute on function update_post(uuid,text,text,text,text)  to service_role;
grant execute on function delete_post(uuid,text)                 to service_role;
