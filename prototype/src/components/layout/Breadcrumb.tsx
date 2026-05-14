'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';

interface BreadcrumbProps {
  customItems?: { label: string; href?: string }[];
}

export default function Breadcrumb({ customItems = [] }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
      <Link href="/dashboard" className="hover:text-gray-700" aria-label="홈">
        <HomeIcon className="w-4 h-4" />
      </Link>
      {customItems.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
          {i === customItems.length - 1 || !item.href ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-gray-700">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
