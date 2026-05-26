# v2/scripts — 운영 스크립트

## update-progress.sh

v1→v2 마이그레이션 진행 상태(`memory/v2_migration_progress.md`)를 갱신한다. Phase 진입·완료·차단 이슈 발생 시 호출.

```bash
v2/scripts/update-progress.sh --phase N --status start --note "메모"
v2/scripts/update-progress.sh --phase N --status done --note "산출물 요약"
v2/scripts/update-progress.sh --phase N --status blocked --note "차단 사유"
v2/scripts/update-progress.sh --note "발견 내용"
```

## sync-check.sh

기획서(`v2/BO/<영역>/<화면 ID>.md`) ↔ 프로토타입(`prototype/src/app/...`) 정합 1차 검증. 명세 표에서 한국어 라벨을 추출해 프로토타입 파일에 존재하는지 grep으로 매칭한다. 100% 정확하지 않으나 누락 후보를 빠르게 검출.

```bash
v2/scripts/sync-check.sh CEB-BO-APP-201
v2/scripts/sync-check.sh APP/201
v2/scripts/sync-check.sh APP/201 --fuzzy   # 부분 일치 허용
```

### 동작 순서

1. `v2/sync-matrix/<화면 ID>.md` 매트릭스에서 (명세 파일, 프로토타입 파일) 매핑 조회
2. 매트릭스가 없거나 명세 파일이 비어 있으면 `v2/BO/<영역>/`에서 자동 탐색
3. 명세 표에서 한국어 라벨 추출 (첫 컬럼이 한글 포함된 행)
4. 프로토타입 파일에 동일 라벨 grep
5. `✅ 매칭 N건` / `⚠️ 누락 후보 N건` 출력

### 종료 코드

| 코드 | 의미 |
|---|---|
| 0 | 누락 0건 — 1차 정합 통과 |
| 1 | 누락 검출 — 후속 검증 필요 |
| 2 | 입력·탐색 오류 (화면 ID 형식 오류 또는 파일 없음) |

### 한계 — L3·L4가 보완

- 라벨 표기 차이("대체 텍스트" vs "이미지 대체 텍스트")는 `--fuzzy`로 1차 보완. 한계는 L3 위임 검증으로 해결
- 컴포넌트화 라벨(`<Field label={LABELS.altText}>`)은 검출 불가 → L3·L4가 보완
- 옵션값 차이(예: 일간/주간/월간 3종 vs 주간/월간 2종)는 매트릭스에서 확인

### 정책

본 스크립트는 `[feedback-spec-prototype-sync]` 메모리 룰의 **L2 단계**다. 명세/프로토타입 동시 작업 시 작업 완료 보고 전 반드시 실행하고 출력을 보고서에 첨부한다. 자세한 절차는 메모리 룰 본문 참조.

## changelog-sync-check.sh

명세 §7 변경 이력 최신 entry에서 약속한 신규/추가/보강 항목이 §2·§3·§5 본문에 실제 노출되는지 자가 검증. "변경 이력에만 약속하고 본문 보강 누락" 패턴 차단 용도. 직전 3개 사이클에서 3차례 재발한 패턴 시스템적 차단.

```bash
v2/scripts/changelog-sync-check.sh CEB-BO-GZ-202
v2/scripts/changelog-sync-check.sh GZ/202
v2/scripts/changelog-sync-check.sh "v2/BO/GAM/[CEB-BO-GZ-202] 게임 상세.md"
```

### 동작 순서

1. 명세 파일 위치 식별 (sync-check.sh와 동일)
2. §7 변경 이력 표에서 최신 entry(첫 `| **v...` 행) 추출
3. **정정/통일 전용 entry**(메타 동사 "정정/통일/환원/폐기" + "신규/추가" 미포함)는 약속 추출 skip
4. entry에서 강조(`**...**`)·따옴표(`"..."`) 안의 한국어 라벨 추출 → 코어 명사구로 정규화
5. §2·§3·§5 본문에서 코어 명사구 grep
6. 누락 후보 리포트 + 종료 코드

### 종료 코드

| 코드 | 의미 |
|---|---|
| 0 | 정합 (누락 0건 또는 정정 전용 entry) |
| 1 | 누락 검출 — 본문 §2·§3·§5에 항목 보강 필요 |
| 2 | 입력·탐색 오류 |

### 정책

본 스크립트는 `[feedback-changelog-body-sync]` 메모리 룰의 **자동 검증 단계**다. 명세 §7 변경 이력 entry 작성·갱신 후 즉시 실행하고 종료 코드 0 확인 후에만 사이클 완료 보고.

## planner-language-check.sh

기획자 언어 룰 위반 패턴(enum/camelCase 변수명/영문 prefix/HTML 속성/내부 작업 추적 용어/단위 표기 위반) 자동 검출. 화이트리스트(화면 ID·영역 약자·게임유형·아티스트·통화·언어 코드)·코드 블록·Page Properties 제외 처리.

```bash
v2/scripts/planner-language-check.sh CEB-BO-GZ-202
v2/scripts/planner-language-check.sh GZ/202
```

### 검출 패턴

| 유형 | 예시 | 권장 대체 |
|---|---|---|
| enum 식별자 | `PM_PARTICIPATION`, `GAME_REWARD` | 한국어 도메인 용어 (예: "PM 참여 보상") |
| camelCase 변수명 | `ticketReward`, `dukReward`, `artistGroup` | 한국어 라벨 (예: "응모권 보상") |
| 영문 prefix + 숫자 | `Tx 100001`, `Quest #44` | 한국어 prefix (예: "구매-100001", "퀘스트-44") |
| HTML 속성 | `target=_blank`, `disabled=` | 동작 설명 (예: "새 탭으로 진입") |
| 내부 작업 추적 용어 | `Phase 10`, `Track A`, `사이클 #1` | 변경 자체만 기술 |
| 단위 표기 위반 | `덕력 N점`, `덕력 {총}점` | `덕력 N DUK` |

### 화이트리스트 (위반 아님)

- 화면 ID: `CEB-BO-{영역}-{번호}` 패턴
- 영역 약자: GAM/FQ/RFT/DUK/BIVE/EVT/SYS/USR/ART/SUP/INF/MEM/COL/APP/SQ
- 게임유형: PM, ST, NFT
- 아티스트 그룹: V01D, iKON, CELEBUS, MADEIN, UNDER:LIGHT
- 통화·단위: GP, CELB, DUK
- 언어 코드: KO, EN, JP
- 버전: vN.N

### 제외 영역

- 코드 블록 ```` ``` ```` 안
- 인라인 코드 `` `...` `` 안 (식별자 인용은 허용)
- Page Properties 표 (`API`, `Breadcrumb` 영문 라벨 정상)

### 종료 코드

| 코드 | 의미 |
|---|---|
| 0 | 위반 0건 |
| 1 | 위반 검출 — 한국어 도메인 용어로 치환 필요 |
| 2 | 입력·탐색 오류 |

### 정책

본 스크립트는 `[feedback-planner-language]` 메모리 룰의 **자동 검증 단계**다. 명세 작성·갱신 후 즉시 실행하고 종료 코드 0 확인 후에만 사이클 완료 보고. false positive는 식별자를 백틱(`` `...` ``)으로 인용 처리하면 제외됨.

## 종합 검증 순서 권장

명세 작성·갱신 사이클 완료 전 다음 3개 검증 모두 통과 확인:

1. `v2/scripts/changelog-sync-check.sh <화면 ID>` (변경 이력 ↔ 본문 자가 검증)
2. `v2/scripts/planner-language-check.sh <화면 ID>` (기획자 언어 룰)
3. `v2/scripts/sync-check.sh <화면 ID>` (명세 ↔ 프로토타입, 프로토타입 동반 작업 시)
