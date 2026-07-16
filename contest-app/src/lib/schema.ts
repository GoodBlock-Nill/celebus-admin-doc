import { z } from "zod";

// SNS 핸들: 앞의 @ 제거 후 저장. 플랫폼 공통으로 무난한 문자만 허용
const handleSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@+/, ""))
  .pipe(
    z
      .string()
      .min(1, "SNS 핸들을 입력해주세요.")
      .max(40, "핸들은 40자 이하로 입력해주세요.")
      .regex(/^[\w.\-]+$/, "핸들은 영문·숫자·밑줄·점·하이픈만 사용할 수 있어요."),
  );

export const resolveUrlSchema = z.object({
  contest_id: z.string().uuid(),
  url: z.string().trim().min(8, "링크를 입력해주세요.").max(500, "링크가 너무 길어요."),
});

export const createEntrySchema = z.object({
  contest_id: z.string().uuid(),
  url: z.string().trim().min(8, "링크를 입력해주세요.").max(500),
  title: z.string().trim().min(1, "작품 제목을 입력해주세요.").max(80, "제목은 80자 이하로 입력해주세요."),
  description: z.string().trim().max(300, "소개는 300자 이하로 입력해주세요.").default(""),
  // 핸들은 서버가 링크에서 추출하는 것이 원칙 — 자동 추출 불가 플랫폼(인스타그램)만 수동 입력 사용
  handle: handleSchema.optional(),
  // CELEBUS 신원 — 본인 확인·보상 연락용 (공개되지 않음)
  celebus_nickname: z
    .string()
    .trim()
    .min(1, "CELEBUS 닉네임을 입력해주세요.")
    .max(20, "닉네임은 20자 이하로 입력해주세요."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{9,20}$/, "CELEBUS에서 인증한 전화번호를 정확히 입력해주세요."),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 해요.").max(64),
  agree: z.literal(true, { errorMap: () => ({ message: "참가 규정에 동의해주세요." }) }),
  agree_official: z.literal(true, {
    errorMap: () => ({ message: "출품작의 공식계정 활용에 동의해주세요." }),
  }),
});

export const updateEntrySchema = z.object({
  password: z.string().min(1).max(64),
  title: z.string().trim().min(1, "작품 제목을 입력해주세요.").max(80),
  description: z.string().trim().max(300).default(""),
});

export const deleteEntrySchema = z.object({
  password: z.string().min(1).max(64),
});

export const verifyEntrySchema = z.object({
  password: z.string().min(1).max(64),
});

export const voteSchema = z.object({
  voter: z.string().min(8).max(64),
});

// 보상 클레임: 본인 확인(출품 비밀번호) + 배송정보 (FanVoice claimSchema 동형)
export const claimSchema = z.object({
  password: z.string().min(1).max(64),
  name: z.string().trim().min(1, "수령자명을 입력해주세요.").max(40),
  email: z.string().trim().email("올바른 이메일을 입력해주세요.").max(120),
  phone: z.string().trim().min(1, "연락처를 입력해주세요.").max(30),
  address: z.string().trim().min(1, "주소를 입력해주세요.").max(200),
  memo: z.string().trim().max(200).optional(),
});

// ── 관리자 ──────────────────────────────────────────────

const prizeItemSchema = z.object({
  rank_label: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  image_url: z.string().trim().url().max(500).nullable().optional(),
  award_type: z.enum(["popular", "judge"]),
  count: z.number().int().min(1).max(100),
});

// 다국어 로케일(en·ja) — 부분 입력 허용
const contestLocaleSchema = z.object({
  title: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  rules: z.string().trim().max(4000).optional(),
  prize_summary: z.string().trim().max(200).optional(),
});

export const contestCreateSchema = z.object({
  // slug 미제공 시 서버가 자동 생성 (제공 시 형식 검증)
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9\-]+$/, "slug는 영문 소문자·숫자·하이픈만 사용할 수 있어요.")
    .optional(),
  artist: z.string().trim().min(1).max(40).default("V01D"),
  contest_type: z.enum(["image", "video"]),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).default(""),
  rules: z.string().trim().max(4000).default(""),
  prize_summary: z.string().trim().max(200).default(""),
  prizes: z.array(prizeItemSchema).max(20).default([]),
  cover_image_url: z.string().trim().url().max(500).nullable().optional(),
  is_featured: z.boolean().optional(),
  banner_order: z.number().int().min(0).max(999).nullable().optional(),
  i18n: z.record(z.enum(["en", "ja"]), contestLocaleSchema).optional(),
  submit_start_at: z.string().datetime({ offset: true }).nullable().optional(),
  submit_end_at: z.string().datetime({ offset: true }).nullable().optional(),
  vote_end_at: z.string().datetime({ offset: true }).nullable().optional(),
  announce_at: z.string().datetime({ offset: true }).nullable().optional(),
});

// 번역 제안 요청 (저장 X — 폼이 결과를 받아 편집 후 저장)
export const contestTranslateSchema = z.object({
  title: z.string().trim().max(80).default(""),
  description: z.string().trim().max(2000).default(""),
  rules: z.string().trim().max(4000).default(""),
  prize_summary: z.string().trim().max(200).default(""),
});

export const contestPatchSchema = contestCreateSchema.partial().extend({
  status: z.enum(["draft", "open", "voting", "judging", "announced", "closed"]).optional(),
});

export const entryAdminPatchSchema = z.object({
  hidden: z.boolean().optional(),
  disqualified: z.boolean().optional(),
  disqualify_reason: z.string().trim().max(200).nullable().optional(),
});

export const finalizeSchema = z.object({
  awards: z
    .array(z.object({ award_name: z.string().trim().min(1).max(40), prize: z.string().trim().max(80).default("") }))
    .min(1)
    .max(20),
});

export const awardCreateSchema = z.object({
  contest_id: z.string().uuid(),
  entry_id: z.string().uuid(),
  award_name: z.string().trim().min(1).max(40),
  prize: z.string().trim().max(80).default(""),
});

export const awardPatchSchema = z.object({
  claim_status: z.enum(["none", "claimed", "shipped"]).optional(),
  purge_claim_info: z.boolean().optional(), // 배송 완료 후 개인정보 파기
});
