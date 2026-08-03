// 홈 (서버 컴포넌트) — 데이터를 서버에서 조회·렌더해 히어로 이미지를 초기 HTML에 포함(LCP/CLS 개선).
// 상호작용·유저별 데이터는 클라이언트 섬(UploadButton·MemberSummary·HowItWorks)으로 분리.
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { PlayBadge } from "./CharmIcon";
import { CATEGORY_LABEL, SectionHeader, Thumb } from "./HomeAtoms";
import HowItWorks from "./HowItWorks";
import UploadButton from "./UploadButton";
import MemberSummary from "./MemberSummary";
import HomeError from "./HomeError";
import { getHomeData } from "@/lib/home-data";
import { getServerLang, serverT } from "@/lib/server-lang";
import { localizeStageText, localizeTitle } from "@/lib/localize";
import type { StagePostPublic } from "@/lib/types";

const CTA_CLS =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-6 text-[14px] font-bold text-white active:scale-[0.98]";

export default async function HomeServer() {
  const lang = await getServerLang();
  const t = serverT(lang);

  let data;
  try {
    data = await getHomeData();
  } catch {
    return (
      <div>
        <Header t={t} />
        <HomeError />
      </div>
    );
  }
  const { stages, posts, event, featuredPost, hallPick } = data;

  // 히어로 우선순위: ① 관리자 고정(featured) → ② 팬 좋아요 최다 → ③ 최신
  let heroBase: StagePostPublic | null = featuredPost;
  if (!heroBase && posts.length > 0) {
    heroBase = posts[0];
    for (const p of posts) if (p.like_count > heroBase.like_count) heroBase = p;
  }
  const heroStage = heroBase ? stages.find((s) => s.id === heroBase!.stage_id) : undefined;
  const heroStageTitle = heroStage ? localizeTitle(heroStage.title, heroStage.i18n, lang) : undefined;

  const isFullyEmpty = stages.length === 0 && posts.length === 0;
  const fanStages = stages.filter((s) => !s.is_official);
  const officialStage = stages.find((s) => s.is_official);
  const officialPosts = posts.filter((p) => p.is_official).slice(0, 12);

  if (isFullyEmpty) {
    return (
      <div>
        <Header t={t} />
        <div className="mt-1">
          <HowItWorks forced />
          <div className="mt-3 rounded-2xl border border-border bg-card px-4 py-10 text-center shadow-sm">
            <div className="text-[15px] font-bold text-fg">{t("home_empty_title")}</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t("home_firstpost_sub")}</p>
            <div className="mt-4">
              <UploadButton label={t("home_empty_upload")} className={CTA_CLS} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header t={t} />
      <HowItWorks />

      {/* 공연은 있지만 영상 0 — 첫 업로더 유도 */}
      {!heroBase && (
        <div className="mt-2 rounded-3xl border border-dashed border-primary/40 bg-primary-soft/40 px-4 py-8 text-center">
          <div className="text-[14px] font-bold text-fg">{t("home_firstpost_title")}</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{t("home_firstpost_sub")}</p>
          <div className="mt-3.5">
            <UploadButton label={t("home_empty_upload")} className={CTA_CLS} />
          </div>
        </div>
      )}

      {heroBase && (
        <Link
          href={`/video/${heroBase.id}`}
          className="relative mt-1 block aspect-[16/10] w-full overflow-hidden rounded-3xl shadow-sm active:scale-[0.99]"
        >
          <Thumb url={heroBase.thumbnail_url} priority />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/60" />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <PlayBadge size="lg" />
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            {heroBase.like_count > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 py-1 px-2.5 text-[11px] font-extrabold text-white backdrop-blur-sm">
                {t("home_pick_hearts").replace("{n}", String(heroBase.like_count))}
              </span>
            )}
            <h1 className="mt-2.5 line-clamp-2 text-[20px] font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
              {heroBase.title}
            </h1>
            <div className="mt-1 truncate text-[12px] font-semibold text-white/85">
              @{heroBase.handle}
              {heroStageTitle ? ` · ${heroStageTitle}` : ""}
            </div>
          </div>
        </Link>
      )}

      {/* 멤버 반응 — 업로더 본인만 보는 비공개 요약(클라이언트 섬) */}
      <MemberSummary />

      {/* D10V 아카이브 — 팬 업로드 아카이브만 */}
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
              <Link key={p.id} href={`/video/${p.id}?list=stage:${p.stage_id}`} className="w-[156px] shrink-0 active:scale-[0.98]">
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
                <small className="mt-0.5 block truncate text-[11px] text-muted">{t(`cat_${p.category}`)}</small>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 진행중인 토너먼트 — 없어도 빈 상태로 항상 노출 */}
      <div>
        <SectionHeader title={t("home_wc_title")} />
        {event ? (
          (() => {
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[14px] font-black text-primary">VS</div>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[13.5px] font-extrabold text-fg">{wcTitle}</strong>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">{wcStageTitle} · {t("home_wc_ongoing")}</p>
                </div>
                <span className="shrink-0 text-[18px] text-subtle">›</span>
              </Link>
            );
          })()
        ) : (
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
    </div>
  );
}

// 상단 태그라인 + 밸류프롭 (모든 상태 공통)
function Header({ t }: { t: (k: string) => string }) {
  return (
    <>
      <p className="px-0.5 text-[12px] font-semibold tracking-tight text-subtle">
        Your moment. <b className="font-extrabold text-primary-strong">Their response.</b>
      </p>
      <p className="px-0.5 pb-1 pt-0.5 text-[12.5px] leading-snug text-muted break-keep">{t("home_valueprop")}</p>
    </>
  );
}
