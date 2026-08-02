"use client";

// 마이페이지 — 내 영상·멤버 반응(익명 집계)·내 댓글. 열람은 로그인 필수(상호작용 지점).
// 프로필(아바타·닉네임) + 통계 2종(내 영상/받은 멤버 하트) + 탭 3종(내 영상/하트 받은 영상/내 댓글).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { CharmIcon, type CharmName } from "./CharmIcon";
import type { Platform, StageCategory } from "@/lib/types";
import { useSession } from "./SessionProvider";
import { useLang } from "./LangProvider";
import ErrorState from "./ErrorState";

type TFn = (key: string) => string;

// /api/stage/mine 이 실제로 반환하는 형태(stage_my_posts RPC) — StagePostPublic과 다름(핸들 없음, 스테이지명 포함)
interface MyPost {
  id: string;
  stage_id: string;
  stage_title: string;
  platform: Platform;
  source_url: string;
  title: string;
  category: StageCategory;
  like_count: number;
  report_count: number;
  hidden: boolean;
  created_at: string;
  thumbnail_url: string | null;
}

interface MineResponse {
  posts?: MyPost[];
  liked?: string[];
  memberHearts?: { post_id: string; count: number }[];
}

type Tab = "videos" | "seen" | "comments";

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "videos", labelKey: "my_tab_videos" },
  { key: "seen", labelKey: "my_tab_seen" },
  { key: "comments", labelKey: "my_tab_comments" },
];

function heartLine(count: number, t: TFn): { text: string; active: boolean } {
  if (count === 0) return { text: `○ ${t("mh_waiting")}`, active: false };
  const text =
    count === 1
      ? `● ${t("mh_private_one")}`
      : `● ${t("mh_private_many").replace("{n}", String(count))}`;
  return { text, active: true };
}

function Avatar({ nickname, avatarUrl }: { nickname: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={nickname} className="h-[58px] w-[58px] shrink-0 rounded-full object-cover" />;
  }
  const initial = nickname.trim().slice(0, 1) || "?";
  return (
    <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-400 text-[20px] font-extrabold text-white">
      {initial}
    </div>
  );
}

function Thumb({ url }: { url: string | null }) {
  return (
    <div className="relative h-[62px] w-[92px] shrink-0 overflow-hidden rounded-[11px] bg-card-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft to-card-2 text-subtle">
          <ImageOff className="h-4 w-4" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}

function StatCard({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-[14px] border border-border bg-card px-1.5 py-[13px] text-center shadow-sm">
      <div className={`text-[20px] font-extrabold tabular-nums ${accent ? "text-primary" : "text-fg"}`}>{n}</div>
      <div className="mt-[3px] text-[10.5px] font-semibold text-muted">{label}</div>
    </div>
  );
}

function EmptyState({ title, sub, cta, charm }: { title: string; sub?: string; cta?: boolean; charm?: CharmName }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      {charm && <CharmIcon name={charm} size={52} className="mb-1" />}
      <p className="text-[13.5px] font-bold text-fg">{title}</p>
      {sub && <p className="max-w-[15rem] text-[12.5px] leading-relaxed text-muted">{sub}</p>}
      {cta && (
        <Link
          href="/stages"
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-[13.5px] font-bold text-white active:scale-[0.98]"
        >
          {t("my_empty_videos_cta")}
        </Link>
      )}
    </div>
  );
}

function VideoRow({ post, count }: { post: MyPost; count: number }) {
  const { t } = useLang();
  const line = heartLine(count, t);
  return (
    <Link href={`/video/${post.id}`} className="flex gap-[11px] border-b border-border px-1 py-[13px] last:border-b-0">
      <Thumb url={post.thumbnail_url} />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[12.5px] font-bold text-fg">{post.title}</div>
        <p className="mt-[5px] text-[10.5px] leading-relaxed text-muted">
          {post.stage_title}
          {post.hidden && <span className="ml-1.5 font-semibold text-subtle">· {t("my_private_flag")}</span>}
          <br />
          <span className={line.active ? "font-extrabold text-primary-strong" : "text-subtle"}>{line.text}</span>
        </p>
      </div>
    </Link>
  );
}

function VideoSkeletonRow() {
  return (
    <div className="flex gap-[11px] border-b border-border px-1 py-[13px] last:border-b-0">
      <div className="h-[62px] w-[92px] shrink-0 animate-pulse rounded-[11px] bg-black/[0.05]" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-3/4 animate-pulse rounded bg-black/[0.05]" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-black/[0.05]" />
      </div>
    </div>
  );
}

export default function MyPage() {
  const { t } = useLang();
  const { signedIn, member, nickname, loading: sessionLoading, requireLogin } = useSession();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [hearts, setHearts] = useState<Map<string, number>>(new Map());
  const [tab, setTab] = useState<Tab>("videos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const mineJson = await fetch("/api/stage/mine").then((r) => {
        if (!r.ok) throw new Error("mine_failed");
        return r.json() as Promise<MineResponse>;
      });
      setPosts(mineJson.posts ?? []);

      // 멤버 하트는 익명 집계(post_id → count). 업로더 본인에게만 반환됨.
      const map = new Map<string, number>();
      for (const h of mineJson.memberHearts ?? []) map.set(h.post_id, h.count);
      setHearts(map);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && signedIn) void load();
  }, [sessionLoading, signedIn, load]);

  const stats = useMemo(() => {
    let totalHearts = 0;
    for (const p of posts) totalHearts += hearts.get(p.id) ?? 0;
    return { videoCount: posts.length, totalHearts };
  }, [posts, hearts]);

  const seenPosts = useMemo(() => posts.filter((p) => (hearts.get(p.id) ?? 0) > 0), [posts, hearts]);

  // 세션 확인 중 — 프로필/통계 스켈레톤
  if (sessionLoading) {
    return (
      <div className="anim-fade-up">
        <div className="flex items-center gap-[13px] px-1 pb-1.5 pt-1">
          <div className="h-[58px] w-[58px] animate-pulse rounded-full bg-black/[0.05]" />
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-black/[0.05]" />
            <div className="h-3 w-20 animate-pulse rounded bg-black/[0.05]" />
          </div>
        </div>
        <div className="mt-3 flex gap-[9px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[70px] flex-1 animate-pulse rounded-[14px] bg-black/[0.05]" />
          ))}
        </div>
      </div>
    );
  }

  // 미로그인 — 로그인 유도
  if (!signedIn) {
    return (
      <div className="anim-fade-up flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
        <CharmIcon name="log-in" size={64} />
        <div>
          <p className="text-[15px] font-bold text-fg">{t("my_login_title")}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t("my_login_sub")}</p>
        </div>
        <button
          onClick={() => requireLogin()}
          className="mt-1 flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-[14px] font-bold text-white active:scale-[0.98]"
        >
          {t("my_login_cta")}
        </button>
      </div>
    );
  }

  return (
    <div className="anim-fade-up">
      {/* 프로필 */}
      <div className="flex items-center gap-[13px] px-1 pb-1.5 pt-1">
        <Avatar nickname={nickname} avatarUrl={member?.avatar_url} />
        <div className="min-w-0">
          <div className="truncate text-[18px] font-extrabold tracking-tight text-fg">{nickname || t("my_guest")}</div>
          {member ? (
            <div className="mt-0.5 truncate text-[12px] font-bold text-primary-strong">{member.display_name} · {t("my_member_account")}</div>
          ) : (
            <div className="mt-0.5 truncate text-[12px] text-muted">@{nickname || "guest"}</div>
          )}
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-3 flex gap-[9px]">
        <StatCard n={stats.videoCount} label={t("my_stat_videos")} />
        <StatCard n={stats.totalHearts} label={t("mh_button")} accent />
      </div>

      {/* 탭 */}
      <div className="mt-2 grid grid-cols-3 border-b border-border">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            aria-current={tab === tabItem.key ? "page" : undefined}
            className={`min-h-11 border-b-2 py-2.5 text-[12px] font-extrabold transition-colors ${
              tab === tabItem.key ? "border-primary text-primary" : "border-transparent text-muted"
            }`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <VideoSkeletonRow key={i} />)
        ) : error ? (
          <ErrorState onRetry={() => void load()} />
        ) : tab === "comments" ? (
          <EmptyState title={t("my_empty_comments")} charm="message-circle" />
        ) : tab === "videos" ? (
          posts.length === 0 ? (
            <EmptyState title={t("my_empty_videos_title")} sub={t("my_empty_videos_sub")} cta charm="upload" />
          ) : (
            posts.map((p) => <VideoRow key={p.id} post={p} count={hearts.get(p.id) ?? 0} />)
          )
        ) : seenPosts.length === 0 ? (
          <EmptyState title={t("my_empty_seen")} charm="heart" />
        ) : (
          seenPosts.map((p) => <VideoRow key={p.id} post={p} count={hearts.get(p.id) ?? 0} />)
        )}
      </div>
    </div>
  );
}
