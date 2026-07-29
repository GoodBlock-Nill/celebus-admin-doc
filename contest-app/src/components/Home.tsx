"use client";

// 홈 — 디스커버리 화면. 플랫 피드가 아니라 "내 순간을 올리면 멤버가 봐준다"는 개념을 한 화면에 압축:
// 콘텐츠 히어로(멤버가 가장 많이 본 영상) → 멤버가 봤어요(최근 반응) → 진행 중인 스테이지 →
// 진행 중인 월드컵 진입 → 명예의 전당 프리뷰. 멤버 반응 표현은 은은하게(글로우·컨페티 없음).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play, RefreshCw } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, StageEventPublic, StagePostPublic, StagePublic } from "@/lib/types";
import { AvatarStack, CATEGORY_LABEL, LoadingSkeleton, SectionHeader, Thumb, timeAgo } from "./HomeAtoms";
import { useLang } from "./LangProvider";

interface HeroPost extends StagePostPublic {
  __stageTitle?: string;
}

export default function Home() {
  const { t } = useLang();
  const [stages, setStages] = useState<StagePublic[]>([]);
  const [posts, setPosts] = useState<StagePostPublic[]>([]);
  const [hearts, setHearts] = useState<Map<string, MemberHeartPublic[]>>(new Map());
  const [membersTotal, setMembersTotal] = useState(0);
  const [event, setEvent] = useState<StageEventPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [stagesRes, postsRes, heartsRes, membersRes, eventRes] = await Promise.all([
        sb.from("stages_public").select("*").eq("status", "open").order("sort_order").limit(8),
        sb.from("stage_posts_public").select("*").order("created_at", { ascending: false }).limit(40),
        sb.from("member_hearts_public").select("*"),
        sb.from("members_public").select("display_name"),
        sb.from("stage_events_public").select("*").eq("status", "open").limit(1),
      ]);
      if (stagesRes.error || postsRes.error || heartsRes.error || membersRes.error || eventRes.error) {
        throw new Error("home load failed");
      }
      setStages((stagesRes.data ?? []) as StagePublic[]);
      setPosts((postsRes.data ?? []) as StagePostPublic[]);
      const map = new Map<string, MemberHeartPublic[]>();
      for (const h of (heartsRes.data ?? []) as MemberHeartPublic[]) {
        map.set(h.post_id, [...(map.get(h.post_id) ?? []), h]);
      }
      setHearts(map);
      setMembersTotal((membersRes.data ?? []).length);
      const events = (eventRes.data ?? []) as StageEventPublic[];
      setEvent(events[0] ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 히어로 = 멤버 하트를 가장 많이 받은 영상 (동률·전무 시 최신 영상으로 대체)
  const heroPost = useMemo<HeroPost | null>(() => {
    if (posts.length === 0) return null;
    let best = posts[0];
    let bestCount = hearts.get(posts[0].id)?.length ?? 0;
    for (const p of posts) {
      const c = hearts.get(p.id)?.length ?? 0;
      if (c > bestCount) {
        best = p;
        bestCount = c;
      }
    }
    const stageTitle = stages.find((s) => s.id === best.stage_id)?.title;
    return { ...best, __stageTitle: stageTitle };
  }, [posts, hearts, stages]);
  const heroHearts = heroPost ? hearts.get(heroPost.id) ?? [] : [];
  const heroGrandSlam = membersTotal > 0 && heroHearts.length >= membersTotal;

  // 멤버가 봤어요 — 최근 멤버 반응이 남은 영상 (최근 반응 순)
  const reactionItems = useMemo(() => {
    const items: { post: StagePostPublic; heart: MemberHeartPublic }[] = [];
    for (const p of posts) {
      const hs = hearts.get(p.id);
      if (!hs || hs.length === 0) continue;
      const latest = [...hs].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
      items.push({ post: p, heart: latest });
    }
    items.sort((a, b) => Date.parse(b.heart.created_at) - Date.parse(a.heart.created_at));
    return items.slice(0, 4);
  }, [posts, hearts]);

  // 명예의 전당 프리뷰 — 멤버 하트 많은 순
  const hallItems = useMemo(() => {
    return posts
      .map((p) => ({ post: p, count: hearts.get(p.id)?.length ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [posts, hearts]);

  const isFullyEmpty = !loading && !error && stages.length === 0 && posts.length === 0;

  return (
    <div>
      <p className="px-0.5 pb-1 text-[12px] font-semibold tracking-tight text-subtle">
        Your moment. <b className="font-extrabold text-primary-strong">Their response.</b>
      </p>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-14 text-center">
          <p className="mb-4 text-[13.5px] text-muted">{t("home_err")}</p>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-[13px] font-bold text-white active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t("home_retry")}
          </button>
        </div>
      ) : isFullyEmpty ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center text-[13.5px] leading-relaxed text-muted">
          {t("home_empty_l1")}
          <br />{t("home_empty_l2")}
        </div>
      ) : (
        <>
          {heroPost && (
            <Link
              href={`/video/${heroPost.id}`}
              className="relative mt-1 block aspect-[16/10] w-full overflow-hidden rounded-3xl shadow-sm active:scale-[0.99]"
            >
              <Thumb url={heroPost.thumbnail_url} />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/60" />
              <span className="absolute inset-0 m-auto flex h-13 w-13 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
                <Play className="h-4 w-4 fill-current" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                {heroHearts.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 py-1 pl-1 pr-2.5 text-[11px] font-extrabold text-white backdrop-blur-sm">
                    <AvatarStack hearts={heroHearts} size={18} ring="ring-white/60" />
                    {heroGrandSlam ? t("member_all_heart_badge") : t("member_heart_badge")}
                  </span>
                )}
                <h1 className="mt-2.5 line-clamp-2 text-[20px] font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
                  {heroPost.title}
                </h1>
                <div className="mt-1 truncate text-[12px] font-semibold text-white/85">
                  @{heroPost.handle}
                  {heroPost.__stageTitle ? ` · ${heroPost.__stageTitle}` : ""}
                </div>
              </div>
            </Link>
          )}

          {reactionItems.length > 0 && (
            <div>
              <SectionHeader title={t("home_reaction_title")} sub={t("home_reaction_sub")} />
              <div className="space-y-2.5">
                {reactionItems.map(({ post, heart }) => (
                  <Link
                    key={post.id}
                    href={`/video/${post.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm active:scale-[0.99]"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <Thumb url={post.thumbnail_url} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="line-clamp-2 block text-[13px] font-bold leading-snug text-fg">
                        {t("home_reaction_line").replace("{name}", heart.display_name)}
                      </strong>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {post.title} · {timeAgo(heart.created_at)}
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-extrabold text-primary-strong">
                        {t("member_heart_badge")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {stages.length > 0 && (
            <div>
              <SectionHeader title={t("home_archive_title")} sub={t("home_archive_sub")} moreHref="/stages" />
              <div className="-mx-0.5 flex gap-2.5 overflow-x-auto px-0.5 pb-1">
                {stages.map((s) => (
                  <Link key={s.id} href={`/stage/${s.id}`} className="w-[156px] shrink-0 active:scale-[0.98]">
                    <div className="relative h-[92px] overflow-hidden rounded-2xl">
                      <Thumb url={s.cover_url} />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
                      {s.event_date && (
                        <span className="absolute left-2 top-2 rounded-md bg-black/45 px-2 py-1 text-[9px] font-extrabold text-white backdrop-blur-sm">
                          {s.event_date}
                        </span>
                      )}
                    </div>
                    <strong className="mt-2 block truncate text-[12.5px] font-bold text-fg">{s.title}</strong>
                    <small className="mt-0.5 block text-[11px] text-muted">
                      {t("home_stage_meta").replace("{n}", String(s.post_count))}
                    </small>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {event && (
            <div>
              <SectionHeader title={t("home_wc_title")} />
              <Link
                href={`/event/${event.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[#dfe0ff] bg-primary-soft p-3.5 active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[14px] font-black text-primary">
                  VS
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[13.5px] font-extrabold text-fg">{event.title}</strong>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">{event.stage_title} · {t("home_wc_ongoing")}</p>
                </div>
                <span className="shrink-0 text-[18px] text-subtle">›</span>
              </Link>
            </div>
          )}

          {hallItems.length > 0 && (
            <div>
              <SectionHeader title={t("hall_title")} sub={t("hall_sub")} moreHref="/hearts" />
              <div className="-mx-0.5 flex gap-2.5 overflow-x-auto px-0.5 pb-1">
                {hallItems.map(({ post, count }) => {
                  const grandSlam = membersTotal > 0 && count >= membersTotal;
                  return (
                    <Link key={post.id} href={`/video/${post.id}`} className="w-[156px] shrink-0 active:scale-[0.98]">
                      <div className="relative h-[92px] overflow-hidden rounded-2xl">
                        <Thumb url={post.thumbnail_url} />
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
                        <span className="absolute left-2 top-2 rounded-md bg-black/45 px-2 py-1 text-[9px] font-extrabold text-white backdrop-blur-sm">
                          {grandSlam ? t("member_all_short") : CATEGORY_LABEL[post.category] ?? post.category}
                        </span>
                      </div>
                      <strong className="mt-2 line-clamp-1 block text-[12.5px] font-bold text-fg">{post.title}</strong>
                      <small className="mt-0.5 block text-[11px] text-muted">
                        {t("home_pick_hearts").replace("{n}", String(count))}
                      </small>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-2" />
        </>
      )}
    </div>
  );
}
