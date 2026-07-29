"use client";

// 마이페이지 — 내 영상·멤버 반응·내 댓글. 열람은 로그인 필수(상호작용 지점).
// 프로필(아바타·닉네임) + 통계 3종(내 영상/멤버가 봤어요/멤버 전원) + 탭 3종(내 영상/봐준 영상/내 댓글).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImageOff, LogIn } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { MemberHeartPublic, Platform, StageCategory } from "@/lib/types";
import { useSession } from "./SessionProvider";
import ErrorState from "./ErrorState";

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
}

type Tab = "videos" | "seen" | "comments";

const TABS: { key: Tab; label: string }[] = [
  { key: "videos", label: "내 영상" },
  { key: "seen", label: "하트 받은 영상" },
  { key: "comments", label: "내 댓글" },
];

function heartLine(hearts: MemberHeartPublic[], membersTotal: number): { text: string; active: boolean } {
  if (hearts.length === 0) return { text: "○ 멤버 반응 기다리는 중", active: false };
  if (membersTotal > 0 && hearts.length >= membersTotal) return { text: "● 멤버 전원 하트", active: true };
  const sorted = [...hearts].sort((a, b) => a.sort_order - b.sort_order);
  const first = sorted[0].display_name;
  const text = sorted.length === 1 ? `● ${first} 님이 하트를 보냈어요` : `● ${first} 님 외 ${sorted.length - 1}명이 하트를 보냈어요`;
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

function EmptyState({ message, cta }: { message: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
      <p className="text-[13px] text-muted">{message}</p>
      {cta && (
        <Link
          href="/stages"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 text-[13px] font-bold text-white active:scale-[0.98]"
        >
          영상 올리러 가기
        </Link>
      )}
    </div>
  );
}

function VideoRow({ post, hearts, membersTotal }: { post: MyPost; hearts: MemberHeartPublic[]; membersTotal: number }) {
  const line = heartLine(hearts, membersTotal);
  return (
    <Link href={`/video/${post.id}`} className="flex gap-[11px] border-b border-border px-1 py-[13px] last:border-b-0">
      <Thumb url={post.thumbnail_url} />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[12.5px] font-bold text-fg">{post.title}</div>
        <p className="mt-[5px] text-[10.5px] leading-relaxed text-subtle">
          {post.stage_title}
          {post.hidden && <span className="ml-1.5 font-semibold text-subtle">· 비공개 처리됨</span>}
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
  const { signedIn, member, nickname, loading: sessionLoading, requireLogin } = useSession();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [hearts, setHearts] = useState<Map<string, MemberHeartPublic[]>>(new Map());
  const [membersTotal, setMembersTotal] = useState(0);
  const [tab, setTab] = useState<Tab>("videos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [mineJson, membersRes] = await Promise.all([
        fetch("/api/stage/mine").then((r) => {
          if (!r.ok) throw new Error("mine_failed");
          return r.json() as Promise<MineResponse>;
        }),
        sb.from("members_public").select("display_name"),
      ]);
      const myPosts = mineJson.posts ?? [];
      setPosts(myPosts);
      setMembersTotal((membersRes.data ?? []).length);

      const ids = myPosts.map((p) => p.id);
      if (ids.length) {
        const { data: hs, error: heartsErr } = await sb.from("member_hearts_public").select("*").in("post_id", ids);
        if (heartsErr) throw heartsErr;
        const map = new Map<string, MemberHeartPublic[]>();
        for (const h of (hs ?? []) as MemberHeartPublic[]) {
          map.set(h.post_id, [...(map.get(h.post_id) ?? []), h]);
        }
        setHearts(map);
      } else {
        setHearts(new Map());
      }
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
    let grandSlamCount = 0;
    for (const p of posts) {
      const h = hearts.get(p.id) ?? [];
      totalHearts += h.length;
      if (membersTotal > 0 && h.length >= membersTotal) grandSlamCount += 1;
    }
    return { videoCount: posts.length, totalHearts, grandSlamCount };
  }, [posts, hearts, membersTotal]);

  const seenPosts = useMemo(() => posts.filter((p) => (hearts.get(p.id)?.length ?? 0) > 0), [posts, hearts]);

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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <LogIn className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-fg">로그인하고 내 순간을 확인하세요</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            내가 올린 영상과 멤버 반응을 한 곳에서 모아볼 수 있어요.
          </p>
        </div>
        <button
          onClick={() => requireLogin()}
          className="mt-1 flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-[14px] font-bold text-white active:scale-[0.98]"
        >
          로그인하기
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
          <div className="truncate text-[18px] font-extrabold tracking-tight text-fg">{nickname || "게스트"}</div>
          {member ? (
            <div className="mt-0.5 truncate text-[12px] font-bold text-primary-strong">{member.display_name} · 멤버 계정</div>
          ) : (
            <div className="mt-0.5 truncate text-[12px] text-muted">@{nickname || "guest"}</div>
          )}
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-3 flex gap-[9px]">
        <StatCard n={stats.videoCount} label="내 영상" />
        <StatCard n={stats.totalHearts} label="멤버 하트" accent />
        <StatCard n={stats.grandSlamCount} label="멤버 전원" />
      </div>

      {/* 탭 */}
      <div className="mt-2 grid grid-cols-3 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={`min-h-11 border-b-2 py-2.5 text-[12px] font-extrabold transition-colors ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted"
            }`}
          >
            {t.label}
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
          <EmptyState message="내 댓글 기능은 곧 제공돼요" />
        ) : tab === "videos" ? (
          posts.length === 0 ? (
            <EmptyState message="아직 올린 영상이 없어요" cta />
          ) : (
            posts.map((p) => <VideoRow key={p.id} post={p} hearts={hearts.get(p.id) ?? []} membersTotal={membersTotal} />)
          )
        ) : seenPosts.length === 0 ? (
          <EmptyState message="아직 멤버가 반응한 영상이 없어요" />
        ) : (
          seenPosts.map((p) => <VideoRow key={p.id} post={p} hearts={hearts.get(p.id) ?? []} membersTotal={membersTotal} />)
        )}
      </div>
    </div>
  );
}
