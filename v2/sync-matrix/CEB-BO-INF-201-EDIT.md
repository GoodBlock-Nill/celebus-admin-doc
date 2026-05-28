# Sync Matrix — CEB-BO-INF-201-EDIT 소식·일정 작성·수정

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/INF/[CEB-BO-INF-201-EDIT] 소식·일정 작성·수정.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/artists/feed/create/page.tsx` |
| 프로토타입 신규 페이지 | — | `prototype/src/app/artists/feed/[id]/edit/page.tsx` |
| 프로토타입 폼 컴포넌트 | — | `prototype/src/app/artists/feed/FeedForm.tsx` |
| 프로토타입 보조 컴포넌트 | — | `prototype/src/components/clone/AddressSearch.tsx` |
| 프로토타입 데이터 모델 | — | `prototype/src/mock/feed.ts` (`FeedItem` 타입) |
| 프로토타입 마지막 동기화 | — | 2026-05-28 |

## 정합 메모

- 타입별 폼 분기(소식/일정/공지). 소식 연관 콘텐츠(타입+콘텐츠명+URL, 최대 3), 일정 장소(구글 장소 검색 자동완성), 공지 대표 이미지.
- [게시]는 다국어 필수(KO/EN/JA)+타입별 필수 충족 시에만 활성. 미충족 시 비활성 + 차단 토스트. 임시저장은 항상 가능.
