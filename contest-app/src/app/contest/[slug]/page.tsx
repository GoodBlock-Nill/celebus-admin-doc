import type { Metadata } from "next";
import ContestView from "@/components/ContestView";
import { anon } from "@/lib/db-anon";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await anon()
      .from("contests_public")
      .select("title, prize_summary, cover_image_url")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return {};
    const title = `${data.title} | CELEBUS MOMENT`;
    const description = data.prize_summary
      ? `🏆 ${data.prize_summary} · 지금 참여하고 좋아요를 받아보세요`
      : "V01D 팬 콘테스트 · 지금 참여하고 좋아요를 받아보세요";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        // 커버가 있으면 콘테스트 커버로, 없으면 기본 브랜드 OG(opengraph-image) 사용
        ...(data.cover_image_url ? { images: [{ url: data.cover_image_url }] } : {}),
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return {};
  }
}

export default async function ContestPage({ params }: Props) {
  const { slug } = await params;
  return <ContestView slug={slug} />;
}
