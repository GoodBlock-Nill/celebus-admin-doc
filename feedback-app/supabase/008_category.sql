-- ============================================================
-- 패치 008: 아이디어 유형 카테고리 (이벤트/굿즈/행사/콘텐츠/기타)
-- posts.category 추가 + posts_public 재생성 + create_post/update_post 재정의(+p_category)
-- Supabase SQL Editor에서 실행.
-- ============================================================

alter table posts add column if not exists category text not null default '기타'
  check (category in ('이벤트','굿즈','행사','콘텐츠','기타'));

-- 공개 뷰 재생성 (+ category, comment_count 유지)
drop view if exists posts_public;
create view posts_public as
  select p.id, p.target, p.category, p.title, p.nickname, p.body, p.like_count,
         p.created_at, p.updated_at, (p.updated_at > p.created_at) as edited,
         p.curated, p.pinned, p.impl_status, p.official_reply,
         coalesce((select count(*)::int from comments c where c.post_id = p.id and c.hidden = false), 0) as comment_count
  from posts p
  where p.hidden = false;
grant select on posts_public to anon, authenticated;

-- create_post 재정의 (+ p_category). 시그니처 변경 → drop 후 재생성.
drop function if exists create_post(text, text, text, text, text, text);
create or replace function create_post(
  p_target text, p_category text, p_title text, p_nickname text, p_body text, p_password text, p_author_hash text
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  insert into posts (target, category, title, nickname, body, password_hash, author_hash)
  values (p_target, p_category, p_title, p_nickname, p_body, crypt(p_password, gen_salt('bf')), p_author_hash)
  returning id into v_id;
  return v_id;
end; $$;

-- update_post 재정의 (+ p_category)
drop function if exists update_post(uuid, text, text, text, text, text);
create or replace function update_post(
  p_id uuid, p_password text, p_target text, p_category text, p_title text, p_nickname text, p_body text
) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash))
    into v_ok from posts where id = p_id and hidden = false;
  if v_ok is not true then return false; end if;
  update posts set target = p_target, category = p_category, title = p_title,
                   nickname = p_nickname, body = p_body, updated_at = now()
    where id = p_id;
  return true;
end; $$;

-- 실행 권한 (신규 시그니처)
revoke execute on function create_post(text,text,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function update_post(uuid,text,text,text,text,text,text)  from public, anon, authenticated;
grant  execute on function create_post(text,text,text,text,text,text,text) to service_role;
grant  execute on function update_post(uuid,text,text,text,text,text,text)  to service_role;
