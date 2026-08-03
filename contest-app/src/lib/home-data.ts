import { unstable_cache } from "next/cache";
import { anon } from "@/lib/db-anon";
import type { StageEventPublic, StagePostPublic, StagePublic } from "@/lib/types";

export interface HomeData {
  stages: StagePublic[];
  posts: StagePostPublic[];
  event: StageEventPublic | null;
  featuredPost: StagePostPublic | null;
  hallPick: { post: StagePostPublic; count: number }[];
}

// 홈 데이터 서버 조회 — 공개 뷰만(anon). 언어 무관이라 요청 간 캐시(30초) 가능:
// 렌더는 요청별(쿠키 언어)로 하되, 원본 데이터 fetch는 unstable_cache로 공유해 서버·DB 부하를 줄인다.
export const getHomeData = unstable_cache(
  async (): Promise<HomeData> => {
    const db = anon();
    const [stagesRes, postsRes, eventRes, featuredRes] = await Promise.all([
      db.from("stages_public").select("*").eq("status", "open").order("sort_order").limit(8),
      db.from("stage_posts_public").select("*").order("created_at", { ascending: false }).limit(40),
      db.from("stage_events_public").select("*").eq("status", "open").limit(1),
      db.from("stage_posts_public").select("*").eq("featured", true).order("created_at", { ascending: false }).limit(1),
    ]);
    if (stagesRes.error || postsRes.error || eventRes.error) throw new Error("home load failed");

    const posts = (postsRes.data ?? []) as StagePostPublic[];
    const stages = (stagesRes.data ?? []) as StagePublic[];
    const event = ((eventRes.data ?? []) as StageEventPublic[])[0] ?? null;
    const featuredPost = ((featuredRes.data ?? []) as StagePostPublic[])[0] ?? null;
    // 팬 인기 영상 — 좋아요 최다(1개 이상만) 상위 6
    const hallPick = [...posts]
      .filter((p) => p.like_count > 0)
      .sort((a, b) => b.like_count - a.like_count)
      .slice(0, 6)
      .map((p) => ({ post: p, count: p.like_count }));

    return { stages, posts, event, featuredPost, hallPick };
  },
  ["home-data"],
  { revalidate: 30, tags: ["home-data"] },
);
