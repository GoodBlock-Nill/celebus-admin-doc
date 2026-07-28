import Shell from "@/components/Shell";
import EventPlay from "@/components/EventPlay";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <EventPlay eventId={id} />
    </Shell>
  );
}
