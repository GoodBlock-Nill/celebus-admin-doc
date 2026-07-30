import Shell from "@/components/Shell";
import TournamentRanking from "@/components/TournamentRanking";

export const dynamic = "force-dynamic";

export default async function TournamentRankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <TournamentRanking eventId={id} />
    </Shell>
  );
}
