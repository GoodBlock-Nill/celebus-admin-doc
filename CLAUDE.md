```
# CELEBUS ADMIN - 화면설명서 작성 가이드 (v1→v2 마이그레이션)

## 프로젝트 개요

CELEBUS는 K-pop 팬 엔터테인먼트 플랫폼이며, 본 프로젝트는 백오피스(BO) + 앱 화면설명서를 v1(게임존+팬퀘스트 중심)에서 v2(12개 영역 통합)로 마이그레이션하는 작업이다.

- **플랫폼**: CELEBUS ADMIN (백오피스) + CELEBUS APP
- **현재 우선 작업**: v1 89개 화면 → v2/BO/, v2/APP/ 로 전면 이전 + Deprecation
- **참고**: 게임존(Phase 1·2)은 PM/ST 운영 중단 상태. 활성 영역은 팬퀘스트(FQ) + BIVE NFT

---

## 작업 재개 프로토콜 (CRITICAL)

신규 Claude Code 세션 시작 시 **반드시 다음 순서로 컨텍스트를 복원**한다.

1. **자동 주입** — `.claude/hooks/session-start-context.sh` 가 SessionStart 훅으로 실행되어 진행상태·다음 작업·차단 이슈를 시스템 프롬프트에 자동 주입
2. **수동 확인** (자동 주입이 실패한 경우):
   - 진행상태: `~/.claude/projects/-Users-goodblock-Projects-celebus-admin/memory/v2_migration_progress.md`
   - 매핑표: `~/.claude/projects/-Users-goodblock-Projects-celebus-admin/memory/v1_v2_mapping_matrix.md`
   - 운영 갭: `~/.claude/projects/-Users-goodblock-Projects-celebus-admin/memory/v2_critical_gaps.md`
   - 마스터 플랜: `~/.claude/plans/v1-v2-resilient-hamming.md`
   - 분석 리포트: `v2/[CEB-BO-001-A] 실제 BO 구현 심층 분석 리포트.md`

### Phase 진입·퇴출 시 강제 호출

```bash
# Phase 진입
v2/scripts/update-progress.sh --phase N --status start --note "메모"

# Phase 완료
v2/scripts/update-progress.sh --phase N --status done --note "산출물 요약"

# 차단 이슈 발생
v2/scripts/update-progress.sh --phase N --status blocked --note "차단 사유"

# 단순 메모만 추가 (Phase 진행 중 발견사항)
v2/scripts/update-progress.sh --note "발견 내용"
```

이 스크립트가 호출되지 않으면 **세션 종료 시 작업 컨텍스트 손실 위험**이 발생한다.

---

## 명세 변경 이력 ↔ 본문 자가 검증 (CRITICAL)

명세 §7 변경 이력 entry에 "신규 기능 — XX 추가" 같은 약속을 작성한 직후 즉시 본문 §2·§3·§5에 실제 항목을 보강해야 한다. **변경 이력만 갱신하고 본문 보강을 잊는 패턴은 직전 3개 사이클에서 3차례 재발**한 가장 빈번한 실수다.

### 강제 시퀀스

1. §7 변경 이력 entry 작성
2. **즉시** `v2/scripts/changelog-sync-check.sh <화면 ID>` 실행
3. 누락 후보 발견 시 §2·§3·§5에 항목 보강 후 재실행
4. 종료 코드 0 확인 후에만 사이클 완료 보고

### 정정/통일 전용 entry

"정정", "통일", "환원", "철회", "폐기" 메타 동사만 포함하고 "신규"/"추가" 동사 없는 entry는 약속 추출 skip(자동 통과). 정정 사이클의 Before/After 인용을 본문 약속으로 오인하는 false positive 방지.

### 위반 시 회복 절차

- 사용자가 누락 발견 시 1차 보강 + 메모리 룰 [feedback-changelog-body-sync] 재확인

---

## 운영 BO 검증 불가 시 테스트 BO 사용 (CRITICAL)

운영 BO(`gb.celebus.xyz`)에 화면·데이터가 부재(PM/ST 휴면, 신규 영역 등)하여 실측 불가한 경우, **테스트 BO(`celebus-backoffice.vercel.app`)에 신규 데이터를 생성한 뒤 실측 정합**해야 한다. "예상 구조"로 명세를 작성하다 본문 보강을 누락하는 패턴의 근본 원인 중 하나.

### 적용 범위

- PM/ST 휴면 상태 + 신규 게임 생성·결과 입력·보상 지급 흐름
- 신규 영역(DUK/EVT/SUP/INF/MEM/COL/APP) 운영 BO 미구현 화면
- 신규 기능 검증 (아티스트 그룹·응모권·덕력 필드 등)

### 테스트 BO 사용 룰

- 인증: `admin@celebus.io / admin1234` (v2/.env 참조)
- [생성]·[수정]·[삭제] 클릭 **허용** (운영 BO는 금지)
- 검증 후 명세에 "**테스트 BO 실측 정합 (vN)**" 노트 명시
- 운영 BO에 화면이 생기면 운영 BO 정합 우선 (테스트 BO는 보조)

### 자기 점검

명세 작성 중 "예상 구조" "v2.x 운영 실측 미실시" "v3.0 운영 재개 시 재조정" 같은 표현을 사용하려는 순간 — 테스트 BO에서 검증 가능한지 먼저 확인. 가능하면 실측 후 명세 작성. 불가능할 때만 보존 노트.

---

## 기획자 언어 룰 자가 검증 (CRITICAL)

명세 작성·갱신 후 즉시 `v2/scripts/planner-language-check.sh <화면 ID>` 실행. enum·camelCase 변수명·영문 prefix·HTML 속성·내부 작업 추적 용어가 본문/변경 이력에 잔존하지 않는지 자가 검증. 메모리 [feedback-planner-language] 룰의 자동 검증 단계.

### 강제 시퀀스

1. 명세 작성·갱신
2. **즉시** `v2/scripts/planner-language-check.sh <화면 ID>` 실행
3. 위반 후보 발견 시 한국어 도메인 용어로 즉시 치환 후 재실행
4. 종료 코드 0 확인 후에만 사이클 완료 보고

### 종합 검증 순서 권장

세 검증 모두 통과 후 사이클 완료:

1. `v2/scripts/changelog-sync-check.sh <화면 ID>` (변경 이력 ↔ 본문)
2. `v2/scripts/planner-language-check.sh <화면 ID>` (기획자 언어)
3. `v2/scripts/sync-check.sh <화면 ID>` (명세 ↔ 프로토타입, 프로토타입 동반 작업 시)

---

## v2 폴더 구조 + 화면 ID 패턴

```
v2/
├── BO/                    # 백오피스 화면 명세 (영역별 폴더)
│   ├── 00-Common/        # CEB-BO-000 (공통 정책), CEB-BO-001 (마이그레이션 마스터)
│   ├── USR/              # 회원 — CEB-BO-002 (가이드) + CEB-BO-USR-*
│   ├── ART/              # 아티스트 — CEB-BO-003 + CEB-BO-ART-*
│   ├── BIVE/             # NFT — CEB-BO-004 + CEB-BO-BIVE-*
│   ├── FQ/               # 팬퀘스트 — CEB-BO-006 + CEB-BO-FQ-* (34개 ✅)
│   └── SYS/              # 관리자 — CEB-BO-005 + CEB-BO-SYS-*
├── APP/                   # 앱 화면 명세 (Phase 11)
├── confluence-html/       # MD ↔ HTML 자동 동기화 (폴더 구조 1:1 미러)
│   ├── BO/{영역}/...
│   └── APP/...
├── scripts/
│   └── update-progress.sh
└── convert-to-html.js     # 재귀 스캔 + 폴더 미러 자동 변환
```

**향후 추가 예정 영역** (Phase 9): `DUK/`, `EVT/`, `SUP/`, `INF/`, `MEM/`, `COL/`, `APP/` (회원 앱 운영 — 배너 등)

**v2 화면 ID 패턴**: `CEB-BO-{영역}-{번호}[-{유형}]`
- 영역: USR / ART / BIVE / RFT / SYS / FQ / DUK / EVT / SUP / INF / MEM / COL / APP / SQ
- 번호: 100(메인), 101~199(메인 하위), 201~299(상세), 301~399(부속), 401~499(내역), 501~599(정책)
- 유형: `Create` / `Edit` / `MD-{action}` (모달)

**HTML 동기화**: `npm run docs:build` (Phase 2 완료 후) 또는 `npm run docs:watch` (실시간)

---

## 화면설명서 작성 원칙

### 대상 독자
- **디자이너**: "아! 내가 이 부분에서는 이런 UX/UI를 디자인하면 되는구나!" 쉽게 이해
- **개발자**: "아! 내가 개발해야 하는 기능과 구조는 이런 거구나!" 쉽게 이해

### 작성 양식

```
1. 화면 목적
2. UI 설명
   - 화면 레이아웃 (ASCII 다이어그램)
   - 영역별 구성요소 (표 형식)
   - 시각적 스타일 묘사는 "피그마 참조"로 통일
3. 화면 내 기능설명
4. 규칙/로직
   - 정렬 기준 (리스트 화면 필수)
   - 상태 정의 (Empty / Disabled / Loading / Error 등)
   - 데이터 기준값 (노출 조건, default 값)
   - 권한/역할별 분기
   - 백오피스 설정이 앱에 반영되는 범위 및 방식
5. 에러 및 예외상황
6. 연관화면ID (표 형식)
```

### 작성 규칙
- DOC 파일 생성 불필요, Confluence 페이지에 바로 붙여넣기 가능하도록 작성
- API/개발 코드 제외, 기능/규칙/로직 중심
- 리스트(내역) 화면은 반드시 정렬 기준 명시
- 시각적 UI 묘사는 와이어프레임 작업 가능 수준으로 상세 작성

---

## 용어 통일 가이드

| 구분 | 통일 용어 | 사용 금지 |
|------|----------|----------|
| GP 증가 | 보상, 환급, 충전 | 발급, 가져오기 |
| GP 감소 | 참여, 부스팅, 출금 | 보내기 |
| 교환 방향 | GP 충전 (CELB→GP), GP 출금 (GP→CELB) | 가져오기, 보내기 |
| 상금 (PM) | 총 상금 GP | 상금풀 |
| 상금 (ST) | 최대 상금풀, 적용 상금풀, 참여비 | 총 상금 GP (ST에서 사용 금지) |
| 게임 상태 | 임시저장/게시대기/진행중/결과 대기/결과 확정/종료 | - |
| GP 이력 | GP 변동 내역 | GP 거래 내역 |
| 참여자 | 참여자 수 | 참여 현황 |
| 관리자 액션 필요 | 결과 입력 필요 | 결과 대기 게임 |
| ST 진행 단위 | 스테이지 | 라운드 |
| ST 결과 | 생존/탈락 | 정답/오답 (PM 전용) |
| ST 보상 | 균등 분배 | 비율 배분 (PM 전용) |
| 게임유형 약칭 | PM (Prediction Market), ST (Survival Trivia) | - |

---

## 게임존 메뉴 구조

### 사이드 메뉴
```
게임존
├── 게임존 홈          → CEB-BO-GZ-101
├── 게임 관리          → CEB-BO-GZ-201
├── 랭킹              → CEB-BO-GZ-401
├── GP 교환소          → CEB-BO-GZ-501
│   └── 지갑 관리      → CEB-BO-GZ-503
└── GP 변동 내역       → CEB-BO-GZ-601

※ 회원상세 (게임존 탭) → CEB-BO-USR-203 (외부 연동 화면)
```

### 전체 화면 목록

| 순서 | 화면ID | 화면명 | 유형 | Phase | 작성상태 |
|------|--------|--------|------|-------|---------|
| 1 | CEB-BO-GZ-101 | 게임존 메인 | Page | 1, 2 | ✅ Phase 2 반영 |
| 2 | CEB-BO-GZ-201 | 게임 리스트 | Page | 1, 2 | ✅ Phase 2 반영 |
| 3 | CEB-BO-GZ-201-CREATE | 게임 생성 | Page | 1, 2 | ✅ Phase 2 반영 |
| 4 | CEB-BO-GZ-201-MD-CANCEL | 생성 취소 확인 | Modal | 1 | ✅ 완료 (변경 없음) |
| 5 | CEB-BO-GZ-202 | 게임 상세 (탭 포함) | Page | 1, 2 | ✅ Phase 2 반영 |
| 6 | CEB-BO-GZ-202-EDIT | 게임 수정 | Page | 1, 2 | ✅ Phase 2 반영 |
| 7 | CEB-BO-GZ-202-MD-EDIT-CANCEL | 수정 취소 확인 | Modal | 1 | ✅ 완료 (변경 없음) |
| 8 | CEB-BO-GZ-202-MD-PUBLISH | 게시 확인 | Modal | 1, 2 | ✅ Phase 2 반영 |
| 9 | CEB-BO-GZ-202-MD-CLOSE | 종료 확인 | Modal | 1, 2 | ✅ Phase 2 반영 |
| 10 | CEB-BO-GZ-202-MD-DELETE | 삭제 확인 | Modal | 1, 2 | ✅ Phase 2 반영 |
| 11 | CEB-BO-GZ-202-MD-RESULT | 결과 입력 | Modal | 1, 2 | ✅ Phase 2 반영 |
| 12 | CEB-BO-GZ-202-MD-REWARD | 보상 지급 확인 | Modal | 1, 2 | ✅ Phase 2 반영 |
| 13 | CEB-BO-GZ-401 | 랭킹 조회 | Page | 1, 2 | ✅ Phase 2 반영 |
| 14 | CEB-BO-GZ-402 | 랭킹 설정 | Page | 1 | ✅ 완료 (변경 없음) |
| 15 | CEB-BO-GZ-501 | 교환 내역 | Page | 1 | ✅ 완료 (변경 없음) |
| 16 | CEB-BO-GZ-501-MD-DETAIL | 교환 상세 | Modal | 1 | ✅ 완료 (변경 없음) |
| 17 | CEB-BO-GZ-502 | 교환 설정 | Page | 1 | ✅ 완료 (변경 없음) |
| 18 | CEB-BO-GZ-503 | 지갑 관리 | Page | 1 | ✅ 완료 (변경 없음) |
| 19 | CEB-BO-GZ-503-MD-REGISTER | 지갑 등록/수정 | Modal | 1 | ✅ 완료 (변경 없음) |
| 20 | CEB-BO-GZ-503-MD-DELETE | 지갑 삭제 확인 | Modal | 1 | ✅ 완료 (변경 없음) |
| 21 | CEB-BO-GZ-601 | GP 변동 내역 | Page | 1, 2 | ✅ Phase 2 반영 |
| 22 | CEB-BO-GZ-601-MD-DETAIL | 변동 상세 | Modal | 1, 2 | ✅ Phase 2 반영 |
| 23 | CEB-BO-USR-203 | 회원상세 (게임존 탭) | Page (탭) | 1, 2 | ✅ Phase 2 반영 |

#### 백오피스 화면 (Fan Quest)

| 순서 | 화면ID | 화면명 | 유형 | 작성상태 |
|------|--------|--------|------|---------|
| 1 | CEB-BO-FQ-101 | 팬퀘스트 메인 (Quest 탭) | Page | ✅ 완료 |
| 2 | CEB-BO-FQ-101-Create | Quest 생성 | Page | ✅ 완료 |
| 3 | CEB-BO-FQ-101-MD-ADD | 팬퀘스트 반려사유 추가 | Modal | ✅ 완료 |
| 4 | CEB-BO-FQ-101-MD-CANCEL | Quest 생성취소 | Modal | ✅ 완료 |
| 5 | CEB-BO-FQ-101-MD-COMPLE | Quest 생성완료 | Modal | ✅ 완료 |
| 6 | CEB-BO-FQ-101-MD-EDIT | 팬퀘스트 반려사유 수정 | Modal | ✅ 완료 |
| 7 | CEB-BO-FQ-101-REJETSET | 팬퀘스트 반려사유 설정 | Page | ✅ 완료 |
| 8 | CEB-BO-FQ-102 | 팬퀘스트 메인 (Raffle 탭) | Page | ✅ 완료 |
| 9 | CEB-BO-FQ-102-CREATE | Raffle 생성 | Page | ✅ 완료 |
| 10 | CEB-BO-FQ-102-MD-CANCEL | Raffle 생성 취소 | Modal | ✅ 완료 |
| 11 | CEB-BO-FQ-102-MD-COMPLE | Raffle 생성 완료 | Modal | ✅ 완료 |
| 12 | CEB-BO-FQ-201 | 퀘스트 상세 (기본정보 탭) | Page | ✅ 완료 |
| 13 | CEB-BO-FQ-201-EDIT | Quest 수정 | Page | ✅ 완료 |
| 14 | CEB-BO-FQ-201-MD-CANCEL | Quest 수정취소 | Modal | ✅ 완료 |
| 15 | CEB-BO-FQ-201-MD-CLOSE | Quest 종료 | Modal | ✅ 완료 |
| 16 | CEB-BO-FQ-201-MD-COMPLE | Quest 수정완료 | Modal | ✅ 완료 |
| 17 | CEB-BO-FQ-201-MD-DELETE | Quest 삭제 | Modal | ✅ 완료 |
| 18 | CEB-BO-FQ-201-MD-OPEN | Quest 게시 | Modal | ✅ 완료 |
| 19 | CEB-BO-FQ-202 | 퀘스트 상세 (대기내역 탭) | Page | ✅ 완료 |
| 20 | CEB-BO-FQ-202-MD-REJECT | Quest 반려사유 | Modal | ✅ 완료 |
| 21 | CEB-BO-FQ-203 | 퀘스트 상세 (처리내역 탭) | Page | ✅ 완료 |
| 22 | CEB-BO-FQ-204 | Raffle 상세 (기본정보 탭) | Page | ✅ 완료 |
| 23 | CEB-BO-FQ-204-EDIT | Raffle 수정 | Page | ✅ 완료 |
| 24 | CEB-BO-FQ-204-MD-CANCEL | Raffle 수정취소 | Modal | ✅ 완료 |
| 25 | CEB-BO-FQ-204-MD-CLOSE | Raffle 종료 | Modal | ✅ 완료 |
| 26 | CEB-BO-FQ-204-MD-COMPLE | Raffle 수정완료 | Modal | ✅ 완료 |
| 27 | CEB-BO-FQ-204-MD-DELETE | Raffle 삭제 | Modal | ✅ 완료 |
| 28 | CEB-BO-FQ-204-MD-OPEN | Raffle 게시 | Modal | ✅ 완료 |
| 29 | CEB-BO-FQ-205 | Raffle 상세 (응모내역 탭) | Page | ✅ 완료 |
| 30 | CEB-BO-FQ-205-MD-DETAIL | 응모내역 상세 | Modal | ✅ 완료 |
| 31 | CEB-BO-FQ-206 | Raffle 상세 (추첨내역 탭) | Page | ✅ 완료 |
| 32 | CEB-BO-FQ-206-MD-DETAIL | 당첨자 비고사항 | Modal | ✅ 완료 |
| 33 | CEB-BO-FQ-206-MD-DRAW | Raffle 추첨하기 | Modal | ✅ 완료 |
| 34 | CEB-BO-FQ-301 | 응모권 거래 내역 | Page | ✅ 완료 |

#### 앱 화면 (Phase 1 - Prediction Market)

| 순서 | 화면ID | 화면명 | 유형 | Phase | 작성상태 |
|------|--------|--------|------|-------|---------|
| 1 | CEB-GAM-101 | 게임존 메인 | Page | 1 | ✅ 완료 |
| 2 | CEB-GAM-201 | Prediction Market 리스트 | Page | 1 | ✅ 완료 |
| 3 | CEB-GAM-202 | Prediction Market 상세 | Page | 1 | ✅ 완료 |
| 4 | CEB-GAM-202-MD-CONFIRMED | 참여확정 | Modal | 1 | ✅ 완료 |
| 5 | CEB-GAM-202-MD-COMPLETED | 참여완료 | Modal | 1 | ✅ 완료 |
| 6 | CEB-GAM-202-MD-NOBALANCE | GP 잔고 부족 | Modal | 1 | ✅ 완료 |
| 7 | CEB-GAM-203 | 결과 상세 | Page | 1 | ✅ 완료 |
| 8 | CEB-GAM-301 | GP 교환소 | Page | 1 | ✅ 완료 |
| 9 | CEB-GAM-302 | CELB 입금주소 상세 | Page | 1 | ✅ 완료 |
| 10 | CEB-GAM-401 | 랭킹 | Page | 1 | ✅ 완료 |
| 11 | CEB-GAM-501 | GP 히스토리 | Page | 1 | ✅ 완료 |
| 12 | CEB-GAM-502 | 참여내역 상세 | Page | 1 | ✅ 완료 |
| 13 | CEB-GAM-503 | 교환내역 상세 | Page | 1 | ✅ 완료 |

#### 앱 화면 (Phase 2 - Survival Trivia)

| 순서 | 화면ID | 화면명 | 유형 | Phase | 작성상태 |
|------|--------|--------|------|-------|---------|
| 1 | CEB-GAM-204 | 트리비아 홈 | Page | 2 | ✅ 완료 |
| 2 | CEB-GAM-205 | Pre-start (대기/카운트다운) | Page | 2 | ✅ 완료 |
| 3 | CEB-GAM-205-MD-RECONNECT | 재연결 안내 | Modal | 2 | ✅ 완료 |
| 4 | CEB-GAM-206 | 트리비아 상세 (게임 진행) | Page | 2 | ✅ 완료 |
| 5 | CEB-GAM-206-MD-ELIMINATE | 탈락 | Modal | 2 | ✅ 완료 |
| 6 | CEB-GAM-206-MD-LEAVE | 나가기 확인 | Modal | 2 | ✅ 완료 |
| 7 | CEB-GAM-206-SPECTATE | 관전 모드 | Page | 2 | ✅ 완료 |
| 8 | CEB-GAM-206-RESULT | 게임 결과 | Page | 2 | ✅ 완료 |

#### 앱 화면 (Fan Quest)

| 순서 | 화면ID | 화면명 | 유형 | 작성상태 |
|------|--------|--------|------|---------|
| 1 | CEB-HOM-501-FQ | 홈 메인 (Phase1) | Page | ✅ 완료 |
| 2 | CEB-FQ-201 | Event | Page | ✅ 완료 |
| 3 | CEB-FQ-201-MD | 반려 사유 모달 | Modal | ✅ 완료 |
| 4 | CEB-FQ-202 | Raffle 상세(진행중) | Page | ✅ 완료 |
| 5 | CEB-FQ-202-MD | Raffle 응모 모달 | Modal | ✅ 완료 |
| 6 | CEB-FQ-203 | Raffle 상세(당첨) | Page | ✅ 완료 |
| 7 | CEB-FQ-204 | Raffle 상세(미당첨) | Page | ✅ 완료 |
| 8 | CEB-FQ-205 | Quest 제출 | Page | ✅ 완료 |
| 9 | CEB-FQ-301 | 응모권 | Page | ✅ 완료 |

---

## 게임 상태 정의

| 상태 | 코드 | 설명 | Badge 색상 | 앱 반영 |
|------|------|------|-----------|---------|
| 임시저장 | Draft | 작성 완료, 미게시 | 회색 | 노출 안됨 |
| 게시대기 | Ready | 생성 완료, 게시 대기 중 | 파란색 | 노출 안됨 |
| 진행중 | Active | 참여 가능 | 초록색 | 참여 가능 |
| 결과 대기 | Pending | 참여 마감, 결과 입력 대기 | 주황색 | 결과 대기 표시 |
| 결과 확정 | Closed | 결과 확정, 보상 지급 전 | 보라색 | 결과 확인 가능 |
| 종료 | Ended | 보상 지급 완료 | 검정색 | 종료 표시 |

### 게임유형별 상태 흐름

- **Prediction Market**: Draft → Ready → Active → Pending → Closed → Ended (관리자 수동 결과 입력/보상 지급)
- **Survival Trivia**: Draft → Ready → Active → Ended (서버 자동 판정/보상 지급, Pending/Closed 없음)

### 상태별 가능 액션 (Prediction Market)

| 현재 상태 | 가능 액션 |
|----------|----------|
| 임시저장 (Draft) | 삭제하기, 수정하기 |
| 게시대기 (Ready) | 삭제하기, 수정하기, 게시하기 |
| 진행중 (Active) | 수정하기, 강제 종료 |
| 결과 대기 (Pending) | 수정하기, 결과 입력, 강제 종료 |
| 결과 확정 (Closed) | 결과 수정, 보상 지급 |
| 종료 (Ended) | 버튼 없음 |

### 상태별 가능 액션 (Survival Trivia)

| 현재 상태 | 가능 액션 |
|----------|----------|
| 임시저장 (Draft) | 삭제하기, 수정하기 |
| 게시대기 (Ready) | 삭제하기, 수정하기, 게시하기 |
| 진행중 (Active) | 수정하기 (퀴즈 제외), 강제 종료 |
| 종료 (Ended) | 버튼 없음 |

---

## GP 변동 유형 정의

| 유형 | 코드 | 설명 | GP 변동 | 게임유형 | 비고 |
|------|------|------|---------|----------|------|
| 참여 | PARTICIPATION | 게임 참여 시 | - (차감) | PM, ST | - |
| 부스팅 | BOOSTING | 부스팅 사용 시 | - (차감) | PM 전용 | ST에는 부스팅 없음 |
| 환급 | REFUND | 결과 발표 후 참여 GP 반환 | + (증가) | PM 전용 | ST는 참여GP 환급 없음 |
| 보상 | REWARD | 정답/생존 시 보상 지급 | + (증가) | PM, ST | PM: 비율배분, ST: 균등분배 |
| 환불 | REFUND_CANCEL | 게임 취소 시 환불 | + (증가) | PM, ST | PM: 부스팅+참여GP, ST: 참여GP만 |
| GP 충전 | EXCHANGE_IN | CELB → GP 교환 | + (증가) | 공통 | 게임유형 무관 |
| GP 출금 | EXCHANGE_OUT | GP → CELB 교환 | - (차감) | 공통 | 게임유형 무관 |

---

## 권한 관리

| 대메뉴 | 중메뉴 | 읽기 | 쓰기 | 삭제 |
|--------|--------|------|------|------|
| 게임존 | 게임 관리 | ☑ | ☑ | ☑ |
| 게임존 | 랭킹 | ☑ | ☑ | - |
| 게임존 | GP 교환소 | ☑ | ☑ | - |
| 게임존 | GP 변동 내역 | ☑ | - | - |

---

## Prediction Market 게임 생성 입력 항목 (참고)

### 게임유형
- 게임유형 선택 (Prediction Market / Survival Trivia, Phase 1: Prediction Market 고정)

### 기본정보
- 타이틀 (KO/EN/JP, 각 50자)
- 상세설명 (KO/EN/JP, WYSIWYG 에디터)
- 힌트 링크 (사용/미사용 Segmented Button, 기본: 미사용, 사용 시 URL 입력)

### 보상설정
- 총 상금 GP

### 참여설정
- 참여 정원 (체크박스 '참여 정원 제한', 미체크 시 무제한)
- 참여 비용 (기본 1GP)
- 부스팅 비용 (기본 1GP, 필수)
- 부스팅 배수 (기본 2배, 최대 10배, 필수)

### 일정설정
- 투표 종료일시
- 결과 발표 예정일

> 투표 시작일시는 게시 시점에 자동 설정

### 결과설정
- 결과 확인 기준 (KO/EN/JP, 텍스트)
- 결과 확인 링크 (URL, 결과 입력 시 입력)

### CTA 버튼
- [취소] / [임시저장] / [생성하기]

---

## Survival Trivia 게임 생성 입력 항목 (참고)

### 게임유형
- Survival Trivia 선택

### 기본정보
- 타이틀 (KO/EN/JP, 각 50자)
- 상세설명 (KO/EN/JP, WYSIWYG 에디터)

### 퀴즈 관리 (ST 전용)
- 총 10문제, 각 문제당:
  - 문제 텍스트 (KO/EN/JP)
  - 4개 선택지 (KO/EN/JP)
  - 정답 지정 (Radio)
  - 제한시간 (기본 10초)

### 보상설정
- 최대 상금풀 (수동 입력)
- 배수 (수동 입력, 기본값 1.25)
- 참여비 (자동 계산: floor(최대 상금풀 / 최대 모집인원 × 배수), readonly)
- 모집인원별 상금 단계 (동적 행 추가/삭제 테이블, 기본: 100%→100%, 80%→80%, 50%→50%, 20%→20%)
- 탈락자 응모권 수량 (수동 입력, 팬퀘스트 응모권)

### 참여설정
- 최대 모집인원 (수동 입력, 상한 없음)
- 부스팅 없음

### 일정설정
- 게임 시작일시 (Date + Time Picker)

> 게시 시 게임 일정이 앱에 공개되며, 시작 10분 전부터 입장 가능

### CTA 버튼
- [취소] / [임시저장] / [생성하기]

---

## 보상 계산 로직 (참고)

### Prediction Market (비율 배분)

- 정답자 보상 = 총 상금 GP × (개인 배분 값 / 전체 합)
- 기본: 개인 배분 값 = 참여 GP
  - 부스팅 구매시: 개인 배분 값 = 참여 GP × 부스팅 배수
- 전체 합 = ∑(각 참여자의 배분 값)
- 배수는 게임별 설정값 (기본 2배, 최대 10배)
- 참여 GP는 정답/오답 관계없이 전액 환급
- 부스팅 GP는 환급 없음, 배분 가중치로만 사용
- 소수점 8자리 이하 절삭, 단수는 시스템 귀속

### Survival Trivia (동적 상금풀 + 균등 분배)

- 참여비 = floor(최대 상금풀 / 최대 모집인원 × 배수)
- 적용 상금풀 결정: 게임 시작 시 실제 모집인원 기준
  - 모집률 = 실제 모집인원 / 최대 모집인원
  - 단계 사이 모집률은 하위 단계 적용 (보수적)
  - 적용 상금풀 = 최대 상금풀 × 해당 단계의 상금 비율
- 생존자 1인당 보상 = floor(적용 상금풀 / 최종 생존자 수)
- 참여비 환급 없음
- 부스팅 없음
- 탈락자 보상: 모든 탈락자에게 팬퀘스트 응모권 지급 (관전 여부 무관)
- 관전 완료 탈락자: 하트 1개 + 응모권 병행 지급
- 전원 탈락 시: 적용 상금풀이 시스템에 귀속
- 소수점 8자리 이하 절삭, 단수는 시스템 귀속
- 보상은 서버에서 자동 지급 (관리자 수동 지급 불필요)

---

## 관리자 활동 로그 정의

| 대분류 | 중분류 | 소분류 | 로그 메시지 |
|--------|--------|--------|------------|
| 게임존 | 게임 관리 | 생성 | 게임 '{타이틀}'을(를) 생성했습니다. (유형: {게임유형}) |
| 게임존 | 게임 관리 | 수정 | 게임 '{타이틀}'의 정보를 수정했습니다. |
| 게임존 | 게임 관리 | 게시 | 게임 '{타이틀}'을(를) 게시했습니다. |
| 게임존 | 게임 관리 | 종료 | 게임 '{타이틀}'을(를) 종료했습니다. |
| 게임존 | 게임 관리 | 삭제 | 게임 '{타이틀}'을(를) 삭제했습니다. |
| 게임존 | 게임 관리 | 결과 입력 | 게임 '{타이틀}'의 결과를 입력했습니다. (결과: {YES/NO}) |
| 게임존 | 게임 관리 | 보상 지급 | 게임 '{타이틀}'의 보상을 지급했습니다. (대상: {n}명, 총 GP: {n}) |
| 게임존 | 랭킹 | 설정 변경 | 랭킹 설정을 변경했습니다. (TOP 10 공개: {ON/OFF}) |
| 게임존 | 교환소 | 설정 변경 | GP 교환 설정을 변경했습니다. |
| 게임존 | 교환소 | 지갑 등록 | 지갑을 등록했습니다. (유형: {유형}, 주소: {주소}) |
| 게임존 | 교환소 | 지갑 수정 | 지갑을 수정했습니다. (지갑ID: {id}) |
| 게임존 | 교환소 | 지갑 삭제 | 지갑을 삭제했습니다. (지갑ID: {id}) |
| 게임존 | 교환소 | 지갑 상태 변경 | 지갑 상태를 변경했습니다. (지갑ID: {id}, 상태: {상태}) |
| 게임존 | 교환소 | 대표 지갑 변경 | 대표 지갑을 변경했습니다. (유형: {유형}, 지갑ID: {id}) |

---

## 공통 UI 상태 정의

모든 화면에서 아래 상태를 고려하여 작성:

| 상태 | 설명 | 표시 |
|------|------|------|
| Loading | 데이터 로딩 중 | Skeleton UI |
| Default | 데이터 정상 조회 | 조회된 값 표시 |
| Empty | 데이터 없음 | Empty 메시지 또는 "0" 표시 |
| Error | 조회 실패 | 에러 메시지 + 재시도 버튼 |
| Disabled | 비활성화 상태 | 회색 처리, 클릭 불가 |

---

## 공통 토스트 규격

모든 화면의 토스트 알림은 아래 공통 규격을 따릅니다. 개별 화면 스펙에서는 메시지 텍스트와 토스트 타입만 명시합니다.

| 항목 | 값 |
|------|------|
| 위치 | 화면 상단 중앙 |
| 상단 여백 | 20px |
| Z-index | 9999 (최상위 레이어) |
| 자동 닫힘 | 3초 |
| 닫기 버튼 | [X] 아이콘 버튼 (우측) |
| 페이드인 | 0.2초 (opacity 0→100%, translateY -10→0px) |
| 페이드아웃 | 0.3초 (opacity 100→0%, translateY 0→-10px) |
| 최대 스택 | 3개 (오래된 것부터 자동 닫힘) |

| 토스트 타입 | 스타일 |
|------------|--------|
| Success | 초록색 체크 아이콘, 밝은 배경 |
| Error | 빨간색 배경, 느낌표 아이콘 |

---

## 공통 규칙

### 날짜/시간 포맷
- 날짜: YYYY.MM.DD (예: 2025.01.15)
- 시간: HH:mm (예: 14:30)
- 기간: MM.DD ~ MM.DD (같은 연도) / YY.MM.DD ~ YY.MM.DD (다른 연도)

### 숫자 포맷
- 천 단위 콤마: 1,234
- GP 표시: {숫자} GP (예: 1,000 GP)

### 시간 기준
- 서버 기준: KST (UTC+9)
- "오늘" 기준: 00:00:00 ~ 23:59:59

---

## 문서 동기화 규칙

- MD 문서를 수정할 때, 반드시 대응하는 HTML 문서도 동일하게 수정해야 한다
- MD 문서가 원본이며, HTML은 Confluence 업로드용 변환본이다

### 폴더 매핑

| MD 폴더 | HTML 폴더 | 파일 종류 |
| ------- | --------- | --------- |
| `BO-GAM/` | `confluence-html/BO-GAM/` | CEB-BO-GZ-*, CEB-BO-USR-* |
| `APP-GAM/` | `confluence-html/APP-GAM/` | CEB-GAM-* |
| `BO-FQ/` | `confluence-html/BO-FQ/` | CEB-BO-FQ-* |
| `APP-FQ/` | `confluence-html/APP-FQ/` | CEB-FQ-*, CEB-HOM-501-FQ |

- 파일명 매핑: `{MD폴더}/[화면ID] 제목.md` ↔ `confluence-html/{HTML폴더}/[화면ID] 제목.html`

## 정책 중앙화 규칙

- **공통 정책 정의서**: `BO-GAM/[CEB-BO-GZ-000] 공통 정책.md` (게임 상태, 액션, 보상 계산, GP 변동 유형, 권한, UI 상태, 토스트/포맷 규격 등)
- **공통 정책 변경 시**: `[CEB-BO-GZ-000]` MD + HTML만 수정 (개별 화면 스펙 문서 수정 불필요)
- **개별 스펙 문서**: 해당 화면 고유 로직만 기술. 공통 정책은 `[CEB-BO-GZ-000]` 참조로 대체
- **신규 스펙 작성 시**: 공통 정책에 해당하는 내용은 직접 기술하지 말고 `[CEB-BO-GZ-000]` 참조를 사용

---

## 참고 문서

프로젝트 폴더 내 클라이언트 앱 PDF 문서:
- `game.pdf` - Game Zone 메인, Prediction Market 상세
- `GP활동내역.pdf` - 게임 참여내역, 교환 내역
- `랭킹.pdf` - 누적 GP 기준 전체 랭킹
- `교환소.pdf` - GP↔CELB 교환

