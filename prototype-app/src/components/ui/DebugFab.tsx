'use client';

import { useState } from 'react';

interface DebugFabProps {
  children: React.ReactNode;
  bottomOffset?: string;
}

export function DebugFab({ children, bottomOffset = 'bottom-6' }: DebugFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <div className={`fixed right-4 ${bottomOffset} z-50`}>
        {open && (
          <div className="absolute bottom-12 right-0 w-72 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl mb-2">
            {children}
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          🎛
        </button>
      </div>
    </>
  );
}
