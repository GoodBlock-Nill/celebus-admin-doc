import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { playerHash } from "@/lib/hash";
import { peekVoterId } from "@/lib/anon-identity";
import { assertSameOrigin } from "@/lib/origin";
import { answerFor, buildTileSet, computeBombIndices, type WordText } from "@/lib/sketch-tiles";

// 파티룸 — 방 상태 조회(GET) + 개설/입장/시작/정답/진행(POST action). 상태 권위 = DB RPC (기획 §5.5).
// 제시어는 출제자에게만, 맞히기 타일은 출제자 외에게만 내려간다 (정답 평문 비출제자 미전송).
export async function GET(req: Request) {
  const anonId = peekVoterId(req);
  if (!anonId) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const h = playerHash(anonId);
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.toUpperCase();
  const lang = (url.searchParams.get("lang") ?? "ko") as "ko" | "en" | "ja";
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
  let tileLang: string = lang;
  if (room.status === "playing" && room.word_id) {
    const { data: w } = await admin().from("game_sketch_word").select("text, category").eq("id", room.word_id).single();
    const text = ((w?.text ?? {}) as WordText);
    if (isDrawer) word = answerFor(text, lang).answer; // 출제자에게는 유저 언어 표기 (판정은 전 언어 허용)
    else if (!correctSet.has(h)) {
      const { data: decoyRows } = await admin().from("game_sketch_word").select("text, category").eq("active", true).neq("id", room.word_id).limit(60);
      const sameCat = (decoyRows ?? []).filter((r) => r.category === (w as { category?: string } | null)?.category);
      const stable = (a: { text: unknown }, b: { text: unknown }) => String((a.text as WordText).ko).localeCompare(String((b.text as WordText).ko));
  const decoys = [...sameCat.sort(stable).slice(0, 6), ...(decoyRows ?? []).sort(stable).slice(0, 6)].map((r) => r.text as WordText);
      // 라운드 시드 고정 — 폴링·재입장에도 타일 불변
      const set = buildTileSet(text, lang, { decoys, seed: `${room.id}:${room.round}:${h}:${lang}` });
      tiles = set.tiles;
      answerLen = set.answer_len;
      tileLang = set.lang;
    } else {
      answerLen = answerFor(text, lang).answer.replace(/[\s-]/g, "").length;
    }
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
    tile_lang: tileLang,
    my_correct: correctSet.has(h),
  });
}

const postSchema = z.object({
  action: z.enum(["create", "join", "start", "guess", "advance", "hint"]),
  code: z.string().max(10).optional(),
  id: z.string().uuid().optional(),
  nick: z.string().max(16).optional(),
  answer: z.string().max(40).optional(),
  lang: z.enum(["ko", "en", "ja"]).optional(),
  tiles: z.array(z.string().min(1).max(4)).max(24).optional(),
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
        return admin().rpc("game_sketch_room_guess", { p_room: p.id, p_h: h, p_answer: p.answer ?? "", p_lang: p.lang ?? "ko" });
      case "advance":
        return admin().rpc("game_sketch_room_advance", { p_room: p.id, p_h: h, p_force: p.force ?? false });
      case "hint":
        return admin().rpc("game_sketch_room_hint_exec", { p_room: p.id, p_h: h, p_lang: p.lang ?? "ko" });
    }
  };
  const { data, error } = await call();
  if (error) return NextResponse.json({ error: "처리에 실패했어요." }, { status: 500 });
  if (p.action === "hint" && data && !data.error) {
    // 폭탄 방식 — 정답은 서버에서만 사용, 제거 인덱스만 응답 (비동기 힌트와 동일)
    const remove = computeBombIndices(String(data.answer ?? ""), p.tiles ?? []);
    return NextResponse.json({ status: "ok", remove, charged: data.charged ?? 0 });
  }
  return NextResponse.json(data ?? {});
}
