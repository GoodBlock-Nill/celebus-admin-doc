# Sync Matrix — CEB-BO-INF-201 소식·일정 상세 (읽기 전용)

## 매핑

| 항목 | 명세 | 프로토타입 |
|---|---|---|
| 명세 파일 | `v2/BO/INF/[CEB-BO-INF-201] 소식·일정 상세.md` | — |
| 프로토타입 페이지 | — | `prototype/src/app/artists/feed/[id]/page.tsx` |
| 프로토타입 컴포넌트 | — | `prototype/src/app/artists/feed/FeedDetail.tsx` |
| 프로토타입 데이터 모델 | — | `prototype/src/mock/feed.ts` (`FeedItem` 타입) |
| 프로토타입 마지막 동기화 | — | 2026-05-28 |

## 정합 메모

- 읽기 전용 상세. 제목·본문·일정명은 언어 전환 탭(KO/EN/JA)으로 다국어 조회. 소식 이미지는 썸네일 그리드.
- 상태별 액션(수정/게시/보관/재게시/삭제) + 확인 모달.
