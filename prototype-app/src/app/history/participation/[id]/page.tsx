'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { formatNumber, formatDate, formatTime } from '@/lib/utils';
import { GP_TYPE_CONFIG, GAME_TYPE_LABELS } from '@/lib/constants';
import { mockGPChanges } from '@/mock/exchanges';
import type { GPChangeType } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

const DATETIME_LABEL: Record<GPChangeType, string> = {
  PARTICIPATION: '참여일시',
  BOOSTING: '참여일시',
  REFUND: '환급일시',
  REWARD: '지급일시',
  REFUND_CANCEL: '환불일시',
  EXCHANGE_IN: '거래일시',
  EXCHANGE_OUT: '거래일시',
};

const GAME_STATUS_LABEL: Record<string, string> = {
  Active: '진행중',
  Pending: '결과 대기',
  Closed: '결과 발표',
  Ended: '종료',
  Cancelled: '취소',
};

function getGameStatusForType(type: GPChangeType): string {
  switch (type) {
    case 'PARTICIPATION':
    case 'BOOSTING':
      return '진행중';
    case 'REFUND':
      return '결과 발표';
    case 'REWARD':
      return '결과 발표';
    case 'REFUND_CANCEL':
      return '취소';
    default:
      return '-';
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <div className="text-right ml-4">{children}</div>
    </div>
  );
}

export default function ParticipationDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const item = mockGPChanges.find((g) => g.id === id);

  if (!item) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <TopBar title="참여내역 상세" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500">참여 정보를 찾을 수 없습니다.</p>
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

  const cfg = GP_TYPE_CONFIG[item.type];
  const isPositive = cfg.sign === '+';
  const typeLabel = cfg.label;
  const title = `${typeLabel} 상세`;

  const isRefundCancel = item.type === 'REFUND_CANCEL';
  const isReward = item.type === 'REWARD';
  const isBoosting = item.type === 'BOOSTING';
  const hasResult = item.type === 'REFUND' || item.type === 'REWARD';
  const isSurvivalTrivia = item.gameType === 'SURVIVAL_TRIVIA';

  // mock 추가 정보
  const mockChoice = 'YES';
  const mockBoostMultiplier = 2;
  const mockResult = 'YES';
  const mockBoostingGP = 1;
  const mockParticipationGP = 10;

  const dateLabel = DATETIME_LABEL[item.type];
  const gameStatus = getGameStatusForType(item.type);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title={title} showBack />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* 상단 카드 */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <button
            onClick={() => {
              if (isSurvivalTrivia) {
                item.relatedGameId && router.push('/trivia');
              } else {
                item.relatedGameId && router.push(`/prediction/${item.relatedGameId}`);
              }
            }}
            className="text-base font-semibold text-gray-900 text-left leading-snug line-clamp-2 mb-3 hover:text-blue-600 transition-colors"
          >
            {item.relatedGameTitle ?? '(삭제된 게임)'}
          </button>

          <p className={`text-2xl font-black ${isPositive ? 'text-blue-600' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{formatNumber(item.amount)} GP
          </p>

          {isRefundCancel && (
            <p className="text-xs text-gray-400 mt-1">
              {isSurvivalTrivia
                ? `참가비 ${formatNumber(mockParticipationGP)}GP`
                : `참가비 ${formatNumber(mockParticipationGP)}GP + 부스팅 ${formatNumber(mockBoostingGP)}GP`}
            </p>
          )}
        </div>

        <div className="h-px bg-gray-200" />

        {/* 상세 정보 */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-2">
          {!isSurvivalTrivia && (
            <DetailRow label="내 선택">
              <span className="text-sm font-medium text-gray-900">
                {mockChoice}
                {(isBoosting || isReward) && (
                  <span className="text-orange-500 ml-1">
                    🔥 부스팅 ({mockBoostMultiplier}배)
                  </span>
                )}
                {isRefundCancel && (
                  <span className="text-orange-500 ml-1">+ 🔥부스팅</span>
                )}
              </span>
            </DetailRow>
          )}

          {hasResult && (
            <DetailRow label="결과">
              <span className="text-sm font-medium text-gray-900">
                {isSurvivalTrivia ? '생존 (10라운드)' : mockResult}
              </span>
            </DetailRow>
          )}

          <DetailRow label="게임 상태">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm text-gray-900">{gameStatus}</span>
              {isReward && (
                <button
                  onClick={() => {
                    if (isSurvivalTrivia) {
                      router.push('/trivia/result');
                    } else {
                      item.relatedGameId && router.push(`/prediction/${item.relatedGameId}/result`);
                    }
                  }}
                  className="text-sm text-blue-600 font-medium"
                >
                  결과보기 &gt;
                </button>
              )}
            </div>
          </DetailRow>

          <DetailRow label={dateLabel}>
            <div>
              <p className="text-sm text-gray-900">
                {formatDate(item.datetime)}. {formatTime(item.datetime)}
              </p>
              <p className="text-xs text-gray-400">(UTC+9)</p>
            </div>
          </DetailRow>

          <DetailRow label="게임 정보">
            <span className="text-sm text-gray-900">{GAME_TYPE_LABELS[item.gameType ?? 'PREDICTION_MARKET']}</span>
          </DetailRow>
        </div>
      </div>
    </div>
  );
}
