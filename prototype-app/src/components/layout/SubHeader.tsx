'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function SubHeader({
  title,
  right,
  onBack,
}: {
  title?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 bg-background/95 px-2 backdrop-blur">
      <button onClick={onBack ?? (() => router.back())} className="grid size-9 place-items-center">
        <ChevronLeft className="size-6 text-foreground" />
      </button>
      <h1 className="flex-1 text-[18px] font-semibold text-foreground">{title}</h1>
      {right && <div className="flex items-center gap-2 pr-2">{right}</div>}
    </header>
  );
}
