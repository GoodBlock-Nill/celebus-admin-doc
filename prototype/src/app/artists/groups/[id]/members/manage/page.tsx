'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SimplePagination from '@/components/clone/SimplePagination';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { getGroupById, getGroupMembers, artistMembers, artistPositions } from '@/mock/artists';

const LEFT_PAGE = 10;

interface Row { id: number; name: string; gender: string; birthday: string; position: string; isNew?: boolean }

export default function GroupMemberManagePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const gid = parseInt(id, 10);
  const group = getGroupById(gid);

  const initialRight: Row[] = useMemo(
    () => getGroupMembers(gid).map((m) => ({ id: m.id, name: m.name, gender: m.gender, birthday: m.birthday, position: m.position || '미선택' })),
    [gid]
  );

  const [right, setRight] = useState<Row[]>(initialRight);
  const [keyword, setKeyword] = useState('');
  const [leftPage, setLeftPage] = useState(1);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  if (!group) return <div className="text-center py-20 text-gray-500">그룹을 찾을 수 없습니다.</div>;

  const rightIds = new Set(right.map((r) => r.id));
  const pool = artistMembers
    .filter((m) => !rightIds.has(m.id))
    .filter((m) => (keyword ? m.name.includes(keyword) : true));
  const leftTotalPages = Math.ceil(pool.length / LEFT_PAGE);
  const leftPaged = pool.slice((leftPage - 1) * LEFT_PAGE, leftPage * LEFT_PAGE);

  const add = (m: typeof artistMembers[number]) =>
    setRight((prev) => [...prev, { id: m.id, name: m.name, gender: m.gender, birthday: m.birthday, position: '미선택', isNew: true }]);
  const remove = (rid: number) => setRight((prev) => prev.filter((r) => r.id !== rid));
  const setPosition = (rid: number, pos: string) => setRight((prev) => prev.map((r) => (r.id === rid ? { ...r, position: pos } : r)));

  const back = () => router.push(`/artists/groups/${gid}?tab=members`);

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={[{ label: '아티스트' }, { label: '그룹리스트', href: '/artists/groups' }, { label: '그룹 상세', href: `/artists/groups/${gid}?tab=info` }, { label: '멤버 관리' }]} />
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-[28px] font-bold text-gray-900">{group.name} <span className="text-gray-400 font-normal">| 멤버 관리</span></h1>
          <div className="flex gap-2">
            <button onClick={() => setCancelOpen(true)} className="h-10 px-4 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100">취소하기</button>
            <button onClick={() => setSaveOpen(true)} className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">수정하기</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 items-start">
        {/* 좌: 전체 멤버 풀 */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-gray-100">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setLeftPage(1); }}
                placeholder="멤버명 입력"
                className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button onClick={() => { setKeyword(''); setLeftPage(1); }} className="h-9 px-3 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800">초기화</button>
          </div>
          <table className="w-full">
            <thead className="bg-indigo-50/60">
              <tr>
                {['멤버명', '성별', '생년월일', '관리'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leftPaged.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{m.gender}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{m.birthday}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => add(m)} className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 inline-flex items-center justify-center" aria-label="추가">
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {leftPaged.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">검색 결과가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
          <SimplePagination page={leftPage} totalPages={leftTotalPages || 1} onChange={setLeftPage} />
        </div>

        {/* 우: 그룹 소속 멤버 */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-indigo-50/60">
              <tr>
                {['멤버명', '포지션', '성별', '생년월일', '관리'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {right.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                    {r.name}
                    {r.isNew && <span className="ml-1.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700">NEW</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="relative">
                      <select
                        value={r.position}
                        onChange={(e) => setPosition(r.id, e.target.value)}
                        className="h-8 pl-2.5 pr-7 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[130px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="미선택">미선택</option>
                        {artistPositions.map((p) => (
                          <option key={p.id} value={p.nameKO}>{p.nameKO}</option>
                        ))}
                      </select>
                      <ChevronUpDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{r.gender}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{r.birthday}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => remove(r.id)} className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 inline-flex items-center justify-center" aria-label="제거">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {right.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">소속 멤버가 없습니다. 좌측에서 추가하세요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal isOpen={saveOpen} onClose={() => setSaveOpen(false)} onConfirm={() => { setSaveOpen(false); back(); }}
        title="그룹멤버 수정" lines={['확인 버튼을 누르면 수정사항이 적용됩니다', '계속 진행하시겠습니까?']} />
      <ConfirmModal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); back(); }}
        title="그룹멤버 수정 취소" lines={['수정된 데이터는 저장되지 않습니다', '계속 진행하시겠습니까?']} />
    </div>
  );
}
