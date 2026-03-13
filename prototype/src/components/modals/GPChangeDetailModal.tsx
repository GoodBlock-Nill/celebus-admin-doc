'use client';

import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import GPDisplay from '@/components/ui/GPDisplay';
import type { GPChange } from '@/lib/types';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { GP_TYPE_CONFIG } from '@/lib/constants';

interface GPChangeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  change: GPChange | null;
}

const GAME_STATUS_LABEL: Record<string, string> = {
  Active: '진행중',
  Pending: '결과 대기',
  Closed: '결과 발표',
  Ended: '종료',
  Cancelled: '취소',
};

const TYPE_TITLE_MAP: Record<string, string> = {
  PARTICIPATION: '참여 상세',
  BOOSTING: '부스팅 상세',
  REFUND: '환급 상세',
  REWARD: '보상 상세',
  REFUND_CANCEL: '환불 상세',
};

const DATETIME_LABEL_MAP: Record<string, string> = {
  PARTICIPATION: '참여일시',
  BOOSTING: '참여일시',
  REFUND: '환급일시',
  REWARD: '지급일시',
  REFUND_CANCEL: '환불일시',
};

function formatDateTimeFull(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-[120px] shrink-0">{label}</span>
      <span className="text-sm text-gray-900 flex-1">{children}</span>
    </div>
  );
}

function GameRelatedDetailView({ change }: { change: GPChange }) {
  const isST = change.relatedGameType === 'SURVIVAL_TRIVIA';
  const isPM = change.relatedGameType === 'PREDICTION_MARKET';
  const isRefundCancel = change.type === 'REFUND_CANCEL';
  const isReward = change.type === 'REWARD';
  const isRefund = change.type === 'REFUND';
  const gameStatusLabel = change.relatedGameStatus
    ? GAME_STATUS_LABEL[change.relatedGameStatus] ?? change.relatedGameStatus
    : '-';

  return (
    <div>
      {/* 상단 카드 영역 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600">
          {change.relatedGameTitle}
        </p>
        <div className="mt-2">
          <span className={`text-xl font-bold ${change.amount > 0 ? 'text-blue-500' : 'text-red-500'}`}>
            {change.amount > 0 ? '+' : '-'} {formatNumber(Math.abs(change.amount))} GP
          </span>
        </div>
        {/* 환불 GP 내역 */}
        {isRefundCancel && (change.refundParticipationGP != null) && (
          <p className="text-xs text-gray-500 mt-1">
            참가비 {formatNumber(change.refundParticipationGP)}GP
            {isPM && change.refundBoostingGP != null && change.refundBoostingGP > 0 && (
              <> + 부스팅 {formatNumber(change.refundBoostingGP)}GP</>
            )}
          </p>
        )}
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-200 mb-1" />

      {/* 상세 정보 */}
      <div>
        {/* 내 선택 (PM만 표시, ST는 미표시) */}
        {isPM && change.userChoice && (
          <DetailRow label="내 선택">
            <span>{change.userChoice}</span>
            {change.boostingMultiplier && change.boostingMultiplier > 1 && (
              <span className="ml-1 text-orange-500">🔥 부스팅 ({change.boostingMultiplier}배)</span>
            )}
          </DetailRow>
        )}

        {/* 결과 (환급/보상에서만) */}
        {(isRefund || isReward) && (
          <DetailRow label="결과">
            {isST ? (
              <span>
                {change.eliminatedAtStage != null
                  ? `탈락 (${change.eliminatedAtStage}스테이지)`
                  : `생존 (${change.survivedStage ?? 10}스테이지)`
                }
              </span>
            ) : (
              <span>{change.gameResult ?? '-'}</span>
            )}
          </DetailRow>
        )}

        {/* 게임 상태 */}
        <DetailRow label="게임 상태">
          <span>{gameStatusLabel}</span>
          {isPM && isReward && (
            <span className="ml-2 text-blue-500 text-xs cursor-pointer hover:underline">결과보기 &gt;</span>
          )}
        </DetailRow>

        {/* 하트 변동 (ST 참여/보상, 종료 후만) */}
        {isST && !isRefundCancel && change.relatedGameStatus === 'Ended' && (
          <DetailRow label="하트 변동">
            <span>
              ❤️ -{change.heartsLost ?? 0} / ❤️ +{change.heartsGained ?? 0}
            </span>
          </DetailRow>
        )}

        {/* 하트 복구 (ST 환불 전용, 복구 수 > 0일 때만) */}
        {isST && isRefundCancel && change.heartsRecovered != null && change.heartsRecovered > 0 && (
          <DetailRow label="하트 복구">
            <span>❤️ +{change.heartsRecovered}</span>
          </DetailRow>
        )}

        {/* 날짜/시간 */}
        <DetailRow label={DATETIME_LABEL_MAP[change.type] ?? '일시'}>
          <div>
            <span>{formatDateTimeFull(change.datetime)}</span>
            <span className="text-xs text-gray-400 ml-1">(UTC+9)</span>
          </div>
        </DetailRow>

        {/* 게임 정보 */}
        <DetailRow label="게임 정보">
          <span>{isST ? 'Survival Trivia' : 'Prediction Market'}</span>
        </DetailRow>
      </div>
    </div>
  );
}

function ExchangeDetailView({ change }: { change: GPChange }) {
  return (
    <div className="space-y-3">
      {[
        { label: '변동 ID', content: <span>{change.id}</span> },
        { label: '일시', content: <span>{formatDateTime(change.datetime)}</span> },
        { label: '닉네임', content: <span className="text-blue-600 cursor-pointer hover:underline">{change.nickname.toLowerCase()}</span> },
        { label: '지갑주소', content: <span className="font-mono text-xs break-all">{change.walletAddress}</span> },
        { label: '변동 유형', content: <Badge variant="gpType" value={change.type} /> },
        { label: 'GP 변동량', content: <GPDisplay amount={change.amount} showSign /> },
        { label: '변동 후 잔액', content: <span>{formatNumber(change.balanceAfter)} GP</span> },
        ...(change.txid ? [{
          label: '관련 교환',
          content: (
            <a href={`https://bscscan.com/tx/${change.txid}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline break-all">
              {change.txid}
            </a>
          ),
        }] : []),
        { label: '비고', content: <span>{change.notes}</span> },
      ].map((row, i) => (
        <div key={i} className="flex items-start py-2 border-b border-gray-100 last:border-0">
          <span className="text-sm text-gray-500 w-[120px] shrink-0">{row.label}</span>
          <span className="text-sm text-gray-900">{row.content}</span>
        </div>
      ))}
    </div>
  );
}

export default function GPChangeDetailModal({ isOpen, onClose, change }: GPChangeDetailModalProps) {
  if (!change) return null;

  const isGameRelated = ['PARTICIPATION', 'BOOSTING', 'REFUND', 'REWARD', 'REFUND_CANCEL'].includes(change.type);
  const title = isGameRelated
    ? (TYPE_TITLE_MAP[change.type] ?? '변동 상세')
    : '변동 상세';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-lg">
      {isGameRelated && change.relatedGameTitle
        ? <GameRelatedDetailView change={change} />
        : <ExchangeDetailView change={change} />
      }
    </Modal>
  );
}
