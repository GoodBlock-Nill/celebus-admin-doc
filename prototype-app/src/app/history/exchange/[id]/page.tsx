'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { useUIStore } from '@/stores/useUIStore';
import { formatNumber, formatDate, formatTime, truncateHash } from '@/lib/utils';
import { mockExchanges } from '@/mock/exchanges';

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <div className="text-right min-w-0">{children}</div>
    </div>
  );
}

export default function ExchangeDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useUIStore();

  const found = mockExchanges.find((e) => e.txid === id);

  if (!found) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <TopBar title="교환내역 상세" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500">교환 정보를 찾을 수 없습니다.</p>
            <button
              onClick={() => router.back()}
              className="text-sm text-blue-600 underline"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const item = found;
  const isCharge = item.direction === 'CHARGE';
  const isSuccess = item.status === 'SUCCESS';
  const isFailed = item.status === 'FAILED';

  const titleText = isCharge ? '가져오기 상세' : '보내기 상세';
  const statusText = isCharge
    ? isSuccess ? '가져오기 완료' : isFailed ? '가져오기 실패' : '처리중'
    : isSuccess ? '보내기 완료' : isFailed ? '보내기 실패' : '처리중';

  const addressLabel = isCharge ? '보낸 주소' : '받는 주소';

  const bscScanUrl = `https://bscscan.com/tx/${item.txid}`;

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(item.walletAddress);
      addToast('복사되었습니다', 'success');
    } catch {
      addToast('복사할 수 없습니다', 'error');
    }
  }

  async function handleCopyTxid() {
    try {
      await navigator.clipboard.writeText(item.txid);
      addToast('복사되었습니다', 'success');
    } catch {
      addToast('복사할 수 없습니다', 'error');
    }
  }

  function handleBscScan() {
    try {
      window.open(bscScanUrl, '_blank', 'noopener,noreferrer');
    } catch {
      addToast('페이지를 열 수 없습니다.', 'error');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title={titleText} showBack />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* 상단 카드 */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm font-semibold ${
              isSuccess
                ? isCharge ? 'text-green-600' : 'text-gray-700'
                : 'text-red-500'
            }`}>
              {statusText}
            </span>
            {!isSuccess && !isFailed && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">처리중</span>
            )}
          </div>

          {isFailed ? (
            <p className="text-2xl font-black text-gray-400 line-through">
              {formatNumber(item.gpAmount)} GP
            </p>
          ) : (
            <p className={`text-2xl font-black ${isCharge ? 'text-blue-600' : 'text-red-500'}`}>
              {isCharge ? '+' : '-'}{formatNumber(item.gpAmount)} GP
            </p>
          )}

          {isFailed && item.failureReason && (
            <p className="text-xs text-red-400 mt-1">{item.failureReason}</p>
          )}
        </div>

        <div className="h-px bg-gray-200" />

        {/* 상세 정보 */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-2">
          <DetailRow label="거래일시">
            <div>
              <p className="text-sm text-gray-900">
                {formatDate(item.datetime)}. {formatTime(item.datetime)}
              </p>
              <p className="text-xs text-gray-400">(UTC+9)</p>
            </div>
          </DetailRow>

          <DetailRow label={addressLabel}>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs font-mono text-gray-700 break-all">
                {truncateHash(item.walletAddress, 8, 8)}
              </span>
              <button
                onClick={handleCopyAddress}
                className="text-gray-400 hover:text-gray-600 shrink-0"
                title="복사"
              >
                📋
              </button>
            </div>
          </DetailRow>

          <DetailRow label="네트워크">
            <span className="text-sm text-gray-900">BSC (BNB Smart Chain)</span>
          </DetailRow>

          <DetailRow label="트랜잭션 해시">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs font-mono text-gray-700">
                {truncateHash(item.txid, 8, 8)}
              </span>
              <button
                onClick={handleCopyTxid}
                className="text-gray-400 hover:text-gray-600 shrink-0"
                title="복사"
              >
                📋
              </button>
            </div>
          </DetailRow>

          {isCharge && (
            <DetailRow label="GP 수신">
              <span className="text-sm font-semibold text-blue-600">
                +{formatNumber(item.gpAmount)} GP
              </span>
            </DetailRow>
          )}

          {!isCharge && (
            <DetailRow label="CELB 전송">
              <span className="text-sm font-semibold text-amber-600">
                {formatNumber(item.celbAmount)} CELB
              </span>
            </DetailRow>
          )}

          <DetailRow label="교환 비율">
            <span className="text-sm text-gray-900">1GP = {item.rate}CELB</span>
          </DetailRow>
        </div>

        {/* BscScan 버튼 */}
        <button
          onClick={handleBscScan}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity"
        >
          BscScan에서 보기
          <span className="text-base">↗</span>
        </button>
      </div>
    </div>
  );
}
