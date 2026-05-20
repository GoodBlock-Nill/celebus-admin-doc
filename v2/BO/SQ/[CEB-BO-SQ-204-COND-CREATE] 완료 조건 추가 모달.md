# [CEB-BO-SQ-204-COND-CREATE] 완료 조건 추가 모달 (폐지)

> 🚫 **DEPRECATED** (v2.2에서 폐기) — 완료 조건 별도 계층이 폐기되고 완료 판정 필드가 **미션에 직접 흡수**되었기 때문이다. 본 모달은 더 이상 사용되지 않는다.
>
> - **대체 흐름**: 미션 1개 = 완료 판정 1개. 미션 생성 시 ([CEB-BO-SQ-204-CREATE]) 판정 유형·기준값·소스 참조값을 함께 입력
> - **수정 흐름**: 미션 상세 ([CEB-BO-SQ-204])의 [수정하기] 액션에서 통합 수정
> - 본 문서는 이력 보존용으로 유지된다

## Page Properties

| Key | Value |
| ---- | ---- |
| Screen ID | CEB-BO-SQ-204-COND-CREATE |
| 기획담당자 | @Nill Yoo |
| 디자인담당자 |  |
| 개발담당자 |  |
| 기능영역(Epic) | SQ — 스토리 퀘스트(에피소드) |
| 상태 | **Deprecated** (v2.2 폐기) |
| 버전 | v2.1 |
| 최근 업데이트 | 2026.05.12 |
| API |  |
| 피그마 링크 |  |
| 프로토타입 링크 |  |
| Breadcrumb | — |
| 비고 | v2.2에서 완료 조건 계층 폐기. 판정 필드는 미션이 직접 흡수. 본 문서는 이력 보존용. |

---

> 작성자: @Nill Yoo · 작성일: 2026-05-12 · 버전: **v2.1** (DEPRECATED)
> 모달 경로: 미션 상세의 [완료 조건 추가] 액션 → 모달 노출 (v2.2부터 미사용)
> 관련 화면: [CEB-BO-SQ-204] 미션 상세

## 1. 모달 개요

특정 미션(ERD `story_quest_chapter`) 안에 새 완료 조건을 추가하는 확인성 모달. 부모 미션의 `type`(FAN_QUEST / PREDICTION_MARKET / SURVIVAL_TRIVIA)에 따라 입력 가능한 판정 유형 옵션이 분기된다.

| 항목 | 값 |
|---|---|
| 트리거 | 미션 상세의 `완료 조건 추가` 버튼 |
| 진입 조건 | 미션의 완료 조건 수 < `MAX_MISSIONS_PER_EPISODE` (10) |
| 차단 조건 | 만석(10개) 도달 시 버튼 자체 disabled + 툴팁 안내 |
| 접근 권한 | OPERATOR, EXTERNAL_ARTIST(자기 아티스트) |
| 데이터 모델 | `StoryMission` ([prototype/src/mock/sq.ts](prototype/src/mock/sq.ts) lines 99~109) |

## 2. UI 구조

### 2-1. 헤더

- 제목: `완료 조건 추가` (h3)
- 보조 안내(상단 회색 1줄): `미션: {mission.titleKO}` · 출처 타입 배지
- X 닫기 버튼 (우상단)

### 2-2. 본문 필드

| 필드 | 타입 | 옵션 / 검증 | 필수 |
|---|---|---|---|
| 출처 타입 | read-only 배지 | mission.type 자동 상속 (FAN_QUEST / PM / ST) | — |
| 조건 내용 (`sourceRefName`) | textbox | 단일 언어, max 100자, 카운터 표시 | ★ |
| 판정 유형 (`completedType`) | dropdown | mission type별 분기 (§3-2) | ★ |
| 기준 수치 (`completedValue`) | number | `TRIVIA_CORRECT_COUNT` 선택 시만 활성. 범위 1~10 | 조건부 ★ |
| 반복 주기 (`repeatCycle`) | dropdown | `null` / `WEEKLY` / `MONTHLY`. REPEAT 에피소드 chapter에서만 활성 | 조건부 |
| 기간 (`openDt` / `closeDt`) | date+time x 2 | 기본값: 부모 그룹의 startDt/endDt 상속(read-only) · 수동 override 시 검증 | — |

### 2-3. 안내 메시지

- 출처 타입 안내: `이 미션은 {type} 유형이므로 완료 조건 판정 유형이 자동 분기됩니다.`
- REPEAT 에피소드: `반복 에피소드의 미션이므로 주기(주간/월간)를 설정할 수 있습니다.`
- 기간 안내: `완료 조건 기간은 기본으로 그룹 기간을 따릅니다.`

### 2-4. CTA (푸터)

| 버튼 | 색상 | 동작 |
|---|---|---|
| 취소 | gray-outline | 모달 닫기 (변경사항 있으면 확인) |
| 추가하기 | indigo (primary) | 검증 통과 시 활성 |

## 3. 데이터 모델 및 분기

### 3-1. StoryMission 필드 매핑

| 필드 | 값 출처 |
|---|---|
| `id` | 신규 발번 (서버) |
| `episodeId` | 현재 mission(chapter) id |
| `sourceType` | mission.type 자동 |
| `sourceRefName` | 입력 |
| `completedType` | 입력 |
| `completedValue` | 입력 (조건부) 또는 `null` |
| `repeatCycle` | 입력 (조건부) 또는 `null` |
| `openDt` / `closeDt` | 기본 그룹 상속 또는 입력 |

### 3-2. completedType 옵션 분기

| mission.type | 가능한 completedType |
|---|---|
| FAN_QUEST | `ADMIN_APPROVAL` 만 (고정, 자동 선택) |
| PREDICTION_MARKET | `PM_PARTICIPATION` · `PM_CORRECT` |
| SURVIVAL_TRIVIA | `TRIVIA_PARTICIPATION` · `TRIVIA_CORRECT_COUNT` |

### 3-3. completedValue 활성 조건

- `TRIVIA_CORRECT_COUNT` 선택 시만 활성 (예: "7회 정답")
- 그 외에는 `null` 자동 저장

## 4. 검증 규칙

| 검증 | 동작 |
|---|---|
| 미션 완료 조건 수 ≥ 10 | 모달 진입 불가 (CTA disabled) |
| `sourceRefName` 미입력 | `추가하기` disabled |
| `completedType` 미선택 | `추가하기` disabled |
| `TRIVIA_CORRECT_COUNT` + completedValue 0/공란 | disabled |
| openDt ≥ closeDt | disabled + 인라인 에러 |
| 기간이 부모 그룹 기간 밖 | 경고 (저장 허용 — 조기 종료 의도 인정) |

## 5. 결과 처리

| 시나리오 | 결과 |
|---|---|
| 성공 | 모달 닫힘 → 미션 상세 완료 조건 테이블 즉시 갱신 + 토스트 `완료 조건이 추가되었습니다.` |
| 실패 (네트워크/서버) | 모달 유지 + 에러 메시지 인라인 |
| 취소 | 변경사항 있으면 확인 다이얼로그 → `취소 확인` 시 모달 닫힘 |

## 6. 연관 화면

| 진입/이탈 | 화면 |
|---|---|
| 트리거 | [CEB-BO-SQ-204] 미션 상세 |
| 성공 후 복귀 | 동 (테이블 자동 갱신) |
| 부모 에피소드 | [CEB-BO-SQ-202] |
| 부모 그룹 | [CEB-BO-SQ-201] |

## 7. 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v2.1 | 2026-05-12 | 용어 통일 — 미션 추가 모달 → 완료 조건 추가 모달 (chapter→미션 / mission→완료 조건) |
| v2.0 | 2026-05-12 | 신규 — chapter type별 옵션 분기, REPEAT chapter 주기 활성, 그룹 기간 상속 정책 명시 |
