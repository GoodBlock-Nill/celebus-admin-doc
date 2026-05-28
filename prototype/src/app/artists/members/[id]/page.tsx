'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SimpleTable from '@/components/clone/SimpleTable';
import { getMemberById, getGroupById } from '@/mock/artists';

const TABS = [
  { key: 'info', label: '기본정보' },
  { key: 'groups', label: '소속그룹' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function LangCard({ title, items }: { title: string; items: { lang: string; value: string; max: number }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.lang} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">{it.lang}</span>
              <span className="text-xs text-gray-400">{it.value ? it.value.length : 0}/{it.max}</span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{it.value || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function MemberDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: TabKey }> }) {
  const router = useRouter();
  const { id } = use(params);
  const sp = use(searchParams);
  const [tab, setTab] = useState<TabKey>(sp.tab === 'groups' ? 'groups' : 'info');
  const [active, setActive] = useState(true);
  const [groupKeyword, setGroupKeyword] = useState('');

  const member = getMemberById(parseInt(id, 10));
  if (!member) return <div className="text-center py-20 text-gray-500">멤버를 찾을 수 없습니다.</div>;

  const handleTab = (k: TabKey) => {
    setTab(k);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', k);
    window.history.replaceState({}, '', url.toString());
  };

  const genderLabel = member.gender === '여자' ? '여성' : member.gender === '남자' ? '남성' : member.gender;

  // 소속그룹: member.groups → 그룹 조회로 컬럼 보강
  const groupRows = (member.groups ?? []).map((g) => {
    const full = getGroupById(g.id);
    return {
      id: g.id,
      status: full?.status ?? 'Active',
      name: g.name,
      position: g.position || '-',
      memberCount: full?.memberCount ?? '-',
      description: full?.description ?? '-',
      updatedAt: full?.updatedAt ?? '-',
    };
  }).filter((r) => (groupKeyword ? r.name.includes(groupKeyword) : true));

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Breadcrumb customItems={[{ label: '아티스트' }, { label: '멤버 리스트', href: '/artists/members' }, { label: member.name }]} />
        <div className="flex items-start justify-between mt-2">
          <div>
            <p className="text-sm text-gray-500 mb-1">아티스트 멤버</p>
            <h1 className="text-[28px] font-bold text-gray-900">{member.name}</h1>
          </div>
          <button
            onClick={() => router.push(`/artists/members/${id}/edit`)}
            className="h-10 px-4 inline-flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >수정하기</button>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'info' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
            {/* 멤버 상태 */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">멤버 상태</h2>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-pink-200 to-purple-200 mb-4 flex items-center justify-center text-gray-500 text-sm">프로필</div>
              <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2.5 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">운영 상태</p>
                  <p className="text-xs text-gray-500">{active ? '노출 중' : '비노출'}</p>
                </div>
                <button onClick={() => setActive(!active)} role="switch" aria-checked={active}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <dl className="space-y-2.5 text-sm">
                {[['생성 관리자', member.createdBy || '-'], ['생성 일시', member.createdAt || '-'], ['최근 수정자', member.updatedBy || '-'], ['최근 수정 일시', member.updatedAt]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium text-gray-900">{v}</dd></div>
                ))}
              </dl>
            </div>

            {/* 기본정보 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">기본정보</h2>
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-5">
                {/* 멤버명 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">멤버명</p>
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    <div className="flex items-center justify-between p-3">
                      <span className="text-base font-bold text-gray-900">{member.nameKO || member.name}</span>
                      <span className="text-xs text-gray-400">{(member.nameKO || member.name).length}/100</span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-sm text-gray-700"><span className="text-xs text-gray-400 mr-2">English</span>{member.nameEN || '-'}</span>
                      <span className="text-xs text-gray-400">{(member.nameEN || '').length}/100</span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <span className="text-sm text-gray-700"><span className="text-xs text-gray-400 mr-2">日本語</span>{member.nameJP || '-'}</span>
                      <span className="text-xs text-gray-400">{(member.nameJP || '').length}/100</span>
                    </div>
                  </div>
                </div>
                {/* 프로필 속성 */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">프로필 속성</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Attr label="소속사" value={member.agency || '소속사 없음'} />
                    <Attr label="생년월일" value={member.birthday} />
                    <Attr label="성별" value={genderLabel} />
                    <Attr label="별자리" value={member.zodiac || '-'} />
                    <Attr label="키" value={member.heightCm ? `${member.heightCm}cm` : '-'} />
                    <Attr label="몸무게" value={member.weightKg ? `${member.weightKg}kg` : '-'} />
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <LangCard title="멤버 소개" items={[
                  { lang: '한국어', value: member.introKO || '', max: 255 },
                  { lang: '영어', value: member.introEN || '', max: 255 },
                  { lang: '일본어', value: member.introJP || '', max: 255 },
                ]} />
              </div>
            </div>
          </div>

          <LangCard title="인사말" items={[
            { lang: '한국어', value: member.greetingKO || '', max: 100 },
            { lang: '영어', value: member.greetingEN || '', max: 100 },
            { lang: '일본어', value: member.greetingJP || '', max: 100 },
          ]} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LangCard title="취미" items={[
              { lang: '한국어', value: member.hobbyKO || '', max: 100 },
              { lang: '영어', value: member.hobbyEN || '', max: 100 },
              { lang: '일본어', value: member.hobbyJP || '', max: 100 },
            ]} />
            <LangCard title="좌우명" items={[
              { lang: '한국어', value: member.mottoKO || '', max: 100 },
              { lang: '영어', value: member.mottoEN || '', max: 100 },
              { lang: '일본어', value: member.mottoJP || '', max: 100 },
            ]} />
          </div>
        </div>
      )}

      {tab === 'groups' && (
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
              <input value={groupKeyword} onChange={(e) => setGroupKeyword(e.target.value)} placeholder="그룹명 입력"
                className="h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm w-[260px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button onClick={() => setGroupKeyword('')} className="h-10 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">초기화</button>
          </div>
          <SimpleTable
            columns={[
              { key: 'status', label: '상태', width: '90px', render: (r: typeof groupRows[number]) => (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${r.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
              )},
              { key: 'name', label: '소속 그룹명', width: '200px', render: (r: typeof groupRows[number]) => (
                <button onClick={() => router.push(`/artists/groups/${r.id}?tab=info`)} className="font-medium text-gray-900 hover:text-indigo-600">{r.name}</button>
              )},
              { key: 'position', label: '그룹내 포지션', width: '130px' },
              { key: 'memberCount', label: '멤버 수', width: '90px' },
              { key: 'description', label: '설명', render: (r: typeof groupRows[number]) => <span className="line-clamp-1 text-gray-600">{r.description}</span> },
              { key: 'updatedAt', label: '업데이트 일시', width: '160px' },
            ]}
            rows={groupRows}
            emptyMessage="검색 결과가 없습니다."
          />
        </div>
      )}
    </div>
  );
}
