"use client";

// 홈 대표 영상 — 관리자가 홈 히어로로 고정할 영상을 지정/해제. 단일 대표(지정 시 나머지 자동 해제).
// 대표 미지정 시 홈은 자동 로직(좋아요 최다 → 최신)으로 히어로를 고른다.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import { Badge, Btn, Card, Empty, SearchInput } from "./ui";

type PostRow = {
  id: string;
  title: string;
  handle: string;
  thumbnail_url: string | null;
  featured: boolean;
  is_official: boolean;
  created_at: string;
};

// 검색 없을 때 기본 표시 개수(수백 개 전체 렌더 방지). 검색 시 전체 표시
const DISPLAY_CAP = 40;

export default function FeaturedPanel() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    // 전체 영상 대상 검색·지정을 위해 상한 확대(기본 50건 → 전체)
    const res = await adminFetch("/api/admin/posts?limit=1000");
    const j = await res.json();
    setPosts(j.posts ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function setFeatured(id: string, featured: boolean) {
    if (busy) return;
    setBusy(id);
    const res = await adminFetch(`/api/admin/posts/${id}`, { method: "PATCH", body: JSON.stringify({ featured }) });
    setBusy(null);
    if (res.ok) {
      toast.success(featured ? "홈 대표로 지정했어요." : "대표 지정을 해제했어요.");
      void load();
    } else {
      toast.error("처리 실패");
    }
  }

  const featured = posts.find((p) => p.featured);
  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = kw ? posts.filter((p) => p.title.toLowerCase().includes(kw) || p.handle.toLowerCase().includes(kw)) : posts;
    // 대표는 위 카드에서 별도 노출하므로 목록에서는 제외
    return list.filter((p) => !p.featured);
  }, [posts, q]);

  return (
    <div className="space-y-4">
      <Card className="p-4 text-[12.5px] leading-relaxed text-muted">
        홈 메인(히어로)에 고정할 영상을 지정해요. <b className="text-fg/80">미지정 시</b> 자동(좋아요 최다 → 최신)으로 노출됩니다.
      </Card>

      {/* 현재 대표 — 없으면 자동 노출 안내 */}
      {featured ? (
        <Card className="flex items-center gap-3 bg-primary-soft/50 p-3 ring-1 ring-primary/25">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Star className="h-4 w-4 fill-current" />
          </span>
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {featured.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.thumbnail_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold text-primary-strong">현재 대표 영상</div>
            <div className="truncate text-[13px] font-bold text-fg">{featured.title}</div>
            <div className="truncate text-[11px] text-subtle">@{featured.handle}</div>
          </div>
          <Btn size="sm" variant="outline" disabled={busy === featured.id} onClick={() => void setFeatured(featured.id, false)}>
            지정 해제
          </Btn>
        </Card>
      ) : (
        <Card className="flex items-center gap-2 p-3 text-[12.5px] text-muted">
          <Star className="h-4 w-4 shrink-0 text-subtle" /> 현재 지정된 대표 영상이 없어요 — 홈은 자동으로 히어로를 골라요.
        </Card>
      )}

      {/* 검색 */}
      <SearchInput value={q} onChange={setQ} placeholder="제목·핸들로 영상 검색" />

      <div className="text-[12px] font-bold text-muted">
        {q ? `'${q}' 검색결과 ${filtered.length.toLocaleString()}개` : `전체 ${filtered.length.toLocaleString()}개`}
        {!q && filtered.length > DISPLAY_CAP && <span className="font-medium text-subtle"> · 상위 {DISPLAY_CAP}개 표시, 검색으로 좁혀보세요</span>}
      </div>

      {filtered.length === 0 ? (
        <Empty>{q ? "검색 결과가 없어요." : "영상이 없어요."}</Empty>
      ) : (
        <div className="space-y-2">
          {(q ? filtered : filtered.slice(0, DISPLAY_CAP)).map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-3">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {p.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold text-fg">{p.title}</span>
                  {p.is_official && <Badge tone="primary">공식</Badge>}
                </div>
                <div className="truncate text-[11px] text-subtle">@{p.handle}</div>
              </div>
              <Btn size="sm" variant="primary" disabled={busy === p.id} onClick={() => void setFeatured(p.id, true)}>
                대표 지정
              </Btn>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
