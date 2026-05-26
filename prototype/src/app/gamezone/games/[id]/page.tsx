'use client';

import { Suspense, use, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import {
  getGameById,
  getPMEntries,
  getPMResultReward,
  type GameStatus,
  type PMGame,
  type STGame,
} from '@/mock/gamezone';
import {
  ConfirmDeleteModal,
  ConfirmPublishModal,
  ConfirmCloseModal,
  ResultInputModal,
  ConfirmRewardModal,
} from '@/components/gamezone/GameModals';

// [CEB-BO-GZ-202] 게임 상세 — 운영 BO 정합 v2.7 (RFT/RFL 양식)
// 라우트: /gamezone/games/{id}?tab={basic|entry-history|result-reward}

const STATUS_BADGE: Record<GameStatus, string> = {
  '임시저장': 'bg-gray-100 text-gray-700',
  '게시대기': 'bg-blue-100 text-blue-700',
  '진행중': 'bg-emerald-100 text-emerald-700',
  '결과대기': 'bg-amber-100 text-amber-700',
  '결과확정': 'bg-violet-100 text-violet-700',
  '종료': 'bg-zinc-200 text-zinc-700',
};

type Tab = 'basic' | 'entry-history' | 'result-reward';

const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: '기본정보' },
  { key: 'entry-history', label: '참여내역' },
  { key: 'result-reward', label: '결과/보상' },
];

function GameDetailContent({ id }: { id: string }) {
  const gameId = parseInt(id, 10);
  const game = getGameById(gameId);
  const router = useRouter();
  const search = useSearchParams();
  const tabParam = (search.get('tab') as Tab) || 'basic';
  const [tab, setTab] = useState<Tab>(tabParam);

  if (!game) {
    return <div className="p-8 text-sm text-gray-500">게임을 찾을 수 없습니다.</div>;
  }

  // 상태별 액션 버튼 (PM 기준 — ST는 결과대기·결과확정 없음)
  const actions: { label: string; variant: 'primary' | 'secondary' | 'danger' }[] = (() => {
    if (game.type === 'PM') {
      switch (game.status) {
        case '임시저장': return [{ label: '삭제하기', variant: 'danger' }, { label: '수정하기', variant: 'secondary' }];
        case '게시대기': return [{ label: '삭제하기', variant: 'danger' }, { label: '수정하기', variant: 'secondary' }, { label: '게시하기', variant: 'primary' }];
        case '진행중': return [{ label: '수정하기', variant: 'secondary' }, { label: '강제 종료', variant: 'danger' }];
        case '결과대기': return [{ label: '수정하기', variant: 'secondary' }, { label: '결과 입력', variant: 'primary' }, { label: '강제 종료', variant: 'danger' }];
        case '결과확정': return [{ label: '결과 수정', variant: 'secondary' }, { label: '보상 지급', variant: 'primary' }];
        case '종료': return [];
      }
    }
    // ST
    switch (game.status) {
      case '임시저장': return [{ label: '삭제하기', variant: 'danger' }, { label: '수정하기', variant: 'secondary' }];
      case '게시대기': return [{ label: '삭제하기', variant: 'danger' }, { label: '수정하기', variant: 'secondary' }, { label: '게시하기', variant: 'primary' }];
      case '진행중': return [{ label: '수정하기', variant: 'secondary' }, { label: '강제 종료', variant: 'danger' }];
      default: return [];
    }
  })();

  const onTabChange = (next: Tab) => {
    setTab(next);
    router.replace(`/gamezone/games/${gameId}?tab=${next}`);
  };

  // 모달 상태
  const [modalDelete, setModalDelete] = useState(false);
  const [modalPublish, setModalPublish] = useState(false);
  const [modalClose, setModalClose] = useState(false);
  const [modalResult, setModalResult] = useState(false);
  const [modalReward, setModalReward] = useState(false);

  const handleAction = (label: string) => {
    if (label === '삭제하기') return setModalDelete(true);
    if (label === '게시하기') return setModalPublish(true);
    if (label === '강제 종료') return setModalClose(true);
    if (label === '결과 입력' || label === '결과 수정') return setModalResult(true);
    if (label === '보상 지급') return setModalReward(true);
    if (label === '수정하기') {
      router.push(`/gamezone/games/create?mode=edit&${game.type === 'PM' ? 'predictionMarketId' : 'survivalTriviaId'}=${gameId}`);
      return;
    }
  };

  const pmGame = game.type === 'PM' ? (game as PMGame) : null;
  const refundGP = pmGame ? pmGame.participants * pmGame.participationCost : 0;
  const resultData = pmGame ? getPMResultReward(pmGame.id) : null;

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title=""
          breadcrumbItems={[
            { label: '게임존', href: '/gamezone/home' },
            { label: '게임 관리', href: '/gamezone/games' },
            { label: '게임 상세' },
          ]}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-bold text-gray-900">{game.title}</h1>
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[game.status]}`}>
              {game.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => handleAction(a.label)}
                className={
                  a.variant === 'primary'
                    ? 'h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700'
                    : a.variant === 'danger'
                    ? 'h-10 px-5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50'
                    : 'h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50'
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && <BasicTab game={game} />}
      {tab === 'entry-history' && <EntryHistoryTab game={game} />}
      {tab === 'result-reward' && <ResultRewardTab game={game} />}

      {/* 모달 7종 — [202-MD-*] */}
      <ConfirmDeleteModal
        isOpen={modalDelete}
        onClose={() => setModalDelete(false)}
        onConfirm={() => { alert(`[Mock] ${game.title} 삭제 완료`); setModalDelete(false); router.push('/gamezone/games'); }}
        gameTitle={game.title}
        status={game.status}
      />
      <ConfirmPublishModal
        isOpen={modalPublish}
        onClose={() => setModalPublish(false)}
        onConfirm={() => { alert(`[Mock] ${game.title} 게시 완료 (Active 전이)`); setModalPublish(false); }}
        gameTitle={game.title}
      />
      <ConfirmCloseModal
        isOpen={modalClose}
        onClose={() => setModalClose(false)}
        onConfirm={() => { alert(`[Mock] ${game.title} 강제 종료 완료`); setModalClose(false); }}
        gameTitle={game.title}
        status={game.status}
        participants={game.participants}
        refundGP={refundGP}
      />
      {pmGame && (
        <ResultInputModal
          isOpen={modalResult}
          onClose={() => setModalResult(false)}
          onConfirm={() => { alert(`[Mock] ${pmGame.title} 결과 확정 (Closed 전이)`); setModalResult(false); }}
          gameTitle={pmGame.title}
          participants={pmGame.participants}
          totalPrize={pmGame.totalPrize}
        />
      )}
      {pmGame && resultData && (
        <ConfirmRewardModal
          isOpen={modalReward}
          onClose={() => setModalReward(false)}
          onConfirm={() => { alert(`[Mock] ${pmGame.title} 보상 지급 완료 (Ended 전이)`); setModalReward(false); }}
          gameTitle={pmGame.title}
          totalPrize={pmGame.totalPrize}
          correctCount={resultData.correctCount}
        />
      )}
    </div>
  );
}

// ─────────────── 기본정보 탭 ───────────────
function BasicTab({ game }: { game: PMGame | STGame }) {
  return (
    <div className="space-y-6">
      <Section title="기본정보">
        <Field label="게임유형" value={game.type === 'PM' ? 'Prediction Market' : 'Survival Trivia'} />
        <Field
          label="아티스트"
          value={
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              {game.artistGroup}
            </span>
          }
        />
        <Field label="타이틀 (KO)" value={game.title} />
        <Field label="타이틀 (EN)" value={game.titleEN} />
        <Field label="타이틀 (JP)" value={game.titleJP} />
        <Field label="상세설명 (KO)" value={game.description} multiline />
        <Field label="상세설명 (EN)" value="-" />
        <Field label="상세설명 (JP)" value="-" />
        {game.type === 'PM' && <Field label="힌트 링크" value="-" />}
        <Field label="배너 이미지" value={<a className="text-indigo-600 hover:underline" href="#">이미지 보기</a>} />
        {game.type === 'PM' && <Field label="상세 이미지" value={<a className="text-indigo-600 hover:underline" href="#">이미지 보기</a>} />}
        <Field label="생성일" value={game.createdAt} />
        <Field label="생성자" value={game.admin} />
      </Section>

      {game.type === 'PM' ? (
        <>
          <Section title="보상설정">
            <Field label="총 상금 GP" value={`${game.totalPrize.toLocaleString()} GP`} />
            <Field
              label="응모권 보상 (정답자 1인당)"
              value={game.ticketReward > 0 ? `${game.ticketReward}장` : '미지급'}
            />
            <Field
              label="덕력 보상 (참여자 1인당)"
              value={game.dukReward > 0 ? `${game.dukReward}점` : '미지급'}
            />
          </Section>
          <Section title="참여설정">
            <Field label="참여 정원" value="무제한" />
            <Field label="참여 비용" value={`${game.participationCost.toLocaleString()} GP`} />
            <Field label="부스팅" value="사용" />
            <Field label="부스팅 비용" value={`${game.boostingCost.toLocaleString()} GP`} />
            <Field label="부스팅 배수" value={`${game.boostingMultiplier}배`} />
          </Section>
          <Section title="일정설정">
            <Field label="투표 시작일시" value={game.votingStart ? `${game.votingStart} (게시 시각)` : '(게시 시 설정)'} />
            <Field label="투표 종료일시" value={game.votingEnd} />
            <Field label="결과 발표 예정일" value={game.resultAnnounceDate} />
          </Section>
          <Section title="결과설정">
            <Field label="결과 확인 기준 (KO)" value="공식 발표에 따라 확정" />
            <Field label="결과 확인 기준 (EN)" value="-" />
            <Field label="결과 확인 기준 (JP)" value="-" />
          </Section>
        </>
      ) : (
        <>
          <Section title="ST 보상설정">
            <Field label="보상 유형" value="단계별 보상" />
            <Field label="최대 상금풀" value={`${game.maxPrize.toLocaleString()} GP`} />
            <Field label="배수" value="1.25배" />
            <Field label="참여비 (자동 계산)" value={`${game.participationCost.toLocaleString()} GP`} />
            <Field
              label="응모권 보상 (생존자 1인당)"
              value={game.ticketReward > 0 ? `${game.ticketReward}장` : '미지급'}
            />
            <Field
              label="응모권 보상 (탈락자 1인당)"
              value={game.eliminatedTicketReward > 0 ? `${game.eliminatedTicketReward}장` : '미지급'}
            />
            <Field
              label="덕력 보상 (참여자 1인당)"
              value={game.dukReward > 0 ? `${game.dukReward}점` : '미지급'}
            />
          </Section>
          <Section title="ST 참여설정">
            <Field label="최대 모집인원" value={`${game.maxParticipants.toLocaleString()}명`} />
          </Section>
          <Section title="ST 일정설정">
            <Field label="게임 시작일시" value={game.startDateTime} />
          </Section>
          <Section title="퀴즈설정">
            <Field label="문제 수" value="10문제" />
            <Field label="문제당 제한시간" value="10초" />
          </Section>
        </>
      )}
    </div>
  );
}

// ─────────────── 참여내역 탭 ───────────────
function EntryHistoryTab({ game }: { game: PMGame | STGame }) {
  if (game.type !== 'PM') {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
        ST 참여내역은 #B-PT-2 추가 작업 또는 별도 사이클에서 구현 예정 (생존 스테이지·하트·관전 컬럼)
      </div>
    );
  }
  const entries = getPMEntries(game.id);
  return (
    <SimpleTable
      columns={[
        { key: 'no', label: 'No.', width: '60px' },
        { key: 'nickname', label: '유저명', width: '160px' },
        { key: 'enteredAt', label: '참여일시', width: '180px' },
        { key: 'selection', label: '선택값', width: '90px' },
        { key: 'usedGP', label: '사용 GP', width: '100px' },
        { key: 'boostingGP', label: '부스팅 GP', width: '100px' },
        { key: 'status', label: '참여 상태', width: '100px' },
      ]}
      rows={entries.map((e) => ({
        no: e.no,
        nickname: <button className="text-indigo-600 hover:underline">{e.nickname}</button>,
        enteredAt: e.enteredAt,
        selection: <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${e.selection === 'YES' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{e.selection}</span>,
        usedGP: `${e.usedGP} GP`,
        boostingGP: `${e.boostingGP} GP`,
        status: e.status,
      }))}
      emptyMessage="아직 참여자가 없습니다."
    />
  );
}

// ─────────────── 결과/보상 탭 ───────────────
function ResultRewardTab({ game }: { game: PMGame | STGame }) {
  if (game.type !== 'PM') {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
        ST 결과/보상은 서버 자동 판정·지급 (별도 사이클에서 구현 예정)
      </div>
    );
  }
  const r = getPMResultReward(game.id);
  return (
    <div className="space-y-6">
      <Section title="결과 정보">
        <Field label="결과제목 (KO)" value={r.resultTitle?.KO ?? '-'} />
        <Field label="결과제목 (EN)" value={r.resultTitle?.EN ?? '-'} />
        <Field label="결과제목 (JP)" value={r.resultTitle?.JP ?? '-'} />
        <Field label="결과" value={r.result ?? '-'} />
        <Field label="결과설명 (KO)" value={r.resultDescription?.KO ?? '-'} multiline />
        <Field label="결과설명 (EN)" value={r.resultDescription?.EN ?? '-'} multiline />
        <Field label="결과설명 (JP)" value={r.resultDescription?.JP ?? '-'} multiline />
        <Field label="결과링크 (KO)" value={r.resultLink ? <a className="text-indigo-600 hover:underline" href={r.resultLink.url}>{r.resultLink.text}</a> : '-'} />
        <Field label="결과링크 (EN)" value="-" />
        <Field label="결과링크 (JP)" value="-" />
      </Section>
      <Section title="보상 현황">
        <Field label="총 상금 GP" value={`${r.totalPrize.toLocaleString()} GP`} />
        <Field label="정답자 수" value={`${r.correctCount}명`} />
        <Field
          label="응모권 분배 결과 (정답자)"
          value={r.perShareTicket > 0 ? `${r.perShareTicket}장 × ${r.correctCount}명 = ${r.totalTicketDistributed}장` : '미지급'}
        />
        <Field
          label="덕력 분배 결과 (참여자)"
          value={r.perShareDuk > 0 ? `${r.perShareDuk}점 × ${game.participants}명 = ${r.totalDukDistributed}점` : '미지급'}
        />
        <Field label="미지급 보상 GP" value={`${r.undistributed.toLocaleString()} GP`} />
        <Field label="미지급보상자(탈퇴회원)" value={`${r.withdrawnUserUnpaid}명`} />
        <Field label="지분당 보상 GP" value={`${r.perShareGP.toLocaleString()} GP`} />
        <Field label="보상 지급 상태" value={r.rewardStatus} />
        <Field label="보상 지급일" value={r.rewardPaidAt ?? '-'} />
      </Section>
    </div>
  );
}

// ─────────────── 공통 UI ───────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <dl className="grid grid-cols-[180px_1fr] gap-y-3 gap-x-6">{children}</dl>
    </div>
  );
}

function Field({ label, value, multiline }: { label: string; value: React.ReactNode; multiline?: boolean }) {
  return (
    <>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
    </>
  );
}

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <GameDetailContent id={id} />
    </Suspense>
  );
}
