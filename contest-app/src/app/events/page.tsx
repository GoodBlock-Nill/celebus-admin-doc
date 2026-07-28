import Shell from "@/components/Shell";
import EventList from "@/components/EventList";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <Shell>
      <EventList />
    </Shell>
  );
}
