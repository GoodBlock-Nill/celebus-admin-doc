# [CEB-BO-006] Quest(FQ) 영역 가이드 (Quest 화면 SQ 영역으로 이전됨)

> ⚠️ **영역 분리 (v1.2, 2026-05-13)** — 본 문서는 v1.1까지 Quest와 Raffle을 함께 다뤘으나, 사이드바 메뉴 재구성으로 **Raffle은 [CEB-BO-012] RFL 독립 영역**(`v2/BO/RFL/`)으로 이전되었습니다. Raffle 명세는 [CEB-BO-012] 및 `[CEB-BO-RFL-101 ~ 203-MD-NOTE]` 참조.
>
> 🚫 **Quest 화면 SQ 영역 흡수 (v2.0, 2026-05-20)** — Quest 관련 17개 화면 명세도 SQ 영역으로 이전되었습니다. 최신 명세는 **[CEB-BO-011] 스토리 퀘스트(SQ) 영역 가이드** 및 SQ-302·303·304·305·501 시리즈 참조. 기존 FQ 원본 17개 파일은 DEPRECATED 표기로 본 폴더에 이력 보존. 본 문서는 v1.x 운영 인벤토리 + 분석 리포트 참조 용도로만 유지된다.

## Page Properties

| Key | Value |
| ---- | ---- |
| Screen ID | CEB-BO-006 |
| 기획담당자 | @Nill Yoo |
| 디자인담당자 | |
| 개발담당자 | |
| 기능영역(Epic) | BO Quest·Raffle 영역 (FQ) |
| 상태 | Draft |
| 버전 | v2.0 |
| 최근 업데이트 | 2026.05.20 |
| 비고 | v2.0 — Quest 17개 화면 SQ 영역으로 흡수. 최신 명세는 [CEB-BO-011] 및 SQ-302/303/304/305/501 시리즈. 본 문서는 v1.x 인벤토리 + 분석 리포트 참조 용도 |

---

## 1. 개요

Quest·Raffle(FQ) 영역은 CELEBUS 팬퀘스트 서비스의 **운영 핵심**으로, Quest(미션형) 와 Raffle(추첨형) 두 종류 콘텐츠의 생성·검수·추첨·배송을 담당한다. 분석 리포트(`[CEB-BO-001-A]`)에서 검증된 바와 같이 현재 BO 운영의 **활성 영역**이며, BIVE NFT 자동 민팅과도 연결되어 있다 (24개 캠페인 중 23개가 팬퀘스트 보상).

| 항목 | 위치 |
| --- | --- |
| 마스터 가이드 | [CEB-BO-001] §2 12영역 매핑 (#1 FQ), §3 마이그레이션 전략 |
| 영역 ID 체계 | [CEB-BO-001] §5 — `CEB-BO-FQ-{번호}[-{유형}]` |
| 권한 매트릭스 | [CEB-BO-000] §3·§4 (4단계 권한 정책) |
| 다국어 입력 | [CEB-BO-000] §5 (KO/EN/JP 3언어 동시 필수) |
| 활동 로그 | [CEB-BO-000] §6 (3년 보관 append-only) |
| BIVE 보상 연결 | [CEB-BO-004] §4.3 민팅 캠페인 — 팬퀘스트 보상 자동 민팅 |
| 분석 리포트 | [CEB-BO-001-A] §3.7 팬퀘스트 영역 검증 |

---

## 1A. 사이드바 메뉴 위치 (v1.1)

v1.1부터 Quest/Raffle은 **탭이 아닌 독립 페이지**이며 서로 다른 메뉴 그룹에 속한다.

```
에피소드 (BookOpenIcon)
  ├─ 그룹 리스트          → /sq/groups/list
  ├─ 팬퀘스트 대기내역    → /sq/pending
  └─ 팬퀘스트            → /sq/quests        ★ 이전 /fanquest Quest 탭
래플 (SparklesIcon)       ← 이전 "팬퀘스트" 단일 항목을 그룹으로 승격
  ├─ 래플                → /raffle           ★ 이전 /fanquest Raffle 탭
  ├─ 응모권 현황         → /rft/current      (응모권 그룹에서 이동)
  └─ 변동 내역           → /rft/history      (응모권 그룹에서 이동)
```

> ⚠️ 기존 `/fanquest`는 `/sq/quests`로 자동 redirect 처리되어 북마크 호환성 유지. 상세·수정·생성·반려사유 라우트(`/fanquest/[id]`, `/fanquest/[id]/edit`, `/fanquest/create`, `/fanquest/reject-reasons`)는 그대로 유지된다.

---

## 2. 화면 목록 (Quest 관련 17개는 SQ 영역으로 흡수됨)

### 2.0 SQ 영역 흡수 매핑 (v2.0, 2026-05-20)

Quest 관련 모든 화면(17개) 명세가 SQ 영역으로 이전되었다. FQ 원본 파일은 DEPRECATED 표기로 본 폴더에 이력 보존.

| FQ 원본 ID | 신규 SQ ID | 신규 화면명 (최신 명세 위치) |
| --- | --- | --- |
| CEB-BO-FQ-101 | **CEB-BO-SQ-302** | 팬퀘스트 리스트 |
| CEB-BO-FQ-101-CREATE | **CEB-BO-SQ-302-CREATE** | Quest 생성 |
| CEB-BO-FQ-101-MD-CANCEL | **CEB-BO-SQ-302-MD-CANCEL** | Quest 생성 취소 모달 |
| CEB-BO-FQ-101-MD-COMPLE | **CEB-BO-SQ-302-MD-COMPLE** | Quest 생성 완료 모달 |
| CEB-BO-FQ-201 | **CEB-BO-SQ-303** | Quest 상세 (기본정보 탭) |
| CEB-BO-FQ-201-EDIT | **CEB-BO-SQ-303-EDIT** | Quest 수정 |
| CEB-BO-FQ-201-MD-OPEN | **CEB-BO-SQ-303-MD-OPEN** | Quest 게시 모달 |
| CEB-BO-FQ-201-MD-CLOSE | **CEB-BO-SQ-303-MD-CLOSE** | Quest 종료 모달 |
| CEB-BO-FQ-201-MD-DELETE | **CEB-BO-SQ-303-MD-DELETE** | Quest 삭제 모달 |
| CEB-BO-FQ-201-MD-CANCEL | **CEB-BO-SQ-303-MD-CANCEL** | Quest 수정 취소 모달 |
| CEB-BO-FQ-201-MD-COMPLE | **CEB-BO-SQ-303-MD-COMPLE** | Quest 수정 완료 모달 |
| CEB-BO-FQ-202 | **CEB-BO-SQ-304** | Quest 상세 (대기내역 탭) |
| CEB-BO-FQ-202-MD-REJECT | **CEB-BO-SQ-304-MD-REJECT** | 제출 반려 모달 |
| CEB-BO-FQ-203 | **CEB-BO-SQ-305** | Quest 상세 (처리내역 탭) |
| CEB-BO-FQ-101-REJETSET | **CEB-BO-SQ-501** | 반려사유 설정 |
| CEB-BO-FQ-101-MD-ADD | **CEB-BO-SQ-501-MD-ADD** | 반려사유 추가 모달 |
| CEB-BO-FQ-101-MD-EDIT | **CEB-BO-SQ-501-MD-EDIT** | 반려사유 수정 모달 |

이하 §2.1~§2.4의 인벤토리는 v1.x 운영 시점 참조용이며, **최신 명세는 위 매핑 표의 SQ ID 문서를 참조**할 것.

### 2.1 메인 진입 (2 · v1.1부터 독립 페이지)

| 화면ID | 화면명 | 라우트 | 유형 | v1 흡수 / v2 신규 | 마이그레이션 상태 |
| --- | --- | --- | --- | --- | --- |
| CEB-BO-FQ-101 | 팬퀘스트 (Quest 리스트) | `/sq/quests` | Page | → [CEB-BO-SQ-302] | 🚫 DEPRECATED (SQ-302로 이전) |
| CEB-BO-FQ-102 | 래플 (Raffle 리스트) | `/raffle` | Page | v1 흡수 + v2 정책 호환 | ✅ v1.1 (스텁) |

### 2.2 Quest 생성·생성 모달 (5) — DEPRECATED (SQ 영역으로 이전)

| 화면ID | 화면명 | 유형 | 마이그레이션 상태 |
| --- | --- | --- | --- |
| CEB-BO-FQ-101-CREATE | Quest 생성 | Page | 🚫 → [CEB-BO-SQ-302-CREATE] |
| CEB-BO-FQ-101-MD-CANCEL | Quest 생성 취소 | Modal | 🚫 → [CEB-BO-SQ-302-MD-CANCEL] |
| CEB-BO-FQ-101-MD-COMPLE | Quest 생성 완료 | Modal | 🚫 → [CEB-BO-SQ-302-MD-COMPLE] |
| CEB-BO-FQ-101-MD-ADD | 반려사유 추가 | Modal | 🚫 → [CEB-BO-SQ-501-MD-ADD] |
| CEB-BO-FQ-101-MD-EDIT | 반려사유 수정 | Modal | 🚫 → [CEB-BO-SQ-501-MD-EDIT] |

### 2.3 Quest 상세·수정·검수 (8) — DEPRECATED (SQ 영역으로 이전)

| 화면ID | 화면명 | 유형 | 마이그레이션 상태 |
| --- | --- | --- | --- |
| CEB-BO-FQ-201 | Quest 상세 (기본정보 탭) | Page | 🚫 → [CEB-BO-SQ-303] |
| CEB-BO-FQ-202 | Quest 상세 (대기내역 탭) | Page | 🚫 → [CEB-BO-SQ-304] |
| CEB-BO-FQ-203 | Quest 상세 (처리내역 탭) | Page | 🚫 → [CEB-BO-SQ-305] |
| CEB-BO-FQ-201-EDIT | Quest 수정 | Page | 🚫 → [CEB-BO-SQ-303-EDIT] |
| CEB-BO-FQ-201-MD-OPEN | Quest 게시 | Modal | 🚫 → [CEB-BO-SQ-303-MD-OPEN] |
| CEB-BO-FQ-201-MD-CLOSE | Quest 종료 | Modal | 🚫 → [CEB-BO-SQ-303-MD-CLOSE] |
| CEB-BO-FQ-201-MD-DELETE | Quest 삭제 | Modal | 🚫 → [CEB-BO-SQ-303-MD-DELETE] |
| CEB-BO-FQ-202-MD-REJECT | Quest 반려사유 | Modal | 🚫 → [CEB-BO-SQ-304-MD-REJECT] |

### 2.4 Quest 부속 모달 (3) — DEPRECATED (SQ 영역으로 이전)

| 화면ID | 화면명 | 유형 | 마이그레이션 상태 |
| --- | --- | --- | --- |
| CEB-BO-FQ-201-MD-CANCEL | Quest 수정 취소 | Modal | 🚫 → [CEB-BO-SQ-303-MD-CANCEL] |
| CEB-BO-FQ-201-MD-COMPLE | Quest 수정 완료 | Modal | 🚫 → [CEB-BO-SQ-303-MD-COMPLE] |
| CEB-BO-FQ-101-REJETSET | 반려사유 설정 | Page | 🚫 → [CEB-BO-SQ-501] |

### 2.5 Raffle 생성·생성 모달 (3)

| 화면ID | 화면명 | 유형 |
| --- | --- | --- |
| CEB-BO-FQ-102-CREATE | Raffle 생성 | Page |
| CEB-BO-FQ-102-MD-CANCEL | Raffle 생성 취소 | Modal |
| CEB-BO-FQ-102-MD-COMPLE | Raffle 생성 완료 | Modal |

### 2.6 Raffle 상세·수정·관리 (8)

| 화면ID | 화면명 | 유형 |
| --- | --- | --- |
| CEB-BO-FQ-204 | Raffle 상세 (기본정보 탭) | Page |
| CEB-BO-FQ-204-EDIT | Raffle 수정 | Page |
| CEB-BO-FQ-204-MD-OPEN | Raffle 게시 | Modal |
| CEB-BO-FQ-204-MD-CLOSE | Raffle 종료 | Modal |
| CEB-BO-FQ-204-MD-DELETE | Raffle 삭제 | Modal |
| CEB-BO-FQ-204-MD-CANCEL | Raffle 수정 취소 | Modal |
| CEB-BO-FQ-204-MD-COMPLE | Raffle 수정 완료 | Modal |

### 2.7 Raffle 응모·추첨 (4)

| 화면ID | 화면명 | 유형 |
| --- | --- | --- |
| CEB-BO-FQ-205 | Raffle 상세 (응모내역 탭) | Page |
| CEB-BO-FQ-205-MD-DETAIL | 응모내역 상세 | Modal |
| CEB-BO-FQ-206 | Raffle 상세 (추첨내역 탭) | Page |
| CEB-BO-FQ-206-MD-DRAW | Raffle 추첨하기 | Modal |
| CEB-BO-FQ-206-MD-DETAIL | 당첨자 비고사항 | Modal |

### 2.8 응모권 거래 (1)

| 화면ID | 화면명 | 유형 |
| --- | --- | --- |
| CEB-BO-FQ-301 | 응모권 거래 내역 | Page |

### 2.9 일일 미션 (1, Phase 12 신규)

| 화면ID | 화면명 | 유형 |
| --- | --- | --- |
| CEB-BO-FQ-501 | 일일 미션 관리 | Page (3탭: 미션 풀·정책 설정·통계·로그) |

> APP `[CEB-FQ-501]` v2.2 대응. 출석 5DUK + 일괄 25DUK + 스트릭 4단계 (7/14/30/100일).

---

## 2A. APP↔BO 영역 매핑 정합 (Phase 12 보강)

> ⚠️ **APP과 BO의 영역 접두어 불일치 주의** — APP 화면 ID의 영역 접두어는 BO 영역과 1:1로 일치하지 않는다. 다음 매핑을 따른다.

| APP 화면ID | APP 화면명 | 관리 BO 화면 (실제 운영) | BO 영역 |
| --- | --- | --- | --- |
| CEB-EVT-101 | Raffle 메인 (앱) | CEB-BO-FQ-102 | **FQ** (Raffle 등록) |
| CEB-EVT-102 | Raffle 상세 (진행중) | CEB-BO-FQ-204 | **FQ** (기본정보 탭) |
| CEB-EVT-102-MD | Raffle 응모 모달 | CEB-BO-FQ-205 | **FQ** (응모내역 탭) |
| CEB-EVT-103 | Raffle 상세 (당첨) | CEB-BO-FQ-204~206 | **FQ** |
| CEB-EVT-104 | Raffle 상세 (미당첨) | CEB-BO-FQ-206 | **FQ** (추첨내역 탭) |
| CEB-EVT-201 | 팬덤 레벨 (앱) | CEB-BO-EVT-101/201/401 | **EVT** (팬덤 레벨 전용) |
| CEB-EVT-301 | 응모권 (앱) | CEB-BO-FQ-301 | **FQ** (9종 거래 코드) |
| CEB-FQ-501 | 일일 미션 (앱) | CEB-BO-FQ-501 | **FQ** (Phase 12 신규) |

**핵심 규칙**:
- APP **EVT-1xx**는 모두 **Raffle** → **BO-FQ**에서 관리
- APP **EVT-201**만 **팬덤 레벨** → **BO-EVT**에서 관리
- APP **EVT-301**은 **응모권 거래** → **BO-FQ-301**에서 관리

---

## 3. 화면 ID 체계

[CEB-BO-001] §5 화면 ID 표 FQ 행 발췌.

| 메인 List | Create | Edit | Detail (탭) | 부속 | 모달 |
| --- | --- | --- | --- | --- | --- |
| **101** (Quest 탭), **102** (Raffle 탭) | 101-CREATE, 102-CREATE | 201-EDIT, 204-EDIT | 201~206 (Quest 3탭, Raffle 3탭) | 301 (응모권 거래), 101-REJETSET | MD-OPEN, MD-CLOSE, MD-DELETE, MD-CANCEL, MD-COMPLE, MD-REJECT, MD-DETAIL, MD-DRAW, MD-ADD, MD-EDIT |

**번호 분배 사유**:
- 101 = Quest 메인 (Quest 탭), 102 = Raffle 메인 (Raffle 탭) — 두 종류 콘텐츠 분리
- 201~203 = Quest 상세 3탭 (기본정보 / 대기내역 / 처리내역)
- 204~206 = Raffle 상세 3탭 (기본정보 / 응모내역 / 추첨내역)
- 301 = 응모권 거래 내역 (Quest·Raffle 전체 통합)

---

## 4. 권한 매트릭스

[CEB-BO-000] §4 적용. FQ 영역은 OPERATOR 중심 운영.

### 4.1 화면별 R/W/D

| 화면 | SUPER | OPERATOR | POLICY | EXTERNAL_ARTIST |
| --- | --- | --- | --- | --- |
| FQ-101/102 메인 | R | R/W (생성·검수) | R | R (자기 아티스트 한정) |
| FQ-101-CREATE / 102-CREATE | R/W | R/W | — | R/W (자기 아티스트, 검수 제외) |
| FQ-201/202/203/204 상세 | R/W/D | R/W | R | R (자기 아티스트 한정) |
| FQ-201-EDIT / 204-EDIT | R/W | R/W (생성자 본인 또는 SUPER 위임) | — | R/W (자기 아티스트) |
| FQ-201-MD-OPEN/CLOSE 게시·종료 | R/W | R/W | — | — (검수 권한 없음) |
| FQ-201-MD-DELETE 삭제 | R/W (Draft만) | R/W (Draft만) | — | R/W (자기 아티스트, Draft만) |
| FQ-202-MD-REJECT 반려 | R/W | R/W (검수자 본인) | — | — |
| FQ-205 응모내역 | R | R | R | R (자기 아티스트) |
| FQ-206-MD-DRAW 추첨 | R/W | R/W (추첨 실행) | — | — |
| FQ-301 응모권 거래 | R | R (조회 전용) | R | — |
| FQ-101-REJETSET 반려사유 설정 | R/W/D | R/W | — | — |

> **EXTERNAL_ARTIST 제약**: 자기 아티스트 한정 콘텐츠 등록·수정만 가능. 검수(승인·반려)·추첨·삭제(게시 후)는 본사 OPERATOR 이상이 처리.

### 4.2 Raffle 추첨 가드레일 (SUPER 추가 검증)

대규모 보상이 걸린 Raffle의 추첨은 추가 보안 절차 적용:

| 조건 | 추가 검증 |
| --- | --- |
| 응모권 사용 누적 ≥ 10,000장 | SUPER 2FA 재인증 후 추첨 실행 |
| 보상 BIVE 발행 ≥ 100장 | SUPER 승인 모달 통과 후 추첨 |
| 일반 Raffle | OPERATOR 단독 추첨 가능 |

---

## 5. 다국어 입력 정책

[CEB-BO-000] §5 적용. FQ 영역은 사용자 노출 텍스트 비중 매우 높음 — 3언어 동시 필수 엄격 적용.

### 5.1 필수 입력 필드

| 화면 | 필드 | 글자수 | 비고 |
| --- | --- | --- | --- |
| Quest/Raffle 생성 | 타이틀 | 50자 | KO/EN/JP 3언어 모두 필수 |
| Quest/Raffle 생성 | 상세설명 | 500자 | KO/EN/JP, WYSIWYG 줄바꿈 포함 |
| Quest/Raffle 생성 | 유저 가이드 (Quest 한정) | 500자 | KO/EN/JP |
| 반려사유 (운영자용 식별 명칭) | 명칭 | 30자 | KO 단일 (내부 관리) |
| 반려사유 (유저 안내 메시지) | 메시지 | 200자 | KO/EN/JP 3언어 |
| Raffle 응모 안내 | 안내문 | 200자 | KO/EN/JP |

### 5.2 임시저장 vs 게시 검증

- **임시저장(Draft)**: 1개 언어만 입력해도 허용
- **게시(Active 전환)**: KO/EN/JP 모두 비어있지 않아야 함. 1개라도 빈 칸 → 게시 차단 + 토스트(Error) "모든 언어 필드를 입력해주세요"

---

## 6. 활동 로그 메시지 템플릿

[CEB-BO-000] §6 양식 적용. 모든 FQ 액션은 자동 로그 (3년 보관, append-only).

| 액션 | 로그 메시지 (KO) | 권한 | 발생 화면 |
| --- | --- | --- | --- |
| Quest 생성 | Quest '{타이틀}'을(를) 생성했습니다. (상태: 임시저장/게시대기) | OPERATOR/SUPER | FQ-101-CREATE |
| Quest 게시 | Quest '{타이틀}'을(를) 게시했습니다. (보상: {보상 BIVE}, 종료: {종료일}) | OPERATOR/SUPER | FQ-201-MD-OPEN |
| Quest 수정 | Quest '{타이틀}'의 정보를 수정했습니다. (변경 항목: {필드 목록}) | OPERATOR/SUPER | FQ-201-EDIT |
| Quest 종료 | Quest '{타이틀}'을(를) 조기 종료했습니다. (참여자: {n}명, 사유: {요약}) | OPERATOR/SUPER | FQ-201-MD-CLOSE |
| Quest 삭제 | Quest '{타이틀}'을(를) 삭제했습니다. (Draft 상태만 가능) | OPERATOR/SUPER | FQ-201-MD-DELETE |
| 검수 승인 | Quest '{타이틀}'의 제출 {n}건을 승인했습니다. (총 보상 BIVE 민팅: {n}장) | OPERATOR/SUPER | FQ-202 |
| 검수 반려 | Quest '{타이틀}'의 제출 {n}건을 반려했습니다. (사유: {반려코드}) | OPERATOR/SUPER | FQ-202-MD-REJECT |
| 반려사유 등록 | 반려사유 '{명칭}'을(를) 등록했습니다. (코드: {REJ_*}) | OPERATOR/SUPER | FQ-101-MD-ADD |
| 반려사유 수정 | 반려사유 '{명칭}'의 메시지를 수정했습니다. (코드: {REJ_*}) | OPERATOR/SUPER | FQ-101-MD-EDIT |
| Raffle 생성 | Raffle '{타이틀}'을(를) 생성했습니다. (응모 정원: {n}, 당첨 인원: {n}) | OPERATOR/SUPER | FQ-102-CREATE |
| Raffle 게시 | Raffle '{타이틀}'을(를) 게시했습니다. (응모 마감: {일시}) | OPERATOR/SUPER | FQ-204-MD-OPEN |
| Raffle 수정 | Raffle '{타이틀}'의 정보를 수정했습니다. (변경 항목: {필드 목록}) | OPERATOR/SUPER | FQ-204-EDIT |
| Raffle 종료 | Raffle '{타이틀}'을(를) 조기 종료했습니다. (응모자: {n}명) | OPERATOR/SUPER | FQ-204-MD-CLOSE |
| Raffle 삭제 | Raffle '{타이틀}'을(를) 삭제했습니다. (Draft 상태만 가능) | OPERATOR/SUPER | FQ-204-MD-DELETE |
| **Raffle 추첨 실행** | **Raffle '{타이틀}'의 추첨을 실행했습니다.** (응모자 {n}명 → 당첨 {n}명, 시드: {hex}) | OPERATOR/SUPER | FQ-206-MD-DRAW |
| Raffle 추첨 SUPER 검증 | Raffle '{타이틀}' 추첨 SUPER 추가 인증 통과 (응모권 {n}장 / BIVE {n}장) | SUPER | FQ-206-MD-DRAW |
| 당첨자 비고 수정 | Raffle '{타이틀}' 당첨자 '{닉네임}' 비고를 수정했습니다. | OPERATOR/SUPER | FQ-206-MD-DETAIL |
| 응모권 환불 | 응모권 환불 처리: 회원 '{닉네임}'에게 {n}장 환불 (사유: {요약}) | SUPER 전용 | FQ-301 |

---

## 7. 영역 고유 정책

### 7.1 Quest 라이프사이클

```
임시저장 (Draft) → 게시 (Active) → 종료 (Ended)
   ↓ 삭제 가능              ↓ 검수 진행          ↓ 보상 지급 완료
   (Draft만)            (대기/처리 탭)         (수정 불가)
```

| 상태 | 설명 | 가능 액션 |
| --- | --- | --- |
| Draft | 임시저장. 미게시 | 수정·삭제·게시 |
| Active | 진행 중. 유저 참여 가능 | 수정 (제한적), 종료, 검수 |
| Ended | 종료. 추가 참여 불가 | 처리내역 조회만 |

### 7.2 Raffle 라이프사이클

```
임시저장 (Draft) → 게시 (Active) → 추첨 대기 (Closed) → 종료 (Ended)
   ↓ 삭제 가능        ↓ 응모 진행      ↓ 추첨 실행          ↓ 보상 지급 완료
```

| 상태 | 설명 | 가능 액션 |
| --- | --- | --- |
| Draft | 임시저장 | 수정·삭제·게시 |
| Active | 응모 진행 중 | 수정 (제한적), 종료 |
| Closed | 응모 마감, 추첨 대기 | 추첨 실행 |
| Ended | 추첨 완료, 보상 지급 완료 | 응모·추첨내역 조회만 |

### 7.3 Quest 검수 워크플로우

```
유저 제출 → [대기내역 탭] (Pending)
              ↓
   운영자 검토 ─┬→ 승인 → 보상 BIVE 자동 민팅 → [처리내역 탭] (Approved)
                └→ 반려 → 반려사유 코드 지정 → [처리내역 탭] (Rejected)
                                ↓
                        유저 알림 + 재참여 가이드
```

#### 검수 시 BIVE 자동 민팅 (BO-004 §4.3 연동)

승인 시 자동 트리거:
1. Quest의 보상 캠페인 ID 조회
2. BIVE 토큰 발행 큐에 추가
3. 회원 외부 지갑으로 민팅 (블록 컨펌)
4. 회원 알림 + 활동 로그 ([CEB-BO-000] §6)

**현재 운영 검증** (분석 리포트 §3.5.3): V01D 23종 BIVE × 평균 100장 = ~2,768개가 이 경로로 발행됨.

### 7.4 반려사유 데이터베이스

[CEB-BO-FQ-101-REJETSET]에서 통합 관리. 반려사유는 코드(REJ_*)로 정규화하여 일관된 유저 안내 메시지를 보장.

| 항목 | 정책 |
| --- | --- |
| 코드 형식 | `REJ_{n}` (자동 채번, 4자리) |
| 운영자 식별 명칭 | KO 단일, 30자 (내부 관리용) |
| 유저 안내 메시지 | KO/EN/JP 3언어, 각 200자 |
| 상태 | Active (사용) / Inactive (비활성, 신규 검수에서 비노출) |
| 수정 시 영향 | 메시지 수정 → 신규 반려부터 적용. 과거 반려 건 영향 없음 |

### 7.5 Raffle 추첨 알고리즘

**시드 기반 결정론적 추첨** (재계산 가능 + 무결성 보장):

```
seed = SHA256(raffleId + drawTimestamp + adminUserId + entryListSnapshot)
shuffled = Fisher-Yates(entries, seed)
winners = shuffled[0:winnerCount]
```

| 항목 | 정책 |
| --- | --- |
| 시드 출처 | 추첨 실행 시점 hash (raffleId + timestamp + adminId + 응모 스냅샷) |
| 시드 기록 | 활동 로그에 `시드: {hex}` 기록 → 분쟁 시 재현 가능 |
| 응모 스냅샷 | 추첨 실행 직전 응모 데이터 동결 (이후 응모 시도 자동 차단) |
| 중복 응모 가중치 | 응모권 1장 = 1엔트리 (10장 응모자는 10엔트리) |
| 당첨자 중복 | 1명당 최대 1회 당첨 (다중 응모해도 1회만) |

### 7.6 응모권 변동 유형 (RFT 영역 SSOT)

응모권은 회원 노출 발급 출처 5종 + 사용 출처 1종 + 운영 카테고리 4종 = 총 10종 변동 유형으로 관리된다. RFT 영역(`v2/BO/RFT/`)이 자산 마스터이며, 본 §7.6은 변동 유형 SSOT.

#### 정규 발급 출처 5종 (회원 노출 카드·필터)

| 변동 유형 | 트리거 | SSOT 문서 |
| --- | --- | --- |
| 퀘스트 보상 | Quest 검수 승인 시 자동 발급 | [CEB-BO-FQ-203] §처리 내역 §승인 |
| PM·ST 보상 | 게임 종료 시 자동 (게임별 응모권 지급 토글이 켜져 있을 때) | [CEB-BO-RFT-301] §4 + [CEB-BO-RFT-302] |
| BIVE 보유혜택 | 매일 자정 직후 자동 지급 | [CEB-BO-BIVE-104] §혜택 관리 |
| 덕력 랭킹 보상 | 덕력 시즌 정산 시 티어·랭킹 보상으로 자동 발급 | [CEB-BO-DUK-201] §2.2-C·D + [CEB-BO-DUK-000] §6.2 |
| GP로 응모권 구매 | 회원이 앱 응모권 구매 화면에서 GP로 직접 구매 | [CEB-BO-RFT-301] §3 (앱내 구매 운영 토글) |

#### 사용 출처 1종

| 변동 유형 | 트리거 |
| --- | --- |
| 래플 응모 사용 | 래플 응모 시 차감 |

#### 운영 카테고리 4종 (정규 발급 출처와 별도 분류)

| 변동 유형 | 트리거 |
| --- | --- |
| 래플 취소 환불 | 운영자가 래플 강제 종료·취소 시 응모자 자동 환불 |
| 운영자 보정 적립 | 최고 권한 운영자가 CS 대응으로 수동 환불 |
| 만료 소멸 | 사용 기한 경과 자동 소멸 |
| 운영자 회수 | 최고 권한 운영자가 부정 이용 회수 ([CEB-BO-USR] §7.4 연동) |

> ⚠️ **일일 미션은 응모권을 발급하지 않음** — 일일 미션 보상은 **덕력 25 적립** ([CEB-BO-FQ-501] §2.4 정합)이며, 응모권 변동을 발생시키지 않는다. RFT 영역의 정규 발급 출처 5종에 포함되지 않음.

---

## 8. v1 → v2 마이그레이션 매핑

v1 BO-FQ 34개 모두 v2/BO/로 이전 + Deprecation 태그. 매핑 매트릭스(`v1_v2_mapping_matrix.md` §2) 와 동기화.

| v1 화면 | v2 화면 | 주요 v2 정책 갱신 |
| --- | --- | --- |
| BO-FQ-101 (Quest 탭) | CEB-BO-FQ-101 | 권한 매트릭스, 활동 로그 §6, 다국어 §5.1, [CEB-BO-000] 참조 |
| BO-FQ-101-Create | CEB-BO-FQ-101-CREATE | 동일 + EXTERNAL_ARTIST 권한 적용 |
| BO-FQ-101-MD-CANCEL/COMPLE/ADD/EDIT/REJETSET | CEB-BO-FQ-101-MD-* / FQ-101-REJETSET | 동일 |
| BO-FQ-102 (Raffle 탭) ~ 102-MD-* | CEB-BO-FQ-102 + 102-MD-* | 동일 |
| BO-FQ-201/202/203 (Quest 상세 3탭) | CEB-BO-FQ-201/202/203 | 동일 + 검수 워크플로우 §7.3 |
| BO-FQ-201-EDIT, 201-MD-OPEN/CLOSE/DELETE/CANCEL/COMPLE | CEB-BO-FQ-201-EDIT + MD-* | 동일 |
| BO-FQ-202-MD-REJECT | CEB-BO-FQ-202-MD-REJECT | 반려사유 코드 표준화 §7.4 |
| BO-FQ-204/205/206 (Raffle 상세 3탭) | CEB-BO-FQ-204/205/206 | 동일 + 추첨 알고리즘 §7.5 |
| BO-FQ-204-EDIT, 204-MD-* (5종) | CEB-BO-FQ-204-EDIT + MD-* | 동일 |
| BO-FQ-205-MD-DETAIL | CEB-BO-FQ-205-MD-DETAIL | 동일 |
| BO-FQ-206-MD-DRAW | CEB-BO-FQ-206-MD-DRAW | SUPER 가드레일 §4.2 적용 |
| BO-FQ-206-MD-DETAIL | CEB-BO-FQ-206-MD-DETAIL | 동일 |
| BO-FQ-301 | CEB-BO-FQ-301 | 응모권 거래 코드 §7.6 표준화 |

---

## 9. 검증·QA 체크포인트

[CEB-BO-001] §9 적용.

각 화면 마이그레이션 후 확인:
- [ ] Page Properties 에 @Nill Yoo 작성자 표기
- [ ] [CEB-BO-000] 공통 정책 참조 명시
- [ ] 권한 매트릭스 (§4) 본 영역 가이드 참조 또는 직접 명시
- [ ] 활동 로그 템플릿 (§6) 해당 액션 포함
- [ ] 다국어 입력 (§5) KO/EN/JP 3언어 명시
- [ ] 변경 이력 (changelog) 표 추가
- [ ] HTML 변환본 (`v2/confluence-html/BO/`) 자동 생성 확인 (`npm run docs:watch`)
- [ ] v1 원본에 deprecated 태그 추가
- [ ] `v1_v2_mapping_matrix.md` 해당 행 🟢 완료로 갱신

---

## 10. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
| ---- | ---- | ------ | --------- |
| **v1.3** | **2026.05.14** | **@Nill Yoo** | §7.6 응모권 변동 유형 9 → 10. ① 덕력 랭킹 보상 신규 (덕력 시즌 정산 시 티어·랭킹 보상으로 자동 발급) ② 정규 발급 출처 5종(퀘스트 보상 / PM·ST 보상 / BIVE 보유혜택 / 덕력 랭킹 보상 / GP로 응모권 구매)과 운영 카테고리 4종(래플 취소 환불 / 운영자 보정 적립 / 만료 소멸 / 운영자 회수)을 분리해서 표기 ③ 일일 미션 응모권 미발급 명시 (덕력 25만 적립) |
| v1.2 | 2026.05.13 | @Nill Yoo | **영역 분리** — 본 문서는 Quest 전용으로 축소. Raffle 명세 13개 화면은 모두 **[CEB-BO-012] RFL 영역**(`v2/BO/RFL/`)으로 이전, 기존 FQ-102/204/205/206 시리즈는 DEPRECATED 배너 처리. 제목 "Quest·Raffle(FQ)" → "**Quest(FQ)**". §2 화면 인벤토리에서 Raffle 행은 보존하되 DEPRECATED 표기 |
| v1.1 | 2026.05.13 | @Nill Yoo | **사이드바 메뉴 재구성** — Quest를 "에피소드" 그룹 하위 페이지(`/sq/quests`)로 이동, Raffle은 신규 "래플" 그룹(`/raffle`)으로 분리. 응모권 그룹 폐기 → 응모권 현황·변동 내역을 래플 그룹 안으로 흡수. §1A 신규 추가, §2.1 라우트 컬럼 추가. 기존 `/fanquest` → `/sq/quests` redirect. 상세/생성/수정 라우트는 그대로 유지 |
| v1.0 | 2026.05.05 | @Nill Yoo | 초안 작성. v1 BO-FQ 34개 화면을 v2 12영역 체계로 흡수하기 위한 영역 가이드. v2 BO-002~005 와 동일 구조 (Page Properties / 화면 목록 / 권한 매트릭스 / 다국어 / 활동 로그 / 영역 고유 정책 / 마이그레이션 매핑 / QA 체크). 영역 고유 정책 6개: Quest 라이프사이클 / Raffle 라이프사이클 / Quest 검수 워크플로우 (BIVE 자동 민팅 연동) / 반려사유 DB / Raffle 추첨 알고리즘 / 응모권 거래 코드. SUPER 추첨 가드레일 (응모권 10K+ 또는 BIVE 100+) 신규 정의. v1 BO-FQ 34개 v2 ID 매핑 명시. |
