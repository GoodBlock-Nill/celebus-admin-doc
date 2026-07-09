-- ============================================================
-- 패치 007: 작성자 댓글 = 글 비밀번호만으로 작성 (닉네임/댓글비번 불필요)
-- create_comment 시그니처 변경 → drop 후 재생성. Supabase SQL Editor에서 실행.
-- ============================================================

drop function if exists create_comment(uuid, text, text, text, text, text);

-- 두 가지 모드:
--   1) 일반: p_nickname + p_password 필요 (op_password 없음)
--   2) 작성자: p_op_password 만. 글 비밀번호와 일치하면 닉네임=글 작성자명, 삭제비번=글 비밀번호, is_op=true.
--      인증 실패 시 null 반환(라우트에서 401).
create or replace function create_comment(
  p_post_id     uuid,
  p_body        text,
  p_author_hash text,
  p_nickname    text default null,
  p_password    text default null,
  p_op_password text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id   uuid;
  v_nick text;
  v_pw   text;
  v_is_op boolean := false;
begin
  if p_op_password is not null and length(p_op_password) > 0 then
    -- 작성자 모드: 글 비밀번호 검증
    select nickname into v_nick
    from posts
    where id = p_post_id and password_hash = crypt(p_op_password, password_hash);
    if v_nick is null then
      return null;  -- 작성자 인증 실패
    end if;
    v_is_op := true;
    v_pw := p_op_password;  -- 삭제용 비밀번호 = 글 비밀번호
  else
    -- 일반 모드
    if p_nickname is null or p_password is null then
      return null;
    end if;
    v_nick := p_nickname;
    v_pw := p_password;
  end if;

  insert into comments (post_id, nickname, body, password_hash, author_hash, is_op)
  values (p_post_id, v_nick, p_body, crypt(v_pw, gen_salt('bf')), p_author_hash, v_is_op)
  returning id into v_id;
  return v_id;
end; $$;

revoke execute on function create_comment(uuid,text,text,text,text,text) from public, anon, authenticated;
grant  execute on function create_comment(uuid,text,text,text,text,text) to service_role;
