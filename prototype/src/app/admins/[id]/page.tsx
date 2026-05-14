'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { getAdminById, getAdminLogs, type ActivityLog } from '@/mock/admins';

const PAGE_SIZE = 10;

export default function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const adminId = parseInt(id, 10);
  const admin = getAdminById(adminId);
  const router = useRouter();

  const [active, setActive] = useState(admin?.active ?? false);
  const [majorFilter, setMajorFilter] = useState('all');
  const [middleFilter, setMiddleFilter] = useState('all');
  const [minorFilter, setMinorFilter] = useState('all');
  const [logKeyword, setLogKeyword] = useState('');
  const [ipKeyword, setIpKeyword] = useState('');
  const [page, setPage] = useState(1);

  if (!admin) return <div className="p-8 text-sm text-gray-500">관리자를 찾을 수 없습니다.</div>;

  const allLogs = getAdminLogs(adminId);
  const filtered = allLogs
    .filter((l) => (majorFilter === 'all' ? true : l.major === majorFilter))
    .filter((l) => (middleFilter === 'all' ? true : l.middle === middleFilter))
    .filter((l) => (minorFilter === 'all' ? true : l.minor === minorFilter))
    .filter((l) => (logKeyword ? l.message.includes(logKeyword) : true))
    .filter((l) => (ipKeyword ? l.ip.includes(ipKeyword) : true));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbItems={[
          { label: '관리자' },
          { label: '관리자 리스트', href: '/admins/list' },
          { label: '관리자 상세' },
        ]}
      />

      <div className="flex items-center justify-between -mt-2 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <h1 className="text-[24px] font-bold text-gray-900">관리자 상세 ({admin.name})</h1>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            admin.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
          }`}>{admin.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            비밀번호 재설정 메일발송
          </button>
          <button className="h-10 px-4 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            수정하기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">기본정보</h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <Row label="관리자명" value={admin.name} />
            <Row label="이메일" value={admin.email} />
            <Row label="등록일시" value={admin.registeredAt} />
            <Row label="최근 로그인" value={admin.lastLoginAt} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">계정 상태 및 권한</h4>
          <div className="space-y-3 text-sm">
            <Row label="권한" value={admin.permission} />
            <div className="flex items-center justify-between">
              <span className="text-gray-500">현재 상태</span>
              <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700">{admin.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">계정 활성화</span>
              <button
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-indigo-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">활동 로그</h4>

        <div className="grid grid-cols-[140px_140px_140px_1fr_180px_140px] gap-3 mb-3">
          <FilterSelect label="대분류" value={majorFilter} onChange={setMajorFilter} options={['all', '인증', '회원', '게임존']} />
          <FilterSelect label="중분류" value={middleFilter} onChange={setMiddleFilter} options={['all', '계정', '게임 관리']} />
          <FilterSelect label="소분류" value={minorFilter} onChange={setMinorFilter} options={['all', '로그인', '생성', '수정']} />
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={logKeyword}
              onChange={(e) => { setLogKeyword(e.target.value); setPage(1); }}
              placeholder="로그"
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={ipKeyword}
              onChange={(e) => { setIpKeyword(e.target.value); setPage(1); }}
              placeholder="IP 검색"
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600">일시</div>
        </div>

        <SimpleTable<ActivityLog>
          columns={[
            { key: 'major', label: '대분류', width: '110px' },
            { key: 'middle', label: '중분류', width: '110px' },
            { key: 'minor', label: '소분류', width: '110px' },
            { key: 'message', label: '로그' },
            { key: 'ip', label: 'IP', width: '160px' },
            { key: 'createdAt', label: '일시', width: '140px' },
          ]}
          rows={paged}
          emptyMessage="활동 로그가 없습니다."
        />

        <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right break-all">{value}</span>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer">
        {options.map((o) => (
          <option key={o} value={o}>{o === 'all' ? `${label} (전체)` : o}</option>
        ))}
      </select>
      <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
