'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import { BREADCRUMB_MAP } from '@/lib/constants';

interface BreadcrumbProps {
  customItems?: { label: string; href?: string }[];
}

export default function Breadcrumb({ customItems }: BreadcrumbProps) {
  const pathname = usePathname();

  const items = customItems || (() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];
    let currentPath = '';

    for (const segment of segments) {
      currentPath += `/${segment}`;
      if (segment.startsWith('[') || /^[a-f0-9-]+$/.test(segment)) {
        continue;
      }
      const label = BREADCRUMB_MAP[currentPath];
      if (label) {
        crumbs.push({ label, href: currentPath });
      }
    }

    return crumbs;
  })();

  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500">
      <Link href="/game-zone" className="hover:text-gray-700">
        <HomeIcon className="w-4 h-4" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
          {i === items.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link href={item.href || '#'} className="hover:text-gray-700">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
