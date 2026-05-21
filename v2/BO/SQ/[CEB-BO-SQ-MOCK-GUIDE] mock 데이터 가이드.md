# [CEB-BO-SQ-MOCK-GUIDE] SQ 영역 mock 데이터 가이드

## Page Properties

| Key | Value |
| ---- | ---- |
| Screen ID | CEB-BO-SQ-MOCK-GUIDE |
| 기획담당자 | @Nill Yoo |
| 디자인담당자 |  |
| 개발담당자 |  |
| 기능영역(Epic) | SQ — 스토리 퀘스트(에피소드) · 참조 가이드 |
| 상태 | Draft |
| 버전 | v1.0 |
| 최근 업데이트 | 2026.05.21 |
| API | — (프로토타입 mock 한정) |
| 피그마 링크 |  |
| 프로토타입 링크 | `prototype/src/mock/sq.ts` |
| Breadcrumb | — (참조 가이드, 화면 진입 없음) |
| 비고 | 개발자·디자이너가 프로토타입 mock의 K-pop 시나리오·정책 매트릭스를 한눈에 파악하기 위한 SSOT 문서 |

---

> 작성자: @Nill Yoo · 작성일: 2026-05-21 · 버전: **v1.0** (신규 — SQ 영역 mock 데이터의 K-pop 시즌 스토리텔링 + 정책 매트릭스 6조합 매핑 SSOT)
> 대상 파일: `prototype/src/mock/sq.ts` · 영역 가이드 정합: [CEB-BO-011] v3.8

## 1. 목적

프로토타입 `sq.ts` mock 데이터는 SQ 영역의 운영 시나리오·정책 검증을 시각화하는 단일 참조이다. 본 가이드는 다음을 한눈에 파악할 수 있도록 정리한다.

- **K-pop 시즌 스토리텔링**: V01D / iKON / CELEBUS 3아티스트의 시즌별 그룹·에피소드·미션 구성
- **정책 매트릭스 6조합 커버**: 부모 에피소드 상태(DRAFT/ACTIVE/CLOSED) × 미션 유형(팬퀘스트/PM/ST) 모든 조합을 mock으로 검증 가능
- **다국어 데이터 정합**: PM/ST 미션의 KO/EN/JA 3종 입력값 일람 ([CEB-BO-011] §5 다국어 필수 정합)
- **반복 주기 3종**: DAILY/WEEKLY/MONTHLY 미션 실장 위치
- **정책 검증 시나리오**: SQ-204-EDIT v1.1 등 신규 정책을 검증할 mock id 안내

> ⚠️ 본 문서는 **운영 화면 명세가 아님**. 개발·디자인·QA가 mock을 빠르게 이해하기 위한 참조 문서.

## 2. 아티스트·그룹 구성 매트릭스

### 아티스트 (3종)

| 아티스트 | 컨셉 | 활성 그룹 |
|---|---|---|
| **V01D** | 4세대 보이그룹 (자체 IP) | 1개 (ACTIVE) — 정책 §5 "아티스트당 ACTIVE 1개" 한도 정합 |
| **iKON** | 글로벌 K-pop 그룹 | 1개 (ACTIVE) |
| **CELEBUS** | 플랫폼 자체 캠페인 | 1개 (DRAFT) |

### 에피소드 그룹 (6건)

| 그룹 ID | 그룹 타이틀 | 아티스트 | 상태 | 기간 | 에피소드 수 |
|---|---|---|---|---|---|
| 1 | V01D — JOURNEY #01 컴백 시즌 | V01D | ACTIVE | 2026.05.01 ~ 2026.07.31 | 메인 5 + 반복 1 = 6 |
| 2 | V01D — 데뷔 1주년 기념 시즌 | V01D | CLOSED | 2025.10.01 ~ 2025.12.31 | 메인 4 + 반복 1 = 5 |
| 3 | V01D — 2026 가을 컴백 예비 | V01D | DRAFT | 2026.09.01 ~ 2026.11.30 | 메인 2 + 반복 1 = 3 |
| 4 | iKON — 데뷔 10주년 글로벌 투어 | iKON | ACTIVE | 2026.04.01 ~ 2026.06.30 | 메인 4 + 반복 1 = 5 |
| 5 | iKON — KCON 2025 종합 시즌 | iKON | CLOSED | 2025.07.01 ~ 2025.09.30 | 메인 3 = 3 |
| 6 | CELEBUS — 플랫폼 1주년 캠페인 | CELEBUS | DRAFT | 2026.06.01 ~ 2026.08.31 | 메인 2 = 2 |

상태 분포: **ACTIVE 2 / DRAFT 2 / CLOSED 2** — 모든 상태가 각 2그룹 이상이라 운영 시나리오 시각화 가능.

## 3. 에피소드 분포 (총 24건)

| 그룹 | 에피소드 ID 범위 | 메인 | 반복 |
|---|---|---|---|
| Group 1 (V01D ACTIVE) | 1 ~ 6 | id 1~5 | id 6 |
| Group 2 (V01D CLOSED) | 7 ~ 11 | id 7~10 | id 11 |
| Group 3 (V01D DRAFT) | 12 ~ 14 | id 12~13 | id 14 |
| Group 4 (iKON ACTIVE) | 15 ~ 19 | id 15~18 | id 19 |
| Group 5 (iKON CLOSED) | 20 ~ 22 | id 20~22 | — |
| Group 6 (CELEBUS DRAFT) | 23 ~ 24 | id 23~24 | — |

## 4. 미션 — 정책 매트릭스 6조합 매핑표

각 부모 상태 × 미션 유형 조합마다 대표 mock id를 명시. SQ-204-EDIT v1.1 정책 검증 시 참조.

| 부모 상태 | 팬퀘스트 미션 ID (예) | PM 미션 ID (예) | ST 미션 ID (예) |
|---|---|---|---|
| **DRAFT** | 1201, 1401 | 1202, 1301, 2301 | 1203, 2302, 2401 |
| **ACTIVE** | 101, 201, 301, 401, 501, 601, 1501, 1601, 1701, 1801 | 102, 202, 1502, 1602, 1901 | 103, 302, 602, 1503 |
| **CLOSED** | 701, 901, 1001, 1101, 2001, 2101 | 702, 2002 | 703, 801, 902, 2003, 2201 |

총 미션 수:

- **팬퀘스트**: 18건 (자체 상속이라 `titleEN`·`titleJA` 빈 문자열)
- **예측 마켓(PM)**: 10건 (KO/EN/JA 3종 모두 입력)
- **서바이벌 트리비아(ST)**: 12건 (KO/EN/JA 3종 모두 입력)
- **합계**: 40건

### 미션 ID 규칙

`storyQuestId * 100 + order` (예: 에피소드 ID 1의 1번째 미션 = 101, 3번째 미션 = 103)

> `getEpisodeById(epId)`는 `storyEpisodes` 배열에서 id 직접 lookup. 구 EPISODE_DATA 단일 템플릿 구조는 v2.3에서 폐기.

## 5. 다국어 데이터 정합 표 (PM/ST 22건)

PM/ST 미션의 KO/EN/JA 3종 입력값 일람 — [CEB-BO-011] §5 "다국어 필수" 표준 정합.

| 미션 ID | 유형 | 부모 상태 | KO | EN | JA |
|---|---|---|---|---|---|
| 102 | PM | ACTIVE | 신곡 멜론 차트 1위 진입 예측 | Predict New Song #1 on Melon Chart | 新曲メロンチャート1位入り予測 |
| 103 | ST | ACTIVE | 신곡 "JOURNEY" 가사 트리비아 5회 정답 | New Song "JOURNEY" Lyrics Trivia — 5 Correct | 新曲「JOURNEY」歌詞トリビア5回正解 |
| 202 | PM | ACTIVE | 뮤직비디오 1000만 뷰 달성 시점 예측 | Predict When MV Reaches 10M Views | ミュージックビデオ1000万再生達成時期予測 |
| 302 | ST | ACTIVE | JOURNEY #01 콘서트 셋리스트 트리비아 | JOURNEY #01 Concert Setlist Trivia | JOURNEY #01 コンサートセットリストトリビア |
| 602 | ST (DAILY 반복) | ACTIVE | 일일 V01D 트리비아 5회 정답 | Daily V01D Trivia — 5 Correct | デイリーV01Dトリビア5回正解 |
| 702 | PM | CLOSED | 1주년 기념 행사 참여수 예측 | Predict 1st Anniversary Event Attendance | 1周年記念イベント参加者数予測 |
| 703 | ST | CLOSED | 1주년 추억 트리비아 7회 정답 | 1st Anniversary Memory Trivia — 7 Correct | 1周年思い出トリビア7回正解 |
| 801 | ST | CLOSED | 1주년 종합 트리비아 10회 정답 | 1st Anniversary Comprehensive Trivia — 10 Correct | 1周年総合トリビア10回正解 |
| 902 | ST | CLOSED | 행사 무대 셋리스트 트리비아 | Event Stage Setlist Trivia | イベントステージセットリストトリビア |
| 1202 | PM | DRAFT | 컴백곡 차트 진입 순위 예측 | Predict Comeback Song Chart Entry Rank | カムバック曲チャートイン順位予測 |
| 1203 | ST | DRAFT | 컴백곡 티저 영상 트리비아 5회 정답 | Comeback Teaser Trivia — 5 Correct | カムバックティザートリビア5回正解 |
| 1301 | PM | DRAFT | 데뷔곡 차트 진입 순위 예측 (작성 중) | Debut Song Chart Entry Rank Prediction (Draft) | デビュー曲チャートイン順位予測(作成中) |
| 1502 | PM | ACTIVE | iKON 컴백 앨범 1위 예측 | Predict iKON Comeback Album #1 | iKONカムバックアルバム1位予測 |
| 1503 | ST | ACTIVE | iKON 디스코그래피 마스터 트리비아 | iKON Discography Master Trivia | iKONディスコグラフィーマスタートリビア |
| 1602 | PM | ACTIVE | 다음 발표 투어 도시 예측 | Predict Next Announced Tour City | 次に発表されるツアー都市予測 |
| 1901 | PM (WEEKLY 반복) | ACTIVE | 주간 iKON 활동 예측 마라톤 | Weekly iKON Activity Prediction Marathon | ウィークリーiKON活動予測マラソン |
| 2002 | PM | CLOSED | 최애 무대 1위 예측 | Predict Favorite Stage #1 | 最推しステージ1位予測 |
| 2003 | ST | CLOSED | KCON 2025 무대 트리비아 | KCON 2025 Stage Trivia | KCON 2025 ステージトリビア |
| 2201 | ST | CLOSED | KCON 2025 종합 추억 트리비아 10회 정답 | KCON 2025 Memory Trivia — 10 Correct | KCON 2025 思い出トリビア10回正解 |
| 2301 | PM | DRAFT | 플랫폼 다음 캠페인 주제 예측 (작성 중) | Predict Platform's Next Campaign Topic (Draft) | プラットフォーム次のキャンペーンテーマ予測(作成中) |
| 2302 | ST | DRAFT | CELEBUS 운영진 OX 퀴즈 5회 정답 | CELEBUS Staff OX Quiz — 5 Correct | CELEBUS運営陣OXクイズ5回正解 |
| 2401 | ST | DRAFT | CELEBUS 1주년 추억 트리비아 (작성 중) | CELEBUS 1st Anniversary Memory Trivia (Draft) | CELEBUS 1周年思い出トリビア(作成中) |

다국어 정합 검증:

```bash
# PM/ST 미션 중 titleEN 빈 문자열은 0건이어야 함
grep -cE "type: 'PREDICTION_MARKET'|type: 'SURVIVAL_TRIVIA'" prototype/src/mock/sq.ts
# 결과: 22 (전체 PM/ST 수)

# titleEN 빈 문자열은 팬퀘스트 미션 수와 일치해야 함
grep -c "titleEN: ''" prototype/src/mock/sq.ts
# 결과: 18 (팬퀘스트 미션 수)
```

## 6. 반복 주기 3종 매핑

[CEB-BO-011] §5 "반복 미션 반복 주기 일간/주간/월간" 정합 — 3종 모두 mock 실장.

| 주기 | 미션 ID | 유형 | 부모 그룹 | 반복 에피소드 ID |
|---|---|---|---|---|
| **DAILY** | 602 | ST | Group 1 (V01D ACTIVE) | 6 |
| **WEEKLY** | 1401 | FQ | Group 3 (V01D DRAFT) | 14 |
| **WEEKLY** | 1901 | PM | Group 4 (iKON ACTIVE) | 19 |
| **MONTHLY** | 601 | FQ | Group 1 (V01D ACTIVE) | 6 |
| **MONTHLY** | 1101 | FQ | Group 2 (V01D CLOSED) | 11 |

## 7. 정책 검증 시나리오 가이드

각 정책을 mock으로 검증할 때 사용할 진입 경로 + mock id 안내.

### 7-1. SQ-204-EDIT v1.1 — 진행중·종료 수정 정책

| 시나리오 | 사용할 mock | 진입 경로 | 기대 결과 |
|---|---|---|---|
| **DRAFT + PM/ST** — 전체 수정 가능 | Story 12 + Mission 1202 (PM) | `/sq/12/quests/1202/edit` | 다국어·판정·보상·반복 모두 수정 가능 |
| **DRAFT + 팬퀘스트** — 메타만 수정 | Story 12 + Mission 1201 (FQ) | `/sq/12/quests/1201/edit` | 인디고 안내 박스 + BIVE·반복 메타만 활성 |
| **ACTIVE + PM/ST** — 다국어만 수정 | Story 1 + Mission 102 (PM) | `/sq/1/quests/102/edit` | 노랑 배너 + 다국어 LangField만 활성, 나머지 disabled |
| **ACTIVE + 팬퀘스트** — [수정하기] 비활성 | Story 1 + Mission 101 (FQ) | `/sq/1/quests/101` | [수정하기] 버튼 disabled + 툴팁 안내 |
| **CLOSED + 전 유형** — [수정하기] 비활성 | Story 7 + Mission 702 (PM) 또는 701 (FQ) | `/sq/7/quests/702` 또는 `/sq/7/quests/701` | [수정하기] 버튼 disabled + 툴팁 안내 |
| **CLOSED 직접 URL 진입 방어** | Story 7 + Mission 702 | `/sq/7/quests/702/edit` (직접 URL) | 회색 차단 배너 + 전체 read-only + [저장] 비활성 |

### 7-2. SQ-204 v3.2 — 다국어 타이틀 노출 카드

| 시나리오 | 사용할 mock | 기대 결과 |
|---|---|---|
| PM/ST 미션 다국어 카드 노출 | Mission 102 (PM) 또는 103 (ST) | §2-3 다국어 타이틀 카드에 KO/EN/JA 3행 표시 |
| 팬퀘스트 미션 다국어 카드 미노출 | Mission 101 (FQ) | §2-3 카드 노출 없음 (자체 상속) |

### 7-3. SQ-204-CREATE v3.3 — 다국어 필수 검증

| 시나리오 | 사용할 그룹 | 기대 결과 |
|---|---|---|
| 메인 에피소드 미션 추가 | Story 4 또는 5 (V01D ACTIVE) | 단일 미션만 추가 가능 (반복 토글 미노출) |
| 반복 에피소드 미션 추가 | Story 6 (V01D ACTIVE 반복) | 반복 여부 토글 노출 + 주기 3종 선택 |
| PM/ST 다국어 미입력 시 [미션 추가] 비활성 | Story 4 진입 | 유형 PM 선택 → 다국어 한 언어라도 비우면 [미션 추가] 비활성 |

### 7-4. [CEB-BO-011] §5 — 정책 상수 검증

| 정책 | 검증 mock | 기대 결과 |
|---|---|---|
| 아티스트당 ACTIVE 그룹 1개 한도 | V01D는 Group 1만 ACTIVE | V01D 그룹 추가 시 ACTIVE 선택 불가 |
| 그룹당 메인 5 + 반복 1 한도 | Group 1 (V01D ACTIVE) | 이미 메인 5 + 반복 1 모두 차있음 — 추가 불가 |
| 에피소드당 미션 10개 한도 | Story 1 (현재 미션 3건) | 추가 가능 |
| 팬퀘스트 ↔ 미션 1:1 매핑 | Mission 101 (fanQuestId: 1) | 미션 추가 화면에서 fanquest #1 드롭다운에서 자동 제외 |

## 8. 변경 이력

| 버전 | 일자 | 작성자 | 변경 |
|---|---|---|---|
| **v1.0** | **2026-05-21** | **@Nill Yoo** | **신규 작성 — SQ mock 데이터 풀 개선과 함께 신설** ① K-pop 시즌 스토리텔링으로 그룹·에피소드·미션 타이틀 전면 재작성 (V01D + iKON + CELEBUS 3아티스트) ② 정책 매트릭스 6조합(DRAFT/ACTIVE/CLOSED × 팬퀘스트/PM/ST) 100% 커버 — SQ-204-EDIT v1.1 정책 검증 가능 ③ PM/ST 미션 22건 다국어 titleEN/titleJA 100% 입력 ([CEB-BO-011] §5 정합) ④ 반복 주기 DAILY/WEEKLY/MONTHLY 3종 실장 ⑤ `EPISODE_DATA` 단일 템플릿 구조 폐기 → `storyEpisodes` 직접 정의 배열 (각 미션이 storyQuestId 명시) ⑥ §7 정책 검증 시나리오 가이드 — 개발·디자인·QA가 mock id로 정책을 직접 검증 가능. [CEB-BO-011] v3.8 동시 정합 |

## 9. 관련 문서

- [CEB-BO-011] 스토리 퀘스트(SQ) 영역 가이드 — 정책 상수 SSOT
- [CEB-BO-SQ-FLOW] 에피소드 영역 플로우 및 로직 — 운영 플로우 정의
- [CEB-BO-SQ-204-EDIT] 미션 수정 — 본 가이드 §7-1 정책 검증 대상
- [CEB-BO-SQ-204] 미션 상세 — 본 가이드 §7-2 다국어 카드 검증 대상
- [CEB-BO-SQ-204-CREATE] 미션 추가 — 본 가이드 §7-3 다국어 필수 검증 대상
