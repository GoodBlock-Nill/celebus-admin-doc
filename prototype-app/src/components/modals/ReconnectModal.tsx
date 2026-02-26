'use client';

interface ReconnectModalProps {
  onSpectate: () => void;
  onLeave: () => void;
}

export default function ReconnectModal({ onSpectate, onLeave }: ReconnectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dim overlay - no click-to-close */}
      <div className="absolute inset-0 bg-black/70 animate-fadeIn" />

      {/* Modal */}
      <div className="relative w-80 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 animate-scaleIn">
        {/* Body */}
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="text-5xl mb-4">🔄</div>
          <h2 className="text-xl font-bold text-white mb-3">
            연결이 복구되었어요
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            일부 스테이지가 진행되어 아쉽지만 탈락 처리되었습니다.
            <br />
            끝까지 관전하면 ❤️ 하트 1개를 받을 수 있어요!
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600" />

        {/* Buttons */}
        <div className="flex">
          <button
            onClick={onLeave}
            className="flex-1 py-4 text-gray-400 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            나가기
          </button>
          <div className="w-px bg-gray-600" />
          <button
            onClick={onSpectate}
            className="flex-1 py-4 text-blue-400 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            관전하고 하트 받기
          </button>
        </div>
      </div>
    </div>
  );
}
