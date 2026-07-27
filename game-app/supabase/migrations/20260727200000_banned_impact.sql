-- 024: 금칙어 영향 미리보기 — 단어별로 현재 몇 명 닉네임에 포함되는지(부분일치) 표시.
--   운영자가 짧은 단어의 오탐(예: 'ass'→'bass')을 추가 전에 확인. additive(신 RPC) — 구 프로드 무영향.

-- 등록된 금칙어 + 각 단어가 포함된 현재 회원 수
create or replace function admin_banned_words()
returns jsonb language sql security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(row_to_json(t) order by t.word), '[]'::jsonb) from (
    select w.word,
           (select count(*) from game_profiles p where lower(p.nickname) like '%' || w.word || '%')::int as affected
    from game_banned_words w
  ) t;
$$;
revoke execute on function admin_banned_words() from public, anon, authenticated;
grant  execute on function admin_banned_words() to service_role;

-- 후보 단어 미리보기 — 포함 회원 수 + 예시 닉네임(최대 5)
create or replace function admin_banned_preview(p_word text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'count', (select count(*) from game_profiles where lower(nickname) like '%' || lower(p_word) || '%'),
    'samples', (select coalesce(jsonb_agg(nickname), '[]'::jsonb) from (
        select nickname from game_profiles where lower(nickname) like '%' || lower(p_word) || '%' limit 5) s)
  );
$$;
revoke execute on function admin_banned_preview(text) from public, anon, authenticated;
grant  execute on function admin_banned_preview(text) to service_role;
