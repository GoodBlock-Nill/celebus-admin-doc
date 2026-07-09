import type { Metadata } from "next";
import PostView from "./PostView";

type Params = { params: Promise<{ id: string }> };

// 글별 제목·설명 메타데이터 (링크 공유 미리보기용). 이미지는 루트 브랜드 OG 이미지 상속.
async function fetchPost(id: string): Promise<{ title: string; body: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/posts_public?id=eq.${encodeURIComponent(id)}&select=title,body`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { title: string; body: string }[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPost(id);
  const heading = post?.title?.trim() || "팬보이스";
  const title = `${heading} | CELEBUS FanVoice`;
  const description = (post?.body ?? "V01D 팬보이스 — 여러분의 목소리가 다음을 만듭니다").slice(0, 120);
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: "CELEBUS FanVoice" };
  return {
    title,
    description,
    openGraph: { type: "article", title, description, url: `/post/${id}`, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({ params }: Params) {
  const { id } = await params;
  return <PostView id={id} />;
}
