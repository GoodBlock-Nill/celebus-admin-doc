import { anon } from "@/lib/db-anon";
import type { StagePostPublic } from "@/lib/types";

// 몰입 피드 리스트 서버 조회 — 클라 loadFeedList와 동일 규칙(공개 뷰만).
// ?list=stage:<id> → 해당 아카이브 최신 300 / 그 외 → 최신 100 / 씨드 미포함 시 단건 폴백.
export async function getFeedList(listParam: string | null, seedId: string): Promise<StagePostPublic[]> {
  const db = anon();
  if (listParam?.startsWith("stage:")) {
    const stageId = listParam.slice(6);
    const { data } = await db
      .from("stage_posts_public")
      .select("*")
      .eq("stage_id", stageId)
      .order("created_at", { ascending: false })
      .limit(300);
    const rows = (data ?? []) as StagePostPublic[];
    if (rows.some((p) => p.id === seedId)) return rows;
  } else {
    const { data } = await db
      .from("stage_posts_public")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = (data ?? []) as StagePostPublic[];
    if (rows.some((p) => p.id === seedId)) return rows;
  }
  // 폴백 — 씨드 단건
  const { data } = await db.from("stage_posts_public").select("*").eq("id", seedId).maybeSingle();
  return data ? [data as StagePostPublic] : [];
}
