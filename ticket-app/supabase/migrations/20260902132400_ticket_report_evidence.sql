-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 부정 거래 신고 증빙 이미지
--
-- ① 증빙 보관함: 신고 증빙은 민감 자료라 공개 버킷(ticket-images)과 분리한 비공개 버킷을 쓴다.
--    정책을 두지 않으므로 익명·로그인 회원 모두 접근할 수 없고, 서버(service_role)만 읽고 쓴다.
--    관리자 화면 노출은 서버가 만든 한시적 열람 주소(1시간)로만 이뤄진다.
-- ② 신고 증빙 이미지 목록: 신고 1건당 최대 3장, 보관함 안 저장 경로만 담는다.
-- ③ 신고 접수 갱신: 증빙 이미지 목록을 함께 받도록 재정의한다(장수·경로 형식 검증 포함).
--
-- 재실행 안전(idempotent) — add column if not exists / on conflict do nothing /
-- drop function if exists + create.
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════
-- 1. 증빙 보관함 — 비공개 버킷
--    읽기·쓰기 정책을 만들지 않는다. 정책이 없으면 회원 신원으로는 어떤 접근도 되지 않고,
--    정책 검사를 건너뛰는 서버 전용 키(service_role)로만 다룰 수 있다.
-- ══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('ticket-report-evidence', 'ticket-report-evidence', false)
on conflict (id) do nothing;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. 컬럼 추가 — 증빙 이미지 저장 경로 목록
-- ══════════════════════════════════════════════════════════════════════════
alter table ticket_reports
  add column if not exists evidence_files text[] not null default '{}';

comment on column ticket_reports.evidence_files is
  '증빙 이미지 저장 경로 목록 — 비공개 보관함(ticket-report-evidence) 안 경로. 신고 1건당 최대 3장';

-- ══════════════════════════════════════════════════════════════════════════
-- 3. 신고 접수 갱신 — 증빙 이미지 목록 수용
--    기존 6개 항목 함수는 항목이 늘어난 새 함수와 헷갈리지 않도록 먼저 없앤다.
-- ══════════════════════════════════════════════════════════════════════════
drop function if exists ticket_submit_report(text, text, text, text, text, uuid);

create or replace function ticket_submit_report(
  p_target_type    text,
  p_reason         text,
  p_detail         text,
  p_evidence_url   text,
  p_source         text,
  p_member_id      uuid,
  p_evidence_files text[] default '{}'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  -- 신고 1건에 담을 수 있는 증빙 이미지 장수
  v_max_files constant integer := 3;
  -- 보관함 경로 형식 — 「연월(6자리)/무작위 식별자.확장자」만 허용해 임의 경로 지정을 막는다.
  v_path_pattern constant text :=
    '^[0-9]{6}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$';

  v_files  text[] := coalesce(p_evidence_files, '{}');
  v_file   text;
  v_report ticket_reports;
  v_member ticket_members;
  v_actor  text;
begin
  if p_target_type not in ('게시물', '계정', '외부 링크') then
    return jsonb_build_object('ok', false, 'reason', '신고 대상 구분을 확인해 주세요.');
  end if;
  if p_source not in ('앱 신고', '외부 통보') then
    return jsonb_build_object('ok', false, 'reason', '신고 경로를 확인해 주세요.');
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    return jsonb_build_object('ok', false, 'reason', '신고 사유를 입력해 주세요.');
  end if;

  -- 증빙 이미지 — 장수 상한과 보관함 경로 형식을 모두 확인한다.
  if array_length(v_files, 1) > v_max_files then
    return jsonb_build_object('ok', false, 'reason',
      format('증빙 이미지는 최대 %s장까지 첨부할 수 있습니다.', v_max_files));
  end if;
  foreach v_file in array v_files loop
    if coalesce(v_file, '') !~ v_path_pattern then
      return jsonb_build_object('ok', false, 'reason', '증빙 이미지 정보를 확인해 주세요.');
    end if;
  end loop;

  insert into ticket_reports (
    target_type, reason, detail, evidence_url, evidence_files,
    source, reporter_member_id, deadline_at, status
  ) values (
    p_target_type, btrim(p_reason), coalesce(p_detail, ''),
    nullif(btrim(coalesce(p_evidence_url, '')), ''), v_files,
    p_source, p_member_id, now() + interval '10 hours', 'RECEIVED'
  ) returning * into v_report;

  if p_source = '앱 신고' and p_member_id is not null then
    select * into v_member from ticket_members where id = p_member_id;
    v_actor := coalesce(nullif(v_member.nickname, ''), v_member.celebus_uid, '회원');
  else
    v_actor := '외부 통보';
  end if;

  perform ticket_log(v_actor, '부정 거래 신고 접수',
    v_report.target_type || ' · ' || v_report.reason
      || ' (처리 기한 10시간, 증빙 이미지 ' || coalesce(array_length(v_files, 1), 0) || '장)');

  return jsonb_build_object('ok', true, 'report_id', v_report.id, 'deadline_at', v_report.deadline_at);
end $$;

revoke execute on function ticket_submit_report(text, text, text, text, text, uuid, text[])
  from public, anon, authenticated;
grant  execute on function ticket_submit_report(text, text, text, text, text, uuid, text[])
  to service_role;
