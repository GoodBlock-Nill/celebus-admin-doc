'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { mockGames, mockParticipations } from '@/mock/games';
import { mockUser } from '@/mock/user';
import { formatGP, formatNumber, getRemainingTime } from '@/lib/utils';
import type { Game, UserParticipation } from '@/lib/types';
import ParticipateConfirm from '@/components/modals/ParticipateConfirm';
import ParticipateComplete from '@/components/modals/ParticipateComplete';
import NoBalanceModal from '@/components/modals/NoBalanceModal';
import VotingButtons from '@/components/game/VotingButtons';
import BoostingCard from '@/components/game/BoostingCard';
import ResultCard from '@/components/game/ResultCard';

// TODO: Replace with store
function getGameById(id: string): Game | undefined {
  return mockGames.find((g) => g.id === id);
}

function getParticipation(gameId: string): UserParticipation | undefined {
  return mockParticipations.find((p) => p.gameId === gameId);
}

type ModalType = 'none' | 'confirm' | 'complete' | 'noBalance';

function getAppBadge(status: Game['status']): { label: string; className: string } {
  if (status === 'Active') return { label: '진행중', className: 'bg-green-500 text-white' };
  if (status === 'Pending') return { label: '발표대기중', className: 'bg-gray-500 text-white' };
  if (status === 'Closed' || status === 'Ended') return { label: '결과발표', className: 'bg-green-500 text-white' };
  return { label: status, className: 'bg-gray-500 text-white' };
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState(getRemainingTime(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getRemainingTime(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const { days, hours, minutes, seconds } = remaining;
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr =
    days > 0
      ? `${days}일 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <span className="text-white font-mono font-bold text-sm">
      투표 종료까지 {timeStr}
    </span>
  );
}

function VoteBar({
  yesCount,
  noCount,
  userChoice,
}: {
  yesCount: number;
  noCount: number;
  userChoice?: 'YES' | 'NO';
}) {
  const total = yesCount + noCount;
  if (total === 0) return null;
  const yesPercent = Math.round((yesCount / total) * 100);
  const noPercent = 100 - yesPercent;

  return (
    <div>
      <div className="flex overflow-hidden rounded-full h-3">
        <div className="bg-blue-500 h-full transition-all" style={{ width: `${yesPercent}%` }} />
        <div className="bg-red-500 h-full transition-all" style={{ width: `${noPercent}%` }} />
      </div>
      <div className="flex justify-between text-sm mt-2">
        <div className="flex items-center gap-1">
          <span className={`font-bold ${userChoice === 'YES' ? 'text-blue-400' : 'text-gray-400'}`}>
            YES {yesPercent}%
          </span>
          {userChoice === 'YES' && (
            <span className="bg-blue-900 text-blue-300 text-xs px-1.5 py-0.5 rounded-full font-medium">
              내 선택
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {userChoice === 'NO' && (
            <span className="bg-red-900 text-red-300 text-xs px-1.5 py-0.5 rounded-full font-medium">
              내 선택
            </span>
          )}
          <span className={`font-bold ${userChoice === 'NO' ? 'text-red-400' : 'text-gray-400'}`}>
            NO {noPercent}%
          </span>
        </div>
      </div>
      <p className="text-gray-600 text-xs mt-1 text-center">
        {formatNumber(total)}명 참여
      </p>
    </div>
  );
}

export default function PredictionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // TODO: Replace with store - using local state for prototype
  const [game, setGame] = useState<Game | undefined>(getGameById(id));
  const [participation, setParticipation] = useState<UserParticipation | undefined>(
    getParticipation(id)
  );
  const [user, setUser] = useState({ ...mockUser });

  const [modal, setModal] = useState<ModalType>('none');
  const [pendingChoice, setPendingChoice] = useState<'YES' | 'NO' | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [showBoostSuccessToast, setShowBoostSuccessToast] = useState(false);

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-base mb-2">게임 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="text-blue-400 text-sm underline"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  const badge = getAppBadge(game.status);
  const isCapacityFull = game.maxParticipants > 0 && game.participantCount >= game.maxParticipants;
  const hasParticipated = !!participation;
  const hasBoosted = participation?.status === 'BOOSTED';
  const isResultPhase = game.status === 'Closed' || game.status === 'Ended';
  const isCorrect = isResultPhase && participation && game.result === participation.choice;
  const showVoteBar =
    hasParticipated || game.status === 'Pending' || isResultPhase;
  const showBoostingCard =
    game.status === 'Active' && hasParticipated && !hasBoosted;
  const showCharacterIllustration = game.status === 'Active' && !hasParticipated;
  const totalParticipants = game.yesCount + game.noCount;

  const handleVoteChoice = (choice: 'YES' | 'NO') => {
    if (user.gpBalance < game.participationCost) {
      setModal('noBalance');
      return;
    }
    setPendingChoice(choice);
    setModal('confirm');
  };

  const handleConfirmParticipate = () => {
    if (!pendingChoice) return;
    // Simulate participation
    const newParticipation: UserParticipation = {
      gameId: game.id,
      choice: pendingChoice,
      participationGP: game.participationCost,
      boostingGP: 0,
      status: 'PARTICIPATED',
      rewardGP: 0,
      refundGP: 0,
      participatedAt: new Date().toISOString(),
    };
    setParticipation(newParticipation);
    setUser((prev) => ({ ...prev, gpBalance: prev.gpBalance - game.participationCost }));
    setGame((prev) =>
      prev
        ? {
            ...prev,
            participantCount: prev.participantCount + 1,
            yesCount: pendingChoice === 'YES' ? prev.yesCount + 1 : prev.yesCount,
            noCount: pendingChoice === 'NO' ? prev.noCount + 1 : prev.noCount,
          }
        : prev
    );
    setModal('complete');
  };

  const handleBoost = () => {
    if (user.gpBalance < game.boostingCost) {
      setModal('noBalance');
      return;
    }
    setParticipation((prev) =>
      prev
        ? {
            ...prev,
            boostingGP: game.boostingCost,
            status: 'BOOSTED',
          }
        : prev
    );
    setUser((prev) => ({ ...prev, gpBalance: prev.gpBalance - game.boostingCost }));
    setModal('none');
    setShowBoostSuccessToast(true);
    setTimeout(() => setShowBoostSuccessToast(false), 3000);
  };

  const renderBottomBar = () => {
    if (isResultPhase) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-gray-950 border-t border-gray-800 px-4 pt-3 pb-5 safe-bottom">
        <div className="mb-2 text-center text-xs text-gray-400">
          {game.status === 'Active' && <CountdownTimer endDate={game.endDate} />}
          {game.status === 'Pending' && (
            <span>
              {new Date(game.resultDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })} 결과발표 예정
            </span>
          )}
        </div>

        {game.status === 'Active' && !hasParticipated && !isCapacityFull && (
          <VotingButtons onVote={handleVoteChoice} />
        )}

        {game.status === 'Active' && hasParticipated && !hasBoosted && (
          <button
            onClick={handleBoost}
            className="w-full h-12 rounded-xl font-bold text-sm text-white active:opacity-70"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
          >
            {formatGP(game.boostingCost)}로 부스팅
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-36">
      {/* Success toast */}
      {showBoostSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          부스팅이 완료되었어요!
        </div>
      )}

      {/* Header */}
      <header className="safe-top bg-gray-950 px-4 py-3 border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-white p-1 rounded-full active:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
            <button
              className="text-gray-400 p-1 active:bg-gray-800 rounded"
              title="공유"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Game Info Section */}
        <div>
          <h1 className="text-white font-bold text-xl leading-snug mb-3">{game.title.ko}</h1>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-amber-400 font-bold text-base">전체상금</span>
              <span className="text-white font-bold text-lg">{formatGP(game.totalPrizeGP)}</span>
            </div>
            {game.maxParticipants > 0 && (
              <span className="text-gray-400 text-sm">
                선착순 {formatNumber(game.maxParticipants)}명
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <span>참여 {formatNumber(game.participantCount)}명</span>
            {game.maxParticipants > 0 && (
              <span>/ {formatNumber(game.maxParticipants)}명</span>
            )}
          </div>
        </div>

        {/* Participation Banner */}
        {hasParticipated && (
          <div
            className={`rounded-2xl p-4 flex items-center gap-3 ${
              hasBoosted ? 'bg-purple-900/40 border border-purple-700/50' : 'bg-blue-900/40 border border-blue-700/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                participation.choice === 'YES' ? 'bg-blue-600' : 'bg-red-600'
              } text-white`}
            >
              {participation.choice === 'YES' ? 'Y' : 'N'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-semibold">
                  참여완료 · <span className={participation.choice === 'YES' ? 'text-blue-400' : 'text-red-400'}>
                    {participation.choice}
                  </span> 선택
                </span>
              </div>
              {hasBoosted && (
                <span className="text-purple-300 text-xs">부스팅 사용 · {formatGP(participation.boostingGP)}</span>
              )}
              {!hasBoosted && (
                <span className="text-gray-400 text-xs">참여 {formatGP(participation.participationGP)}</span>
              )}
            </div>
          </div>
        )}

        {/* Capacity full banner */}
        {game.status === 'Active' && !hasParticipated && isCapacityFull && (
          <div className="bg-red-900/30 border border-red-700/40 rounded-2xl p-4">
            <p className="text-red-400 font-semibold text-sm text-center">
              선착순 인원 마감으로 투표가 종료되었어요
            </p>
          </div>
        )}

        {/* Character illustration (not participated + Active) */}
        {showCharacterIllustration && (
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-6xl mb-3">⭐</div>
            <div className="flex items-center justify-center gap-4 text-2xl">
              <span className="text-blue-400 font-bold">YES</span>
              <span className="text-gray-600">|</span>
              <span className="text-red-400 font-bold">NO</span>
            </div>
            <p className="text-gray-500 text-xs mt-2">예측에 참여해 보세요!</p>
          </div>
        )}

        {/* Description */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-gray-300 text-sm leading-relaxed">{game.description.ko}</p>

          <p className="text-gray-500 text-xs mt-3 leading-relaxed">
            결과는{' '}
            {new Date(game.resultDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            , <span className="text-gray-400">{game.resultBasis.ko}</span> 기준으로 확정됩니다.
          </p>

          {game.hintLinkEnabled && game.hintLink && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-gray-400 text-xs mb-1">예측을 좀 더 잘하고 싶다면?</p>
              <a
                href={game.hintLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm font-semibold"
              >
                힌트 보기 &gt;
              </a>
            </div>
          )}
        </div>

        {/* Vote Bar Section */}
        {showVoteBar && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">
                {game.status === 'Active' ? '전체 유저 투표 현황' : '전체 유저 투표'}
              </h3>
              {(game.status === 'Pending' || isResultPhase) && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  투표마감
                </div>
              )}
              {game.status === 'Active' && hasParticipated && (
                <button className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} (+UTC9)
                </button>
              )}
            </div>
            <VoteBar
              yesCount={game.yesCount}
              noCount={game.noCount}
              userChoice={participation?.choice}
            />
            {isResultPhase && game.result && (
              <div className="mt-2 text-center">
                <span className="text-red-400 font-bold text-sm">
                  WIN! {game.result}
                </span>
              </div>
            )}
            {isResultPhase && (
              <button
                onClick={() => router.push(`/prediction/${game.id}/result`)}
                className="mt-3 text-blue-400 text-sm font-semibold block w-full text-center"
              >
                결과 자세히 보기 &gt;
              </button>
            )}
          </div>
        )}

        {/* Result Card (Closed/Ended) */}
        {isResultPhase && game.result && (
          <>
            {hasParticipated ? (
              <ResultCard
                result={game.result}
                isCorrect={!!isCorrect}
                rewardGP={participation?.rewardGP}
                hasBoosted={hasBoosted}
                gameId={game.id}
                onViewDetail={() => router.push(`/prediction/${game.id}/result`)}
              />
            ) : (
              <div className="bg-gray-900 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">참여하신 내역이 없네요</p>
                <p className="text-gray-500 text-xs leading-relaxed">
                  참여했다면, 정답 시 최대{' '}
                  <span className="text-amber-400 font-semibold">{formatGP(game.totalPrizeGP)}</span>를
                  받을 수 있었어요
                </p>
                <button
                  onClick={() => router.push('/prediction')}
                  className="mt-3 text-blue-400 text-sm font-semibold"
                >
                  다른 예측 게임 둘러보기 &gt;
                </button>
              </div>
            )}
          </>
        )}

        {/* Boosting Promo Card */}
        {showBoostingCard && (
          <BoostingCard
            cost={game.boostingCost}
            multiplier={game.boostingMultiplier}
            onBoost={handleBoost}
          />
        )}

        {/* Info Accordion */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-4"
            onClick={() => setInfoExpanded((v) => !v)}
          >
            <span className="text-gray-300 text-sm font-semibold">Prediction Market 이용 안내</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${infoExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {infoExpanded && (
            <div className="px-4 pb-4 space-y-3 text-xs text-gray-400 leading-relaxed border-t border-gray-800">
              <div className="pt-3">
                <p className="text-gray-300 font-semibold mb-1">참여 방식</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>GP를 사용해 YES/NO 중 하나를 선택합니다</li>
                  <li>참여 완료 후에는 선택 변경이 불가능합니다</li>
                  <li>참여에 사용된 GP는 예측 결과와 관계없이 반환됩니다</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-300 font-semibold mb-1">GP &amp; 부스팅</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>참여에 사용한 GP는 결과 발표 후 반환됩니다</li>
                  <li>부스팅은 상금풀에서 추가 배분 값을 높이기 위한 선택 옵션입니다</li>
                  <li>부스팅에 사용한 GP는 반환되지 않습니다</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-300 font-semibold mb-1">보상 기준</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>예측이 적중하면 사전 안내된 상금풀 내에서 개인 배분 값에 따라 추가 보상이 지급됩니다</li>
                  <li>보상 규모는 참여 GP 및 부스팅 배수에 따라 달라질 수 있습니다</li>
                  <li>예측에 실패한 경우 추가 보상은 지급되지 않습니다</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-300 font-semibold mb-1">유의사항</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>부정 참여가 확인될 경우 보상이 제한될 수 있습니다</li>
                  <li>서비스 정책에 따라 보상 방식 및 기준은 변경될 수 있습니다</li>
                  <li>참여 후 탈퇴할 경우, 해당 참여에 사용된 GP는 소멸됩니다</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA Bar */}
      {renderBottomBar()}

      {/* Modals */}
      {modal === 'confirm' && pendingChoice && (
        <ParticipateConfirm
          choice={pendingChoice}
          participationCost={game.participationCost}
          gpBalance={user.gpBalance}
          gameTitle={game.title.ko}
          onConfirm={handleConfirmParticipate}
          onCancel={() => setModal('none')}
        />
      )}

      {modal === 'complete' && participation && (
        <ParticipateComplete
          choice={participation.choice}
          participationGP={game.participationCost}
          boostingCost={game.boostingCost}
          boostingMultiplier={game.boostingMultiplier}
          gpBalance={user.gpBalance}
          onBoost={handleBoost}
          onLater={() => setModal('none')}
        />
      )}

      {modal === 'noBalance' && (
        <NoBalanceModal
          requiredGP={pendingChoice ? game.participationCost : game.boostingCost}
          currentGP={user.gpBalance}
          gameId={game.id}
          onClose={() => setModal('none')}
        />
      )}
    </div>
  );
}
