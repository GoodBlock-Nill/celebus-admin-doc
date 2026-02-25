'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { useUIStore } from '@/stores/useUIStore';
import { formatNumber, formatGP, formatCELB, cn } from '@/lib/utils';
import ExchangeConfirm from '@/components/modals/ExchangeConfirm';
import ExchangeInfo from '@/components/modals/ExchangeInfo';

type ExchangeTab = 'CHARGE' | 'WITHDRAW';

function validateWalletAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export default function ExchangePage() {
  const router = useRouter();
  const { user, updateGPBalance, updateCELBBalance } = useUserStore();
  const { config, executeCharge, executeWithdraw } = useExchangeStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<ExchangeTab>('CHARGE');
  const [celbInput, setCelbInput] = useState('');
  const [gpInput, setGpInput] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const celbAmount = parseFloat(celbInput) || 0;
  const gpAmount = parseFloat(gpInput) || 0;

  const gpFromCelb = Math.floor(celbAmount * config.celbToGpRate);
  const celbFromGp = gpAmount / config.gpToCelbRate;

  // Charge validation
  function getChargeError(): string {
    if (!celbInput) return '';
    if (celbAmount < config.chargeMinCelb) {
      return `최소 충전 금액은 ${formatNumber(config.chargeMinCelb)} CELB입니다.`;
    }
    if (celbAmount > config.chargeMaxCelb) {
      return `1회 최대 충전 금액은 ${formatNumber(config.chargeMaxCelb)} CELB입니다.`;
    }
    if (celbAmount > user.celbBalance) {
      return `가용 CELB가 부족합니다. (가능: ${formatCELB(user.celbBalance, 2)})`;
    }
    return '';
  }

  // Withdraw validation
  function getWithdrawError(): string {
    if (!gpInput) return '';
    if (gpAmount < config.withdrawMinGP) {
      return `최소 출금 금액은 ${formatNumber(config.withdrawMinGP)} GP입니다.`;
    }
    if (gpAmount > config.withdrawMaxGP) {
      return `1회 최대 출금 금액은 ${formatNumber(config.withdrawMaxGP)} GP입니다.`;
    }
    if (gpAmount > user.gpBalance) {
      return `보유 GP가 부족합니다. (보유: ${formatGP(user.gpBalance)})`;
    }
    return '';
  }

  function getWalletError(): string {
    if (!walletAddress) return '';
    if (!validateWalletAddress(walletAddress)) {
      return '올바른 지갑 주소를 입력해주세요.';
    }
    return '';
  }

  const chargeError = getChargeError();
  const withdrawError = getWithdrawError();
  const walletError = getWalletError();

  const isChargeValid =
    config.chargeEnabled &&
    celbAmount >= config.chargeMinCelb &&
    celbAmount <= config.chargeMaxCelb &&
    celbAmount <= user.celbBalance &&
    !chargeError;

  const isWithdrawValid =
    config.withdrawEnabled &&
    gpAmount >= config.withdrawMinGP &&
    gpAmount <= config.withdrawMaxGP &&
    gpAmount <= user.gpBalance &&
    validateWalletAddress(walletAddress) &&
    !withdrawError;

  function handleTabSwitch(tab: ExchangeTab) {
    setActiveTab(tab);
    setCelbInput('');
    setGpInput('');
    setWalletAddress('');
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await new Promise((res) => setTimeout(res, 800));
    setIsRefreshing(false);
    addToast('최신 Celeb 잔액으로 업데이트했어요', 'success');
  }

  function handleSubmit() {
    if (activeTab === 'CHARGE' && !isChargeValid) return;
    if (activeTab === 'WITHDRAW' && !isWithdrawValid) return;
    setShowConfirm(true);
  }

  function handleConfirm() {
    setShowConfirm(false);
    if (activeTab === 'CHARGE') {
      executeCharge(celbAmount);
      updateGPBalance(gpFromCelb);
      updateCELBBalance(-celbAmount);
      addToast('GP 가져오기가 완료되었습니다.', 'success');
      setCelbInput('');
    } else {
      executeWithdraw(gpAmount, walletAddress);
      updateGPBalance(-gpAmount);
      addToast('CELB으로 보내기가 완료되었습니다.', 'success');
      setGpInput('');
      setWalletAddress('');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* TopBar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <span className="text-base font-semibold text-gray-900">Game Point 교환소</span>
        <button
          onClick={() => setShowInfo(true)}
          className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100"
          aria-label="이용 안내"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      <div className="flex-1 px-4 py-4 pb-28 space-y-4">
        {/* GP 잔액 카드 */}
        <button
          onClick={() => router.push('/history')}
          className="w-full bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">GP</span>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500">보유 Game Point</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(user.gpBalance)}</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* 탭 */}
        <div className="flex bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => handleTabSwitch('CHARGE')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'CHARGE'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 border-b-2 border-transparent'
            )}
          >
            GP 가져오기
          </button>
          <button
            onClick={() => handleTabSwitch('WITHDRAW')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'WITHDRAW'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 border-b-2 border-transparent'
            )}
          >
            CELB으로 보내기
          </button>
        </div>

        {/* GP 가져오기 탭 */}
        {activeTab === 'CHARGE' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Celeb을 사용해 Game Point를 가져올 수 있어요.<br />
                <span className="font-medium text-blue-600">1GP = 1CELB</span>
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">사용할 Celeb</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-500">
                      가능: {formatCELB(user.celbBalance, 2)}
                    </p>
                    <button
                      onClick={handleRefresh}
                      className={cn('text-gray-400', isRefreshing && 'animate-spin')}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={cn(
                  'flex items-center gap-2 border rounded-xl px-4 py-3',
                  chargeError ? 'border-red-400' : 'border-gray-200'
                )}>
                  <span className="text-cyan-600 font-bold text-sm">CELB</span>
                  <input
                    type="number"
                    value={celbInput}
                    onChange={(e) => setCelbInput(e.target.value)}
                    placeholder={`최소 입력 ${formatNumber(config.chargeMinCelb)} CELB`}
                    className="flex-1 outline-none text-right text-gray-900 text-base bg-transparent"
                    min={0}
                  />
                </div>
                {chargeError && (
                  <p className="text-xs text-red-500 mt-1 px-1">{chargeError}</p>
                )}
              </div>

              <button
                onClick={() => router.push('/deposit')}
                className="w-full border border-gray-300 rounded-xl py-3 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Celeb 입금주소
              </button>

              <div className="flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">가져올 Game Point</p>
                <div className="flex items-center gap-2 border border-gray-100 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="flex-1 text-right text-gray-900 text-base font-medium">
                    {formatNumber(gpFromCelb)} GP
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-400 space-y-0.5">
                <p>최소: {formatNumber(config.chargeMinCelb)} CELB / 최대: {formatNumber(config.chargeMaxCelb)} CELB</p>
                <p>1일 한도: {formatNumber(config.chargeDailyLimitCelb)} CELB ({config.chargeDailyLimitCount}회)</p>
              </div>
            </div>
          </div>
        )}

        {/* CELB으로 보내기 탭 */}
        {activeTab === 'WITHDRAW' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Game Point를 Celeb으로 보낼 수 있어요.<br />
                <span className="font-medium text-amber-600">1GP = 1CELB</span>
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">보낼 Game Point</p>
                  <p className="text-xs text-gray-500">보유: {formatGP(user.gpBalance)}</p>
                </div>

                <div className={cn(
                  'flex items-center gap-2 border rounded-xl px-4 py-3',
                  withdrawError ? 'border-red-400' : 'border-gray-200'
                )}>
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <input
                    type="number"
                    value={gpInput}
                    onChange={(e) => setGpInput(e.target.value)}
                    placeholder={`최소 입력 ${formatNumber(config.withdrawMinGP)} GP`}
                    className="flex-1 outline-none text-right text-gray-900 text-base bg-transparent"
                    min={0}
                  />
                </div>
                {withdrawError && (
                  <p className="text-xs text-red-500 mt-1 px-1">{withdrawError}</p>
                )}
              </div>

              <div className="flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">받을 Celeb</p>
                <div className="flex items-center gap-2 border border-gray-100 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-cyan-600 font-bold text-sm shrink-0">CELB</span>
                  <span className="flex-1 text-right text-gray-900 text-base font-medium">
                    {formatCELB(celbFromGp, 2)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">받을 지갑 주소</p>
                <div className={cn(
                  'border rounded-xl px-4 py-3',
                  walletError ? 'border-red-400' : 'border-gray-200'
                )}>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="지갑 주소 입력"
                    className="w-full outline-none text-gray-900 text-sm bg-transparent font-mono"
                  />
                </div>
                {walletError && (
                  <p className="text-xs text-red-500 mt-1 px-1">{walletError}</p>
                )}
              </div>

              <div className="text-xs text-gray-400 space-y-0.5">
                <p>최소: {formatNumber(config.withdrawMinGP)} GP / 최대: {formatNumber(config.withdrawMaxGP)} GP</p>
                <p>1일 한도: {formatNumber(config.withdrawDailyLimitGP)} GP ({config.withdrawDailyLimitCount}회)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 bg-gray-50 pt-2">
        <button
          onClick={handleSubmit}
          disabled={activeTab === 'CHARGE' ? !isChargeValid : !isWithdrawValid}
          className={cn(
            'w-full h-12 rounded-2xl text-white font-semibold text-base transition-colors',
            activeTab === 'CHARGE'
              ? isChargeValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
              : isWithdrawValid
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-gray-300 cursor-not-allowed'
          )}
        >
          {activeTab === 'CHARGE' ? '가져오기' : '보내기'}
        </button>
      </div>

      {/* 확인 바텀시트 */}
      <ExchangeConfirm
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        direction={activeTab}
        gpAmount={activeTab === 'CHARGE' ? gpFromCelb : gpAmount}
        celbAmount={activeTab === 'CHARGE' ? celbAmount : celbFromGp}
      />

      {/* 이용 안내 바텀시트 */}
      <ExchangeInfo
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </div>
  );
}
