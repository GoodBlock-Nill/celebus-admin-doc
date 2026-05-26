'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import {
  ACTIVE_ARTISTS,
  EXCLUSION_LABEL,
  formatPeriod,
  getArtistDisplay,
  getStatusLabel,
  getVisibleBanners,
  SLOT_KIND_META,
  type ArtistGroup,
  type HomeBanner,
  type SlotKind,
  type SlotTab,
} from '@/mock/home';

// 회원 앱 배너 노출/미노출 미리보기 — [CEB-BO-APP-201] §노출 정책 시각화 도구
// 운영자가 BO에서 등록·수정한 배너가 실제 회원 앱에 어떻게 노출되는지
// 가상 시각 기준으로 즉시 확인. mock 데이터 영향 없음 (조회 전용).

const TABS: { id: SlotTab; label: string; slotKinds: SlotKind[] }[] = [
  { id: 'home', label: '홈', slotKinds: ['MAIN', 'TODAY_TODO'] },
  { id: 'artist', label: '아티스트 메인', slotKinds: ['TOGETHER', 'MISSION'] },
];

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(s: string): Date {
  return new Date(`${s}:00`);
}
function formatNow(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HomeBannersPreviewPage() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [tab, setTab] = useState<SlotTab>('home');
  const [artist, setArtist] = useState<ArtistGroup>('V01D');

  const presets: { label: string; offsetMs: number }[] = [
    { label: '지금', offsetMs: 0 },
    { label: '+1시간', offsetMs: 60 * 60 * 1000 },
    { label: '+1일', offsetMs: 24 * 60 * 60 * 1000 },
    { label: '+7일', offsetMs: 7 * 24 * 60 * 60 * 1000 },
  ];

  const jumpFromReal = (offsetMs: number) => {
    setNow(new Date(Date.now() + offsetMs));
  };

  const currentTab = TABS.find((t) => t.id === tab)!;

  // 슬롯별 노출 판정 결과
  const slotResults = useMemo(() => {
    return currentTab.slotKinds.map((slotKind) => {
      const meta = SLOT_KIND_META[slotKind];
      const targetArtist: ArtistGroup | null =
        meta.targetMode === 'GLOBAL_ONLY' ? null : artist;
      const result = getVisibleBanners(slotKind, targetArtist, now);
      return { slotKind, meta, targetArtist, ...result };
    });
  }, [currentTab, artist, now]);

  return (
    <div>
      <PageHeader
        title="배너 미리보기"
        breadcrumbItems={[
          { label: '앱' },
          { label: '배너 관리', href: '/home/banners' },
          { label: '미리보기' },
        ]}
      />
      <p className="mt-1 text-sm text-gray-500">
        회원 앱에 노출될 배너를 가상 시각·탭·아티스트 기준으로 즉시 확인합니다. mock 데이터에 영향 없음.
      </p>

      {/* 컨트롤 패널 */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
          {/* 좌: 탭 + 아티스트 */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">노출 위치</div>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-1.5 text-sm rounded-md transition ${
                      tab === t.id
                        ? 'bg-white text-gray-900 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {tab === 'artist' && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1.5">아티스트</div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVE_ARTISTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setArtist(a)}
                      className={`px-3 py-1.5 text-sm rounded-md border transition ${
                        artist === a
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 우: 시각 시뮬레이션 */}
          <div className="lg:border-l lg:border-gray-200 lg:pl-5">
            <div className="text-xs font-semibold text-gray-500 mb-1.5">가상 현재 시각 (KST 가정)</div>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={toLocalInput(now)}
                onChange={(e) => setNow(fromLocalInput(e.target.value))}
                className="h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-sm text-gray-500 font-mono">{formatNow(now)}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => jumpFromReal(p.offsetMs)}
                  className="px-2.5 py-1 text-xs rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 미리보기 + 디버그 */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        {/* 좌: 모바일 프레임 */}
        <div className="mx-auto w-full max-w-[400px]">
          <div className="rounded-[2.2rem] border-[10px] border-gray-900 bg-gray-50 shadow-xl overflow-hidden">
            <div className="bg-gray-900 text-white text-[10px] text-center py-1 font-mono">
              {tab === 'home' ? 'CELEBUS — 홈' : `CELEBUS — ${artist} 메인`}
            </div>
            <div className="h-[640px] overflow-y-auto bg-white">
              {slotResults.map(({ slotKind, meta, visible }) => (
                <SlotSection
                  key={slotKind}
                  slotKind={slotKind}
                  label={meta.label}
                  capacity={meta.capacity}
                  ratio={meta.imageSpec.ratio}
                  visible={visible}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 우: 디버그 패널 */}
        <div className="space-y-4">
          {slotResults.map(({ slotKind, meta, targetArtist, visible, excluded }) => (
            <DebugPanel
              key={slotKind}
              slotKind={slotKind}
              slotLabel={meta.label}
              capacity={meta.capacity}
              capacityLimit={meta.capacityLimit}
              targetArtistLabel={getArtistDisplay(targetArtist)}
              visible={visible}
              excluded={excluded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────── 모바일 프레임 — 슬롯 섹션 ───────────
function SlotSection({
  slotKind,
  label,
  capacity,
  ratio,
  visible,
}: {
  slotKind: SlotKind;
  label: string;
  capacity: 'SINGLE' | 'MULTI';
  ratio: string;
  visible: HomeBanner[];
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">
          {label} <span className="text-gray-300">({slotKind})</span>
        </span>
        <span className="text-[10px] text-gray-400">
          {capacity === 'SINGLE' ? '단일' : `캐러셀 ${visible.length}/8`}
        </span>
      </div>
      {visible.length === 0 ? (
        <div className="mx-3 mb-3 h-24 flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-gray-400">
          노출 배너 없음
        </div>
      ) : capacity === 'SINGLE' ? (
        <div className="px-3 pb-3">
          <BannerCard banner={visible[0]} ratio={ratio} />
        </div>
      ) : (
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto snap-x snap-mandatory">
          {visible.map((b) => (
            <div key={b.id} className="flex-shrink-0 w-[230px] snap-start">
              <BannerCard banner={b} ratio={ratio} compact />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────── 배너 카드 (placeholder 이미지 + 제목·부제목) ───────────
function BannerCard({
  banner,
  ratio,
  compact = false,
}: {
  banner: HomeBanner;
  ratio: string;
  compact?: boolean;
}) {
  // ratio "16:9" / "1:1" / "3:4" → aspect ratio CSS
  const aspectClass =
    ratio === '1:1' ? 'aspect-square' : ratio === '3:4' ? 'aspect-[3/4]' : 'aspect-video';
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
      <div className={`${aspectClass} bg-gradient-to-br from-indigo-100 via-pink-100 to-amber-100 flex items-center justify-center text-[10px] text-gray-400 font-mono`}>
        {banner.imageUrl || 'no image'}
      </div>
      <div className={`p-2 ${compact ? 'space-y-0.5' : 'space-y-1'}`}>
        <div className="text-xs font-semibold text-gray-900 line-clamp-1">{banner.titleKO}</div>
        {!compact && (
          <div className="text-[11px] text-gray-500 line-clamp-1">{banner.subtitleKO}</div>
        )}
      </div>
    </div>
  );
}

// ─────────── 디버그 패널 — 슬롯별 포함/제외 사유 ───────────
function DebugPanel({
  slotKind,
  slotLabel,
  capacity,
  capacityLimit,
  targetArtistLabel,
  visible,
  excluded,
}: {
  slotKind: SlotKind;
  slotLabel: string;
  capacity: 'SINGLE' | 'MULTI';
  capacityLimit: number | null;
  targetArtistLabel: string;
  visible: HomeBanner[];
  excluded: { banner: HomeBanner; reason: 'STATUS' | 'BEFORE_OPEN' | 'AFTER_CLOSE' | 'CAPACITY' }[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-gray-900">{slotLabel}</span>
          <span className="ml-1.5 text-xs text-gray-400 font-mono">({slotKind})</span>
          <span className="ml-2 text-xs text-gray-500">· {targetArtistLabel}</span>
        </div>
        <span className="text-xs text-gray-500">
          {capacity === 'SINGLE' ? '단일' : `MULTI · 한도 ${capacityLimit}`}
        </span>
      </div>

      {/* 포함된 배너 */}
      <div>
        <div className="text-xs font-semibold text-emerald-700 mb-1.5">
          노출 ({visible.length})
        </div>
        {visible.length === 0 ? (
          <div className="text-xs text-gray-400 px-2 py-1.5">없음</div>
        ) : (
          <ul className="space-y-1">
            {visible.map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-gray-400 w-10">#{b.id}</span>
                <Link
                  href={`/home/banners/${b.id}`}
                  className="font-medium text-gray-900 hover:text-indigo-600 truncate flex-1"
                >
                  {b.titleKO}
                </Link>
                <span className="text-gray-400 text-[10px] flex-shrink-0">
                  {formatPeriod(b.period)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 제외된 배너 */}
      {excluded.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 mb-1.5">
            제외 ({excluded.length})
          </div>
          <ul className="space-y-1">
            {excluded.map(({ banner, reason }) => (
              <li key={banner.id} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-gray-400 w-10">#{banner.id}</span>
                <Link
                  href={`/home/banners/${banner.id}`}
                  className="text-gray-700 hover:text-indigo-600 truncate flex-1"
                >
                  {banner.titleKO}
                </Link>
                <span className="text-[10px] text-rose-600 flex-shrink-0">
                  {EXCLUSION_LABEL[reason]}
                </span>
                <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                  {getStatusLabel(banner.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
