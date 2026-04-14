'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface SubPageHeaderProps {
  title: string;
  backHref?: string;
}

export default function SubPageHeader({ title, backHref }: SubPageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 safe-top">
      <div className="flex items-center h-12 px-4">
        <button onClick={handleBack} className="mr-3 -ml-1 p-1">
          <ChevronLeftIcon className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
      </div>
    </header>
  );
}
