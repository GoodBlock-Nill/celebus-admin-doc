# 주간 랭킹 가챠 보상 (Weekly Rank Gacha) 기획안

- **작성일**: 2026-08-11 · **개정**: 2026-08-12 (v2)
- **상태**: Phase 3 구현 완료 (2026-08-12) — Phase 4 (실물 박스 가챠) 대기
- **구현 이력**:
  - 2026-08-12 Phase 1: 관리자 지급표 전용 폼 (`AdminRewards.tsx`) + `game-config` rewards 확장(weeklyTickets·ticketPrice 기본값) + `/api/admin/config` rewards 스키마 검증(zod, 400 `bad_rewards`) + `AdminConfig` 저장 응답 에러 표시. 브라우저 실측 검증 완료 (겹침 에러·서버 400·저장·재로드 유지·기본값 복귀)
  - 2026-08-12 Phase 2: 이용권 경제 — 마이그레이션 037(`game_gacha_wallet`·`game_gacha_ticket_ledger`·`game_week_tickets` + RPC `game_claim_week_tickets`·`game_gacha_buy_ticket`) dev 선검증 후 프로드 적용. `/api/rewards/weekly` CP+이용권 동시 claim 병합(한쪽 실패 시 500 → 재시도, `!res.ok` 시 seen 미기록 버그 수정), `/api/gacha/buy`·`/api/gacha/status` 신설, `WeeklyResultModal` 이용권 표시, 상점 이용권 품목(500 CP). dev DB RPC 단위검증(1위 10장·중복 차단·잔액 부족) + 브라우저 E2E(주간 모달 표시·상점 구매) 통과
  - 2026-08-12 Phase 3: 재화 가챠 — 마이그레이션 038·038-1(`game_gacha_event`·`game_gacha_pool_item`·`game_gacha_draw` + 공개 뷰 + RPC `game_gacha_draw_exec`: 가중치 추첨·꽝 없음·무상 우선 차감·10연 보너스 유형 승계) dev 선검증 후 프로드 적용. `/api/gacha/draw`·`/api/admin/gacha` 신설, `/api/gacha/status`에 이벤트·풀 공시 포함. 유저 화면 `GachaScreen`(부유→셔플→등급 글로우→CSS 3D 플립, 10연 약→강 순차 공개+스킵, reduced-motion 대응) + `GachaOddsModal`(확률 공시) + 홈 내비 [가챠]. 관리자 [가챠] 탭(`AdminGacha`: 이벤트 CRUD·풀 편집·확률 미리보기, 풀 행은 뽑기 이력 FK 보존 위해 삭제 불가 시 아카이브). dev DB RPC 단위검증(무상/유상 차감·보너스 유형·거부 케이스) + 브라우저 E2E(이벤트 생성→1회/10연 뽑기→원장 정합) 통과
- **결정 이력**:
  - 2026-08-11 (v1): ① 기존 주간 CP 자동 보상(`rewards.weeklyTop`) 유지, 상품 보상은 별도 레이어 ② 당첨자 앱 내 수령 정보 입력 ③ 관리자 설정 UI 중심
  - 2026-08-12 (v2): **직접 지급 모델 폐기 → 가챠 이용권 모델로 전환**. ④ 주간 랭킹 순위에 따라 가챠 이용권 차등 지급 (하위 순위 전원 포함) ⑤ 실물 가챠 = 무상 이용권 전용 / CP 구매 이용권 = 재화 가챠 전용 (사행성 분리) ⑥ 실물 가챠는 확률형이 아닌 **박스 가챠(재고 소진형)** ⑦ 카드 뽑기 UI, 출시 게임 수준 연출
  - 2026-08-12 (v2.1): ⑧ 유상 이용권 가격 **500 CP** ⑨ 콘서트 티켓은 **1인 최대 2매**까지만 당첨 가능 (아이템별 1인 상한) ⑩ **10연 뽑기 시 이용권 1장 보너스** ⑪ 콘서트 티켓 = **무료 공연 초대권** 개념 (유료 콘서트 티켓은 추후 별도 논의) ⑫ 첫 실물 이벤트 = **티켓 가챠 최우선** (포토카드는 추후)

---

## 배경

### 왜 직접 지급이 아니라 가챠인가 (v2 전환 사유)

v1은 "1~5위 = 콘서트 티켓" 식 직접 지급이었다. 그러나 랭킹 상위권은 고착되기 쉬워, 몇 주간 동일 유저가 실물 상품을 반복 수령할 확률이 높다. 이는 나머지 유저의 참여 동기를 죽인다 ("어차피 걔네가 가져감"). v2는 이를 다음 구조로 해결한다:

- **기대값은 순위 비례, 결과는 확률**: 순위가 높을수록 이용권을 많이 받아 유리하지만, 실물 당첨을 독점하지 못함
- **하위 순위 전원 지급**: 랭킹에 기록만 있으면 이용권 1장 — 참여 자체가 보상이 되어 롱테일 리텐션 강화. 기존 구조에서 TOP10 밖 유저는 아무것도 받지 못하던 갭을 메움
- **CP 소모처 신설**: CP로 이용권을 구매하는 경로를 열어 CP 인플레이션 억제 (단, 아래 사행성 분리 원칙 적용)

### 사행성 분리 원칙 (CRITICAL — 법률)

"대가를 지불하고, 우연에 의해, 재산상 이익(실물)을 얻는" 구조는 사행행위의 법적 정의와 일치한다. 현재 CP는 무료 획득 재화지만, **CP 충전에 실결제(CELB/IAP)가 후속 예정**(`src/app/api/account/charge/route.ts` 주석)이므로 다음 분리를 시스템 차원에서 강제한다:

| 이용권 종류 | 획득 경로 | 사용 가능 가챠 |
|---|---|---|
| **무상 이용권** | 주간 랭킹 보상 (무상 지급) | 실물 가챠 + 재화 가챠 |
| **유상 이용권** | CP로 구매 | **재화 가챠만** (실물 가챠 사용 불가) |

실물 경품은 순수하게 랭킹 성과에 대한 무상 보상으로만 접근 가능하다. 이 분리는 UI 안내가 아니라 **지갑·원장·뽑기 RPC 레벨에서 강제**한다.

### 설계 원칙 (v1 계승)

1. **additive-first**: 기존 테이블·RPC(`game_claim_week_reward` 등) 무변경, 신규 테이블만 추가
2. **개인정보 격리**: 실물 당첨자의 이름·연락처·주소는 별도 테이블, 파기 시 이력 무손상
3. **재고·확률 투명성**: 박스 가챠는 남은 재고 실시간 공개, 재화 가챠는 확률표 공시 (게임산업법 확률형 아이템 공시 의무 대응)

### 기존 시스템 요약 (변경하지 않음)

| 구성 | 현재 동작 |
|---|---|
| 랭킹 집계 | `game_scores` 온더플라이. KST 월요일 00:00 주 시작. level desc → score desc → created_at asc, 유저별 베스트 1건, `flagged` 제외. 모드 2개(daily/free) |
| CP 보상 | `rewards.weeklyTop` 기반 lazy claim (`game_claim_week_reward`) — **가챠와 완전 독립, 그대로 유지** |
| 관리자 | 탭 9개, `ADMIN_KEY` + HMAC 쿠키, `game_admin_log` 감사 로그 |

---

## 1. 시스템 개요

```
[주간 랭킹 (기존)]
     │ 주 종료 후, 유저 접속 시 lazy claim (CP 보상과 동일 패턴)
     ▼
[무상 이용권 지급]  1위=10장 · 2~5위=5장 · 6~10위=3장 · 11위~전원=1장 (운영자 설정)
     │                                    [CP 구매] → 유상 이용권
     ▼                                          │
┌─ 실물 가챠 (박스/재고 소진형) ─┐    ┌─ 재화 가챠 (확률형, 상시) ─┐
│  무상 이용권 전용               │    │  무상+유상 이용권            │
│  콘서트 티켓·사인 굿즈·포카     │    │  CP·하트·부스터 (향후 스킨)  │
│  운영자가 이벤트 단위로 개설     │    │  꽝 없음                     │
└───────────┬───────────────────┘    └──────────────────────────────┘
            │ 실물 등급 당첨 시
            ▼
[수령 정보 입력 → 운영자 발송 관리]  (v1 흐름 그대로 재사용)
```

---

## 2. 이용권 정책

### 2-1. 주간 지급표 (운영자 설정, 기본값)

| 순위 구간 | 무상 이용권 |
|---|---|
| 1위 | 10장 |
| 2~5위 | 5장 |
| 6~10위 | 3장 |
| 11위 ~ 랭킹 기록 보유자 전원 | 1장 |

- 설정 위치: `game_config`의 `rewards.weeklyTickets` — 구간 배열 `[{from,to,tickets}]` + `others`(구간 밖 전원 지급 수, 0이면 미지급). 관리자 전용 폼 제공 (§7-3)
- 검증 규칙: 구간 겹침 금지, `from <= to`, 정수 ≥ 0
- **모드별 각각 지급** (daily/free — 기존 CP 보상과 동일 구조). 두 모드 모두 기록이 있으면 각각 수령
- "전원"의 범위 = 해당 주차에 유효 기록(flagged 제외) 1건 이상인 유저

### 2-2. 지급 방식 — lazy claim (기존 CP 패턴 재사용)

- 유저가 다음 주 접속 시 신규 RPC `game_claim_week_tickets`가 지난주 순위 계산 → 무상 이용권 지급. `game_claim_week_reward`와 동일 골격 (주차+모드 PK 중복 차단, flagged 제외)
- 기존 `WeeklyResultModal`에 이용권 획득 행 추가 표시 ("+N장 가챠 이용권") — CP와 함께 한 모달에서 안내
- v1의 "운영자 수동 확정" 단계는 **폐지**: 이용권은 디지털 재화라 오지급 시 회수(revoke) 가능하므로 실물 직접 지급과 달리 사전 확정이 불필요. 부정 유저는 flagged 시점부터 지급 제외, 사후 발견 시 원장 기반 회수
- 소급 주의 (weeklyTop과 동일한 특성): 지급표는 수령 시점에 읽으므로 주 종료 후 변경하면 미수령 유저에게 변경값 적용. 디지털 재화라 허용하되 관리자 폼에 경고 문구 고정 노출

### 2-3. 유상 이용권 (CP 구매)

- 상점(기존 `game_buy_item` 흐름)에 "가챠 이용권" 품목 추가. 가격 **500 CP** (운영자 설정 가능)
- 유상 이용권은 **재화 가챠에만** 사용 가능. 실물 가챠 화면에서는 유상 보유분이 노출되지 않음
- 지갑 표기: "무상 N장 · 유상 M장" 구분 표시. 재화 가챠에서 사용 시 **무상 우선 소진**

---

## 3. 가챠 정책

### 3-1. 실물 가챠 — 박스 가챠 (재고 소진형)

확률형이 아닌 **박스 가챠**를 채택한다. 근거: 실물 상품은 재고가 유한(티켓 2매 등)한데 순수 확률제는 당첨자 0명 또는 예산 초과가 가능하고, 확률 공시·천장(pity) 설계가 복잡해진다. 박스 가챠는:

- 풀에 실물+재화 아이템을 **수량 고정**으로 넣고, 뽑힐 때마다 소진
- 1회 뽑기 = 남은 아이템 중 균등 확률 1개 (남은 수량 비례 — 수학적으로 완전 투명)
- 유저 화면에 "콘서트 티켓 1/2 남음 · 전체 잔여 132/500" 실시간 공개 → 확률 공시 자동 충족
- 운영자의 지출 상한이 풀 구성 시점에 확정됨 (당첨 수 예측 불확실성 제거)
- 천장 불필요 (박스가 비워질수록 실물 확률이 자연 상승)

**운영 단위**: 운영자가 "실물 가챠 이벤트"를 개설 (제목·기간·풀 구성). 주차와 1:1이 아니어도 됨 — 유저가 몇 주간 이용권을 모아 이벤트 기간에 뽑는 운영도 가능 (예: 콘서트 시즌 이벤트).

**풀 구성 예시**:

| 등급 | 아이템 | 수량 | 1인 상한 | 실물 여부 |
|---|---|---|---|---|
| S | V01D 콘서트 초대권 (무료 공연) | 10 | **2매** | O (현장 수령 — 주소 불요) |
| A | 멤버 사인 굿즈 | 5 | - | O (배송 — 주소 필요) |
| B | 한정 포토카드 세트 | 50 | - | O (배송) |
| C | 100 CP | 150 | - | X (즉시 지급) |
| D | 하트 1개 | 285 | - | X (즉시 지급) |

- **1인 당첨 상한 (per-user cap)**: 아이템별로 설정 가능. 콘서트 초대권은 **1인 최대 2매** — 상한에 도달한 유저의 뽑기에서는 해당 아이템이 추첨 대상에서 제외되고 잔여 풀에서 추첨된다 (초대권이 특정인에게 쏠리는 것 방지, 2매 = 동반 1인 관람 배려)
- 콘서트 티켓의 성격: **무료 공연 초대권** (경품이 아닌 무상 관람 초대 — 사행성·제세공과금 리스크 대폭 완화). 유료 콘서트 티켓을 거는 것은 법무 검토 포함 추후 별도 논의

- **꽝 없음**: 최하 등급도 재화 지급. 모든 뽑기가 보상
- 박스 소진 시 이벤트 자동 종료. 기간 만료 시 잔여 실물은 운영자 판단 (차기 이벤트 이월 등 — 시스템은 종료만 처리)
- 실물 등급 당첨 순간 → 실물 당첨 건 생성 → **v1의 수령 정보 입력·발송 관리 흐름 그대로 발동** (§5, §6)

### 3-2. 재화 가챠 — 확률형 (상시)

- 상시 운영, 무상+유상 이용권 모두 사용 가능
- 풀: CP(소·중·대)·하트·부스터 아이템, 향후 스킨 시스템 연동 (스킨 설계안은 별도 문서 — 구현 보류 상태)
- 등급별 **가중치 기반 확률**, 확률표 화면 공시 (게임산업법 대응). 꽝 없음
- 확률표는 운영자 설정 (§7-2), 변경 시 공시 화면 즉시 반영 + `game_admin_log` 기록

### 3-3. 뽑기 규칙 공통

| 항목 | 정책 |
|---|---|
| 1회 소모 | 이용권 1장 |
| 연속 뽑기 | 10연 뽑기 지원 (연출 스킵 옵션) — 이용권 10장 소모 + **보너스 이용권 1장 지급** |
| 10연 보너스 유형 | **소모한 이용권 유형을 따른다**: 10장 전량 무상이면 무상 1장, 유상이 1장이라도 포함되면 유상 1장. (유상→무상 전환을 허용하면 CP 구매분이 실물 가챠에 우회 접근하게 되어 사행성 분리가 무너짐 — 반드시 유지) |
| 원자성 | 뽑기 = 이용권 차감 + 재고 차감(박스) + 보상 지급 + 원장 기록이 단일 트랜잭션. 동시 뽑기 경합은 행 잠금으로 해결 |
| 회수 | 부정 유저 사후 판정 시: 재화 보상은 원장 기반 회수, 실물 당첨 건은 `revoked` 처리 (v1 규칙) |

---

## 4. 상태 머신

### 실물 가챠 이벤트

```
draft ──(공개)──> published ──(기간 만료 or 박스 소진)──> ended
  │                   │
  └──(취소)──────> canceled   ※ published 후 풀 구성 변경 금지 (§7-1), 취소 시 공지 권장
```

### 실물 당첨 건 (v1 계승 — 발생 시점만 "확정"→"뽑기 순간"으로 변경)

```
pending ──(유저 정보 입력)──> submitted ──(운영자 발송)──> shipped
   │                              │
   ├──(기한 만료)──> expired      └──(운영자 무효)──> revoked
   └──(운영자 무효)──> revoked
```

| 상태 | 전이 주체 | 비고 |
|---|---|---|
| `pending` | 뽑기 당첨 순간 자동 생성 | 수령 기한 = 당첨 + `claim_days`(이벤트별, 기본 7일). 카운트다운 노출 |
| `submitted` | 유저 | 기한 내 수정 재제출 허용 |
| `shipped` | 운영자 | `admin_memo`에 송장 등 기록 |
| `expired` | 서버 (조회 시점 판정 — cron 없음) | 운영자 [만료 확정]으로 고정. **만료된 실물은 박스 재고로 복귀하지 않음** (운영자가 차기 이벤트에 수동 재등록) |
| `revoked` | 운영자 | 사유 메모 필수 + `game_admin_log` |

v1의 "차순위 승계"는 개념이 소멸 (순위가 아닌 뽑기 결과이므로). 무효·만료된 실물의 재투입은 운영자 수동.

---

## 5. 유저 UX

### 5-1. 진입점·노출

- **홈**: 가챠 진입 버튼 + 보유 이용권 배지. 실물 가챠 이벤트 진행 중이면 이벤트 배너 (기존 `game_notice` 공지 병행)
- **리더보드**: 주간 탭 상단에 "이번 주 순위 보상: 가챠 이용권" 안내 카드 + 지급표. "동점 시 먼저 달성한 기록이 우선합니다" 문구 유지
- **주간 수령**: 다음 주 첫 접속 시 `WeeklyResultModal`에서 CP + 이용권 함께 안내 (기존 모달 확장)

### 5-2. 가챠 화면 — 카드 뽑기 연출 (출시 게임 수준)

컨셉: **카드 팩 뽑기**. K-pop 감성의 카드 비주얼을 쓰되, **수집·도감 요소는 넣지 않는다** (포토카드 컬렉션은 메인 앱 겹침으로 폐기된 결정 — 카드는 연출 수단으로만 사용).

연출 시퀀스 (1회 뽑기 기준):

| 단계 | 연출 | 구현 |
|---|---|---|
| 1. 대기 | 카드 뒷면(V01D 로고 + 홀로그래픽 시머가 기울기에 따라 흐름) 3장이 부유. 배경 딤 + 파티클 | CSS 3D transform + 디바이스 orientation 연동 시머 |
| 2. 셔플 | 탭하면 카드가 셔플 → 1장이 중앙으로 확대 이동 | 스프링 이징 (기존 인터랙션 톤과 통일) |
| 3. 긴장 | 카드 테두리에 등급 색 글로우가 서서히 점화 (S=골드, A=퍼플, B=블루, C·D=화이트). S등급은 화면 전체 진동 + 광선 누출 연출 추가 | 등급별 CSS 변수, 햅틱(vibrate) |
| 4. 플립 | 카드 Y축 회전 → 앞면 공개 (상품 이미지·등급·이름). S/A는 컨페티 (기존 `WeeklyResultModal` 결정적 컨페티 재사용·확장) | `rotateY` 0.6s + 백페이스 |
| 5. 결과 | 재화면 "+100 CP 지급 완료", 실물이면 [수령 정보 입력] CTA로 연결 | |

- 10연 뽑기: 카드 10장 그리드 순차 플립, [스킵] 버튼으로 일괄 공개. 최고 등급 카드는 마지막에 플립 (연출 관례)
- 사운드: 기존 BGM/효과음 체계에 뽑기 전용 SFX 3종 (셔플·플립·상위 등급 팡파레) 추가. 음소거 설정 존중
- 접근성: `prefers-reduced-motion` 시 연출 생략하고 결과 즉시 표시, 기존 `useFocusTrap` 적용
- 성능: CSS transform·opacity만 사용 (레이아웃 트리거 금지), 60fps 목표, WebGL 불사용

### 5-3. 정보 공시 UI

- 실물 가챠: 풀 전체 목록 + **남은 수량 실시간 표시** ("티켓 1/2 · 전체 잔여 132/500"), "남은 아이템 중 균등 확률" 문구
- 재화 가챠: 등급·아이템별 확률표 화면 (뽑기 화면에서 1탭 접근)
- 유상 이용권으로 실물 가챠 진입 시도 시: "실물 뽑기는 랭킹 보상 이용권으로만 참여할 수 있어요" 안내

### 5-4. 실물 당첨 후 흐름 (v1 계승)

- 당첨 직후 [수령 정보 입력] + 이후 매 접속 시 미제출 건 리마인드 모달 (푸시·우편함이 없으므로 유일 채널) + 홈 미수령 배지
- 수령 폼: 이름·연락처 필수(프로필 phone 프리필), 주소는 아이템의 `requiresAddress`일 때, 개인정보 동의 체크 (목적·항목·발송 완료 후 90일 파기 고지, `agreed_at` 기록). 기한 내 수정 재제출 허용
- 기한 만료 시: "수령 기한이 지나 무효 처리되었습니다" 1회 안내

---

## 6. 개인정보 취급 (v1 그대로)

- 수령 정보는 격리 테이블(`game_prize_claim_info`), service_role 전용 (RLS)
- 관리자 화면 기본 마스킹 (홍*동 / 010-\*\*\*\*-1234), 열람·CSV 익스포트 시 `game_admin_log` 기록
- `shipped`/`expired`/`revoked` 후 90일 경과 건은 관리자 [만료 정보 파기] 버튼으로 일괄 삭제 (당첨 이력은 유지)

---

## 7. 관리자 UI

`admin/page.tsx`에 **"가챠" 탭 신설** (`AdminGacha.tsx`).

### 7-1. 실물 가챠 이벤트 관리

1. **이벤트 목록**: 기간·상태·박스 잔여율·실물 당첨 현황
2. **생성/수정 폼**: 제목·설명(ko/en/ja — `AdminNotice` i18n 패턴), 이미지, 기간, `claim_days`, **풀 편집기** (행: 등급·아이템명(i18n)·이미지·수량·**1인 상한**·실물 여부·주소 필요 토글·재화 지급값). 검증: 수량 ≥ 1, 실물 행은 아이템명 필수, 1인 상한은 빈 값(무제한) 또는 ≥ 1. **published 후 풀 구성 잠금** (기간 연장·메모만 수정 가능 — 뽑기 진행 중 확률 변경 차단)
3. **재고 현황판**: 등급별 잔여/전체, 실물 소진 시 하이라이트
4. **실물 당첨자 테이블** (v1 §5-2 그대로): 당첨 일시·닉네임·아이템·상태·기한·수령 정보(마스킹+열람 로그). 행 액션 [발송 완료] [무효(사유 필수)] [만료 확정]. CSV 익스포트(감사 로그)
5. 대시보드 배지: "발송 대기 N건 · 파기 대상 N건"

### 7-2. 재화 가챠 확률표

- 풀 아이템·가중치 편집 폼. 저장 시 확률 합산 미리보기 ("CP 소 62.5%…"), 변경 이력 `game_admin_log`

### 7-3. 이용권 지급표·가격 폼 (`AdminConfig` rewards 그룹)

- `rewards.weeklyTop` (CP — v1 계획 유지): "N위 → CP" 행 편집 + 서버 검증
- `rewards.weeklyTickets` (신규): 구간 편집기 (from·to·장수) + `others` (전원 지급 수)
- `rewards.ticketPrice` (신규): 유상 이용권 CP 가격 (기본 500)
- 공통 경고 문구: "이 표는 유저가 수령하는 시점에 적용됩니다. 주 종료 후 변경하면 아직 수령하지 않은 유저에게 변경값이 적용됩니다."

---

## 8. DB 스키마 초안

```sql
-- 1) 이용권 지갑 (무상/유상 분리 — 사행성 분리의 시스템 강제 지점)
create table game_gacha_wallet (
  player_hash  text primary key,
  free_tickets int not null default 0 check (free_tickets >= 0),
  paid_tickets int not null default 0 check (paid_tickets >= 0),
  updated_at   timestamptz not null default now()
);

-- 2) 이용권 원장 (지급·구매·사용·회수 전체 기록)
create table game_gacha_ticket_ledger (
  id          bigint generated always as identity primary key,
  player_hash text not null,
  delta_free  int not null default 0,
  delta_paid  int not null default 0,
  reason      text not null,   -- weekly:{week}:{mode}:rank{n} / buy / draw:{draw_id} / admin:{사유}
  created_at  timestamptz not null default now()
);

-- 3) 주간 이용권 지급 기록 (중복 차단 — game_week_rewards 패턴)
create table game_week_tickets (
  player_hash text not null,
  week_start  date not null,
  mode        text not null,
  tickets     int not null,
  primary key (player_hash, week_start, mode)
);

-- 4) 가챠 이벤트 (kind로 실물 박스 / 재화 확률형 통합)
create table game_gacha_event (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('physical_box','digital')),
  status      text not null default 'draft'
              check (status in ('draft','published','ended','canceled')),
  title       jsonb not null default '{}'::jsonb,   -- {ko,en,ja}
  description jsonb not null default '{}'::jsonb,
  image_url   text,
  starts_at   timestamptz,                          -- digital 상시는 null
  ends_at     timestamptz,
  claim_days  int not null default 7 check (claim_days between 1 and 30),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 5) 가챠 풀 아이템 (박스: total/remaining, 확률형: weight)
create table game_gacha_pool_item (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references game_gacha_event(id),
  grade            text not null,                   -- S/A/B/C/D
  prize            jsonb not null,                  -- {ko,en,ja} 아이템명
  image_url        text,
  is_physical      boolean not null default false,
  requires_address boolean not null default false,
  reward_payload   jsonb,                           -- 재화형: {cp:100} | {item:'heart',qty:1}
  total_qty        int,                             -- 박스형 필수
  remaining_qty    int check (remaining_qty >= 0),  -- 박스형 필수, 뽑기마다 차감
  weight           int,                             -- 확률형 필수
  per_user_cap     int,                             -- 1인 당첨 상한 (null=무제한, 콘서트 초대권=2)
  sort             int not null default 0
);

-- 6) 뽑기 기록 (원장)
create table game_gacha_draw (
  id           uuid primary key default gen_random_uuid(),
  player_hash  text not null,
  event_id     uuid not null references game_gacha_event(id),
  pool_item_id uuid not null references game_gacha_pool_item(id),
  used_paid    boolean not null default false,      -- physical_box에서는 항상 false 강제
  created_at   timestamptz not null default now()
);

-- 7) 실물 당첨 건 (v1 game_prize_winner 계승 — 근거가 rank → draw로 변경)
create table game_prize_winner (
  id             uuid primary key default gen_random_uuid(),
  draw_id        uuid not null unique references game_gacha_draw(id),
  player_hash    text not null,
  snapshot       jsonb not null,                    -- {prize, grade, nickname} 당첨 시점 값
  status         text not null default 'pending'
                 check (status in ('pending','submitted','shipped','expired','revoked')),
  claim_deadline timestamptz not null,
  submitted_at   timestamptz,
  shipped_at     timestamptz,
  admin_memo     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 8) 수령 정보 (v1 그대로 — 개인정보 격리)
create table game_prize_claim_info (
  winner_id  uuid primary key references game_prize_winner(id),
  name       text not null,
  phone      text not null,
  address    text,
  note       text,
  agreed_at  timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 전 테이블 RLS enable + 정책 없음 = service_role 전용 (기존 관례)
-- 공개 뷰: game_gacha_event_public — published 이벤트의 title/description/image/기간
--          + pool 요약(등급·아이템·실물여부·잔여/전체 or 확률%) 만 노출
```

---

## 9. API / RPC 초안

| 경로 | 메서드 | 역할 |
|---|---|---|
| `/api/gacha/status` | POST | 내 이용권 잔액 + 진행 중 이벤트 + 풀 공시 데이터 |
| `/api/gacha/draw` | POST | 뽑기 (1회/10연). RPC `game_gacha_draw_exec` 호출 |
| `/api/gacha/buy` | POST | CP로 유상 이용권 구매 (RPC — CP 차감 + 유상 지갑 증가 원자 처리) |
| `/api/prize/me` | POST | 내 실물 당첨 건 + 상태 + 기한 (v1) |
| `/api/prize/claim` | POST | 수령 정보 upsert (본인·기한·상태 검증, v1) |
| `/api/admin/gacha` | GET/POST/PUT | 이벤트·풀 CRUD (published 후 풀 잠금 검증) |
| `/api/admin/gacha/winners` | GET/PATCH | 실물 당첨자 목록·상태 변경·CSV (v1) |

**핵심 RPC `game_gacha_draw_exec(p_player_hash, p_event_id, p_count)`** (단일 트랜잭션):

1. 이벤트 `published` + 기간 내 검증
2. 지갑 잠금 → `physical_box`면 **무상 잔액만** 검증·차감 (유상 사용 원천 차단), `digital`이면 무상 우선 차감
3. 박스형: 풀 행 잠금 → **`per_user_cap` 도달 아이템은 해당 유저의 추첨 대상에서 제외** (`game_gacha_draw`에서 유저×아이템 당첨 수 집계, revoked 건은 상한 계산에서 제외) → 잔여 수량 비례 균등 추첨 → `remaining_qty` 차감 (0이면 해당 행 제외, 전체 0이면 이벤트 `ended`)
   확률형: weight 기반 추첨
4. 재화형 당첨 → `game_wallet`/`game_inventory` 즉시 지급 + `game_point_ledger` 기록 (reason `gacha:{draw_id}`)
   실물 당첨 → `game_prize_winner` insert (`claim_deadline = now() + claim_days`)
5. 10연(p_count=10)이면 보너스 이용권 1장 지급 — 소모분에 유상 포함 시 유상, 전량 무상이면 무상 (원장 reason `bonus:{draw_id}`)
6. `game_gacha_draw` + `game_gacha_ticket_ledger` 기록, 결과 배열 반환

- 난수: `gen_random_uuid()` 기반이 아닌 `pgcrypto` 난수 사용, 서버 단독 결정 (클라이언트 조작 불가)
- 기존 `game_claim_week_reward` 패턴을 따라 security definer + service_role 경유

**신규 RPC `game_claim_week_tickets(p_player_hash)`**: `game_claim_week_reward`와 동일 골격 — 지난주 모드별 순위·기록 유무 판정 → `rewards.weeklyTickets` 매칭 → `game_week_tickets` PK 중복 차단 → 무상 지갑 증가 + 원장 기록. 기존 주간 claim 흐름(`Home.tsx`)에서 CP claim과 함께 호출.

---

## 10. 법률·컴플라이언스 체크리스트

| 항목 | 대응 |
|---|---|
| 사행성 (유료 재화 × 실물 경품 × 우연성) | 실물 가챠 = 무상 이용권 전용을 RPC 레벨 강제 (§9). CP 실결제 도입 후에도 구조 유지 |
| 확률형 아이템 확률 공시 (게임산업법) | 재화 가챠 확률표 화면 + 박스 가챠 실시간 잔여 공개. 확률 변경 시 감사 로그 |
| 제세공과금 (5만원 초과 경품 22%) | 현재 범위의 콘서트 티켓은 **무료 공연 초대권**(무상 관람 초대)이라 리스크 대폭 완화. 단 사인 굿즈 등 시가 5만원 초과 가능 품목은 여전히 검토 대상 — **법무 확인 필요** (§13). **유료 콘서트 티켓을 거는 경우는 별도 법무 논의 후 진행** |
| 미성년자 | 공연 연령 제한은 이벤트 설명 고지, 보호자 동의는 약관·동의 문구로 처리 |
| 개인정보 | §6 (격리·마스킹·감사 로그·90일 파기) |

---

## 11. 엣지케이스

| 케이스 | 처리 |
|---|---|
| 10연 도중 박스 잔여 < 10 | 남은 수량만큼만 뽑고 차액 이용권 미차감, 결과 화면에 안내 |
| 동시 뽑기 경합 (마지막 티켓) | 풀 행 잠금으로 직렬화 — 먼저 커밋한 쪽이 당첨, 나머지는 잔여 풀에서 추첨 |
| 실물 당첨자가 프로필 미등록(익명) | player_hash 기준 당첨 유효, 수령 폼은 디바이스(anon_id) 인증으로 입력 가능. 관리자 테이블에 익명 표시 |
| 같은 유저 실물 중복 당첨 | 기본 허용 (뽑기 결과). 단 `per_user_cap` 설정 아이템(콘서트 초대권=2)은 상한 도달 시 해당 유저의 추첨에서 제외 |
| 상한 도달 유저에게 뽑을 아이템이 없음 (예: 박스에 초대권만 잔존 + 유저는 이미 2매) | 뽑기 차단 + "당첨 가능한 상품이 없어요" 안내, 이용권 미차감 |
| 초대권 `revoked` 후 재투입 | revoked 건은 상한 계산에서 제외 → 해당 유저도 다시 당첨 가능. 재고 복귀는 운영자 수동 (§4) |
| 수령 기한 만료 실물 | 박스 재고 자동 복귀 없음. 운영자가 차기 이벤트에 수동 재등록 |
| 이벤트 기간 만료 시 잔여 실물 | 이벤트 `ended` 처리만. 잔여분 처리는 운영 판단 |
| published 후 풀 수정 시도 | 차단 (기간 연장·메모만 허용). 긴급 회수는 `canceled` + 공지 + 미사용 이용권은 자동 보존 |
| 부정 유저 사후 판정 | 이용권 회수(원장), 재화 회수(원장), 실물 당첨 건 `revoked` |
| flagged 유저의 이용권 claim | 지급 시점 flagged면 해당 모드 지급 제외 (기존 CP 로직과 동일) |
| 하위 전원 지급으로 인한 대량 발행 | 참여자 수 × 모드 2 = 주간 발행량. 박스 가챠 잔여 공개로 수요 자연 조절, 발행량은 관리자 대시보드에서 모니터링 |

---

## 12. 단계적 구현 순서

| Phase | 내용 | 비고 |
|---|---|---|
| **1. 지급표 폼** | `AdminConfig` rewards 그룹 (weeklyTop CP + weeklyTickets + ticketPrice) + 서버 검증 | 독립 배포 가능 |
| **2. 이용권 경제** | 지갑·원장·주간 지급 마이그레이션 → `game_claim_week_tickets` → `WeeklyResultModal` 확장 → CP 구매 | 가챠 없이도 이용권 적립 시작 가능 (선적립 → 가챠 오픈 시 소모) |
| **3. 재화 가챠** | 이벤트·풀·뽑기 RPC → 카드 연출 UI → 확률 공시 → `AdminGacha` 확률표 | 실물 없이 뽑기 루프·연출 완성 및 검증 |
| **4. 실물 박스 가챠** | 박스 재고 로직(1인 상한 포함) → 실물 당첨 → 수령 폼 → 당첨자 관리 테이블 | 핵심 가치 완성. **첫 이벤트 = 콘서트 초대권 가챠 (티켓 최우선 — 사용자 결정). 포토카드는 추후** |
| **5. 운영 편의** | CSV·만료 확정·개인정보 파기·대시보드 배지·발행량 모니터링 | 운영 루틴 완결 |

### 참조 파일 (개발 착수용)

- `supabase/migrations/20260727220000_score_rate_cap.sql` — `game_claim_week_reward` (이용권 claim RPC가 따를 골격)
- `supabase/migrations/20260804100000_home_notice.sql` — 신규 테이블·RLS·공개 뷰 패턴 원형
- `src/components/WeeklyResultModal.tsx` + `src/components/Home.tsx` — 주간 수령 모달 확장·claim 호출 연결 지점
- `src/components/admin/AdminConfig.tsx` / `src/app/admin/page.tsx` — 폼 그룹·탭 추가 지점
- `src/components/Leaderboard.tsx` — 지급표 안내 카드
- `supabase/003_shop.sql` — `game_buy_item` (유상 이용권 구매 선례)
- `docs/project_skin_system_design` (메모리) — 재화 가챠 풀에 스킨 연동 시 참조

---

## 13. 사용자 결정 필요 사항

1. **제세공과금·법무** — 콘서트 초대권은 무료 공연 개념이라 완화. 시가 5만원 초과 가능 품목(사인 굿즈 등) 및 유료 콘서트 티켓 도입 시 법무 확인

### 확정된 결정 (v2.1, 2026-08-12)

| 항목 | 결정 |
|---|---|
| 유상 이용권 가격 | **500 CP** |
| 콘서트 초대권 1인 상한 | **최대 2매** (per_user_cap) |
| 10연 뽑기 보너스 | **이용권 1장** (소모 유형 승계 — 사행성 분리 유지) |
| 콘서트 티켓 성격 | **무료 공연 초대권**. 유료 콘서트 티켓은 추후 별도 논의 |
| 첫 실물 이벤트 | **티켓(초대권) 가챠 최우선**, 포토카드는 추후 |
| 주간 이용권 지급 방식 | **모드별 각각 지급** (기존 CP 보상과 동일 규칙. 박스 가챠는 재고 고정이라 발행량 증가에도 운영 비용 불변) |
