import { z } from "zod";

export const createSchema = z.object({
  target: z.enum(["전체", "V01D", "CELEBUS"]).default("전체"),
  category: z.enum(["이벤트", "굿즈", "행사", "콘텐츠", "기타"]).default("기타"),
  title: z.string().trim().min(1, "제목을 입력해주세요.").max(80, "제목은 80자 이하로 입력해주세요."),
  nickname: z.string().trim().min(1, "닉네임을 입력해주세요.").max(20, "닉네임은 20자 이하로 입력해주세요."),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 해요.").max(64),
  body: z.string().trim().min(2, "내용을 2자 이상 입력해주세요.").max(500, "내용은 500자 이하로 입력해주세요."),
});

export const updateSchema = z.object({
  password: z.string().min(1).max(64),
  target: z.enum(["전체", "V01D", "CELEBUS"]),
  category: z.enum(["이벤트", "굿즈", "행사", "콘텐츠", "기타"]),
  title: z.string().trim().min(1).max(80),
  nickname: z.string().trim().min(1).max(20),
  body: z.string().trim().min(2).max(500),
});

export const deleteSchema = z.object({
  password: z.string().min(1).max(64),
});

export const verifySchema = z.object({
  password: z.string().min(1).max(64),
});

export const likeSchema = z.object({
  voter: z.string().min(8).max(64),
});

// 게시글 번역 요청 — 목표 언어(현재 UI 언어)
export const translateSchema = z.object({
  lang: z.enum(["ko", "en", "ja"]),
});

// 댓글 (평면). 두 모드:
//  - 일반: nickname + password
//  - 작성자: op_password(글 비밀번호)만 → 닉네임/댓글비번 불필요
export const createCommentSchema = z
  .object({
    post_id: z.string().uuid(),
    nickname: z.string().trim().min(1).max(20).optional(),
    password: z.string().min(4).max(64).optional(),
    body: z.string().trim().min(2, "댓글을 2자 이상 입력해주세요.").max(500, "댓글은 500자 이하로 입력해주세요."),
    op_password: z.string().min(1).max(64).optional(),
  })
  .refine((d) => (d.op_password && d.op_password.length > 0) || (d.nickname && d.password), {
    message: "닉네임과 비밀번호를 입력해주세요.",
  });

export const deleteCommentSchema = z.object({
  password: z.string().min(1).max(64),
});

// 관리자: 채택/고정/실현상태/공식답글 (부분 갱신 — 온 필드만 반영)
export const adminPatchSchema = z.object({
  hidden: z.boolean().optional(),
  curated: z.boolean().optional(),
  pinned: z.boolean().optional(),
  impl_status: z.enum(["none", "reviewing", "planned", "realized"]).optional(),
  official_reply: z.string().trim().max(500).nullable().optional(),
});

// 보상 클레임: 본인 확인(비밀번호) + 배송정보
export const claimSchema = z.object({
  password: z.string().min(1).max(64),
  name: z.string().trim().min(1, "수령자명을 입력해주세요.").max(40),
  email: z.string().trim().email("올바른 이메일을 입력해주세요.").max(120),
  phone: z.string().trim().min(1, "연락처를 입력해주세요.").max(30),
  address: z.string().trim().min(1, "주소를 입력해주세요.").max(200),
  memo: z.string().trim().max(200).optional(),
});

// 관리자: 추첨 실행
export const drawSchema = z.object({
  round: z.string().trim().min(1).max(40),
  prize: z.string().trim().min(1).max(80),
  count: z.number().int().min(1).max(100),
  days: z.number().int().min(1).max(365).optional(),
});

// 관리자: 채택-굿즈 수동 등록
export const prizeCreateSchema = z.object({
  post_id: z.string().uuid(),
  nickname: z.string().trim().min(1).max(20),
  prize: z.string().trim().min(1).max(80),
  round: z.string().trim().min(1).max(40),
});
