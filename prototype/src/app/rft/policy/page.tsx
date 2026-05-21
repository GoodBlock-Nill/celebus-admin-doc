'use client';

import { useState, useMemo } from 'react';
import { ClockIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmModal from '@/app/fanquest/_components/ConfirmModal';
import {
  initialGpExchangePolicy,
  initialAppBuyTogglePolicy,
  initialGameRewardPolicy,
  type GpExchangePolicy,
  type AppBuyTogglePolicy,
  type GameRewardPolicy,
} from '@/mock/rft';

type LimitMode = 'limited' | 'unlimited';

export default function RftPolicyPage() {
  const [policy, setPolicy] = useState<GpExchangePolicy>(initialGpExchangePolicy);
  const [buyToggle, setBuyToggle] = useState<AppBuyTogglePolicy>(initialAppBuyTogglePolicy);
  const [gameReward, setGameReward] = useState<GameRewardPolicy>(initialGameRewardPolicy);

  // 입력 상태 (저장 전까지 정책에 미반영)
  const [rateInput, setRateInput] = useState<string>(String(policy.rate));
  const [limitMode, setLimitMode] = useState<LimitMode>(
    policy.dailyLimitPerMember === null ? 'unlimited' : 'limited',
  );
  const [limitInput, setLimitInput] = useState<string>(
    policy.dailyLimitPerMember === null ? '50' : String(policy.dailyLimitPerMember),
  );

  // Phase 13 — 앱내 구매 운영 토글 입력 상태
  const [buyEnabledInput, setBuyEnabledInput] = useState<boolean>(buyToggle.enabled);
  const [buyReasonInput, setBuyReasonInput] = useState<string>(buyToggle.maintenanceReason);

  // Phase 13 — PM·ST 게임 보상 정책 입력 상태
  const [gameRewardInput, setGameRewardInput] = useState(gameReward.rows);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // 입력값 파싱·검증
  const rateNum = Number(rateInput);
  const limitNum = Number(limitInput);
  const isRateValid = Number.isInteger(rateNum) && rateNum >= 1;
  const isLimitValid = limitMode === 'unlimited' || (Number.isInteger(limitNum) && limitNum >= 1);

  // 변경사항 비교
  const newDailyLimit: number | null = limitMode === 'unlimited' ? null : limitNum;
  const rateChanged = isRateValid && rateNum !== policy.rate;
  const limitChanged = isLimitValid && newDailyLimit !== policy.dailyLimitPerMember;
  const buyEnabledChanged = buyEnabledInput !== buyToggle.enabled;
  const buyReasonChanged = buyReasonInput !== buyToggle.maintenanceReason;
  const buyChanged = buyEnabledChanged || (buyEnabledInput === false && buyReasonChanged);
  const gameRewardChanged = JSON.stringify(gameRewardInput) !== JSON.stringify(gameReward.rows);
  const canSave = isRateValid && isLimitValid && (rateChanged || limitChanged || buyChanged || gameRewardChanged);

  // 확인 모달 메시지
  const confirmMessage = useMemo(() => {
    const lines: string[] = [];
    if (rateChanged) {
      lines.push(`GP 환율을 ${policy.rate} GP → ${rateNum} GP로 변경합니다.`);
    }
    if (limitChanged) {
      const prev = policy.dailyLimitPerMember === null ? '무제한' : `${policy.dailyLimitPerMember}장`;
      const next = newDailyLimit === null ? '무제한' : `${newDailyLimit}장`;
      lines.push(`회원당 1일 교환 한도를 ${prev} → ${next}으로 변경합니다.`);
    }
    if (buyEnabledChanged) {
      const prev = buyToggle.enabled ? 'ON' : 'OFF';
      const next = buyEnabledInput ? 'ON' : 'OFF';
      const reasonLine = !buyEnabledInput && buyReasonInput ? ` (사유: ${buyReasonInput})` : '';
      lines.push(`앱내 응모권 구매를 ${prev} → ${next}으로 전환합니다.${reasonLine}`);
    }
    if (gameRewardChanged) {
      // [CEB-BO-RFT-301] §2-5 정합 — 모달 메시지에 변경 필드 목록 명시 (2026-05-21 sync 정정)
      const changedFields = gameRewardInput
        .map((row, idx) => {
          const prev = gameReward.rows[idx];
          if (!prev) return null;
          const enabledChanged = row.enabled !== prev.enabled;
          const amountChanged = row.defaultAmount !== prev.defaultAmount;
          if (!enabledChanged && !amountChanged) return null;
          return row.label;
        })
        .filter(Boolean);
      const fieldList = changedFields.length > 0 ? ` (변경 항목: ${changedFields.join(', ')})` : '';
      lines.push(`PM·ST 게임별 응모권 지급 기본 정책을 변경합니다.${fieldList}`);
    }
    return lines.join('\n');
  }, [rateChanged, limitChanged, buyEnabledChanged, gameRewardChanged, policy.rate, rateNum, policy.dailyLimitPerMember, newDailyLimit, buyToggle.enabled, buyEnabledInput, buyReasonInput, gameRewardInput]);

  // [CEB-BO-RFT-301] §2-7·§4 정합 — 토글 ON+수량 0 안내 (2026-05-21 sync 정정 — 구 브라우저 confirm() → 인라인 확인 모달)
  const [zeroAmountWarnOpen, setZeroAmountWarnOpen] = useState(false);

  const handleSave = () => {
    if (!canSave) return;
    // 토글 ON + 수량 0 안내
    const zeroOnRows = gameRewardInput.filter((r) => r.enabled && r.defaultAmount === 0);
    if (zeroOnRows.length > 0 && gameRewardChanged) {
      setZeroAmountWarnOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const handleZeroWarnConfirm = () => {
    setZeroAmountWarnOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const now = new Date();
    const updatedAt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setPolicy({
      rate: rateNum,
      dailyLimitPerMember: newDailyLimit,
      lastUpdatedBy: 'nill',
      lastUpdatedAt: updatedAt,
    });
    if (buyChanged) {
      setBuyToggle({
        enabled: buyEnabledInput,
        maintenanceReason: buyEnabledInput ? '' : buyReasonInput,
        lastUpdatedBy: 'nill',
        lastUpdatedAt: updatedAt,
      });
    }
    if (gameRewardChanged) {
      setGameReward({
        rows: gameRewardInput,
        lastUpdatedBy: 'nill',
        lastUpdatedAt: updatedAt,
      });
    }
    setConfirmOpen(false);
    alert(`[Mock] 응모권 발급 정책이 변경되었습니다.\n\n${confirmMessage}`);
  };

  return (
    <div>
      {/* [CEB-BO-RFT-301] §1, Page Properties 정합 — Breadcrumb 및 부제 v3.3 (2026-05-21 sync 정정) */}
      <PageHeader
        title="응모권 발급 정책"
        breadcrumbItems={[{ label: '래플' }, { label: '응모권 발급 정책' }]}
      />

      <p className="text-sm text-gray-600 -mt-2 mb-5">
        GP → 응모권 환율, 회원당 1일 교환 한도, 앱내 응모권 구매 운영 토글, PM·ST 게임별 응모권 지급 기본 정책을 운영자가 직접 조정합니다.
      </p>

      {/* 1일 기준 안내 박스 */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-4 py-3 mb-5 flex items-start gap-2.5">
        <ClockIcon className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong className="font-semibold">1일 기준</strong>: KST 자정(00:00 ~ 23:59:59). 매일 자정에 회원별 한도가 자동 리셋됩니다.
        </div>
      </div>

      {/* 카드 1 — GP → 응모권 환율 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">GP → 응모권 환율</h3>
          <span className="text-xs text-gray-400">필수</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            min="1"
            step="1"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            className={`h-11 w-32 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              !isRateValid ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
            }`}
            placeholder="100"
          />
          <span className="text-sm text-gray-700">GP → 응모권 1장</span>
        </div>
        {!isRateValid && (
          <p className="text-xs text-rose-600 mb-2">최소 1 이상의 양의 정수만 입력 가능합니다.</p>
        )}
        <p className="text-xs text-gray-500">
          변경 즉시 회원 앱의 GP 교환 화면에 반영됩니다.
        </p>
      </div>

      {/* 카드 2 — 회원당 1일 교환 한도 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">회원당 1일 교환 한도</h3>
          <span className="text-xs text-gray-400">필수</span>
        </div>

        {/* 라디오 그룹: 한도 적용 / 무제한 */}
        <div className="flex items-center gap-5 mb-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="limitMode"
              value="limited"
              checked={limitMode === 'limited'}
              onChange={() => setLimitMode('limited')}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-900">한도 적용</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="limitMode"
              value="unlimited"
              checked={limitMode === 'unlimited'}
              onChange={() => setLimitMode('unlimited')}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-900">무제한</span>
          </label>
        </div>

        {/* 숫자 입력 (한도 적용 모드에서만 활성) */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            min="1"
            step="1"
            value={limitInput}
            disabled={limitMode === 'unlimited'}
            onChange={(e) => setLimitInput(e.target.value)}
            className={`h-11 w-32 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
              limitMode === 'limited' && !isLimitValid ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
            }`}
            placeholder="50"
          />
          <span className={`text-sm ${limitMode === 'unlimited' ? 'text-gray-400' : 'text-gray-700'}`}>장 / 1일</span>
        </div>
        {limitMode === 'limited' && !isLimitValid && (
          <p className="text-xs text-rose-600 mb-2">최소 1 이상의 양의 정수만 입력 가능합니다.</p>
        )}
        <p className="text-xs text-gray-500 leading-relaxed">
          회원 1명이 KST 자정 기준 1일에 교환받을 수 있는 응모권 최대 장수. 한도 초과 시 회원 앱에서 교환이 차단되고 &quot;오늘 한도 도달. 내일 00:00에 리셋&quot; 안내가 노출됩니다.
          <br />
          <strong className="font-semibold">무제한 선택 시</strong> 한도 검증을 우회하여 회원이 GP만 충분하면 제한 없이 교환 가능합니다.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          마지막 변경 (GP 환율·한도): <strong className="text-gray-600">{policy.lastUpdatedBy}</strong> · {policy.lastUpdatedAt}
        </p>
      </div>

      {/* 카드 3 — 앱내 응모권 구매 (Buy-RF-Ticket-001) [CEB-BO-RFT-301] §2-6 정합 (2026-05-21 sync 정정) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">앱내 응모권 구매 (Buy-RF-Ticket-001)</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          회원이 앱에서 GP를 사용해 응모권을 직접 구매할 수 있는 기능의 운영 상태입니다.
        </p>

        <div className="flex items-center gap-5 mb-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="buyEnabled"
              checked={buyEnabledInput === true}
              onChange={() => setBuyEnabledInput(true)}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-900">정상 운영 (ON)</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="buyEnabled"
              checked={buyEnabledInput === false}
              onChange={() => setBuyEnabledInput(false)}
              className="w-4 h-4 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-900">점검중 (OFF)</span>
          </label>
        </div>

        <div className="mb-2">
          <label className={`block text-xs mb-1 ${buyEnabledInput ? 'text-gray-400' : 'text-gray-700'}`}>
            점검 사유 (선택 입력, 운영 로그 보존용)
          </label>
          <input
            type="text"
            maxLength={200}
            disabled={buyEnabledInput}
            value={buyReasonInput}
            onChange={(e) => setBuyReasonInput(e.target.value)}
            placeholder="예: 결제 게이트웨이 점검으로 일시 중단"
            className="h-11 w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>

        {!buyEnabledInput && (
          <div className="bg-rose-50/60 border border-rose-100 rounded-lg px-3 py-2.5 mt-2 flex items-start gap-2">
            <ShieldExclamationIcon className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-900 leading-relaxed">
              OFF 전환 시 앱 Buy-RF-Ticket-001 화면의 [구매하기] 버튼이 즉시 <strong className="font-semibold">[점검중]</strong> 텍스트로 비활성됩니다 (탭 시 토스트 안내). 변경은 저장 즉시 회원 앱에 반영됩니다.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          마지막 변경: <strong className="text-gray-600">{buyToggle.lastUpdatedBy}</strong> · {buyToggle.lastUpdatedAt}
          {buyToggle.maintenanceReason && ` · 사유: ${buyToggle.maintenanceReason}`}
        </p>
      </div>

      {/* 카드 4 — PM·ST 게임별 응모권 지급 기본 정책 (Phase 13) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">PM·ST 게임별 응모권 지급 기본 정책</h3>
          <span className="text-xs text-gray-400">기본값</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          게임 종료 시 응모권 자동 지급 여부와 기본 수량을 게임유형별로 설정합니다. 개별 게임에서 다른 값을 사용하려면 게임 생성 폼에서 오버라이드합니다.
        </p>

        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">게임유형</th>
                <th className="text-center px-3 py-2 font-medium w-32">기본 지급</th>
                <th className="text-center px-3 py-2 font-medium w-32">기본 수량 (장)</th>
                <th className="text-left px-3 py-2 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {gameRewardInput.map((row, idx) => (
                <tr key={row.type} className="border-t border-gray-100">
                  <td className="px-3 py-3 text-gray-900 font-medium">{row.label}</td>
                  <td className="px-3 py-3 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => {
                          const next = [...gameRewardInput];
                          next[idx] = { ...row, enabled: e.target.checked };
                          setGameRewardInput(next);
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-9 h-5 bg-gray-200 peer-checked:bg-emerald-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
                    </label>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {/* [CEB-BO-RFT-301] §2-7 / RFT-302 §3 정합 — 수량 상한 없음, 0 이상 정수만 (2026-05-21 sync 정정) */}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!row.enabled}
                      value={row.defaultAmount}
                      onChange={(e) => {
                        const next = [...gameRewardInput];
                        next[idx] = { ...row, defaultAmount: Number(e.target.value) || 0 };
                        setGameRewardInput(next);
                      }}
                      className="h-9 w-20 px-2 border border-gray-200 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 mt-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            본 매트릭스는 <strong className="font-semibold text-gray-800">모든 PM·ST 게임의 기본값</strong>입니다. 개별 게임에서 다른 값을 사용하려면 게임 생성 폼에서 오버라이드하세요. 현재 PM·ST는 운영 0건 휴면 상태이므로 정책은 향후 운영 재개 시점에 적용됩니다.
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          마지막 변경: <strong className="text-gray-600">{gameReward.lastUpdatedBy}</strong> · {gameReward.lastUpdatedAt}
        </p>
      </div>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="h-11 px-6 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed"
        >
          저장하기
        </button>
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="응모권 발급 정책을 변경하시겠어요?"
          message={confirmMessage}
          confirmLabel="변경하기"
          size="md"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}

      {/* [CEB-BO-RFT-301] §4 정합 — 토글 ON+수량 0 안내 모달 (2026-05-21 sync 정정 — 구 confirm() 대체) */}
      {zeroAmountWarnOpen && (
        <ConfirmModal
          title="0매 지급은 OFF와 동일합니다"
          message="활성화된 게임 유형 중 지급 수량이 0매인 행이 있습니다. 진행하시겠습니까?"
          confirmLabel="진행"
          size="sm"
          onCancel={() => setZeroAmountWarnOpen(false)}
          onConfirm={handleZeroWarnConfirm}
        />
      )}
    </div>
  );
}
