import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";

// 파티룸 — 방 상태 조회(GET) + 개설/입장/시작/정답/진행(POST action). 상태 권위 = DB RPC (기획 §5.5).
// 제시어는 출제자에게만, 맞히기 타일은 출제자 외에게만 내려간다 (정답 평문 비출제자 미전송).
const DUMMY_SYLLABLES = "가나다라마바사자카타파하고노도로모보소조코토포호구두루무부수주추쿠투푸후기니디리미비시지치키티피히".split("");
const DUMMY_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
function buildTiles(answer: string): string[] {
  const chars = [...answer.replace(/\s/g, "")];
  const pool = /[가-힣]/.test(answer) ? DUMMY_SYLLABLES : DUMMY_LETTERS;
  const dummies: string[] = [];
  while (dummies.length < Math.max(4, 10 - chars.length)) {
    const d = pool[Math.floor(Math.random() * pool.length)];
    if (!chars.includes(d) && !dummies.includes(d)) dummies.push(d);
  }
  return [...chars, ...dummies].sort(() => Math.random() - 0.5);
}

export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const h = playerHash(anonId);
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.toUpperCase();
  if (!code) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const { data: room } = await admin()
    .from("game_sketch_room")
    .select("id, code, status, round, total_rounds, host_hash, drawer_hash, word_id, round_started_at, round_deadline")
    .eq("code", code)
    .maybeSingle();
  if (!room) return NextResponse.json({ error: "방을 찾을 수 없어요." }, { status: 404 });

  const [{ data: members }, { data: corrects }] = await Promise.all([
    admin().from("game_sketch_room_member").select("player_hash, nickname, score, joined_at").eq("room_id", room.id).order("joined_at"),
    admin().from("game_sketch_room_correct").select("player_hash, points").eq("room_id", room.id).eq("round", room.round),
  ]);
  const correctSet = new Map((corrects ?? []).map((c) => [c.player_hash, c.points]));
  const isDrawer = room.drawer_hash === h;

  let word: string | null = null;
  let tiles: string[] | null = null;
  let answerLen = 0;
  if (room.status === "playing" && room.word_id) {
    const { data: w } = await admin().from("game_sketch_word").select("text").eq("id", room.word_id).single();
    const answer = ((w?.text as { ko?: string })?.ko ?? "").trim();
    answerLen = [...answer.replace(/\s/g, "")].length;
    if (isDrawer) word = answer;
    else if (!correctSet.has(h)) tiles = buildTiles(answer);
  }

  return NextResponse.json({
    room: {
      id: room.id,
      code: room.code,
      status: room.status,
      round: room.round,
      total_rounds: room.total_rounds,
      deadline: room.round_deadline,
      is_host: room.host_hash === h,
      is_drawer: isDrawer,
      is_member: (members ?? []).some((m) => m.player_hash === h),
    },
    members: (members ?? []).map((m) => ({
      nick: m.nickname || "익명 팬",
      score: m.score,
      is_drawer: m.player_hash === room.drawer_hash,
      is_host: m.player_hash === room.host_hash,
      is_me: m.player_hash === h,
      correct: correctSet.has(m.player_hash),
    })),
    word,
    tiles,
    answer_len: answerLen,
    my_correct: correctSet.has(h),
  });
}

const postSchema = z.object({
  action: z.enum(["create", "join", "start", "guess", "advance"]),
  code: z.string().max(10).optional(),
  id: z.string().uuid().optional(),
  nick: z.string().max(16).optional(),
  answer: z.string().max(40).optional(),
  force: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const h = playerHash(anonId);
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  const p = parsed.data;

  const call = async () => {
    switch (p.action) {
      case "create":
        return admin().rpc("game_sketch_room_create", { p_h: h, p_nick: p.nick ?? "" });
      case "join":
        return admin().rpc("game_sketch_room_join", { p_code: p.code ?? "", p_h: h, p_nick: p.nick ?? "" });
      case "start":
        return admin().rpc("game_sketch_room_start", { p_room: p.id, p_h: h });
      case "guess":
        return admin().rpc("game_sketch_room_guess", { p_room: p.id, p_h: h, p_answer: p.answer ?? "" });
      case "advance":
        return admin().rpc("game_sketch_room_advance", { p_room: p.id, p_h: h, p_force: p.force ?? false });
    }
  };
  const { data, error } = await call();
  if (error) return NextResponse.json({ error: "처리에 실패했어요." }, { status: 500 });
  return NextResponse.json(data ?? {});
}
