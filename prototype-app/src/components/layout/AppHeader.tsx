import Link from 'next/link';
import { Bell, Ticket } from 'lucide-react';
import { ME } from '@/lib/data';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-background/95 px-4 backdrop-blur">
      <Link href="/home" className="text-[18px] font-bold tracking-tight text-foreground">
        CELEBUS
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/collection" className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <Ticket className="size-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-foreground">{ME.tickets}</span>
        </Link>
        <Link href="/notifications" className="relative grid size-8 place-items-center rounded-full bg-muted">
          <Bell className="size-4 text-foreground" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-error" />
        </Link>
      </div>
    </header>
  );
}
