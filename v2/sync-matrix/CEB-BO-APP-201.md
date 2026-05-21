# Sync Matrix — CEB-BO-APP-201 배너 상세·작성

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/APP/[CEB-BO-APP-201] 배너 상세·작성.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/home/banners/[id]/page.tsx` |
| 프로토타입 신규 페이지 | — | `prototype/src/app/home/banners/new/page.tsx` |
| 프로토타입 폼 컴포넌트 | — | `prototype/src/components/home/BannerForm.tsx` |
| 프로토타입 데이터 모델 | — | `prototype/src/mock/home.ts` (`HomeBanner` 타입) |
| 명세 버전 | v6.6 | — |
| 프로토타입 마지막 동기화 | — | 2026-05-21 (매트릭스 신규 작성) |

## 필드 정합 매트릭스

| # | 명세 §섹션 | 명세 필드 (라벨) | 프로토타입 컴포넌트 | 프로토타입 파일:라인 | 옵션·검증 | 상태 |
|---|---|---|---|---|---|---|
| 1 | §2-2 A | 배너 위치 (read-only Badge) | `ReadOnlyBox` | BannerForm.tsx:72 | 메인/오늘의 할일/다함께/미션 | ✅ |
| 2 | §2-2 A | 아티스트 (read-only Badge) | `ReadOnlyBox` | BannerForm.tsx:80 | 전역 또는 단일 아티스트 | ✅ |
| 3 | §2-2 B | 메인 타이틀 (KO/EN/JP) | `MultiLangRow` | BannerForm.tsx:95 | 각 30자, 필수 | ✅ |
| 4 | §2-2 B | 서브 타이틀 (KO/EN/JP) | `MultiLangRow` | BannerForm.tsx:106 | 각 60자, 필수 | ✅ |
| 5 | §2-2 B | **이미지 대체 텍스트 (KO/EN/JP)** | `MultiLangRow` | BannerForm.tsx:120 | 각 100자, 선택. `HomeBanner` 타입에 `altTextKO/EN/JP` 추가 (mock 9건 빈 문자열 기본값) | ✅ (2026-05-21 정정) |
| 6 | §2-2 C | 미디어 이미지 업로드 | Drag-drop zone | BannerForm.tsx:125 | JPG/PNG/WEBP, 최대 50MB, 슬롯별 권장 비율 | ✅ |
| 7 | §2-2 D | 소스 타입 (텍스트박스) | `DeeplinkPicker.sourceType` | BannerForm.tsx:136 (DeeplinkPicker 내) | 자유 텍스트, placeholder "소스 타입 입력" | ✅ |
| 8 | §2-2 D | 링크 URL (텍스트박스) | `DeeplinkPicker.url` | BannerForm.tsx:136 (DeeplinkPicker 내) | `https://`·`http://`·`/` 형식 검증 | ✅ |
| 9 | §2-2 E | 노출 기간 모드 (무기한/사용자 지정) | 라디오 버튼 그룹 | BannerForm.tsx:146 | 2종 라디오 | ✅ |
| 10 | §2-2 E | 공개일시 (KST) | `<input>` Date+Time | BannerForm.tsx:178 | 사용자 지정 선택 시 노출 | ✅ |
| 11 | §2-2 E | 종료일시 (KST) | `<input>` Date+Time | BannerForm.tsx:188 | 사용자 지정 선택 시 노출 | ✅ |

## 액션·헤더 정합 매트릭스

| # | 명세 §섹션 | 상태별 액션 | 프로토타입 버튼 | 프로토타입 파일:라인 | 상태 |
|---|---|---|---|---|---|
| A1 | §4-1 DRAFT | [즉시 노출 시작] | `<button>` | banners/[id]/page.tsx | ✅ |
| A2 | §4-1 DRAFT | [수정] | `<button>` | banners/[id]/page.tsx:143 | ✅ |
| A3 | §4-1 DRAFT | [삭제] | `<button>` | banners/[id]/page.tsx:151 | ✅ |
| A4 | §4-1 ACTIVE | [즉시 노출 종료] | `<button>` | banners/[id]/page.tsx | ✅ |
| A5 | §4-1 ACTIVE | [복제] | `<button>` | banners/[id]/page.tsx | ✅ |
| A6 | §4-1 CLOSED | [복제] | `<button>` | banners/[id]/page.tsx | ✅ |
| A7 | §4-1 CLOSED | [삭제] | `<button>` | banners/[id]/page.tsx | ✅ |

## 기타 동작 정합

| # | 명세 §섹션 | 동작 | 프로토타입 구현 | 상태 |
|---|---|---|---|---|
| O1 | §4-2 | 슬롯 쿼리 없을 때 토스트(Error) 안내 + 배너 관리로 리다이렉트 | `new/page.tsx:33` — 인라인 안내 박스(rose 톤) + 1.5초 후 자동 리다이렉트. `alert()` 제거 | ✅ (2026-05-21 정정) |

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-21 | **신규 작성**. 명세 v6.6 기준 매트릭스 초기 정의. 누락 1건(#5 이미지 대체 텍스트 KO/EN/JP) + 불일치 1건(O1 토스트 vs alert) 표기. 사용자 발견 누락(이미지 대체 텍스트)을 시스템 첫 추적 대상으로 등록 |
| 2026-05-21 | **정정 완료** — #5 이미지 대체 텍스트 ⚠️→✅ (BannerForm.tsx §B에 `MultiLangRow` 추가, `HomeBanner` 타입에 `altTextKO/EN/JP` 3필드 + mock 9건 빈 값 기본). O1 ⚠️→✅ (`new/page.tsx` `alert()` 제거, 인라인 안내 박스로 교체) |
