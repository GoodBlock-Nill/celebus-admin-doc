# CELEBUS FeedBack

V01D 팬 피드백 보드 PWA — **로그인 없이** V01D · CELEBUS · ix엔터에 자유롭게 피드백을 남기고 서로 좋아요를 누르는 공간.

- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase(Postgres) · Serwist(PWA) · Vercel
- **화면**: ① 상단 글쓰기 · ② 인기 TOP 10 · ③ 최신글 · 관리자(`/admin`)
- **기능**: 무로그인 작성(닉네임+비밀번호) · 좋아요 · 수정/삭제(비밀번호) · 신고(자동숨김) · **이미지 카드 저장** · 관리자 숨김/삭제

---

## 1. Supabase 준비 (새 프로젝트)

1. [supabase.com](https://supabase.com)에서 **새 프로젝트** 생성 (기존 앱과 격리).
2. **SQL Editor** → `supabase/001_schema.sql` 내용을 붙여넣고 실행 (pgcrypto·테이블·뷰·RLS·RPC 생성).
3. **Project Settings → API** 에서 아래 3개 값 확보:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (**서버 전용, 절대 노출 금지**)

## 2. 환경변수

`.env.local.example` 을 복사해 `.env.local` 로 만들고 값 채우기:

```bash
cp .env.local.example .env.local
```

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon 키 (읽기, RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role 키 (서버 쓰기 전용) |
| `HASH_SALT` | IP/디바이스 해시용 랜덤 문자열 |
| `ADMIN_PASSWORD` | `/admin` 접근 비밀번호 |

## 3. 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3200
```

## 4. Vercel 배포

1. GitHub에 push 후 Vercel에서 **New Project** → 이 폴더(`feedback-app`)를 Root Directory로 지정.
2. 위 5개 환경변수를 Vercel **Environment Variables**에 등록 (service role·salt·admin은 Production/Preview에만).
3. Deploy. (빌드 명령은 `next build --webpack` — Serwist가 webpack 필요. `package.json`에 이미 설정됨.)

---

## 보안 설계 요약

- **RLS 잠금**: anon은 `posts_public` 뷰(민감 컬럼·숨김글 제외)만 읽기. 모든 쓰기/수정/삭제는 서버 라우트에서 `service_role`로만.
- **비밀번호**: bcrypt(`pgcrypto`) 해시만 저장. 평문·해시 모두 클라이언트에 노출되지 않음(뷰에서 제외). **분실 시 복구 불가**.
- **개인정보 최소화**: 원본 IP 미저장 — 솔트 결합 SHA-256 해시만 사용.
- **스팸 방지**(Supabase+Vercel만): 작성 레이트리밋(30초 1건 / 시간당 10건, IP 해시 기준) · 욕설 필터 · 신고 누적 5회 자동 숨김 · 좋아요 디바이스 중복 방지 · 동일 출처(Origin) 체크.
- **XSS**: 평문만 저장·표시(React 자동 이스케이프, HTML 렌더 없음).

### 알려진 한계 (무로그인 특성)

- 좋아요·수정삭제 인증은 **디바이스/비밀번호 기반 best-effort** — 완전한 어뷰징 차단은 불가.
- 욕설 필터는 경량(우회 가능) → 신고·관리자 검수로 보완.
- 강한 봇 방어가 필요해지면 Cloudflare Turnstile · Upstash 레이트리밋을 추가 도입 권장.

## 구조

```
feedback-app/
├─ supabase/001_schema.sql     # DB 스키마·RLS·RPC (Supabase에서 실행)
├─ src/lib/                    # supabase 클라이언트, zod, 해시, 욕설필터, origin
├─ src/app/api/                # posts(등록·수정·삭제·좋아요·신고), admin
├─ src/components/             # Header, WriteForm, PostCard, Modals, Board
└─ src/app/(page·admin·sw)     # 메인/관리자/서비스워커
```
