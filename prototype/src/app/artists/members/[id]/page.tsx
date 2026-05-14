'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { getMemberById } from '@/mock/artists';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'groups', label: '소속그룹' },
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{children}</span>
    </div>
  );
}

function MultiLang({ ko, en, jp }: { ko?: string; en?: string; jp?: string }) {
  return (
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
  );
}

export default function MemberDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: TabKey }> }) {
  const router = useRouter();
  const { id } = use(params);
  const sp = use(searchParams);
  const [tab, setTab] = useState<TabKey>(sp.tab || 'info');
  const [active, setActive] = useState(true);

  const member = getMemberById(parseInt(id, 10));

  if (!member) {
    return <div className="text-center py-20 text-gray-500">멤버를 찾을 수 없습니다.</div>;
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
        title={member.name}
        breadcrumbItems={[
          { label: '아티스트' },
          { label: '멤버 리스트', href: '/artists/members' },
          { label: member.name },
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
        <button className="h-9 px-4 mb-2 inline-flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
          수정하기
        </button>
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
              <Field label="생성 관리자">{member.createdBy || '-'}</Field>
              <Field label="생성 일시">{member.createdAt || '-'}</Field>
              <Field label="최근 수정자">{member.updatedBy || '-'}</Field>
              <Field label="최근 수정 일시">{member.updatedAt}</Field>
            </div>
          </Section>

          <div className="grid grid-cols-2 gap-4">
            <Section title="프로필 이미지">
              <div className="aspect-square w-full bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                프로필 이미지
              </div>
            </Section>
            <div className="space-y-4">
              <Section title="기본정보">
                <div className="space-y-1">
                  <Field label="소속사">{member.agency || '소속사 없음'}</Field>
                  <Field label="생년월일">{member.birthday}</Field>
                  <Field label="키(CM)">{member.heightCm ?? '-'}</Field>
                </div>
              </Section>
              <Section title="멤버명">
                <div className="space-y-1">
                  <Field label="한국어">{member.nameKO || member.name}</Field>
                  <Field label="영어">{member.nameEN || '-'}</Field>
                  <Field label="일본어">{member.nameJP || '-'}</Field>
                </div>
              </Section>
            </div>
          </div>

          <Section title="추가정보">
            <div className="space-y-1">
              <Field label="몸무게(kg)">{member.weightKg ?? '-'}</Field>
              <Field label="별자리">{member.zodiac || '-'}</Field>
            </div>
          </Section>

          <Section title="멤버 소개">
            <MultiLang ko={member.introKO} en={member.introEN} jp={member.introJP} />
          </Section>

          <Section title="인사말">
            <MultiLang ko={member.greetingKO} en={member.greetingEN} jp={member.greetingJP} />
          </Section>

          <Section title="취미">
            <MultiLang ko={member.hobbyKO} en={member.hobbyEN} jp={member.hobbyJP} />
          </Section>

          <Section title="좌우명">
            <MultiLang ko={member.mottoKO} en={member.mottoEN} jp={member.mottoJP} />
          </Section>
        </div>
      )}

      {tab === 'groups' && (
        <Section title="소속 그룹">
          {member.groups && member.groups.length > 0 ? (
            <div className="space-y-3">
              {member.groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => router.push(`/artists/groups/${g.id}?tab=info`)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{g.name}</span>
                    {g.isMain && <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">메인</span>}
                  </div>
                  <span className="text-sm text-gray-500">{g.position}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">소속된 그룹이 없습니다.</p>
          )}
        </Section>
      )}
    </div>
  );
}
