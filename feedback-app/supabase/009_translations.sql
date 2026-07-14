-- ============================================================
-- 패치 009: 게시글 번역 캐시 (Claude Haiku 온디맨드 번역)
-- posts.translations jsonb 추가 + posts_public 재생성(translations 노출)
-- 구조: {"en": {"title": "...", "body": "..."}, "ja": {...}} — 언어별 번역 캐시
-- 첫 번역 요청 시 서버가 채우고, 이후엔 캐시 반환(0비용)
-- Supabase SQL Editor에서 실행.
-- ============================================================

alter table posts add column if not exists translations jsonb not null default '{}';

-- 공개 뷰 재생성 (+ translations)
drop view if exists posts_public;
create view posts_public as
  select p.id, p.target, p.category, p.title, p.nickname, p.body, p.like_count,
         p.created_at, p.updated_at, (p.updated_at > p.created_at) as edited,
         p.curated, p.pinned, p.impl_status, p.official_reply, p.translations,
         coalesce((select count(*)::int from comments c where c.post_id = p.id and c.hidden = false), 0) as comment_count
  from posts p
  where p.hidden = false;
grant select on posts_public to anon, authenticated;

-- 번역 캐시 저장 RPC (특정 언어 병합) — 본문 수정 시 캐시 무효화는 update_post에서 처리
create or replace function cache_translation(p_id uuid, p_lang text, p_value jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update posts
     set translations = translations || jsonb_build_object(p_lang, p_value)
   where id = p_id;
end; $$;
revoke execute on function cache_translation(uuid, text, jsonb) from public, anon, authenticated;
grant  execute on function cache_translation(uuid, text, jsonb) to service_role;

-- update_post 재정의: 본문 수정 시 번역 캐시 무효화 (낡은 번역 방지)
create or replace function update_post(
  p_id uuid, p_password text, p_target text, p_category text, p_title text, p_nickname text, p_body text
) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v_ok boolean;
begin
  select (password_hash = crypt(p_password, password_hash))
    into v_ok from posts where id = p_id and hidden = false;
  if v_ok is not true then return false; end if;
  update posts set target = p_target, category = p_category, title = p_title,
                   nickname = p_nickname, body = p_body, updated_at = now(),
                   translations = '{}'
    where id = p_id;
  return true;
end; $$;
revoke execute on function update_post(uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant  execute on function update_post(uuid,text,text,text,text,text,text) to service_role;
