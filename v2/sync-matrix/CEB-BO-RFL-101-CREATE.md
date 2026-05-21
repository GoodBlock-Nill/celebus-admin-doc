# Sync Matrix — CEB-BO-RFL-101-CREATE 래플 생성

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/RFL/[CEB-BO-RFL-101-CREATE] 래플 생성.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/raffle/create/page.tsx` |
| 프로토타입 공통 폼 | — | `prototype/src/app/raffle/_components/RaffleForm.tsx` |
| 동기화일 | — | 2026-05-21 |

## 정합 매트릭스

| # | 명세 §섹션 | 항목 | 프로토타입 | 상태 |
|---|---|---|---|---|
| 1 | §1 | **페이지 제목 "래플 생성"** (구 "Raffle 생성") | PageHeader title 정합 | ✅ (2026-05-21 정정) |
| 2 | §1 | **Breadcrumb "래플 생성"** (구 "Raffle 생성") | breadcrumbItems 정합 | ✅ (2026-05-21 정정) |
| 3 | §2-2 | 좌측 카드 **"래플 정보"** (구 "Raffle 정보") | RaffleForm.tsx 카드 제목 | ✅ (2026-05-21 정정 — 생성·수정 공통) |
| 4 | §2-2 | 다국어 입력 (KO/EN/JP 3종, 임시저장 1개 언어 이상) | LangField + isAllLangsFilled | ✅ |
| 5 | §2 | 임시저장·게시 검증 (다국어 1개+ / 3개+) | canSubmitRaffle | ✅ |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | 신규 작성 + Critical 3건 정정 — "Raffle" 영문 라벨 3건 → "래플" ([CEB-BO-012] §1 정합) |
