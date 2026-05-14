'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import StatCardWithBar from '@/components/clone/StatCardWithBar';
import { getBannerById, getSourceTypeBadge, type BannerStatus } from '@/mock/home';

const STATUS_STYLE: Record<BannerStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-700',
  ACTIVE: 'bg-emerald-500 text-white',
  CLOSED: 'bg-gray-400 text-white',
};

export default function HomeBannerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const banner = getBannerById(parseInt(id, 10));
  const router = useRouter();

  if (!banner) return <div className="p-8 text-sm text-gray-500">배너를 찾을 수 없습니다.</div>;

  const ctr = banner.impressionCount > 0 ? (banner.clickCount / banner.impressionCount) * 100 : 0;
  const sourceBadge = getSourceTypeBadge(banner.sourceType);

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '홈 운영', href: '/home/banners' },
          { label: '배너 관리', href: '/home/banners' },
          { label: banner.titleKO },
        ]}
      />

      <div className="flex items-start justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 max-w-[640px]">{banner.titleKO}</h1>
            <p className="text-sm text-gray-500 mt-1">{banner.titleEN || '(EN 미입력)'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLE[banner.status]}`}>
            {banner.status}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${sourceBadge.bg} ${sourceBadge.text}`}>
            {sourceBadge.label}
          </span>
          <button className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            수정하기
          </button>
          {banner.status === 'DRAFT' ? (
            <button
              onClick={() => alert(`[Mock] 게시 모달 (HOM-101-MD-PUBLISH) — '${banner.titleKO}'`)}
              className="h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              게시하기
            </button>
          ) : banner.status === 'ACTIVE' ? (
            <button
              onClick={() => alert(`[Mock] 종료 모달 (HOM-101-MD-CLOSE) — '${banner.titleKO}'`)}
              className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100"
            >
              종료하기
            </button>
          ) : null}
        </div>
      </div>

      {/* 섹션 1 — 배너 프리뷰 + 기본 정보 */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="aspect-[16/9] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <div className="text-center">
              <PhotoIcon className="w-12 h-12 mx-auto text-indigo-300 mb-2" />
              <span className="text-xs text-indigo-400 font-medium">배너 메인 이미지 (16:9)</span>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">이미지 URL</div>
            <div className="text-[11px] text-gray-700 font-mono truncate">{banner.imageUrl}</div>
            <div className="text-xs text-gray-500 mb-1 mt-3">랜딩 링크</div>
            <div className="text-[11px] text-indigo-600 font-mono truncate">{banner.linkUrl}</div>
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h4>
            <div className="space-y-3 text-sm">
              <Row label="아티스트" value={banner.artistGroup ?? '전역 (NULL)'} />
              <Row label="소스 타입" value={sourceBadge.label} />
              <Row label="소스 참조" value={`${banner.sourceRefName} (refId: ${banner.sourceRefId ?? 'N/A'})`} />
              <Row label="노출 순서" value={`#${banner.displayOrder}`} />
              <Row label="공개 일시" value={banner.openDt} />
              <Row label="종료 일시" value={banner.closeDt} />
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="text-xs text-gray-500 mb-2">다국어 타이틀</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">KO</span>
                  <span className="text-gray-900 flex-1">{banner.titleKO}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">EN</span>
                  <span className="text-gray-700 flex-1">{banner.titleEN || '(미입력)'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-7 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">JP</span>
                  <span className="text-gray-700 flex-1">{banner.titleJP || '(미입력)'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">관리 정보</h4>
            <div className="space-y-3 text-sm">
              <Row label="생성자" value={banner.createdBy} />
              <Row label="생성 일시" value={banner.createdAt} />
              <Row label="최근 수정자" value={banner.updatedBy} />
              <Row label="최근 수정 일시" value={banner.updatedAt} />
            </div>
          </div>
        </div>
      </div>

      {/* 섹션 2 — 노출/클릭 성과 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCardWithBar label="총 노출 (Impression)" count={banner.impressionCount} variant="default" />
        <StatCardWithBar label="총 클릭 (Click)" count={banner.clickCount} variant="active" />
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">CTR (Click-Through Rate)</div>
          <div className="text-2xl font-bold text-indigo-700">{ctr.toFixed(2)}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">참조 콘텐츠 상태</div>
          <div className="text-sm font-semibold text-gray-900 mt-2">
            <a href={banner.linkUrl} className="text-indigo-600 hover:underline">→ 원본 보기</a>
          </div>
        </div>
      </div>

      {/* 섹션 3 — 멀티아티스트 정책 안내 */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
        <h4 className="text-sm font-semibold text-indigo-900 mb-1">멀티아티스트 노출 정책</h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          {banner.artistGroup === null
            ? '본 배너는 artist_group_id가 NULL인 전역 배너입니다. 모든 아티스트 헤더에서 노출됩니다 ([CEB-BO-100] §3 🟠 High).'
            : `본 배너는 ${banner.artistGroup} 아티스트 전용입니다. 헤더 토글이 ${banner.artistGroup}일 때만 노출됩니다. EXTERNAL_ARTIST 권한자는 자기 아티스트 배너만 R/W 가능합니다.`}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}
