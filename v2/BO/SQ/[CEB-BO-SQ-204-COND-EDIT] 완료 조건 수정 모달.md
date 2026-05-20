# [CEB-BO-SQ-204-COND-EDIT] 완료 조건 수정 모달 (폐지)

> 🚫 **DEPRECATED** (v2.2에서 폐기) — 완료 조건 별도 계층이 폐기되고 완료 판정 필드가 **미션에 직접 흡수**되었기 때문이다. 본 모달은 더 이상 사용되지 않는다.
>
> - **대체 흐름**: 미션 상세 ([CEB-BO-SQ-204])의 [수정하기] 액션에서 미션 기본정보·보상·완료 판정(판정 유형·기준값·소스 참조값·반복 주기·기간)을 통합 수정
> - 본 문서는 이력 보존용으로 유지된다

## Page Properties

| Key | Value |
| ---- | ---- |
| Screen ID | CEB-BO-SQ-204-COND-EDIT |
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
> 모달 경로: 미션 상세의 완료 조건 테이블 행 클릭 → 모달 노출 (v2.2부터 미사용)
> 관련 화면: [CEB-BO-SQ-204] 미션 상세

## 1. 모달 개요

기존 완료 조건 정보를 수정. 부모 미션의 `type`은 변경 불가이고, 그 결과 `sourceType`도 변경 불가. 부모 에피소드/그룹이 CLOSED 상태이면 수정 자체 차단.

| 항목 | 값 |
|---|---|
| 트리거 | 미션 상세 완료 조건 테이블 행 클릭 |
| 진입 조건 | 부모 에피소드/그룹의 status ≠ `CLOSED` |
| 차단 조건 | CLOSED 시 read-only 또는 클릭 비활성 |
| 접근 권한 | OPERATOR, EXTERNAL_ARTIST(자기 아티스트) |

## 2. UI 구조

### 2-1. 헤더

- 제목: `완료 조건 수정` (h3)
- 보조: `미션: {mission.titleKO}` · 출처 타입 배지
- X 닫기 버튼

### 2-2. 본문 필드 (prefilled)

| 필드 | 수정 가능 | 비고 |
|---|---|---|
| 출처 타입 (`sourceType`) | ❌ | mission type 종속, read-only 배지 |
| 완료 조건 ID (`id`) | ❌ | 시스템 발번, hidden 또는 회색 표시 |
| 미션 ID (`episodeId`) | ❌ | 종속 |
| 조건 내용 (`sourceRefName`) | ✅ | textbox, max 100자 |
| 판정 유형 (`completedType`) | ✅ | dropdown — mission type별 옵션 분기 |
| 기준 수치 (`completedValue`) | ✅ | `TRIVIA_CORRECT_COUNT`일 때만 활성 |
| 반복 주기 (`repeatCycle`) | ✅ | REPEAT 에피소드 chapter에서만 활성 |
| 기간 (`openDt` / `closeDt`) | ✅ | 그룹 기간 외 설정 시 경고 |

### 2-3. 안내 메시지

- CLOSED 안내(필요 시): `종료된 완료 조건은 수정할 수 없습니다.` (회색 배너)
- 영향 안내: `이 완료 조건의 변경은 현재 진행 중인 유저 활동에 즉시 반영됩니다.`

### 2-4. CTA

| 버튼 | 색상 | 동작 |
|---|---|---|
| 취소 | gray-outline | 변경사항 있으면 확인 후 닫기 |
| 저장하기 | indigo (primary) | 검증 통과 시 활성 |

## 3. 변경 가능 매트릭스

| 필드 | sourceType=FAN_QUEST | PM | ST |
|---|---|---|---|
| sourceRefName | ✅ | ✅ | ✅ |
| completedType | ❌ (ADMIN_APPROVAL 고정) | PM 옵션 2종 중 전환 | ST 옵션 2종 중 전환 |
| completedValue | — | — | `TRIVIA_CORRECT_COUNT` 시만 |
| repeatCycle | REPEAT chapter면 ✅ | 동 | 동 |
| openDt / closeDt | ✅ | ✅ | ✅ |

## 4. 검증 규칙

| 검증 | 동작 |
|---|---|
| `sourceRefName` 공백 | 저장 disabled |
| `completedType` null | 저장 disabled |
| `TRIVIA_CORRECT_COUNT` + completedValue 0 | disabled |
| openDt ≥ closeDt | disabled |
| 부모 에피소드/그룹 CLOSED | 모든 필드 disabled |
| 변경사항 없음 | 저장 클릭 시 토스트 `변경사항이 없습니다.` |

## 5. 결과 처리

| 시나리오 | 결과 |
|---|---|
| 성공 | 모달 닫힘 + 완료 조건 테이블 해당 행 갱신 + 토스트 `완료 조건이 수정되었습니다.` |
| 실패 (서버) | 모달 유지 + 에러 인라인 |
| 취소 | 변경사항 있으면 확인 모달 |

## 6. 연관 화면

| 진입/이탈 | 화면 |
|---|---|
| 트리거 | [CEB-BO-SQ-204] 미션 상세 |
| 성공 후 복귀 | 동 |
| 추가 모달 | [CEB-BO-SQ-204-COND-CREATE] |

## 7. 변경 이력

| 버전 | 일자 | 변경 |
|---|---|---|
| v2.1 | 2026-05-12 | 용어 통일 — 미션 수정 모달 → 완료 조건 수정 모달 |
| v2.0 | 2026-05-12 | 신규 — chapter 종속 필드 잠금, REPEAT chapter 외 주기 비활성, CLOSED 부모 차단 정책 명시 |
