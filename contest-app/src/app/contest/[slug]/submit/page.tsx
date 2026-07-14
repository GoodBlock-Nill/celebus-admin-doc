import SubmitWizard from "@/components/SubmitWizard";

export const dynamic = "force-dynamic";

export default async function SubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SubmitWizard slug={slug} />;
}
