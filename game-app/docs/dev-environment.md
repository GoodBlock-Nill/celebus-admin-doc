# 개발/운영 환경 분리 가이드 (Supabase)

2026-07-28 Supabase Pro 전환과 함께 개발(dev)·운영(prod) 프로젝트를 분리했다.
**운영 DB에 직접 실험하던 구조를 종료** — 모든 마이그레이션·설정 실험은 dev 선검증 후 프로드에 적용한다.

## 프로젝트 구성

| 환경 | 조직 | 프로젝트 (ref) | 리전 | 요금제 |
|------|------|----------------|------|--------|
| **운영(prod)** | GoodBlock-Product | CELEBUS-Feedback (`kvnareycturmavnyaqws`) | Sydney | **Pro** (일일 백업 7일·Spend Cap ON) |
| **개발(dev)** | GoodBlock-Dev | celeb-match-dev (`mqprgrvlyrqtuctzglxs`) | Seoul | Free ($0) |

- dev는 프로드 스키마 전체 덤프로 생성(테이블·함수·정책 동일 파리티), 데이터는 빈 상태에서 시작.
- 같은 조직(GoodBlock-Product)의 나머지 프로젝트는 **일시정지 유지**(Pro 조직 내 활성 프로젝트는 개별 컴퓨트 과금되므로 복원 금지).

## 키·시크릿 위치

| 파일 | 내용 | 비고 |
|------|------|------|
| `.env.local` | **dev** 프로젝트 URL·키 (로컬 `npm run dev`가 사용) | gitignore |
| `.env.prod.backup` | 프로드 키 백업 (스크립트 검증용 참조) | gitignore |
| `.env.dev-db-password` | dev DB 비밀번호 (push 스크립트가 사용) | gitignore |
| Vercel 환경변수 | **프로드 배포**가 사용하는 프로드 키 | 로컬 파일과 무관 |

⚠️ 프로덕션 배포(`npx vercel --prod`)는 Vercel에 저장된 프로드 env를 쓰므로 `.env.local` 전환의 영향을 받지 않는다.

## 마이그레이션 워크플로우 (변경됨)

```bash
# 1) dev에 먼저 적용·검증
./scripts/db-push-dev.sh

# 2) 로컬(localhost:3400 = dev DB)에서 기능 검증

# 3) 검증 통과 후 프로드 적용 (CLI 링크 = 프로드)
supabase db push --yes
```

- 규칙: **프로드 push 전 dev push를 건너뛰지 않는다.** (과거 사고: 운영 설정 실험·호환 함수 삭제가 실유저에게 즉시 반영)
- 설정(game_config) 실험도 dev에서만. 프로드 설정 변경은 관리자 화면을 통해서만.
- dev와 프로드의 스키마 드리프트가 의심되면 프로드 스키마를 다시 덤프해 dev 재구성(비용 0, 데이터 없음).

## 참고

- dev DB 접속(psql): Docker 필요 — `docker run --rm -it postgres:16-alpine psql "postgresql://postgres.mqprgrvlyrqtuctzglxs:$(cat .env.dev-db-password)@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"`
- 프로드 백업: Supabase 대시보드 → Database → Backups (일일, 7일 보관). 위험 작업 전 수동 백업 권장.
- 로컬에서 SSO 없이 테스트: `SSO_DEV_MOCK` 환경변수(기존 패턴) 사용.
