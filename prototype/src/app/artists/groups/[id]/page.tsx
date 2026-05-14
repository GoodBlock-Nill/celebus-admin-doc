'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { getGroupById, getGroupMembers } from '@/mock/artists';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'sns', label: 'SNS & Link' },
  { key: 'members', label: '멤버' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl overflow-hidden mb-4">
      <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="bg-white p-5">{children}</div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{children}</span>
    </div>
  );
}

function MultiLangField({ label, ko, en, jp }: { label: string; ko: string; en: string; jp: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 mb-3">{label}</p>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">한국어</p>
          <p className="text-sm text-gray-900 whitespace-pre-line">{ko || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">영어</p>
          <p className="text-sm text-gray-900 whitespace-pre-line">{en || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">일본어</p>
          <p className="text-sm text-gray-900 whitespace-pre-line">{jp || '-'}</p>
        </div>
      </div>
    </div>
  );
}

export default function GroupDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: TabKey }> }) {
  const router = useRouter();
  const { id } = use(params);
  const sp = use(searchParams);
  const [tab, setTab] = useState<TabKey>(sp.tab || 'info');
  const [active, setActive] = useState(true);

  const group = getGroupById(parseInt(id, 10));
  const members = getGroupMembers(parseInt(id, 10));

  if (!group) {
    return <div className="text-center py-20 text-gray-500">그룹을 찾을 수 없습니다.</div>;
  }

  const handleTab = (k: TabKey) => {
    setTab(k);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', k);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div>
      <PageHeader
        title={`그룹상세 (${group.name})`}
        breadcrumbItems={[
          { label: '아티스트' },
          { label: '그룹리스트', href: '/artists/groups' },
          { label: group.name },
        ]}
      />

      <div className="border-b border-gray-200 mb-6 flex items-center justify-between">
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
        {tab === 'members' ? (
          <button className="h-9 px-4 mb-2 inline-flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            멤버 관리
          </button>
        ) : (
          <button className="h-9 px-4 mb-2 inline-flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
            수정하기
          </button>
        )}
      </div>

      {tab === 'info' && (
        <div className="space-y-4">
          <Section title="관리정보">
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">상태</span>
                <button
                  onClick={() => setActive(!active)}
                  role="switch"
                  aria-checked={active}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <Field label="생성 관리자">{group.createdBy || '-'}</Field>
              <Field label="생성 일시">{group.createdAt || '-'}</Field>
              <Field label="최근 수정자">{group.updatedBy || '-'}</Field>
              <Field label="최근 수정 일시">{group.updatedAt}</Field>
            </div>
          </Section>

          <div className="grid grid-cols-2 gap-4">
            <Section title="로고">
              <div className="aspect-square w-full bg-black rounded-lg flex items-center justify-center text-white font-bold text-3xl">
                {group.name.split(' ')[0]}
              </div>
            </Section>
            <Section title="메인 이미지">
              <div className="aspect-square w-full bg-gradient-to-br from-purple-200 to-indigo-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                메인 이미지
              </div>
            </Section>
          </div>

          <Section title="그룹명">
            <div className="space-y-1">
              <Field label="한국어">{group.nameKO || group.name}</Field>
              <Field label="영어">{group.nameEN || group.name}</Field>
              <Field label="일본어">{group.nameJP || group.name}</Field>
            </div>
          </Section>

          <Section title="그룹 소개">
            <MultiLangField
              label=""
              ko={group.descriptionKO || group.description}
              en={group.descriptionEN || ''}
              jp={group.descriptionJP || ''}
            />
          </Section>
        </div>
      )}

      {tab === 'sns' && (
        <Section title="SNS & Link 정보">
          <div className="space-y-1">
            <Field label="Instagram">{group.sns?.instagram || '-'}</Field>
            <Field label="X(twitter)">{group.sns?.twitter || '-'}</Field>
            <Field label="Youtube">{group.sns?.youtube || '-'}</Field>
            <Field label="TikTok">{group.sns?.tiktok || '-'}</Field>
            <Field label="Homepage">{group.sns?.homepage || '-'}</Field>
          </div>
        </Section>
      )}

      {tab === 'members' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <select className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]">
                <option>상태(전체)</option>
              </select>
              <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex-1" />
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="멤버명 입력"
                className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">초기화</button>
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
              { key: 'position', label: '포지션', width: '140px' },
              { key: 'birthday', label: '생년월일', width: '130px' },
              { key: 'gender', label: '성별', width: '80px' },
              { key: 'registeredAt', label: '등록 일시', width: '160px' },
            ]}
            rows={members}
            emptyMessage="등록된 멤버가 없습니다."
          />
          <SimplePagination page={1} totalPages={1} onChange={() => {}} />
        </div>
      )}
    </div>
  );
}
