# 공식영상 아카이브 — 프로드 적용 런북

dev에 구축한 "V01D 공식" 아카이브(카테고리 + 공식영상 186건)를 프로드에 동일하게 재현하는 절차.

## 데이터 구성

| 파일 | 카테고리 | 건수 | 출처 |
|------|----------|------|------|
| `official-shorts.txt` | `shorts` | 155 | `@v01d-ix/shorts` (오래된순) |
| `official-album01.txt` | `album01` | 31 | 플레이리스트 "V01D 1st Mini Album 01" (오래된순) |

- URL은 **오래된순**으로 정렬 → 등록 시 오래된 것부터 들어가 앱에서 **최신이 맨앞**에 노출.
- 등록은 영상ID 기준 **중복 방지** → 재실행해도 안전(이미 있으면 skip).

## 프로드 적용 3단계

### 1) 스키마 — 마이그레이션 적용
프로드 접속 URL을 `.env.prod-db-url`에 저장(Supabase → 프로드 → Connect → Session pooler URI. gitignore됨).

```bash
./scripts/db-apply-prod.sh \
  supabase/013_challenge_views.sql \
  supabase/014_official_seed.sql \
  supabase/015_official_archive.sql \
  supabase/016_featured_post.sql \
  supabase/017_uploader_nickname.sql \
  supabase/018_official_categories.sql \
  supabase/019_official_categories_add.sql \
  supabase/020_official_category_album01.sql
```
(이미 적용된 파일은 건너뛰고, 미적용 파일만 넣어도 됨. 'yes' 확인 프롬프트 있음.)

### 2) 아카이브 생성 — 프로드 admin
프로드 앱 `/admin` → `아카이브` 탭 → **V01D 공식 아카이브 1개 생성**(is_official).
생성 후 그 stage_id 확보(공식영상 탭 드롭다운 or `/api/admin/stages`).

### 3) 공식영상 186건 일괄 등록
```bash
./scripts/seed-official.sh https://<프로드-앱-도메인> <프로드_공식_stage_id> <프로드_admin_비번>
```

## 갱신(새 영상 추가) 방법
1. `yt-dlp --flat-playlist --print "%(id)s" <채널/플레이리스트 URL>` 로 ID 수집
2. 오래된순으로 정렬해 `https://www.youtube.com/watch?v=<id>` 형태로 해당 리스트 파일에 추가
3. `manifest.tsv`에 새 리스트↔카테고리 매핑 추가(신규 카테고리면 코드+마이그레이션도 추가)
4. `seed-official.sh` 재실행(기존분은 중복 skip, 신규만 등록)
