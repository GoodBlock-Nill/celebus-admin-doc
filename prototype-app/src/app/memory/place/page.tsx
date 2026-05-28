'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, MapPin } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { PLACES } from '@/lib/data';

export default function PlaceSearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('고척');
  const results = PLACES.filter((p) => !q || p.name.includes(q) || p.addr.includes(q));

  return (
    <div className="min-h-dvh">
      <SubHeader
        title=""
        right={undefined}
      />
      <div className="-mt-12 px-4">
        <div className="flex items-center gap-2 pl-10">
          <div className="flex flex-1 items-center rounded-lg border border-primary bg-card px-3 py-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent text-[14px] outline-none" autoFocus />
            <button onClick={() => setQ('')}><X className="size-4 text-text-disabled" /></button>
          </div>
        </div>
        <div className="mt-3 divide-y divide-border-card">
          {results.map((p) => (
            <button key={p.name} onClick={() => router.push('/memory/create')} className="flex w-full items-center gap-3 py-3 text-left">
              <MapPin className="size-5 text-text-disabled" />
              <div>
                <p className="text-[14px] font-medium">{p.name}</p>
                <p className="text-[12px] text-text-disabled">{p.addr}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
