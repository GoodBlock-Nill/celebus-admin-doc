'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { toast } from '@/components/ui/Toast';
import { getGroupMembers } from '@/mock/artists';
import { useArtistGroupStore } from '@/stores/artistGroupStore';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'members', label: '멤버' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const SNS_ROWS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'X' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'homepage', label: 'Homepage' },
] as const;

export default function GroupDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: TabKey }> }) {
  const router = useRouter();
  const { id } = use(params);
  const sp = use(searchParams);
  const gid = parseInt(id, 10);
  const group = useArtistGroupStore((s) => s.groups.find((g) => g.id === gid));
  const setStatus = useArtistGroupStore((s) => s.setStatus);
  const toggleExposure = useArtistGroupStore((s) => s.toggleExposure);
  const [tab, setTab] = useState<TabKey>(sp.tab === 'members' ? 'members' : 'info');
  const [memberKeyword, setMemberKeyword] = useState('');

  const members = getGroupMembers(gid);

  if (!group) {
    return <div className="text-center py-20 text-gray-500">그룹을 찾을 수 없습니다.</div>;
  }

  const active = group.status === 'Active';
  const exposed = group.exploreExposed ?? true;

  const handleToggleExposure = () => {
    const next = toggleExposure(group.id);
    toast.success(`'${group.name}'의 탐색 노출을 ${next ? '켬' : '끔'}(으)로 변경했습니다.`);
  };

  const handleTab = (k: TabKey) => {
    setTab(k);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', k);
    window.history.replaceState({}, '', url.toString());
  };

  const filteredMembers = members.filter((m) => (memberKeyword ? m.name.includes(memberKeyword) : true));

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Breadcrumb customItems={[{ label: '아티스트' }, { label: '그룹 리스트', href: '/artists/groups' }, { label: group.name }]} />
        <div className="flex items-start justify-between mt-2">
          <div>
            <p className="text-sm text-gray-500 mb-1">아티스트 그룹</p>
            <h1 className="text-[28px] font-bold text-gray-900">{group.name}</h1>
          </div>
          {tab === 'members' ? (
            <button
              onClick={() => router.push(`/artists/groups/${id}/members/manage`)}
              className="h-10 px-4 inline-flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >멤버 관리</button>
          ) : (
            <button
              onClick={() => router.push(`/artists/groups/${id}/edit`)}
              className="h-10 px-4 inline-flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
            >수정하기</button>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'info' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
            {/* 관리정보 카드 */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900">관리정보</h2>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {group.name.slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">로고</p>
                  <p className="text-sm font-medium text-gray-900">{group.logoSrc ? '등록됨' : '등록됨'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2.5 mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">운영 상태</p>
                  <p className="text-xs text-gray-500">{active ? '노출 중' : '비노출'}</p>
                </div>
                <button
                  onClick={() => setStatus(group.id, active ? 'Inactive' : 'Active')}
                  role="switch"
                  aria-checked={active}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2.5 mb-5">
                <div>
                  <p className="text-sm font-medium text-gray-900">탐색 노출</p>
                  <p className="text-xs text-gray-500">{exposed ? '앱 탐색 노출' : '앱 탐색 숨김'}</p>
                </div>
                <button
                  onClick={handleToggleExposure}
                  role="switch"
                  aria-checked={exposed}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exposed ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${exposed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <dl className="space-y-2.5 text-sm">
                {[
                  ['팔로워 수', `${(group.followerCount ?? 0).toLocaleString()} 명`],
                  ['생성 관리자', group.createdBy || '-'],
                  ['생성 일시', group.createdAt || '-'],
                  ['최근 수정자', group.updatedBy || '-'],
                  ['최근 수정 일시', group.updatedAt],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* 대표 이미지 및 링크 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">대표 이미지 및 링크</h2>
              <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">대표 이미지</p>
                  <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-purple-300 via-fuchsia-300 to-indigo-300 flex items-center justify-center text-white font-bold text-xl">
                    {group.name}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">SNS &amp; Link</p>
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {SNS_ROWS.map((s) => (
                      <div key={s.key} className="flex items-center justify-between px-3 py-2.5">
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <GlobeAltIcon className="w-4 h-4 text-gray-400" />{s.label}
                        </span>
                        <span className="text-sm text-gray-400 truncate max-w-[140px]">
                          {(group.sns?.[s.key as keyof typeof group.sns]) || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 다국어 콘텐츠 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { lang: '한국어', name: group.nameKO || group.name, desc: group.descriptionKO || group.description },
              { lang: '영어', name: group.nameEN || group.name, desc: group.descriptionEN || '' },
              { lang: '일본어', name: group.nameJP || group.name, desc: group.descriptionJP || '' },
            ].map((c) => (
              <div key={c.lang} className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-2">{c.lang}</p>
                <h3 className="text-base font-bold text-gray-900 mb-3">{c.name}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{c.desc || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]">
                <option>상태(전체)</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex-1" />
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={memberKeyword}
                onChange={(e) => setMemberKeyword(e.target.value)}
                placeholder="멤버명 입력"
                className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button onClick={() => setMemberKeyword('')} className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">초기화</button>
          </div>

          <SimpleTable
            columns={[
              { key: 'status', label: '상태', width: '90px', render: () => (
                <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500 text-white">Active</span>
              )},
              { key: 'name', label: '멤버명', width: '180px', render: (m: typeof members[number]) => (
                <button onClick={() => router.push(`/artists/members/${m.id}?tab=info`)} className="font-medium text-gray-900 hover:text-indigo-600">
                  {m.name}
                </button>
              )},
              { key: 'position', label: '포지션', width: '140px', render: (m: typeof members[number]) => m.position || '-' },
              { key: 'birthday', label: '생년월일', width: '130px' },
              { key: 'gender', label: '성별', width: '80px' },
              { key: 'registeredAt', label: '등록 일시', width: '160px' },
            ]}
            rows={filteredMembers}
            emptyMessage="검색 결과가 없습니다."
          />
          <SimplePagination page={1} totalPages={1} onChange={() => {}} />
        </div>
      )}
    </div>
  );
}
