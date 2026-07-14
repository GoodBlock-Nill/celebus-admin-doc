import type { Metadata } from "next";
import EntryView from "@/components/EntryView";
import { anon } from "@/lib/db-anon";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data } = await anon()
      .from("contest_entries_public")
      .select("title, handle, vote_count, thumbnail_url")
      .eq("id", id)
      .maybeSingle();
    if (!data) return {};
    const title = `${data.title} — @${data.handle} | CELEBUS FanStage`;
    const description = `투표하러 가기 💜 현재 ${data.vote_count.toLocaleString()}표`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(data.thumbnail_url ? { images: [{ url: data.thumbnail_url }] } : {}),
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return {};
  }
}

export default async function EntryPage({ params }: Props) {
  const { id } = await params;
  return <EntryView id={id} />;
}
