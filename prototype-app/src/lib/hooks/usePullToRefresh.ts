'use client';

import { useState, useCallback } from 'react';

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) setTouchStart(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStart;
    if (diff > 80 && window.scrollY === 0 && !isRefreshing) {
      setIsRefreshing(true);
      Promise.resolve(onRefresh()).finally(() => setIsRefreshing(false));
    }
    setTouchStart(0);
  }, [touchStart, isRefreshing, onRefresh]);

  return { isRefreshing, handleTouchStart, handleTouchEnd };
}
