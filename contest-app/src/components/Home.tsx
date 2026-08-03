"use client";

// 홈 — 디스커버리 화면. 플랫 피드가 아니라 "내 순간을 올리면 멤버가 봐준다"는 개념을 한 화면에 압축:
// 콘텐츠 히어로(멤버가 가장 많이 본 영상) → 멤버가 봤어요(최근 반응) → 진행 중인 스테이지 →
// 진행 중인 월드컵 진입 → 명예의 전당 프리뷰. 멤버 반응 표현은 은은하게(글로우·컨페티 없음).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Plus, RefreshCw } from "lucide-react";
import { PlayBadge } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StageEventPublic, StagePostPublic, StagePublic } from "@/lib/types";
import { localizeStageText, localizeTitle } from "@/lib/localize";
import { CATEGORY_LABEL, LoadingSkeleton, SectionHeader, Thumb } from "./HomeAtoms";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";
import HowItWorks from "./HowItWorks";
import GlobalUploadSheet from "./GlobalUploadSheet";
import { isLaunchPreview } from "@/lib/launchPreview";

interface HeroPost extends StagePostPublic {
  __stageTitle?: string;
}

export default function Home() {
  const { t, lang } = useLang();
  const { requireLogin } = useSession();
  const [uploadOpen, setUploadOpen] = useState(false);
  const openUpload = () => {
    if (!requireLogin(() => setUploadOpen(true))) return;
    setUploadOpen(true);
  };
  const [stages, setStages] = useState<StagePublic[]>([]);
  const [posts, setPosts] = useState<StagePostPublic[]>([]);
  const [event, setEvent] = useState<StageEventPublic | null>(null);
  const [featuredPost, setFeaturedPost] = useState<StagePostPublic | null>(null);
  const [hallPick, setHallPick] = useState<{ post: StagePostPublic; count: number }[]>([]);
  // 멤버 반응(하트)은 비공개 — 업로더 본인 영상에 남은 하트 총합만(익명)
  const [memberHeartTotal, setMemberHeartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // 배포초기 프리뷰: 팬 콘텐츠 숨김(공식만) + 이벤트 미노출(오픈 첫날엔 이벤트 없음)
      const preview = isLaunchPreview();
      let postsQuery = sb.from("stage_posts_public").select("*").order("created_at", { ascending: false }).limit(40);
      if (preview) postsQuery = postsQuery.eq("is_official", true);
      // 관리자가 고정한 대표 영상(있으면 히어로 우선)
      let featuredQuery = sb.from("stage_posts_public").select("*").eq("featured", true);
      if (preview) featuredQuery = featuredQuery.eq("is_official", true);
      featuredQuery = featuredQuery.order("created_at", { ascending: false }).limit(1);
      const [stagesRes, postsRes, eventRes, featuredRes] = await Promise.all([
        sb.from("stages_public").select("*").eq("status", "open").order("sort_order").limit(8),
        postsQuery,
        preview ? Promise.resolve({ data: [], error: null }) : sb.from("stage_events_public").select("*").eq("status", "open").limit(1),
        featuredQuery,
      ]);
      if (stagesRes.error || postsRes.error || eventRes.error) {
        throw new Error("home load failed");
      }
      const postRows = (postsRes.data ?? []) as StagePostPublic[];
      setStages((stagesRes.data ?? []) as StagePublic[]);
      setPosts(postRows);
      setFeaturedPost(((featuredRes.data ?? []) as StagePostPublic[])[0] ?? null);
      // 팬 인기 영상 — 좋아요 최다 영상 하이라이트(좋아요 1개 이상만)
      setHallPick(
        [...postRows]
          .filter((p) => p.like_count > 0)
          .sort((a, b) => b.like_count - a.like_count)
          .slice(0, 6)
          .map((p) => ({ post: p, count: p.like_count })),
      );
      const events = (eventRes.data ?? []) as StageEventPublic[];
      setEvent(events[0] ?? null);
      // 멤버 반응(비공개) — 업로더 본인 영상에 남은 멤버 하트 총합만(익명)
      try {
        const mineRes = await fetch("/api/stage/mine");
        const mine = await mineRes.json();
        const total = ((mine.memberHearts ?? []) as { post_id: string; count: number }[]).reduce(
          (sum, m) => sum + (m.count ?? 0),
          0,
        );
        setMemberHeartTotal(total);
      } catch {
        setMemberHeartTotal(0);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 히어로 우선순위: ① 관리자 고정(featured) → ② 팬 좋아요 최다 → ③ 최신
  const heroPost = useMemo<HeroPost | null>(() => {
    if (featuredPost) {
      const stage = stages.find((s) => s.id === featuredPost.stage_id);
      const stageTitle = stage ? localizeTitle(stage.title, stage.i18n, lang) : undefined;
      return { ...featuredPost, __stageTitle: stageTitle };
    }
    if (posts.length === 0) return null;
    let best = posts[0];
    for (const p of posts) {
      if (p.like_count > best.like_count) best = p;
    }
    const stage = stages.find((s) => s.id === best.stage_id);
    const stageTitle = stage ? localizeTitle(stage.title, stage.i18n, lang) : undefined;
    return { ...best, __stageTitle: stageTitle };
  }, [posts, stages, featuredPost, lang]);

  const isFullyEmpty = !loading && !error && stages.length === 0 && posts.length === 0;

  // D10V 아카이브 = 팬 업로드 아카이브만 / V01D 아카이브 = 공식영상(최신순)
  const fanStages = stages.filter((s) => !s.is_official);
  const officialStage = stages.find((s) => s.is_official);
  const officialPosts = posts.filter((p) => p.is_official).slice(0, 12); // posts는 이미 최신순

  return (
    <div>
      <p className="px-0.5 text-[12px] font-semibold tracking-tight text-subtle">
        Your moment. <b className="font-extrabold text-primary-strong">Their response.</b>
      </p>
      <p className="px-0.5 pb-1 pt-0.5 text-[12.5px] leading-snug text-muted break-keep">{t("home_valueprop")}</p>

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
        // 콜드스타트 — 막다른 문구 대신 온보딩 + 첫 업로드 유도(Q1)
        <div className="mt-1">
          <HowItWorks forced />
          <div className="mt-3 rounded-2xl border border-border bg-card px-4 py-10 text-center shadow-sm">
            <div className="text-[15px] font-bold text-fg">{t("home_empty_title")}</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t("home_firstpost_sub")}</p>
            <button
              onClick={openUpload}
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-6 text-[14px] font-bold text-white active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.6} /> {t("home_empty_upload")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <HowItWorks />
          {/* 공연은 있지만 아직 영상이 0 — 첫 업로더 유도(Q1) */}
          {!heroPost && (
            <div className="mt-2 rounded-3xl border border-dashed border-primary/40 bg-primary-soft/40 px-4 py-8 text-center">
              <div className="text-[14px] font-bold text-fg">{t("home_firstpost_title")}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{t("home_firstpost_sub")}</p>
              <button
                onClick={openUpload}
                className="mt-3.5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-6 text-[14px] font-bold text-white active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.6} /> {t("home_empty_upload")}
              </button>
            </div>
          )}
          {heroPost && (
            <Link
              href={`/video/${heroPost.id}`}
              className="relative mt-1 block aspect-[16/10] w-full overflow-hidden rounded-3xl shadow-sm active:scale-[0.99]"
            >
              <Thumb url={heroPost.thumbnail_url} priority />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/60" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <PlayBadge size="lg" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                {heroPost.like_count > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 py-1 px-2.5 text-[11px] font-extrabold text-white backdrop-blur-sm">
                    {t("home_pick_hearts").replace("{n}", String(heroPost.like_count))}
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

          {/* 멤버 반응 — 업로더 본인만 보는 비공개 요약(익명, 멤버 이름 비노출) */}
          {memberHeartTotal > 0 && (
            <div>
              <SectionHeader title={t("home_reaction_title")} sub={t("home_reaction_sub")} />
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-[18px]">
                  💜
                </div>
                <strong className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-fg break-keep">
                  {memberHeartTotal === 1
                    ? t("mh_private_one")
                    : t("mh_private_many").replace("{n}", String(memberHeartTotal))}
                </strong>
              </div>
            </div>
          )}

          {/* D10V 아카이브 — 팬 업로드 아카이브만 (공식 제외) */}
          {fanStages.length > 0 && (
            <div>
              <SectionHeader title={t("home_archive_title")} sub={t("home_archive_sub")} moreHref="/stages" />
              <div className="-mx-0.5 flex gap-2.5 overflow-x-auto px-0.5 pb-1">
                {fanStages.map((s) => {
                  const { title: stageTitle } = localizeStageText(s, lang);
                  return (
                    <Link key={s.id} href={`/stage/${s.id}`} className="w-[156px] shrink-0 active:scale-[0.98]">
                      <div className="relative h-[92px] overflow-hidden rounded-2xl">
                        <Thumb url={s.cover_url} />
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
                      </div>
                      <strong className="mt-2 block truncate text-[12.5px] font-bold text-fg">{stageTitle}</strong>
                      <small className="mt-0.5 block text-[11px] text-muted">
                        {t("home_stage_meta").replace("{n}", String(s.post_count))}
                      </small>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* V01D 아카이브 — 공식영상 최신순 */}
          {officialPosts.length > 0 && (
            <div>
              <SectionHeader
                title={t("home_official_title")}
                sub={t("home_official_sub")}
                moreHref={officialStage ? `/stage/${officialStage.id}` : "/stages"}
              />
              <div className="-mx-0.5 flex gap-2.5 overflow-x-auto px-0.5 pb-1">
                {officialPosts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/video/${p.id}?list=stage:${p.stage_id}`}
                    className="w-[156px] shrink-0 active:scale-[0.98]"
                  >
                    <div className="relative h-[92px] overflow-hidden rounded-2xl">
                      <Thumb url={p.thumbnail_url} />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
                      <div className="absolute left-2 top-2">
                        <span className="brand-gradient flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[9.5px] font-extrabold text-white shadow-sm">
                          <BadgeCheck className="h-3 w-3" /> {t("official_badge")}
                        </span>
                      </div>
                      <span className="absolute bottom-2 right-2">
                        <PlayBadge size="sm" />
                      </span>
                    </div>
                    <strong className="mt-2 block truncate text-[12.5px] font-bold text-fg">{p.title}</strong>
                    <small className="mt-0.5 block truncate text-[11px] text-muted">
                      {t(`cat_${p.category}`)}
                    </small>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 진행중인 토너먼트 — 없어도 빈 상태로 항상 노출 */}
          <div>
            <SectionHeader title={t("home_wc_title")} />
            {event ? (() => {
              const { title: wcTitle } = localizeStageText(event, lang);
              const wcStageTitle =
                event.stage_count && event.stage_count > 1
                  ? t("ev_n_archives").replace("{n}", String(event.stage_count))
                  : localizeTitle(event.stage_title, event.stage_i18n, lang);
              return (
                <Link
                  href={`/event/${event.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#dfe0ff] bg-primary-soft p-3.5 active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[14px] font-black text-primary">
                    VS
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[13.5px] font-extrabold text-fg">{wcTitle}</strong>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">{wcStageTitle} · {t("home_wc_ongoing")}</p>
                  </div>
                  <span className="shrink-0 text-[18px] text-subtle">›</span>
                </Link>
              );
            })() : (
              <p className="rounded-2xl border border-[#dfe0ff] bg-primary-soft/50 px-3 py-5 text-center text-[12.5px] font-semibold text-muted">
                {t("home_wc_empty")}
              </p>
            )}
          </div>

          {/* 팬 인기 영상 — 없어도 빈 상태로 항상 노출 */}
          <div>
            <SectionHeader title={t("hall_title")} sub={t("hall_sub")} moreHref={hallPick.length > 0 ? "/hearts" : undefined} />
            {hallPick.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card px-3 py-5 text-center text-[12.5px] font-semibold text-muted">
                {t("hall_empty")}
              </p>
            ) : (
              <div className="-mx-0.5 flex gap-2.5 overflow-x-auto px-0.5 pb-1">
                {hallPick.map(({ post, count }) => (
                  <Link key={post.id} href={`/video/${post.id}?list=hearts`} className="w-[156px] shrink-0 active:scale-[0.98]">
                    <div className="relative h-[92px] overflow-hidden rounded-2xl">
                      <Thumb url={post.thumbnail_url} />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
                      <span className="absolute left-2 top-2 rounded-md bg-black/45 px-2 py-1 text-[9px] font-extrabold text-white backdrop-blur-sm">
                        {CATEGORY_LABEL[post.category] ?? post.category}
                      </span>
                    </div>
                    <strong className="mt-2 line-clamp-1 block text-[12.5px] font-bold text-fg">{post.title}</strong>
                    <small className="mt-0.5 block text-[11px] text-muted">
                      {t("home_pick_hearts").replace("{n}", String(count))}
                    </small>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="h-2" />
        </>
      )}

      {uploadOpen && <GlobalUploadSheet onClose={() => setUploadOpen(false)} />}
    </div>
  );
}
