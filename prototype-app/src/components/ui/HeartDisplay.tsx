'use client';

import { HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

interface HeartDisplayProps {
  hearts: number;
  maxHearts?: number;
}

export default function HeartDisplay({ hearts, maxHearts = 3 }: HeartDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxHearts }, (_, i) => {
        const isFilled = i < hearts;
        return isFilled ? (
          <HeartIcon key={i} className="w-6 h-6 text-red-500" />
        ) : (
          <HeartOutlineIcon key={i} className="w-6 h-6 text-gray-300" />
        );
      })}
    </div>
  );
}
