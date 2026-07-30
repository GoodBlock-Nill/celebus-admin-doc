"use client";

// 공식 영상 등록 — 공식 아카이브(is_official)에 V01D 공식 YouTube/TikTok URL을 붙여넣어 일괄 등록.
// 기존 시드 API(/api/stage/admin/seed) UI화 + 등록된 공식 영상 목록·삭제. (YouTube·TikTok만 지원)
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin-types";

type Stage = { id: string; title: string; is_official: boolean };
type Post = { id: string; title: string; handle: string; thumbnail_url: string | null; is_official: boolean; stage_id: string };
type SeedResult = { url: string; ok: boolean; id?: string; code?: string };

// 공식 카테고리 — V01D 공식 채널 플레이리스트 기준
const CATS = [
  { v: "v1de0", l: "V1DE0" },
  { v: "oncam", l: "ON CAM" },
  { v: "log", l: "LOG" },
  { v: "azit", l: "AZIT" },
  { v: "stud10", l: "STUD10" },
  { v: "outv", l: "OUT THE V01D" },
];

export default function OfficialSeedPanel() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState<string>("");
  const [urls, setUrls] = useState("");
  const [category, setCategory] = useState("v1de0");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SeedResult[] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const loadStages = useCallback(async () => {
    const res = await adminFetch("/api/admin/stages");
    const j = await res.json();
    const official = ((j.stages ?? []) as Stage[]).filter((s) => s.is_official);
    setStages(official);
    setStageId((prev) => prev || official[0]?.id || "");
  }, []);

  const loadPosts = useCallback(async () => {
    if (!stageId) return setPosts([]);
    const res = await adminFetch("/api/admin/posts");
    const j = await res.json();
    setPosts(((j.posts ?? []) as Post[]).filter((p) => p.stage_id === stageId && p.is_official));
  }, [stageId]);

  useEffect(() => { void loadStages(); }, [loadStages]);
  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const urlList = urls.split(/\s+/).map((u) => u.trim()).filter(Boolean);
  const catLabel = CATS.find((c) => c.v === category)?.l ?? "";

  async function seed() {
    if (busy || !stageId || urlList.length === 0) return;
    setBusy(true);
    setResults(null);
    const res = await adminFetch("/api/stage/admin/seed", {
      method: "POST",
      body: JSON.stringify({ stage_id: stageId, urls: urlList, category }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setResults(j.results ?? []);
      toast(`${j.added}/${j.total}건 등록됐어요.`);
      setUrls("");
      void loadPosts();
    } else {
      toast(j.error ?? "등록 실패");
    }
  }

  async function remove(id: string) {
    if (!confirm("이 공식 영상을 삭제할까요?")) return;
    const res = await adminFetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (res.ok) { toast("삭제했어요."); void loadPosts(); }
    else toast("삭제 실패");
  }

  if (stages.length === 0) {
    return (
      <div className="rounded-xl bg-white/[0.04] p-5 text-center text-[13px] text-fg/60 ring-1 ring-white/10">
        공식 아카이브가 없어요. <b className="text-fg/80">‘아카이브’ 탭</b>에서 <b className="text-primary-400">V01D 공식 아카이브</b>를 먼저 만들어주세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
        <label className="block text-[12px] font-bold text-fg/60">
          공식 아카이브
          <select value={stageId} onChange={(e) => setStageId(e.target.value)}
            className="mt-1 w-full rounded-xl bg-white/6 px-3 py-3 text-[13.5px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60">
            {stages.map((s) => <option key={s.id} value={s.id} className="bg-[#141217]">{s.title}</option>)}
          </select>
        </label>

        <div className="mt-3">
          <span className="block text-[12px] font-bold text-fg/60">카테고리 선택 <span className="text-fg/40">(등록할 영상이 속한 플레이리스트)</span></span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CATS.map((c) => (
              <button key={c.v} onClick={() => setCategory(c.v)}
                className={`rounded-full px-3.5 py-2 text-[12px] font-bold ring-1 ${category === c.v ? "bg-primary text-white ring-primary" : "bg-white/8 text-fg/60 ring-white/10"}`}>{c.l}</button>
            ))}
          </div>
        </div>

        <label className="mt-3 block text-[12px] font-bold text-fg/60">
          영상 URL (YouTube · TikTok, 한 줄에 하나 · 최대 30개)
          <textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={5}
            placeholder={"https://www.youtube.com/watch?v=...\nhttps://www.tiktok.com/@v01d/video/..."}
            className="mt-1 w-full resize-none rounded-xl bg-white/6 px-3 py-3 text-[13px] text-fg outline-none ring-1 ring-white/10 focus:ring-primary/60 placeholder:text-fg/25" />
        </label>

        <button onClick={seed} disabled={busy || urlList.length === 0}
          className="mt-3 w-full rounded-full bg-primary py-3 text-[14px] font-bold text-white disabled:opacity-40">
          {busy ? "등록 중…" : `${catLabel} 카테고리로 ${urlList.length}건 등록`}
        </button>

        {results && (
          <div className="mt-3 space-y-1 text-[11.5px]">
            {results.map((r) => (
              <div key={r.url} className={`truncate ${r.ok ? "text-emerald-400" : "text-rose-400"}`}>
                {r.ok ? "✓" : "✗"} {r.url}{!r.ok && r.code ? ` (${r.code})` : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-[12px] font-bold text-fg/60">등록된 공식 영상 ({posts.length})</div>
        {posts.length === 0 ? (
          <div className="rounded-xl bg-white/[0.04] p-4 text-center text-[12.5px] text-fg/45 ring-1 ring-white/10">아직 등록된 공식 영상이 없어요.</div>
        ) : posts.map((p) => (
          <div key={p.id} className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-white/8">
              {p.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-fg">{p.title}</div>
              <div className="truncate text-[11px] text-fg/45">@{p.handle}</div>
            </div>
            <button onClick={() => void remove(p.id)} className="shrink-0 rounded-full bg-white/8 px-3 py-2 text-[12px] font-bold text-rose-300">삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
