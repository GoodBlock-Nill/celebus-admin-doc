'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon, ArrowDownTrayIcon, EyeSlashIcon, PencilSquareIcon, TrophyIcon, GiftIcon,
  UserGroupIcon, TicketIcon, XCircleIcon, ChevronUpDownIcon, MagnifyingGlassIcon,
  ChatBubbleLeftEllipsisIcon, PhotoIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimplePagination from '@/components/clone/SimplePagination';
import ConfirmModal from '@/app/fanquest/_components/ConfirmModal';
import { downloadCSV } from '@/lib/csv';
import {
  getRaffleById, getRaffleEntries, getRaffleWinners, getRaffleDraw,
  RAFFLE_STATUS_BADGE, RAFFLE_ENTRY_STATUS_BADGE,
  type Raffle, type RaffleEntry, type RaffleWinner, type WinnerStatus,
} from '@/mock/fanquest';
import DrawModal from '../_components/DrawModal';
import EntryDetailModal from '../_components/EntryDetailModal';
import WinnerNoteModal from '../_components/WinnerNoteModal';

type Tab = 'info' | 'entries' | 'draws';
type EntrySort = 'recent' | 'tickets';
type EntrySearch = 'nickname' | 'phone';

const TABLE_PAGE_SIZE = 20;

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const raffleId = parseInt(id, 10);
  const initial = getRaffleById(raffleId);
  const router = useRouter();

  const [raffle, setRaffle] = useState<Raffle | undefined>(initial);
  const [winners, setWinners] = useState<RaffleWinner[]>(() => getRaffleWinners(raffleId));
  const [entries, setEntries] = useState<RaffleEntry[]>(() => getRaffleEntries(raffleId));
  const [tab, setTab] = useState<Tab>('info');

  // Modals
  const [confirmKind, setConfirmKind] = useState<null | 'publish' | 'close' | 'delete' | 'hide'>(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [entryDetail, setEntryDetail] = useState<RaffleEntry | null>(null);
  const [winnerNote, setWinnerNote] = useState<RaffleWinner | null>(null);
  const [imageLightbox, setImageLightbox] = useState(false);

  if (!raffle) return <div className="p-8 text-sm text-gray-500">래플을 찾을 수 없습니다.</div>;

  // Status flag
  const isDraft = raffle.status === '임시저장';
  const isActive = raffle.status === '진행중';
  const isAwaiting = raffle.status === '추첨대기';
  const isEnded = raffle.status === '종료';

  // 게시 활성화 조건 — 모든 필수 입력 완료 + 다국어 KO/EN/JA 3개 모두 + BIVE ON 시 이벤트 선택
  // 수령 가이드는 deliveryType별로 분기 검증 (현장 수령 vs 배송 수령)
  const pickupValidForPublish = raffle.deliveryType === '배송 수령'
    ? !!(raffle.pickup.deliveryDeadlineDt && raffle.pickup.deliveryDeadlineTime && raffle.pickup.deliveryFormUrl)
    : !!(raffle.pickup.startDt && raffle.pickup.endDt && raffle.pickup.openTime && raffle.pickup.closeTime)
      && !!(raffle.pickup.locationKO && raffle.pickup.locationEN && raffle.pickup.locationJA)
      && !!(raffle.pickup.itemsKO && raffle.pickup.itemsEN && raffle.pickup.itemsJA);

  const canPublish = isDraft
    && !!raffle.artist
    && !!raffle.imageUrl
    && !!raffle.endAt
    && raffle.winnerCount >= 1
    && !!raffle.deliveryType
    && !!raffle.prizeUnit
    && !!(raffle.titleKO && raffle.titleEN && raffle.titleJA)
    && !!(raffle.descKO && raffle.descEN && raffle.descJA)
    && !!(raffle.prizeKO && raffle.prizeEN && raffle.prizeJA)
    && !!(raffle.noticeKO && raffle.noticeEN && raffle.noticeJA)
    && pickupValidForPublish
    && (!raffle.biveRewardYn || raffle.mintingEventId !== null);

  // ── Header CTAs by status ─────────────────────────────
  const handlePublish = () => setConfirmKind('publish');
  const handleCloseRaffle = () => setConfirmKind('close');
  const handleDelete = () => setConfirmKind('delete');
  const handleToggleHide = () => setConfirmKind('hide');

  const confirmExec = () => {
    if (!confirmKind || !raffle) return;
    if (confirmKind === 'publish') {
      const allLangs = raffle.titleKO && raffle.titleEN && raffle.titleJA && raffle.descKO && raffle.descEN && raffle.descJA;
      if (!allLangs) {
        alert('게시 차단 — 다국어(KO/EN/JA) 필수 입력이 누락되었습니다.');
        setConfirmKind(null);
        return;
      }
      setRaffle({ ...raffle, status: '진행중', startAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    } else if (confirmKind === 'close') {
      // 응모자 0건이면 추첨대기 단계 건너뛰고 즉시 종료 (입상자 없음)
      if (raffle.totalParticipants === 0) {
        setRaffle({
          ...raffle,
          status: '종료',
          winnerCountFinal: 0,
          winnerPaid: 0,
          loserCount: 0,
        });
      } else {
        setRaffle({ ...raffle, status: '추첨대기' });
      }
    } else if (confirmKind === 'delete') {
      alert(`[Mock] 래플 삭제 — '${raffle.titleKO}'`);
      setConfirmKind(null);
      router.push('/raffle');
      return;
    } else if (confirmKind === 'hide') {
      setRaffle({ ...raffle, hidden: !raffle.hidden });
    }
    setConfirmKind(null);
  };

  const handleDrawConfirm = (_seed: string, preview: { userId: number; nickname: string; phone: string; cumulativeTickets: number }[]) => {
    const winnerIds = new Set(preview.map((w) => w.userId));
    const now = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
    // 추첨 결과는 추첨 풀(제외되지 않은 응모자)만 대상으로 산출
    const eligible = entries.filter((e) => !e.excludedFromDraw);
    const next: RaffleWinner[] = eligible.map((e) => ({
      raffleId,
      userId: e.userId,
      nickname: e.nickname,
      phone: e.phone,
      status: winnerIds.has(e.userId) ? '당첨' : '미당첨',
      drawAt: now,
      cumulativeTickets: e.cumulativeTickets,
      paid: false,
      note: '',
    }));
    setWinners(next);
    setRaffle({ ...raffle, status: '종료', winnerCountFinal: preview.length, winnerPaid: 0, loserCount: eligible.length - preview.length });
    setDrawOpen(false);
  };

  const toggleEntryExclusion = (userIds: number[], exclude: boolean) => {
    setEntries((prev) => prev.map((e) => (userIds.includes(e.userId) ? { ...e, excludedFromDraw: exclude } : e)));
    if (!raffle) return;
    const count = userIds.length;
    if (count === 1) {
      const target = entries.find((e) => e.userId === userIds[0]);
      const action = exclude ? '추첨에서 제외했습니다' : '의 추첨 제외를 해제했습니다';
      alert(`[Mock] 래플 '${raffle.titleKO}'의 응모자 '${target?.nickname}'을(를) ${action}.`);
    } else {
      const action = exclude ? '을 추첨에서 제외했습니다' : '의 추첨 제외를 해제했습니다';
      alert(`[Mock] 래플 '${raffle.titleKO}'에서 응모자 ${count}명${action}.`);
    }
  };

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[{ label: '래플', href: '/raffle' }, { label: 'Raffle 상세' }]}
      />

      {/* 헤더 */}
      <div className="flex items-start justify-between -mt-2 mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-gray-900 max-w-[760px]">{raffle.titleKO}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${RAFFLE_STATUS_BADGE[raffle.status]}`}>{raffle.status}</span>
            {raffle.hidden && (
              <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-600">숨김</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <button onClick={() => router.push(`/raffle/${raffleId}/edit`)} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                <PencilSquareIcon className="w-4 h-4 inline mr-1" />수정하기
              </button>
              <button onClick={handleDelete} className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
                삭제
              </button>
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                className="h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed disabled:hover:bg-indigo-200"
              >
                게시하기
              </button>
            </>
          )}
          {isActive && (
            <>
              <button onClick={() => router.push(`/raffle/${raffleId}/edit`)} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                수정하기
              </button>
              <button onClick={handleCloseRaffle} className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
                종료하기
              </button>
            </>
          )}
          {isEnded && (
            <button onClick={handleToggleHide} className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
              <EyeSlashIcon className="w-4 h-4 inline mr-1" />
              {raffle.hidden ? '숨김 해제' : '숨김 처리'}
            </button>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { v: 'info', label: '기본정보' },
          { v: 'entries', label: '응모내역' },
          { v: 'draws', label: '추첨내역' },
        ] as { v: Tab; label: string }[]).map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`px-5 h-9 text-sm font-medium rounded-md transition-colors ${
              tab === t.v ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'info' && <InfoTab raffle={raffle} onImageClick={() => setImageLightbox(true)} />}
      {tab === 'entries' && (
        <EntriesTab
          raffle={raffle}
          entries={entries}
          onRowClick={(e) => setEntryDetail(e)}
          onToggleExclusion={toggleEntryExclusion}
        />
      )}
      {tab === 'draws' && (
        <DrawsTab
          raffle={raffle}
          winners={winners}
          onDraw={() => setDrawOpen(true)}
          onWinnerNote={(w) => setWinnerNote(w)}
          onTogglePaid={(userId) => {
            setWinners((prev) => prev.map((w) => (w.userId === userId && w.status === '당첨' ? { ...w, paid: !w.paid } : w)));
            setRaffle((cur) => cur && { ...cur, winnerPaid: (cur.winnerPaid ?? 0) + (winners.find((w) => w.userId === userId)?.paid ? -1 : 1) });
          }}
        />
      )}

      {/* Confirm modals */}
      {confirmKind === 'publish' && (
        <ConfirmModal
          title="게시하시겠어요?"
          message={`'${raffle.titleKO}'을(를) 게시합니다.\n게시 시점부터 앱에 즉시 노출되며 응모가 시작됩니다.`}
          confirmLabel="게시하기"
          onCancel={() => setConfirmKind(null)}
          onConfirm={confirmExec}
        />
      )}
      {confirmKind === 'close' && (
        <ConfirmModal
          title="종료하시겠어요?"
          message={`'${raffle.titleKO}'을(를) 종료합니다.\n응모가 차단되고 추첨대기 상태로 전환됩니다.`}
          danger
          confirmLabel="종료"
          onCancel={() => setConfirmKind(null)}
          onConfirm={confirmExec}
        />
      )}
      {confirmKind === 'delete' && (
        <ConfirmModal
          title="삭제하시겠어요?"
          message={`'${raffle.titleKO}'을(를) 삭제합니다. 복구할 수 없습니다.`}
          danger
          confirmLabel="삭제"
          onCancel={() => setConfirmKind(null)}
          onConfirm={confirmExec}
        />
      )}
      {confirmKind === 'hide' && (
        <ConfirmModal
          title={raffle.hidden ? '숨김 해제하시겠어요?' : '숨김 처리하시겠어요?'}
          message={
            raffle.hidden
              ? '앱에서 다시 노출됩니다.'
              : '본 래플이 앱에서 숨겨집니다. 다시 노출하려면 [숨김 해제]로 전환하세요.'
          }
          confirmLabel={raffle.hidden ? '숨김 해제' : '숨김 처리'}
          danger={!raffle.hidden}
          onCancel={() => setConfirmKind(null)}
          onConfirm={confirmExec}
        />
      )}

      {drawOpen && isAwaiting && (
        <DrawModal
          raffle={raffle}
          entries={entries}
          onCancel={() => setDrawOpen(false)}
          onConfirm={handleDrawConfirm}
        />
      )}

      {entryDetail && (
        <EntryDetailModal entry={entryDetail} onClose={() => setEntryDetail(null)} />
      )}

      {winnerNote && (
        <WinnerNoteModal
          winner={winnerNote}
          onCancel={() => setWinnerNote(null)}
          onSave={(note) => {
            setWinners((prev) => prev.map((w) => (w.userId === winnerNote.userId ? { ...w, note } : w)));
            alert('[Mock] 비고가 저장되었습니다.');
            setWinnerNote(null);
          }}
        />
      )}

      {imageLightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8 cursor-zoom-out"
          onClick={() => setImageLightbox(false)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setImageLightbox(false); }}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="닫기"
          >
            <span className="text-white text-2xl leading-none">×</span>
          </button>
          <div className="max-w-[90vw] max-h-[90vh] bg-gradient-to-br from-indigo-200 to-purple-200 rounded-xl flex items-center justify-center p-12">
            <div className="text-center">
              <PhotoIcon className="w-24 h-24 mx-auto text-white/80 mb-3" />
              <div className="text-white text-sm font-medium">{raffle.imageUrl}</div>
              <div className="text-white/70 text-xs mt-1">실제 환경에서는 이미지 원본이 노출됩니다 (mock)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 기본정보 탭
// ============================================================
function InfoTab({ raffle, onImageClick }: { raffle: Raffle; onImageClick: () => void }) {
  const isEnded = raffle.status === '종료';
  return (
    <div>
      {/* 통계 4 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={<UserGroupIcon className="w-5 h-5 text-sky-500" />} label="총 응모자" value={raffle.totalParticipants} />
        <StatCard icon={<TicketIcon className="w-5 h-5 text-emerald-500" />} label="총 응모권" value={raffle.totalTicketsUsed} />
        <StatCard icon={<TrophyIcon className="w-5 h-5 text-amber-500" />} label="목표 당첨자" value={raffle.winnerCount} />
        <StatCard icon={<GiftIcon className="w-5 h-5 text-indigo-500" />} label="지급 완료" value={isEnded ? (raffle.winnerPaid ?? 0) : 0} />
      </div>

      {/* Raffle 정보 + 관리 정보 */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Raffle 정보</h3>
          <div className="space-y-3 text-sm">
            <Row label="아티스트" value={raffle.artist} />
            <Row label="당첨 인원" value={`${raffle.winnerCount}명`} />
            <Row label="배송 타입" value={raffle.deliveryType} />
            <Row label="대표 이미지" value={
              <button
                type="button"
                onClick={onImageClick}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <PhotoIcon className="w-3.5 h-3.5" />
                이미지 보기
              </button>
            } />
            <Row label="시작일시" value={raffle.startAt || '—'} />
            <Row label="마감일시" value={raffle.endAt} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">관리 정보</h3>
          <div className="space-y-3 text-sm">
            <Row label="상태" value={raffle.status} />
            <Row label="생성 관리자" value={raffle.createdBy} />
            <Row label="생성 일시" value={raffle.createdAt} />
            <Row label="최근 수정자" value={raffle.updatedBy} />
            <Row label="최근 수정 일시" value={raffle.updatedAt} />
          </div>
        </div>
      </div>

      {/* 다국어 섹션 */}
      <LangSection title="Raffle 타이틀" ko={raffle.titleKO} en={raffle.titleEN} ja={raffle.titleJA} />
      <LangSection title="Raffle 설명" ko={raffle.descKO} en={raffle.descEN} ja={raffle.descJA} />
      <LangSection title="경품 상세" ko={raffle.prizeKO} en={raffle.prizeEN} ja={raffle.prizeJA} />

      {/* v2.2 — 추가 보상 (BIVE) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">추가 보상 (BIVE)</h3>
        {raffle.biveRewardYn ? (
          <div className="grid grid-cols-2 gap-5 text-sm">
            <Row label="BIVE 보상" value={
              <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />ON
              </span>
            } />
            <Row label="민팅 이벤트" value={raffle.mintingEventName ?? '—'} />
            <Row label="민팅 캠페인 ID" value={
              <span className="font-mono text-xs text-indigo-700">eventId: {raffle.mintingEventId}</span>
            } />
            <Row label="지급 대상" value="당첨자 (자동 민팅)" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200">OFF</span>
            <span className="text-gray-500">BIVE 보상 미지정 — 당첨자에게 경품만 지급됩니다.</span>
          </div>
        )}
      </div>

      {/* 수령 가이드 / 배송 가이드 — deliveryType에 따라 분기 */}
      {raffle.deliveryType === '배송 수령' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">배송 가이드</h3>
          <div className="space-y-3 text-sm">
            <Row
              label="배송지 입력 마감일시"
              value={`${raffle.pickup.deliveryDeadlineDt ?? '—'} ${raffle.pickup.deliveryDeadlineTime ?? ''}`.trim()}
            />
            <Row
              label="배송지 입력 폼 URL"
              value={
                raffle.pickup.deliveryFormUrl ? (
                  <a
                    href={raffle.pickup.deliveryFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                  >
                    {raffle.pickup.deliveryFormUrl}
                  </a>
                ) : '—'
              }
            />
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">수령 가이드</h3>
          <div className="grid grid-cols-2 gap-5 mb-4 text-sm">
            <Row label="보상수령 기간" value={`${raffle.pickup.startDt ?? '—'} ~ ${raffle.pickup.endDt ?? '—'}`} />
            <Row label="운영 시간" value={`${raffle.pickup.openTime ?? '—'} ~ ${raffle.pickup.closeTime ?? '—'}`} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <PickupBlock title="한국어" location={raffle.pickup.locationKO ?? ''} items={raffle.pickup.itemsKO ?? ''} />
            <PickupBlock title="영어" location={raffle.pickup.locationEN ?? ''} items={raffle.pickup.itemsEN ?? ''} />
            <PickupBlock title="일본어" location={raffle.pickup.locationJA ?? ''} items={raffle.pickup.itemsJA ?? ''} />
          </div>
        </div>
      )}

      {/* 유의사항 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">유의사항</h3>
        <div className="space-y-3 text-sm">
          <NoticeBlock lang="KO" text={raffle.noticeKO} />
          <NoticeBlock lang="EN" text={raffle.noticeEN} />
          <NoticeBlock lang="JA" text={raffle.noticeJA} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 응모내역 탭
// ============================================================
function EntriesTab({
  raffle,
  entries,
  onRowClick,
  onToggleExclusion,
}: {
  raffle: Raffle;
  entries: RaffleEntry[];
  onRowClick: (e: RaffleEntry) => void;
  onToggleExclusion: (userIds: number[], exclude: boolean) => void;
}) {
  const [sort, setSort] = useState<EntrySort>('recent');
  const [searchType, setSearchType] = useState<EntrySearch>('nickname');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const isAwaiting = raffle.status === '추첨대기';
  const excludedCount = entries.filter((e) => e.excludedFromDraw).length;

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let arr = entries.filter((e) => {
      if (!k) return true;
      const target = searchType === 'phone' ? e.phone : e.nickname;
      return target.toLowerCase().includes(k);
    });
    arr = arr.slice().sort((a, b) => {
      if (sort === 'tickets') {
        const diff = b.cumulativeTickets - a.cumulativeTickets;
        if (diff !== 0) return diff;
        // 동률은 최근 응모일시가 최신인 회원이 위
        return b.recentEntryAt.localeCompare(a.recentEntryAt);
      }
      return b.recentEntryAt.localeCompare(a.recentEntryAt);
    });
    return arr;
  }, [entries, sort, searchType, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * TABLE_PAGE_SIZE, safePage * TABLE_PAGE_SIZE);
  const filteredIds = paged.map((e) => e.userId);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));

  const toggleOne = (userId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredIds.forEach((id) => next.delete(id));
      else filteredIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulk = (exclude: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    onToggleExclusion(ids, exclude);
    setSelected(new Set());
  };

  return (
    <div>
      {/* 통계 3 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard icon={<UserGroupIcon className="w-5 h-5 text-sky-500" />} label="누적 참여자 수" value={raffle.totalParticipants} big />
        <StatCard icon={<TicketIcon className="w-5 h-5 text-emerald-500" />} label="누적 사용 응모권 합계" value={raffle.totalTicketsUsed} big />
        <StatCard icon={<XCircleIcon className="w-5 h-5 text-rose-500" />} label="추첨 제외" value={excludedCount} big />
      </div>

      {/* 일괄 처리 액션 바 — 추첨대기 + 선택 1건 이상 */}
      {isAwaiting && selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
          <span className="font-semibold text-indigo-900">{selected.size}건 선택됨</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => handleBulk(true)}
            className="h-9 px-4 inline-flex items-center text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
          >선택 {selected.size}건 추첨 제외</button>
          <button
            type="button"
            onClick={() => handleBulk(false)}
            className="h-9 px-4 inline-flex items-center text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >선택 {selected.size}건 제외 해제</button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="h-9 px-3 inline-flex items-center text-xs font-medium text-indigo-700 hover:underline"
          >선택 해제</button>
        </div>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as EntrySort); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="recent">응모일시 최근 순</option>
            <option value="tickets">응모권 많은 순</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select
            value={searchType}
            onChange={(e) => { setSearchType(e.target.value as EntrySearch); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[100px] cursor-pointer"
          >
            <option value="nickname">닉네임</option>
            <option value="phone">전화번호</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder={searchType === 'phone' ? '전화번호 입력' : '닉네임 입력'}
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[200px]"
          />
        </div>
        <button
          onClick={() => { setKeyword(''); setSort('recent'); setSearchType('nickname'); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  disabled={!isAwaiting || filteredIds.length === 0}
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                  aria-label="현재 페이지 전체 선택"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">유저 닉네임</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-36">전화번호</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-32 whitespace-nowrap">최근 사용 응모권</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-44 whitespace-nowrap">최근 응모일시</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-36 whitespace-nowrap">누적 사용 응모권</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 w-24">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">응모 내역이 없습니다.</td></tr>
            ) : paged.map((e) => {
              const status = e.excludedFromDraw ? '추첨 제외' : '정상';
              return (
                <tr
                  key={e.userId}
                  className={`hover:bg-gray-50 cursor-pointer ${e.excludedFromDraw ? 'bg-rose-50/30' : ''}`}
                  onClick={() => onRowClick(e)}
                >
                  <td className="px-3 py-3" onClick={(ev) => ev.stopPropagation()}>
                    <input
                      type="checkbox"
                      disabled={!isAwaiting}
                      checked={selected.has(e.userId)}
                      onChange={() => toggleOne(e.userId)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                      aria-label={`${e.nickname} 선택`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{e.nickname}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 font-mono">{e.phone}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{e.recentTicketsUsed}</td>
                  <td className="px-4 py-3 text-xs text-right text-gray-700 font-mono whitespace-nowrap">{e.recentEntryAt}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{e.cumulativeTickets}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${RAFFLE_ENTRY_STATUS_BADGE[status]}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SimplePagination page={safePage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// ============================================================
// 추첨내역 탭
// ============================================================
function DrawsTab({
  raffle, winners, onDraw, onWinnerNote, onTogglePaid,
}: {
  raffle: Raffle;
  winners: RaffleWinner[];
  onDraw: () => void;
  onWinnerNote: (w: RaffleWinner) => void;
  onTogglePaid: (userId: number) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'' | WinnerStatus>('');
  const [searchType, setSearchType] = useState<EntrySearch>('nickname');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const draw = getRaffleDraw(raffle.id);

  if (raffle.status === '임시저장' || raffle.status === '진행중') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-sm text-gray-500">
        래플 상태가 추첨대기일 때만 추첨이 가능합니다.
      </div>
    );
  }

  if (raffle.status === '추첨대기') {
    // 응모자 0건이라면 추첨 자체가 불가능 — 자동 종료 처리 안내
    if (raffle.totalParticipants === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
          <p className="text-sm text-gray-500 mb-2">추첨 없이 자동 종료 — 입상자 없음</p>
          <p className="text-xs text-gray-400">응모자가 없어 추첨이 진행되지 않았습니다.</p>
        </div>
      );
    }
    return (
      <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
        <p className="text-sm text-gray-600 mb-4">추첨대기 상태에서는 하단 추첨하기 버튼을 눌러 추첨을 진행해주세요</p>
        <button
          onClick={onDraw}
          className="h-11 px-6 inline-flex items-center text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          추첨하기
        </button>
      </div>
    );
  }

  // ENDED — 응모자 0건이면 "입상자 없음" 안내 (시드·통계·테이블 미노출)
  if (raffle.totalParticipants === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
        <p className="text-sm text-gray-500 mb-2">추첨 없이 자동 종료 — 입상자 없음</p>
        <p className="text-xs text-gray-400">응모자가 없어 추첨이 진행되지 않은 채 종료되었습니다.</p>
      </div>
    );
  }
  const filtered = winners
    .filter((w) => (statusFilter ? w.status === statusFilter : true))
    .filter((w) => {
      if (!keyword) return true;
      const target = searchType === 'phone' ? w.phone : w.nickname;
      return target.toLowerCase().includes(keyword.toLowerCase());
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * TABLE_PAGE_SIZE, safePage * TABLE_PAGE_SIZE);

  return (
    <div>
      {/* 통계 4 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={<GiftIcon className="w-5 h-5 text-indigo-500" />} label="보상지급" value={raffle.winnerPaid ?? 0} />
        <StatCard icon={<UserGroupIcon className="w-5 h-5 text-sky-500" />} label="총 응모 유저" value={raffle.totalParticipants} />
        <StatCard icon={<TrophyIcon className="w-5 h-5 text-amber-500" />} label="당첨" value={raffle.winnerCountFinal ?? 0} />
        <StatCard icon={<XCircleIcon className="w-5 h-5 text-gray-400" />} label="미당첨" value={raffle.loserCount ?? 0} />
      </div>

      {draw && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-4 py-2 mb-4 flex items-center gap-3 text-xs">
          <span className="text-indigo-600 font-semibold">추첨 시드</span>
          <span className="font-mono text-indigo-900">{draw.seed}</span>
          <span className="text-indigo-300">·</span>
          <span className="text-indigo-700">{draw.drawnAt} · {draw.drawnBy}</span>
        </div>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as '' | WinnerStatus); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[120px]"
          >
            <option value="">전체</option>
            <option value="당첨">당첨</option>
            <option value="미당첨">미당첨</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex-1" />
        <div className="relative">
          <select
            value={searchType}
            onChange={(e) => { setSearchType(e.target.value as EntrySearch); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none min-w-[100px] cursor-pointer"
          >
            <option value="nickname">닉네임</option>
            <option value="phone">전화번호</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder={searchType === 'phone' ? '전화번호 입력' : '닉네임 입력'}
            className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[200px]"
          />
        </div>
        <button
          onClick={() => { setKeyword(''); setStatusFilter(''); setSearchType('nickname'); setPage(1); }}
          className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >초기화</button>
        <button
          type="button"
          onClick={() => {
            const winnerRows = winners
              .filter((w) => w.status === '당첨')
              .sort((a, b) => b.cumulativeTickets - a.cumulativeTickets)
              .map((w) => [w.nickname, w.phone, w.cumulativeTickets] as (string | number)[]);
            if (winnerRows.length === 0) return;
            const now = new Date();
            const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
            downloadCSV(
              [['유저 닉네임', '전화번호', '누적 응모권'], ...winnerRows],
              `raffle-${raffle.id}-winners-${ts}.csv`,
            );
          }}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          당첨자 명단 다운로드
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-24">상태</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">유저 닉네임</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 w-36">전화번호</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-28 whitespace-nowrap">누적 응모권</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-32 whitespace-nowrap">추첨 일시</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 w-32 whitespace-nowrap">보상 지급</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 w-16">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">결과가 없습니다.</td></tr>
            ) : paged.map((w) => (
              <tr key={w.userId} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    w.status === '당첨' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>{w.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{w.nickname}</td>
                <td className="px-4 py-3 text-xs text-gray-700 font-mono">{w.phone}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{w.cumulativeTickets}</td>
                <td className="px-4 py-3 text-xs text-right text-gray-700 font-mono whitespace-nowrap">{w.drawAt}</td>
                <td className="px-4 py-3 text-right">
                  {w.status === '당첨' ? (
                    <button
                      onClick={() => onTogglePaid(w.userId)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium`}
                    >
                      <span className={`w-8 h-4 rounded-full relative transition-colors ${w.paid ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${w.paid ? 'left-4' : 'left-0.5'}`} />
                      </span>
                      <span className={w.paid ? 'text-emerald-700' : 'text-gray-500'}>{w.paid ? '지급' : '미지급'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onWinnerNote(w)}
                    disabled={w.status !== '당첨'}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SimplePagination page={safePage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

// ============================================================
// 공통 컴포넌트
// ============================================================
function StatCard({ icon, label, value, big = false }: { icon: React.ReactNode; label: string; value: number; big?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`font-bold text-gray-900 ${big ? 'text-2xl' : 'text-xl'}`}>{value.toLocaleString('ko-KR')}</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">{icon}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function LangSection({ title, ko, en, ja }: { title: string; ko: string; en: string; ja: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2 text-sm">
        <LangRow lang="KO" text={ko} />
        <LangRow lang="EN" text={en} />
        <LangRow lang="JA" text={ja} />
      </div>
    </div>
  );
}

function LangRow({ lang, text }: { lang: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex shrink-0 items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold mt-0.5">{lang}</span>
      <p className={`flex-1 leading-relaxed ${text ? 'text-gray-900' : 'text-gray-400 italic'}`}>{text || '(미입력)'}</p>
    </div>
  );
}

function PickupBlock({ title, location, items }: { title: string; location: string; items: string }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/40">
      <div className="text-[11px] font-semibold text-gray-700">{title}</div>
      <div>
        <p className="text-[10px] text-gray-500 mb-0.5">수령장소</p>
        <p className={`text-xs leading-relaxed ${location ? 'text-gray-900' : 'text-gray-400 italic'}`}>{location || '(미입력)'}</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-500 mb-0.5">지참물</p>
        <p className={`text-xs leading-relaxed ${items ? 'text-gray-700' : 'text-gray-400 italic'}`}>{items || '(미입력)'}</p>
      </div>
    </div>
  );
}

function NoticeBlock({ lang, text }: { lang: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex shrink-0 items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold mt-0.5">{lang}</span>
      <p className={`flex-1 leading-relaxed whitespace-pre-line ${text ? 'text-gray-700' : 'text-gray-400 italic'}`}>{text || '(미입력)'}</p>
    </div>
  );
}
