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
