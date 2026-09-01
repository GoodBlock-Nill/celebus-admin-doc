# [CEB-TKT-001-B] 예매 웹 구현 설계서

## Page Properties

| 항목 | 내용 |
| --- | --- |
| 문서 ID | CEB-TKT-001-B |
| 문서 유형 | 구현 설계서 (개발팀 대상 기술 문서 — 기획 리포트 [CEB-TKT-001-A]의 실행 설계) |
| 기획담당자 | @Nill Yoo |
| 기능영역 | 티켓 (TKT) |
| 상태 | 초안 (승인 후 구현 착수) |
| 버전 | v1.7 |
| 최근 업데이트 | 2026.09.01 |
| 선행 문서 | [CEB-TKT-001-A] 티켓 예매 서비스 기획 리포트 v1.2 / 프로토타입 `ticket-app/` (동작 사양 SSOT) |

> 본 문서는 실서비스 예매 웹의 구현 설계다. 정책·화면 동작의 근거는 [CEB-TKT-001-A]와 프로토타입 `ticket-app/`이며, 이 문서는 그것을 **실제 서비스로 옮기는 방법**(아키텍처·데이터·서버 로직·연동·배포·일정)을 다룬다.

---

## 1. 확정 구현 방향 (2026.08.31 결정)

| 결정 | 내용 |
| --- | --- |
| 구현 형태 | **별도 예매 웹** — CELEBUS 본 앱과 독립된 웹 서비스. 본 앱에서 링크/웹뷰로 진입 |
| 관리자 화면 | **같은 웹의 관리자 영역**(`/admin`) — 확정 플로우의 "예매페이지 관리자 화면"에 해당. 별도 BO 의존 없음 |
| 스택 | Next.js + Supabase(Postgres·인증·RLS) + Vercel — 기존 위성 앱(game-app·live-app) 검증 패턴 재사용 |
| 사양 원본 | 프로토타입 `ticket-app/`의 화면·상태 흐름·문구를 그대로 이식 (데모 장치만 제거) |
| 1차 오픈 제외 | PG 결제·좌석 지정·양도·가상계좌 (확장 경로는 [CEB-TKT-001-A] §6.2) |

### 1.1 프로토타입 대비 달라지는 것

| 구분 | 프로토타입 (`ticket-app/`) | 실서비스 예매 웹 |
| --- | --- | --- |
| 상태 저장 | 브라우저 로컬 저장소(`localStorage`, 단일 브라우저 데모) | Supabase Postgres (서버 단일 원본) |
| 검증 위치 | 클라이언트 스토어 함수 | **서버** (RLS + Postgres 함수 + API Route) — 재고 선점·한도·상태 전이 전부 서버 판정 |
| 본인확인 | 모의 간편인증 | 간편인증 사업자 실연동 (대행사 경유) — DI 실값 수신 |
| 로그인 | 데모 사용자 전환 | CELEBUS 계정 연계 (§3) |
| 시간 | 데모 시간 이동 | 서버 시각 (KST 기준 계산) |
| 데모 장치 | 모의 입금 프리셋·데모 초기화 | 제거. 대신 관리자 수기 입금 등록 화면 유지 (§6 B2) |

---

## 2. 시스템 아키텍처

```text
CELEBUS 앱 (회원 로그인 상태)
   │  예매 배너/메뉴 → 예매 웹 진입 (인증 연계 §3)
   ▼
예매 웹 (Next.js, Vercel)
   ├─ /            공연 목록·상세 (A1·A2)
   ├─ /verify      간편인증 (A3) ──────────► 간편인증 대행사 (카카오·토스·네이버 3종)
   ├─ /checkout    예매 신청·입금 안내 (A4)
   ├─ /orders      주문 내역 (A5)
   │               (내 티켓 메뉴 없음 — 지급 확인은 예매내역 4단계 타임라인. §5 역할 분담)
   ├─ /report      암표 신고 (A7)
   └─ /admin/**    관리자 영역 (B1~B7) — 별도 관리자 인증
   │
   ▼
Supabase (단일 프로젝트, dev/prod 분리)
   ├─ Postgres: 도메인 테이블(§4) + 상태 전이 함수(§5) + RLS(§7)
   ├─ Auth: 회원·관리자 세션
   └─ (스토리지: 신고 증빙 이미지 — 2차)
   │
   ▼ 외부
   ├─ 간편인증 대행사 (본인확인 — DI/실명 수신)
   ├─ 은행 입금 내역 (운영자 수기 확인 — MVP는 자동 연동 없음)
   └─ 알림 채널 (§8.3 — 결정 필요)
```

- **서버 신뢰 원칙**: 재고 잔여·1인 한도·상태 전이·티켓 코드 검증은 전부 서버(Postgres 함수/API Route)에서 판정한다. 클라이언트 값은 표시용.
- **관리자 영역 동거**: 같은 Next.js 앱의 `/admin` 라우트 그룹. 관리자 인증(§3.3)을 통과한 세션에만 렌더·API 허용.

### 2.1 기존 위성 앱 패턴 재사용 (사내 검증 코드 기준)

| 영역 | 재사용 원천 | 적용 |
| --- | --- | --- |
| 코드베이스 | 프로토타입 `ticket-app/` | **새 폴더를 만들지 않고 `ticket-app/`을 실서비스로 진화**시킨다 (데모 장치 제거 + 서버 계층 도입). 화면·상태 흐름은 이미 검증 완료 |
| CELEBUS 계정 연계 | `game-app/src/lib/auth-api.ts`·`celebus-sso.ts`·`anon-identity.ts` + `src/app/api/auth/sso/route.ts` + `SsoGate` 컴포넌트 | 4파일 세트 이식 (§3.1). 미로그인 게이트·오프라인/브리지 상태 구분 포함 |
| 서버 공통 유틸 | `game-app/src/lib/origin.ts`(동일 출처 검증)·`ratelimit.ts`(IP 스로틀)·`hash.ts` | 그대로 이식 |
| DB 접근 계층 | `game-app/src/lib/db-admin.ts`(service_role, 서버 전용)·`db-anon.ts`·`supabase-browser.ts` | 3종 클라이언트 패턴 동일 적용 |
| 서버 로직 구조 | game-app: **API Route(검증·신원·스로틀) → `SECURITY DEFINER` RPC(원자적 상태 전이)** 2층. Edge Function 선례 없음 | 동일 2층 채택. ⚠️ live-app식 "브라우저 anon 직접 RPC + 개방 정책"은 데모 전용 — 예매 웹 사용 금지 |
| 원자적 재고/차감 | `live_spend()` — 단일 `UPDATE … WHERE 잔여 조건` 문으로 검사+차감 동시 처리, PK 제약으로 멱등성 | §5 `create_order` 선점·`check_in_ticket` 사용 처리에 동일 패턴 |
| 관리자 인증 | `game-app/src/lib/admin-auth.ts` — `ADMIN_KEY` 단일 키 + HMAC 서명 쿠키(12시간) + fail-closed | §3.3 |
| 환경 변수 명명 | `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`·`SUPABASE_SERVICE_ROLE_KEY`·`HASH_SALT`·`ADMIN_KEY`·`SSO_DEV_MOCK` | 전 위성 앱 통일 규약 준수 |

---

## 3. 인증·회원 연계

### 3.1 CELEBUS 계정 연계 (로그인)

기존 위성 앱 공통 패턴(game-app·sketch-app 검증 완료)을 이식한다:

1. 브라우저가 **본앱 API를 직접 호출** — `GET https://api.client.celebus.xyz/v1/private/users/me` (`credentials: "include"`, 본앱 로그인 쿠키 동승). `401` = 미로그인 확정 → 진입 게이트에서 본앱 이동 안내.
2. 획득한 신원(`userId`·`username`·`profileImageUrl`)을 예매 웹 서버 `POST /api/auth/sso`로 전달 → 회원 upsert + **HMAC 서명 세션 쿠키** 발급 (`httpOnly`·1년).
3. `HASH_SALT` 결정론 해시로 회원 식별자 산출 — 타 위성 앱과 솔트를 공유하면 동일 유저 식별자가 되나, **예매 웹은 실명·결제 데이터를 다루므로 전용 솔트 분리**를 원칙으로 한다 (타 앱과 신원 교차 불필요).
4. 로컬 개발: `SSO_DEV_MOCK` (운영 빌드 완전 비활성) — 기존 규약 그대로.

> 🔴 **선결 과제 — 서버 재검증 부재**: 본앱 인증 쿠키가 `api.client.celebus.xyz` 전용이라 **위성 서버가 클라이언트가 전달한 신원을 재검증할 수 없다** (2026-07-24 본앱 개발팀 아키텍처 결정, game-app 코드에 경고 주석 존재). 게임 점수 수준에서는 수용됐지만, **실명 본인확인·수십만 원 결제·실물 입장권이 걸린 예매 웹에서는 신원 위조 = 타인 티켓 탈취 경로**가 된다. 대응:
> ① (권장) 본앱 개발팀에 **서버 간 신원 검증 API**(토큰 → 회원 확인) 제공을 요청 — W1 협의 필수 (§10 #1)
> ② 검증 API 확보 전 임시 완화: 예매 웹의 실질 신원 기준을 SSO가 아닌 **간편인증(DI)** 에 둔다 — 주문·티켓·입금 매칭이 전부 본인확인 실명에 묶여 있어, SSO 위조만으로는 티켓 지급·입장이 불가능한 구조(입금자 실명 매칭 + 현장 확인)임을 명시적 방어선으로 삼는다. 단 타인 계정의 주문 열람 위험은 남으므로 검증 API 확보 전까지 주문 상세 노출 정보를 최소화(마스킹)한다.

- 예매 웹 회원 행은 최초 진입 시 지연 생성. 자체 회원가입 없음.

### 3.2 본인확인 (간편인증)

- 화면 순서·UX는 [CEB-TKT-001-A] v1.2 §4.3 확정안: **수단 선택 → 정보 입력 → 인증 요청 → 앱 승인 → [인증 완료]**.
- **유력 연동 후보: NHN KCP 본인확인 V2** (developer.kcp.co.kr/guide/cert — 2026.08.31 검토):
  - 플로우: ① 가맹점 서버가 요청 데이터 암호화(`encryptJson`) 후 **거래등록** → 등록 키 수신 ② 인증창 호출 — PC 팝업 / 모바일 페이지 전환 ③ 인증 완료 시 지정 반환 URL로 콜백 ④ **가맹점 서버가 결과 조회 API 호출** → 암호문 복호화(`decryptJson`)로 결과 확보
  - 반환 필드: 이름·생년월일·휴대폰 + **CI/DI 반환 확인됨** (+성별·내외국인·통신사)
  - 위변조 방지: 가맹점 암호화 키 기반 — 결과를 클라이언트 콜백이 아닌 **서버 조회로 재확인**하는 구조라 §3.1의 "서버 검증" 원칙과 부합
  - 키 발급: KCP 가맹점 관리자(테스트 키 사전 제공 → 상용 키 발급 후 교체) — 심사·계약 리드타임 영업 확인 필요
  - ⚠️ 확인 필요: 이 상품이 커버하는 인증 수단 범위 — 휴대폰 본인확인(PASS·문자) 중심인지, 확정 수단 3종(카카오·토스·네이버)을 제공하는지 영업 문의. 부족 시 통합인증 상품 병행 검토
- 어댑터 경계: `본인확인 어댑터`(거래등록 → 창 호출 파라미터 생성 → 콜백 수신 → 결과 조회·복호화)를 인터페이스로 분리 — W1 모의 구현 ↔ W2 KCP(또는 타 대행사) 실구현 교체 지점. 대행사가 바뀌어도 `/api/verify` 이후의 DI 처리 경로는 불변.
- 서버 처리: 대행사 결과 콜백을 **서버에서 검증**(위·변조 방지) → 실명·생년월일·휴대폰·DI 수신 → `identity_verifications` 저장. **DI 유니크 제약**으로 중복 계정 차단 — 위반 시 409 응답, 클라이언트는 차단 화면.
- DI·전화번호는 저장 시 암호화(§7.2). 주민등록번호 비저장.
- 확장(2차): 사업자 사전 정보 전달 방식 지원 시 재인증 입력 생략.

### 3.3 관리자 인증

- **사내 선례(`game-app` `admin-auth.ts`) 채택**: `ADMIN_KEY` 단일 비밀키 로그인(타이밍 세이프 비교) → HMAC 서명 쿠키(`httpOnly`, 12시간). 키 미설정 환경은 전면 차단(fail-closed). 로그인 라우트에 동일 출처 검증 + IP 스로틀.
- 보완(예매 웹 특수성 — 환불·티켓 지급이 걸림): ① 관리자 액션 시 **처리자 이름을 세션에 등록**(로그인 후 1회 입력)해 `admin_logs`에 기록 — 단일 키의 감사 추적 약점 보완 ② 2차에 계정제(Supabase Auth + 역할) 전환 여지를 로그 스키마에 남김.
- `/admin/**` 화면·관리자 API 전부 미들웨어에서 서명 쿠키 검증.

---

## 4. 데이터 모델 (Postgres)

프로토타입 `ticket-app/src/lib/types.ts` 도메인을 테이블로 이식한다. 식별자는 `snake_case`, 공용 Supabase 편입 시 전 테이블 `ticket_` 접두어 (§8.4).

```text
members                 CELEBUS 회원 연계 (celebus_member_id UNIQUE, nickname, created_at)
identity_verifications  본인확인 (member_id UNIQUE, real_name, birth, phone_enc, di_hash UNIQUE, provider, verified_at)
concerts                공연 (title, artist, venue, price_krw, max_per_user=4, seat_type, status,
                         refund_policy, notice, sales_start_at, sales_end_at)
concert_sessions        회차 (concert_id, name, start_at, entry_open_minutes_before=60)
session_pools           재고 4분류 (session_id, pool_type: PAID_SALE|CELEBUS_WINNER|IX_INVITATION|OPERATION_HOLD,
                         allocated, reserved, issued — UNIQUE(session_id, pool_type))
orders                  주문 (order_no, member_id, session_id, qty, amount_krw,
                         status: AWAITING_DEPOSIT|DEPOSIT_REPORTED|ON_HOLD|DEPOSIT_CONFIRMED|PAID|EXPIRED|CANCEL_REQUESTED|REFUNDED,
                         deposit_reported_at, report_rejected_at (입금확인 요청·미입금 반려 시각),
                         deposit_deadline, depositor_name_rule, wants_cash_receipt, cash_receipt_phone_enc,
                         hold_reason, deposit_confirmed_at, cancel_requested_at, refunded_at)
tickets                 티켓 (code UNIQUE, order_id NULL 허용(무상 발급), member_id, session_id, pool_type,
                         status: VALID|USED|REVOKED, issued_at, used_at)
deposits                입금 건 (depositor_name, amount_krw, deposited_at,
                         status: UNMATCHED|AUTO_MATCHED|CONFIRMED|HELD|REFUND_TARGET|REFUNDED,
                         matched_order_id, memo)
ticket_reports          신고 (target_type, reason, detail, evidence_url, source, deadline_at(+10h),
                         status: RECEIVED|BLOCKED|SUBMITTED|CLOSED)
report_actions          신고 조치 이력 (report_id, action_type, acted_at, admin_id)
admin_users             관리자 (auth_user_id, role, name)
admin_logs              관리자 활동 로그 (admin_id, action, detail, created_at)
```

핵심 제약:
- `identity_verifications.di_hash` **UNIQUE** — 중복 가입 차단의 DB 층 보장 (DI 원문 대신 해시+암호문 이중 보관, §7.2)
- `session_pools` 수량 불변식: `reserved >= 0 AND issued >= 0 AND reserved + issued <= allocated` (CHECK)
- `orders.order_no` 일자별 채번 (`T{YYMMDD}-{seq}`) — 시퀀스 테이블 또는 Postgres 시퀀스
- 1인 한도: 서버 함수에서 `orders`(유효 상태) + `tickets`(VALID·USED) 합산 검증 — 프로토 `countHeldQty` 로직 이식

---

## 5. 핵심 서버 로직

상태 전이는 전부 **Postgres 함수(RPC)** 로 구현해 원자성을 보장한다. 프로토 스토어 액션과 1:1 대응.

| 함수 | 프로토 대응 | 핵심 처리 |
| --- | --- | --- |
| `create_order(session, qty, …)` | `createOrder` | 한도·판매기간 검증 → **`UPDATE session_pools SET reserved = reserved + qty WHERE … AND allocated - reserved - issued >= qty`** 원자적 선점(0행이면 매진 실패) → 주문 생성, 마감=주문일 당일 23:59:59 KST |
| `expire_overdue_orders()` | `expireOverdueOrders` | 마감 지난 `AWAITING_DEPOSIT`·`ON_HOLD` → `EXPIRED` + reserved 원복. `DEPOSIT_CONFIRMED`·**`DEPOSIT_REPORTED`(입금확인 요청 접수 건) 제외** — 요청 건은 운영자가 확인 또는 미입금 반려로 수동 종결 |
| `report_deposit(order)` / `cancel_deposit_report(order)` | 동일 | **회원 액션** — 입금 대기 → "입금 확인중"(입금했어요 신호) 전환·취소. 게이트가 아닌 신호: 요청 없이도 운영자 입금 매칭으로 입금 확인 직행 가능 |
| `reject_deposit_report(order)` | `rejectDepositReport` | 운영자 액션 — 미입금 반려: 입금 확인중 → 입금 대기 복귀 + 반려 시각 기록, 회원 화면에 재요청 안내 |
| `reject_hold(order)` | `rejectHold` | **운영자 액션 — 보류 반려**: 보류 입금을 예매와 대조하지 않기로 확정 → 주문 입금 대기 복귀(마감이 지났으면 당일 자정으로 연장) + 입금 건 반환 대상 지정 + 회원 안내(반려 시각 기록). 회원 등록 환불 계좌로 환불 처리 |
| `submit_hold_info(order, …)` | `submitHoldInfo` | **회원 액션 — 보류 해소 정보 제출**: 실제 입금자명(입금자명 불일치)·환불 계좌(오입금, 계좌번호는 암호화 저장·화면 마스킹)를 사유별로 제출. 운영자 보류 큐에 대조 힌트로 표시 |
| `register_deposit(...)` + 자동 대조 | `addDeposit` | 관리자 수기 입금 등록 → 금액 완전 일치 + 실명(또는 실명+주문번호 끝4자리) 매칭 → `AUTO_MATCHED`/`HELD`/`UNMATCHED`/`REFUND_TARGET` 분류 |
| `confirm_deposit(deposit)` | `confirmDeposit` | 운영자 액션 ① — deposit `CONFIRMED`, 주문 `DEPOSIT_CONFIRMED`(+확정 시각). **티켓 미발급·선점 유지** |
| `issue_order_tickets(order)` | `issueOrderTickets` | 운영자 액션 ② — 티켓 qty매 생성, reserved→issued 전환, 주문 `PAID`. 중복 지급 차단 |
| `request_cancel(order)` / `approve_refund(order)` | 동일 | 24시간 SLA. 발급 전 취소=선점 원복, 발급 후=티켓 `REVOKED`+issued 원복 |
| `issue_comp_tickets(...)` / `reallocate_pool(...)` | 동일 | 당첨자·초대·운영 예비 무상 발급(사유 필수), 분류 간 재배정 — 잔여 검증 + 로그 |
| `check_in_ticket(code)` | `checkInTicket` | `VALID`→`USED` 원자 갱신. 이미 `USED`→중복 경고 응답, `REVOKED`/미존재 구분 응답 |
| `submit_report(...)` / `act_on_report(...)` | 동일 | 접수 시 `deadline_at = now() + 10시간`. 조치 이력 append |

**만료 처리 구동 — lazy 우선 (사내 관행)**: 리포 전체에 크론 선례가 없고(vercel cron·`pg_cron` 0건), 기존 앱들은 "조회 시점 파생 표시 + 관리자 확정 액션" 패턴을 쓴다(game-app 경품·주간 보상 코드에 명시). 예매 웹도 동일하게:
- ① **잔여 수량 계산이 만료 선점을 제외**하도록 뷰/쿼리를 설계 — 오버셀 방지는 크론 없이 성립 (프로토의 "암묵적 상태" 방식과 동일)
- ② 앱 주문 조회·관리자 화면 진입 API가 `expire_overdue_orders()`를 호출해 지나간 건을 정리 (요청 시점 정리)
- ③ 트래픽이 없어 정리가 지연되어도 ①로 정합성은 유지. 필요해지면 `pg_cron` 도입(사내 첫 사례가 됨 — 선택 사항)

**발권·체크인 역할 분담 (2026.08.31 확정)**: **발권(QR 표시)과 현장 체크인은 CELEBUS 본 앱이 담당**하고, 예매 웹은 **입금 확인과 티켓 지급 여부 처리까지만** 맡는다.
- 예매 웹: 회원 탭은 홈·예매내역·신고 3개 — **"내 티켓" 메뉴 없음** (2026.09.01 개편). 지급 확인은 예매내역의 **4단계 진행 상태(예매 접수 → 입금 대기 → 입금 확인 → 티켓 지급)**로 제공. 무상 지급 티켓(래플 당첨·초대)의 확인·사용도 CELEBUS 앱으로 일원화 — 예매 웹에는 별도 확인 화면 없음 (2026.09.01 결정). 관리자 체크인 화면 없음
- **티켓 지급 시점**: 입금 확인으로 예매가 확정되고, 티켓 지급 처리는 **공연 당일 CELEBUS 앱 발권 일정에 맞춰** 실행하는 것이 운영 원칙 (회원 안내 문구·관리자 지급 대기 탭에 명시)
- DB 보존: 티켓 `code`(서버 난수)·`check_in_ticket` RPC(원자적 사용 처리·중복 판정)는 유지 — 본 앱이 발권·체크인 시 사용할 **서버 간 티켓 연동 API**(회원 티켓 조회·체크인 처리)의 기반. 연동 스펙은 본 앱 개발팀 협의 항목 (§10 #7)

**입금 마감 시각**: `SAME_DAY`(당일 자정, 원안) 설정값 — 운영 설정 테이블(`app_settings`)로 두고 익일 자정 전환 가능하게.

---

## 6. 화면 구성 (프로토 이식표)

프로토타입이 화면 사양 SSOT — 레이아웃·문구·상태 뱃지·카운트다운을 그대로 이식하고 데이터 소스만 교체한다.

| 실서비스 라우트 | 프로토 원본 | 이식 시 변경점 |
| --- | --- | --- |
| `/` `/concert/[id]` | A1·A2 | 잔여 수량 = 서버 계산값. 판매 기간 서버 판정 |
| `/verify` | A3 (v1.2 순서) | 모의 인증 → 대행사 실연동. 차단 화면 동일 |
| `/checkout/[sessionId]` | A4 | 주문 생성 RPC. 마감 카운트다운은 서버 마감시각 기준 |
| `/orders` `/orders/[id]` | A5 | 지급 대기 상태 포함 전체 이식 |
| (내 티켓 화면 없음) | — | A6 폐지 (2026.09.01) — 지급 확인은 `/orders` 타임라인으로 통합 (무상 지급분 확인은 CELEBUS 앱). `/app/tickets` 접근은 예매내역으로 이동. 티켓 조회 API는 본 앱 연동·섹션 데이터용으로 유지 |
| `/report` | A7 | 증빙 URL 입력(파일 업로드는 2차) |
| `/admin` 대시보드 | BO 대시보드 | 동일 |
| `/admin/concerts` | B1 | 재배정·무상 발급 포함 |
| `/admin/deposits` | B2 (4탭) | 모의 입금 프리셋 제거 → **수기 입금 등록 폼**으로 대체 (은행 내역 보고 입력) |
| `/admin/refunds` `/admin/reports` `/admin/logs` | B3·B5·로그 | SLA 타이머 동일. 발권·체크인 화면(B4)은 두지 않음 — CELEBUS 본 앱 담당 (§5 역할 분담). 지급 현황 집계는 공연 상세에 유지 |

---

## 7. 보안·법적 요건 구현

### 7.1 접근 제어
- RLS: 회원은 자기 `orders`·`tickets`·`identity_verifications`만 조회. 쓰기는 전부 RPC 경유(직접 INSERT/UPDATE 차단). 관리자 테이블·타 회원 데이터는 관리자 역할만.
- 상태 전이 RPC는 `SECURITY DEFINER` + 역할 검사 내장. 관리자 API는 미들웨어 이중 검증.

### 7.2 개인정보
- DI: 조회용 해시(UNIQUE) + 원문 암호화 보관(제출 대응). 전화번호·현금영수증 번호 암호화 컬럼.
- 수집 고지·처리방침 문구는 법무 확정본 사용 ([CEB-TKT-001-A] §8.2). 탈퇴·기간 만료 파기 배치는 법무 확정 후 구현.

### 7.3 법적 요건 대응 매핑
- 부정거래 방지 조치 의무: DI 유니크·1인 4매 한도·서버 검증·거래 로그 보관 — 구현 근거를 운영 문서에 기록
- 신고 10시간 SLA: `deadline_at` + 관리자 알림(§8.3) + 조치 시각 감사 로그
- 현금영수증: MVP는 **국세청 발급 시스템 수동 발행** + `/admin`에 발행 대상 목록(주문번호·금액·전화번호) 제공. API 자동화는 2차
- 🔴 에스크로/피해보상보험: 법무 결론 대기 — 구현 착수와 병행하되 **오픈 전 종결 필수** ([CEB-TKT-001-A] §8.2 #1)

---

## 8. 외부 연동·운영

### 8.1 간편인증 (오픈 전 필수)
**1순위: NHN KCP 본인확인 V2** (§3.2 — DI 반환·서버 조회 검증 구조 확인 완료, 테스트 키 사전 제공으로 개발 선행 가능). 병행 견적: 포트원 등 대행사 통합인증(4개 수단 일괄). 공통 확인 항목: 간편인증 4종 커버 범위·DI 반환·심사 리드타임. 계약 지연 시 폴백: 휴대폰 본인확인 단일 수단 선오픈 후 확대.

### 8.2 입금 확인 (MVP 수동)
은행 알림/인터넷뱅킹을 운영자가 확인 → `/admin/deposits` 수기 등록 → 자동 대조. 오픈 주간 운영 당번·확인 주기(권장 1시간 이내) 운영 수칙 문서화. 가상계좌 전환 시 등록 입력만 자동화로 교체(구조 불변).

### 8.3 알림 (결정 필요)
지급 완료·자동 취소·환불 완료 시 회원 통지 채널: ⓐ CELEBUS 앱 푸시(본 앱 연동 필요) ⓑ 카카오 알림톡(발신프로필 심사 ~1주) ⓒ SMS. **MVP 권장: 알림톡 또는 SMS** (본 앱 개발 의존 제거). → §10 결정 필요

### 8.4 배포·데이터베이스 운영

- **Supabase**: 위성 앱 공용 프로젝트(dev: `celeb-match-dev` 서울 / prod: Pro 플랜, 일일 백업 7일)에 **`ticket_` 테이블 접두어**로 편입 — 기존 `game_`·`stage_`·`live_` 관행과 동일. 마이그레이션은 `ticket-app/supabase/migrations/` + **dev 선검증 후 prod push** 절대 규칙(`db-push-dev.sh` 패턴 이식, 2026-07-28 확립 규약).
  - ⚠️ 검토 항목: 실명·DI를 다루므로 공용 프로젝트 편입 대신 **전용 Supabase 프로젝트 분리**도 후보 — 백업·접근권한 격리 이점 vs 운영 프로젝트 증가 비용. §10 #6
- **Vercel**: 신규 프로젝트 생성 + Root Directory `ticket-app` 설정. 🚨 **배포는 반드시 리포 루트에서 `VERCEL_ORG_ID`·`VERCEL_PROJECT_ID` 명시 실행** — 루트 `.vercel`이 celebus-admin 프로젝트에 링크되어 있어 미지정 시 타 프로젝트를 덮어쓴 사고 이력 있음(2026-08-19, game-app 문서화됨). `ticket-app/scripts/deploy.sh`로 명령을 고정해 재발 차단.
- 도메인: 예매 전용 서브도메인(§10 #3) + https 강제.
- 모니터링: Vercel 로그 + 관리자 대시보드 큐 카운트. 오픈 주간은 입금 확인 당번이 겸임.

---

## 9. 개발 일정 (역산)

[CEB-TKT-001-A] §7 로드맵과 동기화. 오늘(8/31) 기준 판매 오픈까지 약 2.5~3주.

| 주차 | 개발 | 병행 |
| --- | --- | --- |
| W1 (9/1~9/7) | 스키마·RPC·RLS 구축 + 프로토 화면 이식(회원 영역) + CELEBUS 계정 연계 | 간편인증 계약·알림 채널 계약, 법무(에스크로) 확인 |
| W2 (9/8~9/14) | `/admin` 이식 + 간편인증 실연동 + QR 서명 토큰 + 만료 크론 | 운영 수칙(입금 확인 당번·신고 온콜), 약관·고지 문구 반영 |
| W3 (9/15~9/21) | 통합 QA(코너케이스 전수) + dev→prod 마이그레이션 + 도메인·모니터링 | 공연·회차 등록, 입금 대사 리허설 → **판매 오픈** |
| 10월 초 | 당첨자·초대 지급, 체크인 리허설 | 10/15~16 쇼케이스 현장 운영 |

리스크: 간편인증 계약 리드타임(폴백 §8.1), 에스크로 법무 결론, CELEBUS 계정 연계 방식 협의(§3.1).

---

## 10. 결정 필요 사항

1. 🔴 **본앱 서버 간 신원 검증 API 제공 여부** — 본앱 개발팀 협의 (§3.1 선결 과제). 미제공 시 §3.1 ②의 완화 구조로 오픈하되 리스크 문서화
2. 알림 채널 (앱 푸시 / 알림톡 / SMS) — §8.3
3. 예매 웹 도메인 (예: ticket.celebus.xyz)
4. 입금 수납 계좌·예금주 표기 확정
5. (기존 잔여) 입금 마감 당일 vs 익일 자정, 취소 수수료, 신분증 대조, 온콜 — [CEB-TKT-001-A] §8.1
6. Supabase 공용 프로젝트 편입(`ticket_` 접두어) vs 전용 프로젝트 분리 — 실명·DI 격리 관점 (§8.4)
7. **본 앱 티켓 연동 API 스펙** — CELEBUS 앱이 발권(QR)·체크인을 담당하기로 확정(§5)됨에 따라, 본 앱이 회원 티켓을 조회하고 체크인을 처리할 서버 간 API(인증 방식·엔드포인트) 협의 필요 (#1 신원 검증 API 협의와 함께 진행)

---

## 11. 변경 이력

| 버전 | 일자 | 작성자 | 내용 |
| --- | --- | --- | --- |
| v1.0 | 2026.08.31 | @Nill Yoo | 최초 작성 — 별도 예매 웹(Next.js+Supabase+Vercel, 관리자 영역 동거) 구현 설계: 아키텍처·데이터 모델·서버 로직·화면 이식표·보안·연동·일정 |
| v1.1 | 2026.08.31 | @Nill Yoo | 본인확인 연동 후보 구체화 (§3.2·§8.1) — NHN KCP 본인확인 V2 검토 반영: 거래등록→인증창→콜백→서버 결과 조회 플로우, CI/DI 반환 확인, 테스트 키로 개발 선행 가능. 어댑터 경계 정의. 간편인증 4종 커버 범위는 영업 확인 항목 |
| v1.2 | 2026.08.31 | @Nill Yoo | 발권·체크인 역할 분담 확정 (§2·§5·§6) — 발권(QR)·현장 체크인은 CELEBUS 본 앱 담당, 예매 웹은 입금 확인·티켓 지급 처리까지. 예매 웹의 QR·체크인 화면 제거, 회원 내 티켓은 지급 상태 확인 전용. 티켓 코드·사용 처리 규칙은 본 앱 연동 기반으로 보존, 서버 간 연동 스펙을 결정 필요 #7로 등록 |
| v1.3 | 2026.09.01 | @Nill Yoo | 본인확인 수단 3종 확정 반영 — 카카오·토스·네이버 (PASS 제외, §2·§3.2). 현금영수증 기본값 = 본인확인 휴대폰 번호를 서버에서 자동 사용 (전화번호 원문은 클라이언트에 내려보내지 않고 마스킹 표시, 다른 번호 직접 입력 옵션 병행) |
| v1.7 | 2026.09.01 | @Nill Yoo | 확인 보류 해소 플로우 — 보류 사유별로 회원의 다음 행동을 다르게 안내: ① 입금자명 불일치 = 실제 입금자명 알려주기(운영자가 그 이름으로 대조) ② 금액 불일치(오입금) = 환불 계좌 등록(암호화 저장·마스킹 표시) + 올바른 금액 재송금 안내 ③ 복합·기타 = 두 블록 + 고객센터. 재송금만 반복 유도하던 기존 구성 폐기. 회원 제출 정보는 운영자 보류 탭에 노출. **입금 확인중 상태의 예매 취소 차단**(화면+서버) — 취소하려면 먼저 입금확인 요청 취소로 입금 대기 복귀. **운영자 보류 반려 액션 신설** — 대조 불가 주문을 입금 대기로 되돌리고 입금 건을 반환 대상으로 지정 |
| v1.6 | 2026.09.01 | @Nill Yoo | 예매 진행 상태 흐름 개편 — ① 회원 표기 정정: 입금 대기(예매 직후) → 입금 확인중(회원 [입금확인 요청] 클릭) → 입금 확인(운영자) → 티켓 지급(운영자). 기존 "입금 확인중"(예매 직후)·"지급 대기"·"지급 완료" 표기의 주체 혼동 해소 ② 회원 [입금확인 요청]·[요청 취소] 신설 — 요청은 게이트가 아닌 신호(운영자 직행 확인 허용) ③ 입금 확인중 상태는 자정 자동 만료에서 제외(운영자 확인·미입금 반려로 수동 종결) ④ 운영자 미입금 반려 액션 신설 ⑤ 예매내역 목록을 진행중(입금 대기·입금 확인중·확인 보류·입금 확인)/완료(티켓 지급)/취소(취소 요청·환불·만료) 3탭으로 분할 — 기본 탭 진행중, 탭별 건수·빈 상태 문구 ⑥ 티켓 지급은 공연 당일 처리되므로 지급 후 취소·환불 요청 불가 — 지급 완료 화면에서 취소 버튼 제거·불가 안내, 진행 상태 티켓 지급 단계 안내문에 명시 |
| v1.5 | 2026.09.01 | @Nill Yoo | "지급받은 티켓" 섹션 제거 — 무상 지급 티켓(래플 당첨·초대)의 확인·사용을 CELEBUS 앱으로 일원화, 예매 웹 회원 화면은 본인 예매 건의 진행 상태 확인만 담당. 티켓 조회 경로는 본 앱 연동 기반으로 유지 |
| v1.4 | 2026.09.01 | @Nill Yoo | 회원 IA 개편 (§2·§5·§6) — ① "내 티켓" 메뉴 폐지: 탭 3개(홈·예매내역·신고), 지급 확인은 예매내역 4단계 진행 상태(예매 접수·입금 대기·입금 확인·티켓 지급)로 통합, 무상 지급 티켓은 예매내역 하단 "지급받은 티켓" 섹션 ② 티켓 지급 처리는 공연 당일 CELEBUS 앱 발권 일정에 맞춰 실행하는 운영 원칙 명문화 ③ 회원 화면 용어 "주문"→"예매" 통일. 티켓 조회 경로는 본 앱 연동 기반으로 보존 |
