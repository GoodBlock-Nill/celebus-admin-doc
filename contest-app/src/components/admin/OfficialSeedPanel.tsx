"use client";

// 공식 영상 등록 — 공식 아카이브(is_official)에 V01D 공식 YouTube/TikTok URL을 붙여넣어 일괄 등록.
// 기존 시드 API(/api/stage/admin/seed) UI화 + 등록된 공식 영상 목록·검색·삭제. (YouTube·TikTok만 지원)
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin-types";
import { Badge, Btn, Card, Empty, Label, SearchInput, inputCls, useConfirm } from "./ui";

type Stage = { id: string; title: string; is_official: boolean };
type Post = { id: string; title: string; handle: string; thumbnail_url: string | null; is_official: boolean; stage_id: string; category: string };
type SeedResult = { url: string; ok: boolean; id?: string; code?: string };

// 공식 카테고리 — V01D 공식 채널 플레이리스트 기준
const CATS = [
  { v: "v1de0", l: "V1DE0" },
  { v: "album01", l: "1st Mini Album [01]" },
  { v: "oncam", l: "ON CAM" },
  { v: "log", l: "LOG" },
  { v: "azit", l: "AZIT" },
  { v: "stud10", l: "STUD10" },
  { v: "outv", l: "OUT THE V01D" },
  { v: "shorts", l: "Shorts" },
];
const CAT_LABEL: Record<string, string> = Object.fromEntries(CATS.map((c) => [c.v, c.l]));

export default function OfficialSeedPanel() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState<string>("");
  const [urls, setUrls] = useState("");
  const [category, setCategory] = useState("v1de0");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SeedResult[] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [q, setQ] = useState("");
  const { confirm, confirmEl } = useConfirm();

  const loadStages = useCallback(async () => {
    const res = await adminFetch("/api/admin/stages");
    const j = await res.json();
    const official = ((j.stages ?? []) as Stage[]).filter((s) => s.is_official);
    setStages(official);
    setStageId((prev) => prev || official[0]?.id || "");
  }, []);

  const loadPosts = useCallback(async () => {
    if (!stageId) return setPosts([]);
    const res = await adminFetch(`/api/admin/posts?stage_id=${stageId}&limit=1000`);
    const j = await res.json();
    setPosts(((j.posts ?? []) as Post[]).filter((p) => p.is_official));
  }, [stageId]);

  useEffect(() => { void loadStages(); }, [loadStages]);
  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const urlList = urls.split(/\s+/).map((u) => u.trim()).filter(Boolean);
  const catLabel = CATS.find((c) => c.v === category)?.l ?? "";

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return kw ? posts.filter((p) => p.title.toLowerCase().includes(kw) || p.handle.toLowerCase().includes(kw)) : posts;
  }, [posts, q]);

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
      toast.success(`${j.added}/${j.total}건 등록됐어요.`);
      setUrls("");
      void loadPosts();
    } else {
      toast.error(j.error ?? "등록 실패");
    }
  }

  async function remove(id: string, title: string) {
    if (!(await confirm({ title: "공식 영상 삭제", body: `'${title}'을(를) 목록에서 삭제할까요?`, confirmLabel: "삭제", danger: true }))) return;
    const res = await adminFetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("삭제했어요."); void loadPosts(); }
    else toast.error("삭제 실패");
  }

  if (stages.length === 0) {
    return (
      <Empty>
        공식 아카이브가 없어요. <b className="text-fg/80">‘아카이브’ 탭</b>에서 <b className="text-primary-strong">V01D 공식 아카이브</b>를 먼저 만들어주세요.
      </Empty>
    );
  }

  const row = (p: Post) => (
    <Card key={p.id} className="flex items-center gap-3 p-3">
      <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {p.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-fg">{p.title}</div>
        <div className="truncate text-[11px] text-subtle">@{p.handle}</div>
      </div>
      <Btn size="sm" variant="danger" onClick={() => void remove(p.id, p.title)}>삭제</Btn>
    </Card>
  );

  return (
    <div className="space-y-5">
      {/* 등록 폼 */}
      <Card className="space-y-4 p-4">
        <div>
          <Label>공식 아카이브</Label>
          <select value={stageId} onChange={(e) => setStageId(e.target.value)} className={inputCls}>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>

        <div>
          <Label>카테고리 <span className="font-medium text-subtle">(등록할 영상이 속한 플레이리스트)</span></Label>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map((c) => (
              <button key={c.v} onClick={() => setCategory(c.v)}
                className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors ${category === c.v ? "border-primary bg-primary text-white" : "border-border bg-card text-muted hover:bg-surface-2"}`}>{c.l}</button>
            ))}
          </div>
        </div>

        <div>
          <Label>영상 URL <span className="font-medium text-subtle">(YouTube · TikTok, 한 줄에 하나 · 최대 30개)</span></Label>
          <textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={5}
            placeholder={"https://www.youtube.com/watch?v=...\nhttps://www.tiktok.com/@v01d/video/..."}
            className={`${inputCls} resize-none`} />
        </div>

        <Btn variant="primary" className="w-full py-3" disabled={busy || urlList.length === 0} onClick={seed}>
          {busy ? "등록 중…" : `${catLabel} 카테고리로 ${urlList.length}건 등록`}
        </Btn>

        {results && (
          <div className="space-y-1 text-[11.5px]">
            {results.map((r) => (
              <div key={r.url} className={`truncate ${r.ok ? "text-[#21845f]" : "text-[#c0392b]"}`}>
                {r.ok ? "✓" : "✗"} {r.url}{!r.ok && r.code ? ` (${r.code})` : ""}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 등록된 공식 영상 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] font-bold text-fg">등록된 공식 영상 <span className="text-muted">({posts.length})</span></div>
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="제목·핸들로 공식 영상 검색" />

        {posts.length === 0 ? (
          <Empty>아직 등록된 공식 영상이 없어요.</Empty>
        ) : filtered.length === 0 ? (
          <Empty>검색 결과가 없어요.</Empty>
        ) : q ? (
          // 검색 중 — 그룹핑 없이 결과만
          <div className="space-y-2">
            <div className="text-[12px] font-bold text-muted">‘{q}’ 검색결과 {filtered.length}건</div>
            {filtered.map(row)}
          </div>
        ) : (
          // 카테고리별 그룹핑
          <>
            {CATS.map((c) => {
              const group = posts.filter((p) => p.category === c.v);
              if (group.length === 0) return null;
              return (
                <div key={c.v} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="primary">{c.l}</Badge>
                    <span className="text-[11px] font-bold text-subtle">{group.length}건</span>
                  </div>
                  {group.map(row)}
                </div>
              );
            })}
            {posts.filter((p) => !CAT_LABEL[p.category]).length > 0 && (
              <div className="space-y-2">
                <Badge tone="gray">기타</Badge>
                {posts.filter((p) => !CAT_LABEL[p.category]).map(row)}
              </div>
            )}
          </>
        )}
      </div>
      {confirmEl}
    </div>
  );
}
