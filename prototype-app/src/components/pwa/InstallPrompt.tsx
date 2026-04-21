'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('celebus-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('celebus-install-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[150] max-w-[398px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-3 animate-slideInUp">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📲</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">CELEBUS 앱 설치</p>
          <p className="text-xs text-gray-500">홈 화면에 추가하면 더 빠르게!</p>
        </div>
        <button onClick={handleInstall} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold">
          설치
        </button>
        <button onClick={handleDismiss} className="text-gray-400 text-lg">×</button>
      </div>
    </div>
  );
}
