-- ─────────────────────────────────────────────────────────────────────────────
-- CELEBUS 예매 웹 (ticket-app) — 회원 노출 문구 "주문" → "예매" 전환
-- 인터파크·멜론티켓 등 티켓 서비스 표준 용어에 맞춰 회원이 보는 문구만 바꾼다.
--
-- 적용 대상 (회원 화면에 그대로 노출되는 DB 저장 문구)
--   ① 입금자명 안내 문구 생성 함수  — 신규 예매부터 "예매번호 끝 4자리"로 안내
--   ② 이미 만들어진 예매의 입금자명 안내 문구
--   ③ 공연 유의사항 · 환불 정책 (시드/운영자 입력분)
--
-- 적용 제외
--   · 운영자 활동 로그 문구, 관리자 화면 문구 — 운영 개념(주문·입금 확인) 유지
--   · 기존 마이그레이션 파일은 수정하지 않는다(이력 보존).
--
-- 멱등 — replace 기반이라 여러 번 실행해도 결과가 같다.
-- ─────────────────────────────────────────────────────────────────────────────

-- ① 입금자명 안내 문구 — 회원이 계좌 이체 시 그대로 따라 적는 문구
create or replace function ticket_depositor_name_rule(p_real_name text)
returns text language sql immutable as $$
  select p_real_name || ' (동명이인 등으로 확인이 어려우면 "' || p_real_name || '+예매번호 끝 4자리")';
$$;

-- ② 기존 예매에 저장된 안내 문구 소급 정정
update ticket_orders
   set depositor_name_rule = replace(depositor_name_rule, '주문번호', '예매번호')
 where depositor_name_rule like '%주문번호%';

-- ③ 공연 유의사항 · 환불 정책 — 회원 상세 화면에 그대로 노출된다.
update ticket_concerts
   set notice = replace(
                  replace(
                    replace(notice, '주문 후 안내되는 계좌로', '예매 후 안내되는 계좌로'),
                    '주문번호 끝', '예매번호 끝'),
                  '주문은 자동 취소되고', '예매가 자동 취소되고')
 where notice like '%주문%';

update ticket_concerts
   set refund_policy = replace(refund_policy, '주문은 수수료 없이', '예매는 수수료 없이')
 where refund_policy like '%주문%';
