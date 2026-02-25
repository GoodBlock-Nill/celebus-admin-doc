'use client';

import { formatDate, formatDateTime, formatGP, formatNumber, calcSTEndTime } from '@/lib/utils';
import { GAME_TYPE_LABELS, ST_REVEAL_DURATION_SEC } from '@/lib/constants';
import QuizEditor from '@/components/forms/QuizEditor';
import type { Game } from '@/lib/types';

interface BasicInfoTabProps {
  game: Game;
}

export default function BasicInfoTab({ game }: BasicInfoTabProps) {
  const isST = game.type === 'SURVIVAL_TRIVIA';

  return (
    <div className="space-y-8">
      <DetailSection title="기본정보" fields={[
        { label: '게임유형', value: GAME_TYPE_LABELS[game.type] },
        { label: '타이틀 (KO)', value: game.title.ko },
        { label: '타이틀 (EN)', value: game.title.en || '-' },
        { label: '타이틀 (JP)', value: game.title.jp || '-' },
        { label: '상세설명 (KO)', value: game.description.ko || '-', full: true, html: true },
        { label: '상세설명 (EN)', value: game.description.en || '-', full: true, html: true },
        { label: '상세설명 (JP)', value: game.description.jp || '-', full: true, html: true },
        ...(!isST ? [{ label: '힌트 링크', value: game.hintLinkEnabled && game.hintLink ? (
          <a href={game.hintLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{game.hintLink}</a>
        ) : '-' }] : []),
        { label: '생성일', value: formatDateTime(game.createdAt) },
        { label: '생성자', value: game.createdBy },
      ]} />

      <DetailSection title="보상설정" fields={[
        { label: '총 상금 GP', value: formatGP(game.totalPrizeGP) },
      ]} />

      {isST ? (
        <>
          <DetailSection title="참여설정" fields={[
            { label: '참여 정원', value: `${formatNumber(game.maxParticipants)}명 (최대 500명)` },
            { label: '참여 비용', value: formatGP(game.participationCost) },
          ]} />
          <DetailSection title="일정설정" fields={[
            { label: '게임 시작일시', value: formatDateTime(game.startDateTime || '') },
            { label: '게임 종료 예정시각', value: game.startDateTime
              ? formatDateTime(calcSTEndTime(game.startDateTime, game.quizzes?.length ?? 10, game.timePerQuestion ?? 10, ST_REVEAL_DURATION_SEC))
              : '-' },
            { label: '게시일시', value: game.publishedAt ? formatDateTime(game.publishedAt) : '(게시 시 설정)' },
          ]} />
          {game.quizzes && game.quizzes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <QuizEditor quizzes={game.quizzes} onChange={() => {}} disabled />
            </div>
          )}
        </>
      ) : (
        <>
          <DetailSection title="참여설정" fields={[
            { label: '참여 정원', value: game.maxParticipants === 0 ? '무제한' : `${formatNumber(game.maxParticipants)}명` },
            { label: '참여 비용', value: formatGP(game.participationCost) },
            { label: '부스팅 비용', value: formatGP(game.boostingCost) },
            { label: '부스팅 배수', value: `${game.boostingMultiplier}배` },
          ]} />
          <DetailSection title="일정설정" fields={[
            { label: '투표 시작일시', value: game.publishedAt ? formatDateTime(game.publishedAt) : '(게시 시 설정)' },
            { label: '투표 종료일시', value: formatDateTime(game.endDate) },
            { label: '결과 발표 예정일', value: formatDate(game.resultDate) },
          ]} />
          <DetailSection title="결과설정" fields={[
            { label: '결과 확인 기준 (KO)', value: game.resultBasis.ko || '-', full: true },
            { label: '결과 확인 기준 (EN)', value: game.resultBasis.en || '-', full: true },
            { label: '결과 확인 기준 (JP)', value: game.resultBasis.jp || '-', full: true },
          ]} />
        </>
      )}
    </div>
  );
}

export function DetailSection({ title, fields }: { title: string; fields: { label: string; value: React.ReactNode; full?: boolean; html?: boolean }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="divide-y divide-gray-100">
        {fields.map((field, i) => (
          <div key={i} className="flex items-start py-3 first:pt-0 last:pb-0">
            <span className="text-sm text-gray-500 w-[160px] shrink-0">{field.label}</span>
            {field.html && typeof field.value === 'string' ? (
              <div className="text-sm text-gray-900 prose prose-sm max-w-none flex-1" dangerouslySetInnerHTML={{ __html: field.value }} />
            ) : (
              <span className="text-sm text-gray-900 flex-1">{field.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
