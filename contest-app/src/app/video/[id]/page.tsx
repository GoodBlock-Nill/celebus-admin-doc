import type { Metadata } from "next";
import Shell from "@/components/Shell";
import VideoFeed from "@/components/VideoFeed";
import { anon } from "@/lib/db-anon";
import { getFeedList } from "@/lib/feed-data";
import { getServerLang } from "@/lib/server-lang";

export const dynamic = "force-dynamic";

// 공유 미리보기(OG) — 딥링크로 공유 시 썸네일·제목 노출 (Wave 9)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await anon()
    .from("stage_posts_public")
    .select("title, handle, thumbnail_url")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { title: "CELEBUS MOMENT" };
  const title = `${data.title} — @${data.handle} | CELEBUS MOMENT`;
  const images = data.thumbnail_url ? [{ url: data.thumbnail_url as string }] : undefined;
  return {
    title,
    openGraph: { title, images, type: "video.other" },
    twitter: { card: "summary_large_image", title, images: data.thumbnail_url ? [data.thumbnail_url as string] : undefined },
  };
}

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ list?: string }>;
}) {
  const { id } = await params;
  const { list } = await searchParams;
  // 리스트를 서버에서 조회해 초기 데이터로 주입 → 클라 fetch 워터폴 제거(씨드 영상 즉시 렌더).
  const [initialPosts, lang] = await Promise.all([getFeedList(list ?? null, id), getServerLang()]);
  return (
    <Shell initialLang={lang}>
      {/* key=id: 다른 영상으로 내비게이션 시 새 initialPosts로 리마운트(스와이프는 URL 불변이라 영향 없음) */}
      <VideoFeed key={id} postId={id} initialPosts={initialPosts} />
    </Shell>
  );
}
