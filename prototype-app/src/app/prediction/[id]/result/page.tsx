'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { mockGames, mockParticipations } from '@/mock/games';
import { formatGP, formatNumber } from '@/lib/utils';
import type { Game, UserParticipation } from '@/lib/types';

// TODO: Replace with store
function getGameById(id: string): Game | undefined {
  return mockGames.find((g) => g.id === id);
}

function getParticipation(gameId: string): UserParticipation | undefined {
  return mockParticipations.find((p) => p.gameId === gameId);
}

export default function PredictionResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const game = getGameById(id);
  const participation = getParticipation(id);

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-base mb-2">게임 정보를 불러올 수 없습니다.</p>
          <button onClick={() => router.back()} className="text-blue-400 text-sm underline">
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  if (!game.result) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-base mb-2">아직 결과가 발표되지 않았습니다.</p>
          <button onClick={() => router.back()} className="text-blue-400 text-sm underline">
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  const result = game.result;
  const isCorrect = participation && participation.choice === result;
  const totalVotes = game.yesCount + game.noCount;
  const yesPercent = totalVotes > 0 ? Math.round((game.yesCount / totalVotes) * 100) : 0;
  const noPercent = 100 - yesPercent;
  const correctCount = result === 'YES' ? game.yesCount : game.noCount;
  const incorrectCount = result === 'YES' ? game.noCount : game.yesCount;

  return (
    <div className="min-h-screen bg-gray-950 pb-8">
      {/* Header */}
      <header className="safe-top bg-gray-950 px-4 py-3 border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-white p-1 rounded-full active:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white font-bold text-base">결과 자세히 보기</h1>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-4">
        {/* Result Badge + Title */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-400 text-sm font-medium">결과:</span>
            <span
              className={`font-bold text-base px-3 py-1 rounded-full ${
                result === 'YES'
                  ? 'bg-blue-900 text-blue-300 border border-blue-600'
                  : 'bg-red-900 text-red-300 border border-red-600'
              }`}
            >
              {result}
            </span>
          </div>
          <h2 className="text-white font-bold text-xl leading-snug line-clamp-3">
            {game.resultTitle.ko}
          </h2>
        </div>

        {/* Character illustration */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <span className="text-2xl">
                {result === 'YES' ? '✅' : '❌'}
              </span>
              <p className="text-blue-400 font-bold text-lg mt-1">YES</p>
            </div>
            <div className="text-5xl">⭐</div>
            <div className="text-center">
              <span className="text-2xl">
                {result === 'NO' ? '✅' : '❌'}
              </span>
              <p className="text-red-400 font-bold text-lg mt-1">NO</p>
            </div>
          </div>
        </div>

        {/* Result Description */}
        {game.resultDescription.ko && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-gray-300 text-sm leading-relaxed">{game.resultDescription.ko}</p>
          </div>
        )}

        {/* Result Date & Source */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          {game.rewardDistributedAt && (
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="text-gray-400 text-sm">
                {new Date(game.rewardDistributedAt).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                (KST, UTC+9)
              </span>
            </div>
          )}

          {game.resultLinkText.ko && (
            <a
              href={game.resultLinkUrl.ko || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <span className="text-lg">🏛</span>
              <span className="text-blue-400 text-sm font-semibold flex-1">{game.resultLinkText.ko}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* My Reward Info (participated) */}
        {participation && (
          <div
            className={`rounded-2xl p-5 border ${
              isCorrect
                ? 'bg-green-900/30 border-green-700/50'
                : 'bg-gray-900 border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">내 결과</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">내 선택</span>
                <span
                  className={`font-bold ${
                    participation.choice === 'YES' ? 'text-blue-400' : 'text-red-400'
                  }`}
                >
                  {participation.choice}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">예측 결과</span>
                <span className={isCorrect ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {isCorrect ? '정답 ✓' : '오답 ✗'}
                </span>
              </div>
              {isCorrect && participation.rewardGP > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">내 보상 GP</span>
                  <span className="text-amber-400 font-bold">{formatGP(participation.rewardGP)}</span>
                </div>
              )}
              {participation.refundGP > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">참여 GP 환급</span>
                  <span className="text-green-400 font-semibold">+{formatGP(participation.refundGP)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">참여 통계</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">총 참여자</span>
              <span className="text-white font-semibold">{formatNumber(totalVotes)}명</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">총 상금</span>
              <span className="text-amber-400 font-bold">{formatGP(game.totalPrizeGP)}</span>
            </div>
            <div className="h-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex overflow-hidden rounded-full h-2.5">
                  <div className="bg-blue-500 h-full" style={{ width: `${yesPercent}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${noPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-gray-400">YES</span>
                <span className="text-white font-semibold">
                  {formatNumber(game.yesCount)}명 ({yesPercent}%)
                </span>
                {result === 'YES' && (
                  <span className="text-red-400 font-bold text-xs ml-1">WIN!</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {result === 'NO' && (
                  <span className="text-red-400 font-bold text-xs mr-1">WIN!</span>
                )}
                <span className="text-white font-semibold">
                  {formatNumber(game.noCount)}명 ({noPercent}%)
                </span>
                <span className="text-gray-400">NO</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              </div>
            </div>
          </div>
        </div>

        {/* Official confirmation banner */}
        <div className="bg-green-900/30 border border-green-700/40 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p className="text-green-300 text-sm font-medium">공식 소스를 통해 결과가 확인되었습니다</p>
        </div>

        {/* Back to list */}
        <button
          onClick={() => router.push('/prediction')}
          className="w-full h-12 bg-gray-800 rounded-xl text-gray-300 font-semibold text-sm active:bg-gray-700"
        >
          다른 예측 게임 둘러보기
        </button>
      </div>
    </div>
  );
}
