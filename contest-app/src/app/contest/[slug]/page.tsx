import ContestView from "@/components/ContestView";

export const dynamic = "force-dynamic";

export default async function ContestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ContestView slug={slug} />;
}
