import Shell from "@/components/Shell";
import StageView from "@/components/StageView";

export const dynamic = "force-dynamic";

export default async function StagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <StageView stageId={id} />
    </Shell>
  );
}
