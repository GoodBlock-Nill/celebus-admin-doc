import type { Metadata } from "next";
import Shell from "@/components/Shell";
import VideoFeed from "@/components/VideoFeed";
import { anon } from "@/lib/db-anon";

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

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <VideoFeed postId={id} />
    </Shell>
  );
}
