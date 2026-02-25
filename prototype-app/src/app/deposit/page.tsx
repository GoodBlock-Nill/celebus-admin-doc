'use client';

import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { useExchangeStore } from '@/stores/useExchangeStore';

export default function DepositPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { config } = useExchangeStore();

  const depositAddress = config.depositAddress;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(depositAddress);
      addToast('복사완료', 'success');
    } catch {
      addToast('주소 복사에 실패했습니다.', 'error');
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: depositAddress });
      } catch {
        // 사용자가 취소한 경우 무시
      }
    } else {
      await handleCopy();
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* TopBar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center px-4 h-14 gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center text-gray-700"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-900">Celeb 입금 주소</span>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col items-center gap-6">
        {/* QR 코드 영역 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4 w-full">
          <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center relative border border-gray-200">
            {/* QR 플레이스홀더 */}
            <div className="w-full h-full p-4 grid grid-cols-7 grid-rows-7 gap-0.5">
              {Array.from({ length: 49 }).map((_, i) => {
                const isCorner =
                  (i < 7 && (i < 3 || i % 7 < 3)) ||
                  (i >= 42 && (i < 45 || i % 7 < 3)) ||
                  (i % 7 >= 4 && i < 7);
                return (
                  <div
                    key={i}
                    className={[
                      'rounded-sm',
                      Math.random() > 0.5 || isCorner ? 'bg-gray-800' : 'bg-transparent',
                    ].join(' ')}
                  />
                );
              })}
            </div>
            {/* 중앙 로고 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-black">C</span>
              </div>
            </div>
          </div>

          {/* 네트워크 배지 */}
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
            BSC (BEP-20)
          </span>

          {/* 주소 */}
          <p className="text-xs font-mono text-gray-700 text-center break-all px-2 leading-relaxed">
            {depositAddress}
          </p>
        </div>

        {/* 안내사항 */}
        <div className="w-full bg-red-50 rounded-2xl px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-red-600 mb-2">주의사항</p>
          <div className="flex gap-2">
            <span className="text-red-400 text-xs mt-0.5">•</span>
            <p className="text-xs text-red-600">BSC(Binance Smart Chain) 네트워크로만 입금해주세요.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-red-400 text-xs mt-0.5">•</span>
            <p className="text-xs text-red-600">잘못된 네트워크 입금 시 복구가 불가능합니다.</p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="h-12 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            주소 복사
          </button>
          <button
            onClick={handleShare}
            className="h-12 rounded-2xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            공유하기
          </button>
        </div>

        {/* 추가 안내 */}
        <div className="w-full bg-blue-50 rounded-2xl px-5 py-4">
          <p className="text-xs text-blue-600 leading-relaxed">
            Celeb을 위 주소로 입금하면 자동으로 GP로 전환됩니다.<br />
            블록체인 네트워크 상황에 따라 1~10분 소요될 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
