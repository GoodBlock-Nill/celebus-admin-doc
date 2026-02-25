'use client';

import { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { formatDateTime, formatGP } from '@/lib/utils';
import { DetailSection } from './BasicInfoTab';
import type { Game, Participant } from '@/lib/types';

const REWARD_PER_PAGE = 20;

interface ResultsTabProps {
  game: Game;
  participants: Participant[];
}

export default function ResultsTab({ game, participants }: ResultsTabProps) {
  const [rewardPage, setRewardPage] = useState(1);
  const isST = game.type === 'SURVIVAL_TRIVIA';

  if (isST) {
    return <STResultsContent game={game} participants={participants} rewardPage={rewardPage} setRewardPage={setRewardPage} />;
  }

  return <PMResultsContent game={game} participants={participants} rewardPage={rewardPage} setRewardPage={setRewardPage} />;
}

interface ContentProps {
  game: Game;
  participants: Participant[];
  rewardPage: number;
  setRewardPage: (p: number) => void;
}

function STResultsContent({ game, participants, rewardPage, setRewardPage }: ContentProps) {
  const survivors = participants.filter(p => p.survivedStage === 10);
  const survivorCount = game.survivorCount || survivors.length;
  const perPerson = survivorCount > 0 ? Math.floor(game.totalPrizeGP / survivorCount) : 0;
  const totalPages = Math.ceil(survivors.length / REWARD_PER_PAGE);
  const paginated = survivors.slice((rewardPage - 1) * REWARD_PER_PAGE, rewardPage * REWARD_PER_PAGE);

  return (
    <div className="space-y-8">
      <DetailSection title="보상 현황" fields={[
        { label: '총 상금 GP', value: formatGP(game.totalPrizeGP) },
        { label: '생존자 수', value: `${survivorCount}명` },
        { label: '1인당 보상 GP', value: formatGP(perPerson) },
        { label: '보상 방식', value: '균등 분배 (총상금 ÷ 생존자수)' },
        { label: '보상 지급 상태', value: (
          <Badge variant="custom" value={game.rewardDistributed ? 'done' : 'pending'}
            customBg={game.rewardDistributed ? 'bg-green-100' : 'bg-gray-100'}
            customText={game.rewardDistributed ? 'text-green-700' : 'text-gray-600'}
            customLabel={game.rewardDistributed ? '자동 지급 완료' : '미지급'}
          />
        )},
        { label: '보상 지급일', value: game.rewardDistributedAt ? formatDateTime(game.rewardDistributedAt) : '-' },
      ]} />

      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-700">Survival Trivia는 게임 종료 시 서버가 자동으로 보상을 지급합니다. 별도의 결과 입력이나 보상 지급 액션이 필요하지 않습니다.</p>
      </div>

      {survivors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">생존자 목록</h3>
          <DataTable<Participant & Record<string, unknown>>
            columns={[
              { key: 'nickname', label: '닉네임', render: (p: Participant) => p.nickname.toLowerCase() },
              { key: 'participationGP', label: '참여 GP', align: 'right' as const, render: (p: Participant) => formatGP(p.participationGP) },
              { key: 'heartsUsed', label: '하트 사용', align: 'center' as const, render: (p: Participant) => `${p.heartsUsed ?? 0}개` },
              { key: 'rewardGP', label: '보상 GP', align: 'right' as const, render: () => <span className="font-semibold">{formatGP(perPerson)}</span> },
            ]}
            data={paginated as (Participant & Record<string, unknown>)[]}
            rowNumber={{ page: rewardPage, perPage: REWARD_PER_PAGE }}
          />
          <Pagination currentPage={rewardPage} totalPages={totalPages} onPageChange={setRewardPage} />
        </div>
      )}
    </div>
  );
}

function PMResultsContent({ game, participants, rewardPage, setRewardPage }: ContentProps) {
  const winners = participants.filter(p => p.choice === game.result);
  const totalShares = winners.reduce((sum, p) => sum + p.participationGP + (p.boostingGP * (game.boostingMultiplier || 2)), 0);
  const totalPages = Math.ceil(winners.length / REWARD_PER_PAGE);
  const paginated = winners.slice((rewardPage - 1) * REWARD_PER_PAGE, rewardPage * REWARD_PER_PAGE);

  return (
    <div className="space-y-8">
      <DetailSection title="결과 정보" fields={[
        { label: '결과제목 (KO)', value: game.resultTitle?.ko || '-', full: true },
        { label: '결과제목 (EN)', value: game.resultTitle?.en || '-', full: true },
        { label: '결과제목 (JP)', value: game.resultTitle?.jp || '-', full: true },
        { label: '결과', value: game.result ? (
          <Badge variant="custom" value={game.result} customBg={game.result === 'YES' ? 'bg-green-100' : 'bg-red-100'} customText={game.result === 'YES' ? 'text-green-700' : 'text-red-700'} customLabel={game.result} />
        ) : '-' },
        { label: '결과설명 (KO)', value: game.resultDescription?.ko || '-', full: true },
        { label: '결과설명 (EN)', value: game.resultDescription?.en || '-', full: true },
        { label: '결과설명 (JP)', value: game.resultDescription?.jp || '-', full: true },
        { label: '결과링크 (KO)', value: game.resultLinkUrl?.ko ? (
          <a href={game.resultLinkUrl.ko} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.resultLinkText?.ko || game.resultLinkUrl.ko}</a>
        ) : '-' },
        { label: '결과링크 (EN)', value: game.resultLinkUrl?.en ? (
          <a href={game.resultLinkUrl.en} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.resultLinkText?.en || game.resultLinkUrl.en}</a>
        ) : '-' },
        { label: '결과링크 (JP)', value: game.resultLinkUrl?.jp ? (
          <a href={game.resultLinkUrl.jp} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.resultLinkText?.jp || game.resultLinkUrl.jp}</a>
        ) : '-' },
      ]} />

      <DetailSection title="보상 현황" fields={[
        { label: '총 상금 GP', value: formatGP(game.totalPrizeGP) },
        { label: '정답자 수', value: `${winners.length}명` },
        { label: '미지급 보상 GP', value: !game.rewardDistributed ? formatGP(game.totalPrizeGP) : '0 GP' },
        { label: '미지급보상자(탈퇴회원)', value: '0명' },
        { label: '지분당 보상 GP', value: totalShares > 0 ? formatGP(Math.floor(game.totalPrizeGP / totalShares)) : '-' },
        { label: '보상 지급 상태', value: (
          <Badge variant="custom" value={game.rewardDistributed ? 'done' : 'pending'} customBg={game.rewardDistributed ? 'bg-green-100' : 'bg-gray-100'} customText={game.rewardDistributed ? 'text-green-700' : 'text-gray-600'} customLabel={game.rewardDistributed ? '지급 완료' : '미지급'} />
        )},
        { label: '보상 지급일', value: game.rewardDistributedAt ? formatDateTime(game.rewardDistributedAt) : '-' },
      ]} />

      {game.result && winners.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">보상 상세 (정답자 목록)</h3>
          <DataTable<Participant & Record<string, unknown>>
            columns={[
              { key: 'nickname', label: '닉네임', render: (p: Participant) => p.nickname.toLowerCase() },
              { key: 'participationGP', label: '참여 GP', align: 'right' as const, render: (p: Participant) => formatGP(p.participationGP) },
              { key: 'boostingGP', label: '부스팅 GP', align: 'right' as const, render: (p: Participant) => formatGP(p.boostingGP) },
              { key: 'share', label: '지분', align: 'right' as const, render: (p: Participant) => `${p.participationGP + (p.boostingGP * (game.boostingMultiplier || 2))} GP` },
              { key: 'rewardGP', label: '보상 GP', align: 'right' as const, render: (p: Participant) => {
                const share = p.participationGP + (p.boostingGP * (game.boostingMultiplier || 2));
                const reward = totalShares > 0 ? Math.floor((share / totalShares) * game.totalPrizeGP) : 0;
                return <span className="font-semibold">{formatGP(reward)}</span>;
              }},
              { key: 'refundGP', label: '환급 GP', align: 'right' as const, render: (p: Participant) => formatGP(p.participationGP) },
            ]}
            data={paginated as (Participant & Record<string, unknown>)[]}
            rowNumber={{ page: rewardPage, perPage: REWARD_PER_PAGE }}
          />
          <Pagination currentPage={rewardPage} totalPages={totalPages} onPageChange={setRewardPage} />
        </div>
      )}
    </div>
  );
}
