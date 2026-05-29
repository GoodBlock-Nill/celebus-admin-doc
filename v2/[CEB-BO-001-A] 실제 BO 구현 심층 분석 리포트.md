# [CEB-BO-001-A] 실제 BO 구현 심층 분석 리포트

## Page Properties

| Key | Value |
| ---- | ---- |
| 분석 대상 | https://gb.celebus.xyz/ (CELEBUS Admin Production) |
| 분석 일시 | 2026.05.05 |
| 분석자 | @Nill Yoo (자동 분석 by Chrome DevTools MCP) |
| 분석 권한 | Super Admin (nill@good-block.com) |
| 비교 기준 | [CEB-BO-000~005] v2 BO 마스터 가이드 |
| 화면 캡처 | `analysis-screenshots/01~09-*.png` |

---

## 0. Executive Summary

### 0.1 한 줄 요약

**v2 BO 가이드와 실제 구현 사이에 심각한 영역 매핑 갭이 존재**한다. 실제 BO는 v2가 정의한 12개 영역 중 6개만 부분 구현, 5개는 placeholder, 1개(BIVE)는 v2보다 더 정교하게 구현되어 있다. **v2 BO-001~005 마스터 가이드는 현재 운영 중인 실제 시스템을 반영하도록 전면 재정렬이 필요**하다.

### 0.2 핵심 발견 (Top 10)

| # | 발견 | 심각도 | 후속 조치 |
| -- | --- | --- | --- |
| 1 | **회원 상세 = 9탭** (실제) ≠ **8탭** (v2 정의) — 탭 구성도 완전히 다름 | 🔴 Critical | BO-002 8탭 구조 재설계 |
| 2 | v2 정의 영역 누락: **덕력(DUK)·팬덤레벨(EVT)·서포트(SUP)·콘텐츠(INF)·기억(MEM)·디지털굿즈(COL)** 사이드 메뉴에 없음 | 🔴 Critical | 영역별 가이드(DUK·EVT·SUP·INF·MEM·COL) 작성·구현 우선순위 결정 |
| 3 | 실제 메뉴: **프로젝트·앱·Fans·티켓·재무** 5개 — v2 12영역 어디에도 매핑 없음 (모두 placeholder) | 🟠 High | v2 영역 매핑 갱신 — 13개 영역으로 확장 검토 |
| 4 | 권한 시스템 4단계(SUPER/OPERATOR/POLICY/EXTERNAL_ARTIST) 미구현 — **현재 9명 전원 Super Admin** | 🔴 Critical | BO-005 §3 4단계 권한 마이그레이션 시급 |
| 5 | BIVE 민팅 캠페인 = **Event/Ticket/Mix/Pick 4탭** (v2는 2탭만) — 24개 캠페인 활성, 팬퀘스트 보상 자동 민팅 가동 중 | 🟢 Info | BO-004 §4.3 4탭 구조로 갱신 |
| 6 | GP 변동 유형 = "**GP 출석체크**", "**응모권 구매**" 중심 — v2 정의(PARTICIPATION/REWARD/REFUND 등)와 다름 | 🟠 High | CLAUDE.md GP 변동 유형 표 갱신 |
| 7 | **GP 교환소 페이지 크래시** (`TypeError: Cannot read properties of null (reading 'toLowerCase')`) | 🟠 High | 즉시 버그 수정 |
| 8 | 랭킹 화면 **API 500 에러** ("Request failed with status code 500") | 🟠 High | 백엔드 디버깅 |
| 9 | 로그인 화면 **2FA 미구현** — v2 BO-000 §1.1 "운영자 이상 2FA 필수" 정책 위배 | 🟠 High | 2FA 도입 또는 정책 완화 |
| 10 | 다국어(KO/EN/JP) 정책은 **아티스트 그룹·BIVE 에디션 등에서 잘 작동** | 🟢 Info | 정책 유지 |

---

## 1. 사이트 기술 스택

| 항목 | 값 | 비고 |
| --- | --- | --- |
| 도메인 | gb.celebus.xyz | "Good Block CELEBUS" |
| 프레임워크 | **Vite + React SPA** | Next.js 아님. 단일 번들 (`index-BSosEy4H.js`) |
| 스타일 | TailwindCSS | `bg-gray-50 dark:bg-neutral-900` — 다크모드 클래스 발견 |
| 폰트 | Pretendard (KO) + Exo 2 (로고) | jsDelivr CDN |
| 언어 속성 | `<html lang="ko">` | 단일 언어. UI 다국어 토글 없음 |
| 인증 | 이메일 + 비밀번호 | **2FA 미구현** |
| 페이지 타이틀 | "Celebus Backoffice" | |

---

## 2. 사이드바 메뉴 구조 (실제 vs v2 문서)

### 2.1 실제 사이드바 (좌→우, 위→아래)

```
대시보드
─────── 관리자 메뉴 ───────
회원
프로젝트                        ← v2 미정의, placeholder
[아티스트]
  ├── 그룹 리스트
  └── 멤버 리스트
앱                              ← v2 미정의, placeholder
[BIVE]
  ├── 에디션 관리
  ├── 민팅 관리
  └── 혜택 관리
Fans                            ← v2 미정의, placeholder
티켓                            ← v2 미정의, placeholder
[게임존]
  ├── 게임존 홈
  ├── 게임 관리
  ├── 랭킹                     ⚠️ API 500
  ├── GP 교환소                ⚠️ 페이지 크래시
  └── GP 변동 내역
팬퀘스트
재무                            ← v2 미정의, placeholder
[관리자]
  ├── 관리자 리스트
  └── 권한관리
```

### 2.2 v2 BO-000 §1.2 정의 영역 vs 실제 매핑

| v2 영역 | v2 접두어 | 실제 메뉴 매핑 | 상태 |
| --- | --- | --- | --- |
| Quest·Raffle | FQ | 팬퀘스트 | ✅ 운영 중 (Quest/Raffle 탭) |
| 덕력 시스템 | DUK | **(없음)** | ❌ 메뉴·화면 미구현 |
| 팬덤 레벨 | EVT | **(없음)** | ❌ 메뉴·화면 미구현 |
| 서포트 이벤트 | SUP | **(없음)** | ❌ 메뉴·화면 미구현 |
| 콘텐츠·소식 | INF | **(없음)** | ❌ 메뉴·화면 미구현 |
| 기억저장소 운영 | MEM | **(없음)** | ❌ 메뉴·화면 미구현 |
| BIVE (NFT) | BIVE | BIVE > 에디션/민팅/혜택 | ✅ 운영 중 (3,196개 NFT 발행) |
| 디지털 굿즈 (기타) | COL | **(없음)** | ❌ 메뉴·화면 미구현 |
| 회원 | USR | 회원 | ⚠️ 부분 구현 (탭 구조 상이) |
| 아티스트 | ART | 아티스트 > 그룹/멤버 | ⚠️ 부분 구현 (활동 통계 탭 없음) |
| 홈·배너 | HOM | **(없음)** | ❌ 메뉴·화면 미구현 |
| 관리자 | SYS | 관리자 > 리스트/권한관리 | ⚠️ 부분 구현 (4단계 권한 없음) |

**결과**: v2 12개 영역 중
- ✅ **운영 중**: 2개 (FQ, BIVE)
- ⚠️ **부분 구현**: 3개 (USR, ART, SYS)
- ❌ **미구현**: 7개 (DUK·EVT·SUP·INF·MEM·COL·HOM)

### 2.3 v2 미정의 메뉴 (실제에 존재)

| 메뉴 | URL | 상태 | 내용 |
| --- | --- | --- | --- |
| 프로젝트 | /projects | placeholder | "프로젝트를 관리합니다. 준비 중인 페이지입니다." |
| 앱 | /apps | placeholder | "앱 설정을 관리합니다. 준비 중인 페이지입니다." |
| Fans | /fans | placeholder | "Fans 서비스를 관리합니다. 준비 중인 페이지입니다." |
| 티켓 | /tickets | placeholder | "티켓을 관리합니다. 준비 중인 페이지입니다." |
| 재무 | /finance | placeholder | "재무 정보를 관리합니다. 준비 중인 페이지입니다." |

→ **v2 영역 매핑 재검토 필요**. 이 5개가 신규 영역인지, 기존 영역의 다른 명칭인지 결정 필요.

---

## 3. 영역별 상세 분석

### 3.1 대시보드

| 항목 | 실제 | v2 정의 |
| --- | --- | --- |
| URL | `/dashboard` | — |
| 상태 | **빈 화면** | BO-000 §17 "신규 정의" |
| Breadcrumb | "대시보드" | — |

→ v2 BO-001 §1.1 "대시보드 = 빈 화면" 분석과 정확히 일치.

### 3.2 회원 (USR)

#### 3.2.1 회원 리스트 `/members`

| 항목 | 실제 | v2 정의 (BO-002) |
| --- | --- | --- |
| 헤더 카운터 | 전체/정상/정지/탈퇴대기/탈퇴완료 (5상태) | 유사 |
| 전체 수 | 566명 | — |
| 정상 | 556 | — |
| 정지 | 0 | — |
| 탈퇴대기 | 6 | — |
| 탈퇴완료 | 4 | — |
| 컬럼 | 계정상태 / 유저명 / 전화번호 / 지갑주소 / 가입일시 | "검색·필터에 v2 신규 활동 필터 추가" 정의됨 |
| 신규 활동 필터 (덕력 잔액·기억저장소 신고·서포트 응원·팬덤레벨) | **없음** | BO-002 §7.2에서 정의 |
| 추가 메뉴 | "정지사유 설정" 링크 (`/members/suspension-reasons`) | v2 미정의 |
| 페이지네이션 | 29페이지 | — |

#### 3.2.2 회원 상세 `/members/{id}` — 9탭

| 순서 | 실제 탭 | v2 BO-002 §7.1 정의 (8탭) | 매핑 |
| --- | --- | --- | --- |
| 1 | 기본정보 | 기본 | ✅ |
| 2 | 참여내역 | 참여내역 | ✅ |
| 3 | 게임존 | 게임존 | ✅ |
| 4 | BIVE | BIVE | ✅ |
| 5 | **프로젝트** | 덕력 ⭐ v2 신규 | ❌ 다름 |
| 6 | **Fans** | 서포트 ⭐ v2 신규 | ❌ 다름 |
| 7 | **티켓** | 기억 ⭐ v2 신규 | ❌ 다름 |
| 8 | **지갑** | 팬덤레벨 ⭐ v2 신규 | ❌ 다름 |
| 9 | **활동내역** | (정의 없음) | 추가 |

**기본정보 섹션**:
- 유저명 (수정 가능 — v2 BO-002에 정책 미정의)
- 이메일, 전화번호, 국가, 로그인 방식 (Google), 가입일시, 최근로그인
- 상태정보: 계정상태(정상), **계정정지 토글** (v2 SANCTION 모달과 다름), DID발급(미발급), Set Approval(미승인)
- 추가정보: 지갑주소, 소개

**중대 갭**:
- v2가 추가하려던 4개 탭(덕력/서포트/기억/팬덤레벨) **하나도 없음**
- 실제는 다른 4개 탭(프로젝트/Fans/티켓/지갑)이 있음 — 이는 v2 미정의 영역
- 활동내역 탭이 추가로 있음

#### 3.2.3 모달

| v2 정의 모달 | 실제 구현 |
| --- | --- |
| MD-SANCTION (제재 모달) | **계정정지 토글로 대체** (단일 액션) |
| MD-RECLAIM (자산 회수) | 미발견 |
| MD-NOTE (운영자 메모) | 미발견 (별도 메모 필드 없음) |

---

### 3.3 프로젝트 / 앱 / Fans / 티켓 / 재무 (v2 미정의)

5개 메뉴 모두 동일 패턴:
```
{영역}
{영역}을(를) 관리합니다.
준비 중인 페이지입니다.
```

→ v2 영역 매핑에 **반영되지 않은 신규 영역**. 운영팀 요구사항 추가 또는 v2 영역과 다른 비전.

---

### 3.4 아티스트 (ART)

#### 3.4.1 그룹 리스트 `/artists/groups`

| 항목 | 실제 |
| --- | --- |
| 등록 그룹 수 | 5개 (UNDER:LIGHT, V01D, CELEBUS, MADEIN, iKON) |
| 컬럼 | 상태/그룹명/멤버 수/설명/업데이트 일시 |
| 추가 버튼 | [그룹 생성] [포지션 설정] |
| 상태 필터 | Active(5) / Inactive(0) |

#### 3.4.2 그룹 상세 `/artists/groups/{id}` — 3탭

| 순서 | 실제 탭 | v2 BO-003 정의 (4탭) | 매핑 |
| --- | --- | --- | --- |
| 1 | 기본정보 | 기본 | ✅ |
| 2 | SNS & Link | SNS&LINK | ✅ |
| 3 | 멤버 | 멤버 | ✅ |
| — | **(없음)** | **활동 통계** ⭐ v2 신규 | ❌ 미구현 |

**기본정보 섹션**:
- 관리정보: 상태, 생성 관리자(-), 생성일시, 최근 수정자(-), 최근 수정 일시
- 로고 + 메인 이미지 (CDN: `assets.celebus.xyz/celebus/artist/group/...png`)
- 그룹명 (KO/EN/JP) ✅ 다국어 정상
- 그룹 소개 (KO/EN/JP) ✅ 다국어 정상

**갭**:
- v2 신규 "활동 통계" 탭 미구현 (Quest·Raffle 참여, BIVE 발행, 팬덤레벨업 추이 KPI)
- 생성 관리자/최근 수정자가 모두 "-"로 표시 — **활동 로그 추적 부재** ([CEB-BO-000] §6 위배)

---

### 3.5 BIVE (NFT)

#### 3.5.1 에디션 관리 `/bive/editions`

| 에디션 | 등록 BIVE | 총 발행 | 생성 관리자 |
| --- | --- | --- | --- |
| V01D | 23종 | **2,768개** | nill |
| CELEBUS | 1종 | **428개** | nill |

→ **총 3,196개 NFT가 실제 온체인 발행**됨. 운영 가동 중.

#### 3.5.2 BIVE 토큰 목록 (에디션 상세) `/bive/editions/{id}`

V01D 에디션:
- 멤버 5명 (송유찬·정지섭·케빈박·신노스케·조주연)
- 4시리즈 (Event-001~004)
- 발행 패턴: Event-001 ≈ 263~276개, Event-002 ≈ 158~176, Event-003 ≈ 47~169, Event-004 ≈ 18~25
- → **후속 시리즈로 갈수록 발행량 감소** (Top fan only 구조)

| 컬럼 | 실제 |
| --- | --- |
| 상태 | Active |
| 명칭 | "{멤버} {시리즈}-{번호}" |
| 아티스트 그룹 | V01D |
| 아티스트 | (멤버명) |
| 등급 | Event |
| 등급번호 | 001~004 |
| 민팅 이벤트 | (캠페인 발행수) |
| 발행 수 | (실 발행) |
| 등록일시 | — |

#### 3.5.3 민팅 관리 `/bive/minting` — **4탭** (Event/Ticket/Mix/Pick)

| 항목 | 실제 | v2 BO-001 §4.3 정의 |
| --- | --- | --- |
| 탭 구조 | **Event / Ticket / Mix / Pick** | EVENT·Ticket (2탭) |
| 캠페인 수 | 24개 | — |
| 컬럼 | ID/상태/캠페인 명/연결 기능/등록 BIVE/발행 수/생성일 | — |
| 연결 기능 | **팬퀘스트 보상**(23) / **회원가입 보상**(1) | "Quest 완료 → BIVE 자동 민팅 트리거" 정의됨 |

**v2 정의 항목 검증**:
- ✅ "Quest/Raffle 보상 연결" 핵심 기능 **이미 구현·운영 중**
- ❌ Mix·Pick 탭은 v2 미정의 신규 개념

#### 3.5.4 혜택 관리 `/bive/benefits`

| 항목 | 실제 |
| --- | --- |
| 탭 | Boost Point / Raffle Ticket |
| 안내 | "일일/주간 혜택 지급시간: 00:05" |
| 컬럼 | 상태/혜택 명칭/등록된 BIVE/BP수량/지급 주기/지급 요일/시작일/종료일 |
| 등록 혜택 | **0건** ("검색 결과가 없습니다") |

→ 혜택 시스템 **인프라만 구축, 운영 시작 전**.

---

### 3.6 게임존

#### 3.6.1 게임존 홈 `/gamezone/home`

전체 현황:
- 진행중 게임: **0개**
- 결과 입력 필요: **0개**
- 오늘 GP 충전: 0
- 오늘 GP 출금: 0
- 오늘 GP 변동 건수: **17건** (= GP 출석체크 등 로그)

PM/ST 영역:
- Prediction Market: 진행중 0, 결과 대기 0, 오늘 참여자 0
- Survival Trivia: 진행중 0, 게시 대기 0, 오늘 참여자 0

→ **게임존 PM/ST 운영 중단 상태**. 인프라는 v1 그대로 유지.

#### 3.6.2 게임 관리 `/gamezone/games`

- "등록된 게임이 없습니다."
- 탭: Prediction Market (Survival Trivia 탭 발견 안 됨 — 추가 확인 필요)

#### 3.6.3 랭킹 `/gamezone/ranking` — ⚠️ 500 에러

```
랭킹 데이터를 불러오지 못했습니다.
Request failed with status code 500
```

→ TOP 1 = "-" 표시는 빈 데이터 처리. 그러나 본 페이지는 API 500.

#### 3.6.4 GP 교환소 `/gamezone/exchange` — ⚠️ 페이지 크래시

```
Something went wrong!
Show Error
```

콘솔 에러:
```
TypeError: Cannot read properties of null (reading 'toLowerCase')
```

→ **즉시 수정 필요**한 null safety 버그. 운영팀 GP 교환 관리 불가능.

#### 3.6.5 GP 변동 내역 `/gamezone/gp-history`

실제 변동 유형 (관찰):
- **GP 출석체크** (다수): +5 GP, 일일
- **응모권 구매** (소수): -25 GP

| v2 정의 (CLAUDE.md) | 실제 구현 발견 |
| --- | --- |
| PARTICIPATION (게임 참여) | 미관찰 (게임 운영 중단 상태) |
| BOOSTING (부스팅) | 미관찰 |
| REFUND (참여 GP 반환) | 미관찰 |
| REWARD (정답/생존 보상) | 미관찰 |
| REFUND_CANCEL (게임 취소 환불) | 미관찰 |
| EXCHANGE_IN (CELB→GP) | 미관찰 |
| EXCHANGE_OUT (GP→CELB) | 미관찰 |
| **(미정의)** | ✅ **GP 출석체크** |
| **(미정의)** | ✅ **응모권 구매** |

→ v2 GP 변동 유형 표는 **PM/ST 가동 중심**으로 정의됐으나, 실제는 **출석/팬퀘스트 응모권** 중심으로 운영. CLAUDE.md GP 변동 유형 표 재정렬 필요.

---

### 3.7 팬퀘스트 (FQ)

#### 3.7.1 Fan Quest 관리 `/fanquest`

| 항목 | 실제 |
| --- | --- |
| 탭 | Quest / Raffle |
| 페이지 수 | 5페이지 (대량 등록) |
| 검토 필요 카운터 | (추가 분석 필요) |
| 컬럼 | 상태/타이틀/아티스트/기간/검토 필요 |
| 부속 메뉴 | [반려사유 설정] [생성하기] |
| 활성 Quest | V01D, iKON 등 다수 운영 중 |

→ **활발히 운영 중**. v1 BO-FQ 35개 화면 그대로 흡수되어 가동.

---

### 3.8 관리자 (SYS)

#### 3.8.1 관리자 리스트 `/admins/list`

| 상태 | 수 |
| --- | --- |
| 전체 | 9명 |
| Active | 9 |
| Pending | 0 |
| Locked | 0 |
| Inactive | 0 |

**관리자 명단 (전원 Super Admin)**:
1. Oliver — oliver@good-block.com
2. hennie — hennie@good-block.com
3. Kara — kara@good-block.com
4. carl — carl@good-block.com
5. lily — lily@good-block.com
6. sun — sun@good-block.com
7. nill — nill@good-block.com (현재 로그인)
8. teddy — lee.ch@good-block.com
9. admin — admin@celebus.xyz

→ **전원 Super Admin** — v2 BO-000 §3 4단계 권한(SUPER/OPERATOR/POLICY/EXTERNAL_ARTIST) **미적용**.

#### 3.8.2 권한관리 `/admins/permissions`

| 권한 그룹 | 관리자 수 | 비고 |
| --- | --- | --- |
| Super Admin (수정불가) | 9명 | 전원 |
| Viewer (기본값) | 0명 | 사용 안 됨 |

**v2 BO-005 정의 vs 실제 갭**:

| v2 4단계 권한 | 실제 |
| --- | --- |
| SUPER (슈퍼관리자) | ✅ Super Admin |
| OPERATOR (운영자) | ❌ 없음 |
| POLICY (정책관리자) | ❌ 없음 |
| EXTERNAL_ARTIST (아티스트사 외부) | ❌ 없음 |
| (— 없음) | Viewer (v2 미정의) |

권한 상세 화면:
- 3탭: 기본정보 / 권한설정 / 관리자(N)
- v1 정의 그대로 흡수

---

## 4. 횡단 분석 (Cross-cutting concerns)

### 4.1 다국어 정책 ([CEB-BO-000] §5)

| 영역 | KO/EN/JP 입력 |
| --- | --- |
| 아티스트 그룹명·소개 | ✅ 정상 (V01D 일본어 번역까지 완료) |
| BIVE 에디션명 | ✅ 정상 (CELEBUS 3언어) |
| 회원 데이터 | — (회원은 텍스트 입력 적음) |
| 팬퀘스트 타이틀 | (분석 미완 — 후속 검증 필요) |

→ 다국어 정책은 **잘 작동**. v2 BO-000 §5 정책 유지 가능.

### 4.2 인증·권한 ([CEB-BO-000] §1, §3)

| v2 정책 | 실제 |
| --- | --- |
| 이메일+비밀번호+2FA | **2FA 미구현** |
| IP 화이트리스트 | (확인 불가, BO 외부에서 검증 필요) |
| 4단계 권한 | **미구현 (Super Admin만)** |
| 90일 비활성 자동 잠금 | (확인 불가) |

→ **권한 시스템 전면 미구현**. v2 BO-005 마이그레이션 사실상 0% 진행.

### 4.3 활동 로그 ([CEB-BO-000] §6)

- 아티스트 그룹 상세에 "생성 관리자: -", "최근 수정자: -" 표시
- → 활동 로그 데이터 **수집 안 됨**. 화면 필드는 있으나 실데이터 없음.

### 4.4 에러 처리

| 화면 | 에러 |
| --- | --- |
| 게임존 > 랭킹 | API 500 ("Request failed with status code 500") |
| 게임존 > GP 교환소 | 페이지 크래시 (`null.toLowerCase()` JS 에러) |

→ **에러 바운더리** 동작은 하나, **빠른 수정 필요**한 회귀.

### 4.5 다크모드 지원

- `<body class="bg-gray-50 dark:bg-neutral-900">` — 다크모드 클래스 발견
- 토글 UI는 미발견 (UI 테마 전환 인터랙션 미구현 가능성)

---

## 5. v2 마이그레이션 권고

### 5.1 즉시 조치 (Critical)

1. **GP 교환소 null safety 버그 수정** — 운영 차단 이슈
2. **랭킹 API 500 디버깅** — 운영팀 가시성 확보
3. **회원 상세 9탭 확정 + v2 BO-002 재설계**
   - 실제 9탭(기본정보·참여내역·게임존·BIVE·프로젝트·Fans·티켓·지갑·활동내역)을 v2 가이드에 반영
   - 또는 v2 신규 4탭(덕력·서포트·기억·팬덤레벨)을 추가하여 13탭으로 확장
4. **v2 영역 매핑 재정렬**:
   - 실제 메뉴(프로젝트·앱·Fans·티켓·재무) 5개를 v2 12개 영역에 흡수 또는 신규 영역으로 추가
   - placeholder 5개를 어떻게 채울지 운영팀 결정

### 5.2 단기 조치 (High)

5. **권한 4단계 마이그레이션 시작** — v2 BO-005 §3
   - 현재 9명 전원 Super Admin → 운영팀 역할별 OPERATOR/POLICY 부여
   - Viewer 그룹 활용 또는 폐기 결정
6. **2FA 도입** 또는 v2 BO-000 §1.1 정책 완화
7. **활동 로그 데이터 수집 시작** — 현재 모든 "-" 표시 필드를 실데이터로
8. **GP 변동 유형 표 갱신** (CLAUDE.md, BO-000)
   - "GP 출석체크", "응모권 구매" 추가
   - 게임존 운영 중단 시 PM/ST 유형은 "보류" 표기

### 5.3 중기 조치 (v2 신규 영역 구현)

9. **v2 신규 6개 영역 단계적 구현**:
   - DUK (덕력 시스템) — 현재 GP 출석체크가 덕력 유사 기능?
   - EVT (팬덤 레벨)
   - SUP (서포트 이벤트)
   - INF (콘텐츠·소식)
   - MEM (기억저장소 운영)
   - HOM (홈·배너)

10. **BIVE 4탭 운영 정착** — Mix/Pick 캠페인 정의 추가 필요

---

## 6. 화면 ID 매핑 제안

### 6.1 실제 → v2 ID 매핑

| 실제 URL | 화면명 | v2 ID 제안 | 비고 |
| --- | --- | --- | --- |
| `/dashboard` | 대시보드 | CEB-BO-DASH-101 | v2 신규 정의 필요 |
| `/login` | 로그인 | CEB-BO-AUTH-101 | v2 신규 |
| `/members` | 회원 리스트 | CEB-BO-USR-101 | ✅ |
| `/members/{id}` | 회원 상세 (9탭) | CEB-BO-USR-201 | 8→9탭 갱신 |
| `/members/suspension-reasons` | 정지사유 설정 | CEB-BO-USR-501 | v2 신규 매핑 |
| `/projects` | 프로젝트 | (보류) | v2 영역 결정 후 |
| `/artists/groups` | 그룹 리스트 | CEB-BO-ART-201 | ✅ |
| `/artists/groups/{id}?tab=info` | 그룹 상세 (기본정보 탭) | CEB-BO-ART-301 | 실측 2탭 정합 |
| `/artists/members` | 멤버 리스트 | CEB-BO-ART-202 | ✅ |
| `/apps` | 앱 | (보류) | placeholder |
| `/bive/editions` | 에디션 관리 | CEB-BO-BIVE-101 | ✅ |
| `/bive/editions/{id}` | 에디션 BIVE 관리 | CEB-BO-BIVE-201 | v2 BIVE 4탭 정의와 다름 |
| `/bive/minting?tab={EVENT/Ticket/Mix/Pick}` | 민팅 관리 | CEB-BO-BIVE-301 | 4탭 갱신 |
| `/bive/benefits?tab={boostPoint/raffleTicket}` | 혜택 관리 | CEB-BO-BIVE-401 | ✅ |
| `/fans` | Fans | (보류) | placeholder |
| `/tickets` | 티켓 | (보류) | placeholder |
| `/gamezone/home` | 게임존 홈 | CEB-BO-GZ-101 | ✅ v1 그대로 |
| `/gamezone/games` | 게임 관리 | CEB-BO-GZ-201 | ✅ |
| `/gamezone/ranking` | 랭킹 | CEB-BO-GZ-401 | ⚠️ 500 |
| `/gamezone/exchange` | GP 교환소 | CEB-BO-GZ-501 | ⚠️ 크래시 |
| `/gamezone/gp-history` | GP 변동 내역 | CEB-BO-GZ-601 | ✅ |
| `/fanquest` | 팬퀘스트 | CEB-BO-FQ-101 | ✅ v1 그대로 |
| `/fanquest/reject-reasons` | 반려사유 설정 | CEB-BO-FQ-101-REJETSET | ✅ |
| `/fanquest/create` | Quest/Raffle 생성 | CEB-BO-FQ-101-Create | ✅ |
| `/finance` | 재무 | (보류) | placeholder |
| `/admins/list` | 관리자 리스트 | CEB-BO-SYS-101 | ✅ |
| `/admins/permissions` | 권한관리 | CEB-BO-SYS-102 | ✅ |

---

## 7. 운영 통계 스냅샷 (2026.05.05)

| 지표 | 값 |
| --- | --- |
| 회원 수 | 566명 (정상 556 / 탈퇴대기 6 / 탈퇴완료 4) |
| 관리자 수 | 9명 (전원 Super Admin) |
| 등록 아티스트 그룹 | 5개 |
| BIVE 에디션 | 2개 (V01D, CELEBUS) |
| BIVE 토큰 종류 | 24종 (V01D 23 + CELEBUS 1) |
| 발행된 NFT 총량 | **3,196개** |
| 민팅 캠페인 | 24개 (대다수 팬퀘스트 보상 연결) |
| 진행중 Quest | 5페이지 분량 |
| 게임존 PM/ST | 0 (운영 중단) |
| 오늘 GP 변동 건수 | 17건 (대부분 출석체크) |

→ **CELEBUS의 현재 핵심 운영 = 팬퀘스트 + BIVE NFT 보상 자동 민팅**. PM/ST 게임존은 운영 중단 상태.

---

## 8. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
| ---- | ---- | ------ | --------- |
| v1.0 | 2026.05.05 | @Nill Yoo | 초안 작성. https://gb.celebus.xyz/ 실제 BO 12개 영역 전수 조사 (Chrome DevTools MCP 자동 분석). v2 BO-000~005 마스터 가이드와 갭 정리 → 13개 화면 갱신 권고 + 2개 즉시 수정 버그(GP교환소 크래시·랭킹 500) 발견 + 권한 4단계 마이그레이션 0% 확인 + BIVE 운영 가동 검증 (3,196 NFT 발행). 영역별 매핑 차이·신규 영역 5개(프로젝트/앱/Fans/티켓/재무) 식별. 즉시·단기·중기 권고 10건 명시. |
