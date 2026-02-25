'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const COUNTDOWN_SECONDS = 5;

interface EliminateModalProps {
  onSpectate: () => void;
  onLeave?: () => void;
}

export default function EliminateModal({ onSpectate, onLeave }: EliminateModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  // 1-second interval countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // countdown === 0 -> auto-navigate to trivia home (spectate unavailable)
  useEffect(() => {
    if (countdown === 0) {
      router.push('/home');
    }
  }, [countdown, router]);

  function handleLeave() {
    if (onLeave) {
      onLeave();
    } else {
      router.push('/home');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dim overlay with fadeIn animation */}
      <div className="absolute inset-0 bg-black/70 animate-fadeIn" />

      {/* Modal with scaleIn animation */}
      <div className="relative w-80 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 animate-scaleIn">
        {/* Body */}
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="text-5xl mb-4">💔</div>
          <h2 className="text-xl font-bold text-white mb-3">
            탈락하셨습니다.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            끝까지 관전하면 ❤️ 하트 1개를
            <br />
            받을 수 있어요!
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600" />

        {/* Buttons */}
        <div className="flex">
          <button
            onClick={handleLeave}
            className="flex-1 py-4 text-gray-400 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            나가기
          </button>
          <div className="w-px bg-gray-600" />
          <button
            onClick={onSpectate}
            className="flex-1 py-4 text-blue-400 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            관전하고 하트 받기 ({countdown})
          </button>
        </div>
      </div>

    </div>
  );
}
