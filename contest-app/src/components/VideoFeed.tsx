"use client";

// 몰입 피드(Q3) — 카드 탭 시 진입하는 세로 풀스크린 스와이프 피드.
// 임베드가 대부분 가로(16:9)라 '세로 스크롤-스냅 페이저 + 탭하면 재생'형으로 구현.
// 활성 항목만 임베드를 마운트하고, 나머지는 포스터로 대기(성능).
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { X, Heart, MessageCircle, Flag, ExternalLink, Eye, EyeOff, BadgeCheck } from "lucide-react";
import { PlayBadge } from "./CharmIcon";
import { sb } from "@/lib/supabase-browser";
import type { StagePostPublic } from "@/lib/types";
import { stagePostAsEntry } from "@/lib/types";
import EntryEmbed from "./EntryEmbed";
import FeedYouTube from "./FeedYouTube";
import CommentSection from "./CommentSection";
import { Thumb } from "./HomeAtoms";
import { useLang } from "./LangProvider";
import { useSession } from "./SessionProvider";
import { isLaunchPreview } from "@/lib/launchPreview";

type HeartState = { memberHearted: boolean; liked: boolean; likeCount: number; viewCount: number };

// 리스트 컨텍스트 로더 — ?list=stage:<id> | hearts | recent(기본)
async function loadFeedList(listParam: string | null, seedId: string): Promise<StagePostPublic[]> {
  const preview = isLaunchPreview(); // 배포초기 프리뷰 — 공식만
  if (listParam?.startsWith("stage:")) {
    const stageId = listParam.slice(6);
    // 공식 아카이브는 200+개 — 씨드가 상위 100 밖이면 단건 폴백으로 빠져 스와이프 컨텍스트가 끊긴다. 전체 포함되도록 상한 확대
    let q = sb.from("stage_posts_public").select("*").eq("stage_id", stageId).order("created_at", { ascending: false }).limit(300);
    if (preview) q = q.eq("is_official", true);
    const { data } = await q;
    const rows = (data ?? []) as StagePostPublic[];
    if (rows.some((p) => p.id === seedId)) return rows;
  } else {
    let q = sb.from("stage_posts_public").select("*").order("created_at", { ascending: false }).limit(100);
    if (preview) q = q.eq("is_official", true);
    const { data } = await q;
    const rows = (data ?? []) as StagePostPublic[];
    if (rows.some((p) => p.id === seedId)) return rows;
  }
  // 폴백 — 씨드 단건만
  const { data } = await sb.from("stage_posts_public").select("*").eq("id", seedId).maybeSingle();
  return data ? [data as StagePostPublic] : [];
}

export default function VideoFeed({ postId, initialPosts }: { postId: string; initialPosts?: StagePostPublic[] }) {
  const { t } = useLang();
  const { requireLogin, member } = useSession();
  const isMemberMe = !!member;
  const router = useRouter();
  const listParam = useSearchParams().get("list");
  const focus = useSearchParams().get("focus"); // 알림 딥링크: comment 시 시트 오픈

  // 서버 주입(initialPosts)이 있으면 그걸로 초기화 → 클라 재조회 없이 씨드 영상 즉시 렌더
  const [posts, setPosts] = useState<StagePostPublic[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!initialPosts);
  const [notFound, setNotFound] = useState(initialPosts != null && initialPosts.length === 0);
  const [active, setActive] = useState(() =>
    initialPosts && initialPosts.length ? Math.max(0, initialPosts.findIndex((p) => p.id === postId)) : 0,
  );
  const [states, setStates] = useState<Map<string, HeartState>>(new Map());
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false); // 자동재생은 muted, 사용자가 켜면 이후 영상도 유지
  const [chromeHidden, setChromeHidden] = useState(false); // 레일·메타 오버레이 숨김(가로모드 자동)
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // 가로모드 진입 시 오버레이 자동 숨김(영상 시청 방해 제거), 세로 복귀 시 표시
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(orientation: landscape)");
    const apply = () => setChromeHidden(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 리스트 로드 + 씨드 위치로 스크롤
  useEffect(() => {
    // 서버 주입이 있으면 재조회 skip(씨드는 이미 초기 상태에 있음) — focus 딥링크만 처리
    if (initialPosts) {
      if (focus === "comment") setCommentsFor(postId);
      return;
    }
    (async () => {
      const list = await loadFeedList(listParam, postId);
      if (list.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPosts(list);
      const idx = Math.max(0, list.findIndex((p) => p.id === postId));
      setActive(idx);
      setLoading(false);
      if (focus === "comment") setCommentsFor(postId);
      // 스크롤은 posts 렌더 커밋 후 별도 이펙트에서 수행(아래) — refs 준비 보장
    })();
  }, [listParam, postId, focus, initialPosts]);

  // 씨드(클릭한 영상) 위치로 스크롤 — posts가 실제로 렌더/커밋된 뒤 실행해 itemRefs 준비를 보장.
  // (setPosts 직후 rAF는 아직 아이템이 커밋 전이라 스크롤이 무시돼 항상 최신 영상이 재생되던 버그 수정)
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!posts.length) return;
    if (seededRef.current === postId) return;
    const idx = posts.findIndex((p) => p.id === postId);
    seededRef.current = postId;
    if (idx > 0) {
      const el = itemRefs.current[idx];
      if (el) el.scrollIntoView({ block: "start" });
    }
  }, [posts, postId]);

  // 활성 항목 감지 (뷰포트 중앙)
  useEffect(() => {
    const root = containerRef.current;
    if (!root || posts.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const i = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(i)) setActive(i);
          }
        }
      },
      { root, threshold: [0.6] },
    );
    itemRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [posts.length]);

  // 활성 항목 하트/좋아요 상태 로드
  const ensureState = useCallback(
    async (post: StagePostPublic) => {
      if (states.has(post.id)) return;
      const mineRes = await fetch(`/api/stage/mine?liked_for=${post.id}&member_heart_for=${post.id}`)
        .then((r) => r.json())
        .catch(() => ({ liked: [], memberHearted: [] }));
      setStates((prev) => {
        const n = new Map(prev);
        const cur = n.get(post.id);
        n.set(post.id, {
          memberHearted: (mineRes.memberHearted ?? []).includes(post.id),
          liked: (mineRes.liked ?? []).includes(post.id),
          likeCount: post.like_count,
          viewCount: cur?.viewCount ?? post.view_count,
        });
        return n;
      });
    },
    [states],
  );

  // 조회 집계 — 세션당 1회(클라 dedup) + 서버 30분 창 dedup. 활성 항목만
  const viewedRef = useRef<Set<string>>(new Set());
  const recordView = useCallback(async (post: StagePostPublic) => {
    if (viewedRef.current.has(post.id)) return;
    viewedRef.current.add(post.id);
    try {
      const j = await fetch(`/api/stage/posts/${post.id}/view`, { method: "POST" }).then((r) => r.json());
      if (typeof j.view_count === "number") {
        setStates((prev) => {
          const n = new Map(prev);
          const cur = n.get(post.id) ?? { memberHearted: false, liked: false, likeCount: post.like_count, viewCount: post.view_count };
          n.set(post.id, { ...cur, viewCount: j.view_count });
          return n;
        });
      }
    } catch {
      /* 조회 집계는 보조 — 실패 무시 */
    }
  }, []);

  useEffect(() => {
    const p = posts[active];
    if (p) {
      void ensureState(p);
      void recordView(p);
    }
  }, [active, posts, ensureState, recordView]);

  async function toggleLike(post: StagePostPublic) {
    if (!requireLogin(() => toggleLike(post))) return;
    try {
      const res = await fetch(`/api/stage/posts/${post.id}/like`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) return void toast(t("err_server"));
      setStates((prev) => {
        const n = new Map(prev);
        const cur = n.get(post.id);
        if (cur) n.set(post.id, { ...cur, liked: !!j.liked, likeCount: j.like_count as number });
        return n;
      });
    } catch {
      toast(t("err_server"));
    }
  }

  // 멤버 본인 — 하트 남기기/취소(코어 액션). 응답의 새 상태로 갱신
  async function toggleMemberHeart(post: StagePostPublic) {
    if (!requireLogin(() => toggleMemberHeart(post))) return;
    const res = await fetch(`/api/stage/posts/${post.id}/member-heart`, { method: "POST" }).catch(() => null);
    if (!res?.ok) return void toast(t("err_server"));
    const j = await res.json().catch(() => ({}));
    setStates((prev) => {
      const n = new Map(prev);
      const cur = n.get(post.id) ?? { memberHearted: false, liked: false, likeCount: post.like_count, viewCount: post.view_count };
      n.set(post.id, { ...cur, memberHearted: !!j.hearted });
      return n;
    });
  }

  async function report(post: StagePostPublic) {
    if (!requireLogin(() => report(post))) return;
    try {
      const res = await fetch(`/api/stage/posts/${post.id}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const j = await res.json().catch(() => ({}));
      toast(res.ok || j.code === "already" ? t("stage_reported") : t("err_server"));
    } catch {
      toast(t("err_server"));
    }
  }

  const activePost = posts[active];
  const chromeCls = chromeHidden ? "pointer-events-none opacity-0" : "opacity-100";

  if (notFound) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <p className="text-[14px] text-white/80">{t("video_not_found")}</p>
        <button onClick={() => router.back()} className="rounded-full bg-white/15 px-5 py-2.5 text-[13px] font-bold text-white">{t("nav_back")}</button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-[60] snap-y snap-mandatory overflow-y-scroll overscroll-contain bg-black">
      {/* 닫기 */}
      <button
        onClick={() => router.back()}
        aria-label={t("nav_back")}
        className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:scale-95"
      >
        <X className="h-5 w-5" />
      </button>

      {/* UI 숨김/표시 토글 — 오버레이가 영상을 가릴 때 사용(가로모드 자동 숨김도 여기서 복원) */}
      <button
        onClick={() => setChromeHidden((h) => !h)}
        aria-label={chromeHidden ? t("video_show_ui") : t("video_hide_ui")}
        aria-pressed={chromeHidden}
        className="fixed left-[3.75rem] top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:scale-95"
      >
        {chromeHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>

      {loading ? (
        <div className="flex h-[100dvh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      ) : (
        posts.map((post, i) => {
          // 윈도잉 — 활성 ±2만 실제 콘텐츠 렌더. 그 외는 빈 셸(높이·스냅·ref 유지)로 DOM/이미지 부하 최소화
          const near = Math.abs(i - active) <= 2;
          if (!near) {
            return (
              <section
                key={post.id}
                data-idx={i}
                ref={(el) => { itemRefs.current[i] = el; }}
                className="h-[100dvh] snap-start snap-always"
              />
            );
          }
          const st = states.get(post.id);
          const memberHearted = st?.memberHearted ?? false;
          const isActive = i === active;
          return (
            <section
              key={post.id}
              data-idx={i}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="relative flex h-[100dvh] snap-start snap-always items-center justify-center overflow-hidden"
            >
              {/* 영상 (활성 유튜브는 자동재생, 그 외 포스터) */}
              <div className="w-full max-w-2xl px-3">
                {isActive ? (
                  post.platform === "youtube" ? (
                    <FeedYouTube id={post.external_id} title={post.title} soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} />
                  ) : (
                    <EntryEmbed entry={stagePostAsEntry(post)} />
                  )
                ) : (
                  <div className="relative overflow-hidden rounded-2xl">
                    <Thumb url={post.thumbnail_url} />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <PlayBadge size="lg" />
                    </span>
                  </div>
                )}
              </div>

              {/* 우측 액션 레일 (가로모드/숨김 시 페이드) */}
              <div className={`absolute bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] right-2 z-10 flex flex-col items-center gap-3.5 transition-opacity duration-200 ${chromeCls}`}>
                {isMemberMe && (
                  <button onClick={() => toggleMemberHeart(post)} aria-label={t("mh_button")} aria-pressed={memberHearted} className="flex flex-col items-center gap-1 text-white">
                    <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full shadow-[0_4px_12px_-2px_rgba(108,77,230,0.8)] active:scale-90">
                      <Heart className={`h-[18px] w-[18px] ${memberHearted ? "fill-current" : ""}`} />
                    </span>
                    <span className="text-[10px] font-bold drop-shadow">{t("mh_button")}</span>
                  </button>
                )}
                <RailButton icon={Heart} label={String(st?.likeCount ?? post.like_count)} active={st?.liked} onClick={() => toggleLike(post)} ariaLabel={t("action_like")} />
                <RailButton icon={MessageCircle} onClick={() => setCommentsFor(post.id)} ariaLabel={t("comment_title")} />
                <a href={post.source_url} target="_blank" rel="noreferrer noopener" aria-label={t("stage_open_original")} className="flex flex-col items-center gap-1 text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm active:scale-90"><ExternalLink className="h-[18px] w-[18px]" /></span>
                </a>
                <RailButton icon={Flag} onClick={() => report(post)} ariaLabel={t("stage_report")} muted />
              </div>

              {/* 하단 메타 + 멤버 반응 (가로모드/숨김 시 페이드) */}
              <div className={`absolute inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-4 right-16 z-10 transition-opacity duration-200 ${chromeCls}`}>
                {post.is_official && (
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary-400" />
                    <span className="text-[11px] font-extrabold text-white">{t("official_badge")}</span>
                  </div>
                )}
                <h1 className="line-clamp-2 text-[16px] font-bold leading-snug text-white drop-shadow-md">{post.title}</h1>
                <div className="mt-0.5 flex items-center gap-2 text-[12.5px] font-semibold text-white/85">
                  <span className="truncate">@{post.handle}</span>
                  <span className="flex shrink-0 items-center gap-1 text-white/75" aria-label={t("views_label")}>
                    <Eye className="h-3.5 w-3.5" /> <span className="tabular-nums">{(st?.viewCount ?? post.view_count).toLocaleString()}</span>
                  </span>
                </div>
                {post.uploader_nickname && (
                  <div className="mt-0.5 truncate text-[11.5px] text-white/70">
                    {t("uploader_by")} {post.uploader_nickname}
                  </div>
                )}
              </div>
            </section>
          );
        })
      )}

      {/* 댓글 시트 */}
      {commentsFor && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/60" onClick={() => setCommentsFor(null)}>
          <div className="max-h-[75dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-fg">{t("comment_title")}</h2>
              <button onClick={() => setCommentsFor(null)} aria-label={t("hiw_new_dismiss")} className="flex h-9 w-9 items-center justify-center rounded-full text-subtle"><X className="h-5 w-5" /></button>
            </div>
            <CommentSection postId={commentsFor} />
          </div>
        </div>
      )}

      {activePost && <FeedProgress index={active} total={posts.length} />}
    </div>
  );
}

// 우측 레일 버튼
function RailButton({ icon: Icon, label, active, muted, onClick, ariaLabel }: { icon: typeof Heart; label?: string; active?: boolean; muted?: boolean; onClick: () => void; ariaLabel: string }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} aria-pressed={active} className="flex flex-col items-center gap-1 text-white">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm active:scale-90 ${active ? "bg-primary text-white" : muted ? "bg-white/10 text-white/80" : "bg-white/15"}`}>
        <Icon className={`h-[18px] w-[18px] ${active ? "fill-current" : ""}`} />
      </span>
      {label && <span className="text-[10.5px] font-bold tabular-nums drop-shadow">{label}</span>}
    </button>
  );
}

// 진행 표시 (n / total) — 상단 중앙(우측은 소리·전체화면 컨트롤 자리)
function FeedProgress({ index, total }: { index: number; total: number }) {
  return (
    <div className="fixed left-1/2 top-[max(0.9rem,env(safe-area-inset-top))] z-20 -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm tabular-nums">
      {index + 1} / {total}
    </div>
  );
}
