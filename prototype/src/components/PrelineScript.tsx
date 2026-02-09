'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function PrelineScript() {
  const pathname = usePathname();

  useEffect(() => {
    const loadPreline = async () => {
      try {
        await import('preline/preline');

        if (
          window.HSStaticMethods &&
          typeof window.HSStaticMethods.autoInit === 'function'
        ) {
          window.HSStaticMethods.autoInit();
        }
      } catch {
        // Preline JS not available, skip
      }
    };

    loadPreline();
  }, [pathname]);

  return null;
}
