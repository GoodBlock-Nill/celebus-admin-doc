'use client';

import BottomSheet from './BottomSheet';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { formatNumber } from '@/lib/utils';

interface ExchangeInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExchangeInfo({ isOpen, onClose }: ExchangeInfoProps) {
  const { config } = useExchangeStore();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="교환소 안내">
      <div className="px-5 py-4 space-y-5 pb-6">
        <p className="text-sm text-gray-600 text-center">
          Game Point와 Celeb은 1:1 비율로 교환돼요.
        </p>

        <div className="bg-blue-50 rounded-2xl px-4 py-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">교환 비율</span>
            <span className="text-sm font-semibold text-blue-600">1GP = 1CELB</span>
          </div>
          <div className="border-t border-blue-100 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">GP 가져오기 최소</span>
              <span className="text-xs text-gray-700">{formatNumber(config.chargeMinCelb)} CELB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">GP 가져오기 최대 (1회)</span>
              <span className="text-xs text-gray-700">{formatNumber(config.chargeMaxCelb)} CELB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">GP 가져오기 1일 한도</span>
              <span className="text-xs text-gray-700">{formatNumber(config.chargeDailyLimitCelb)} CELB / {config.chargeDailyLimitCount}회</span>
            </div>
          </div>
          <div className="border-t border-blue-100 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">CELB 보내기 최소</span>
              <span className="text-xs text-gray-700">{formatNumber(config.withdrawMinGP)} GP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">CELB 보내기 최대 (1회)</span>
              <span className="text-xs text-gray-700">{formatNumber(config.withdrawMaxGP)} GP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">CELB 보내기 1일 한도</span>
              <span className="text-xs text-gray-700">{formatNumber(config.withdrawDailyLimitGP)} GP / {config.withdrawDailyLimitCount}회</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {[
            '교환 수수료는 없어요.',
            '교환은 내 계정에 연결된 Celeb 주소를 통해 진행돼요.',
            'Game Point는 게임 내에서만 사용할 수 있어요.',
            '네트워크 상황에 따라 반영까지 시간이 소요될 수 있어요.',
          ].map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-blue-400 text-xs mt-0.5 shrink-0">•</span>
              <p className="text-xs text-gray-600">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
