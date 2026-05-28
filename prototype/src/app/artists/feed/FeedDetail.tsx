'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowTopRightOnSquareIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ConfirmModal from '@/components/clone/ConfirmModal';
import { toast } from '@/components/ui/Toast';
import type { Lang } from '@/components/clone/LangField';
import type { FeedItem, FeedStatus } from '@/mock/feed';

const LANGS: Lang[] = ['KO', 'EN', 'JA'];

const typeBadge: Record<string, string> = {
  소식: 'bg-blue-100 text-blue-700',
  일정: 'bg-violet-100 text-violet-700',
  공지: 'bg-rose-100 text-rose-700',
};

function statusBadge(s: FeedStatus) {
  if (s === '게시') return 'bg-emerald-500 text-white';
  if (s === '임시저장') return 'bg-gray-200 text-gray-600';
  return 'bg-amber-100 text-amber-700';
}

export default function FeedDetail({ item }: { item: FeedItem }) {
  const router = useRouter();
  const [status, setStatus] = useState<FeedStatus>(item.status);
  const [lang, setLang] = useState<Lang>('KO');
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const doPublish = () => { setStatus('게시'); toast.success(`${item.type} '${item.title.KO}'을(를) 게시했습니다.`); };
  const doArchive = () => { setStatus('보관'); toast.success(`${item.type} '${item.title.KO}'을(를) 보관 처리했습니다.`); };

  const LangTab = (
    <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
      {LANGS.map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${lang === l ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}>{l}</button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb customItems={[{ label: '아티스트' }, { label: '소식/일정', href: '/artists/feed' }, { label: item.title.KO }]} />
        <div className="flex items-start justify-between mt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${typeBadge[item.type]}`}>{item.type}</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(status)}`}>{status}</span>
            </div>
            <h1 className="text-[28px] font-bold text-gray-900">{item.title.KO}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/artists/feed/${item.id}/edit`)} className="h-10 px-4 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">수정</button>
            {status === '임시저장' && <button onClick={() => setPublishOpen(true)} className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">게시</button>}
            {status === '게시' && <button onClick={() => setArchiveOpen(true)} className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">보관</button>}
            {status === '보관' && <button onClick={() => setPublishOpen(true)} className="h-10 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">재게시</button>}
            {status !== '게시' && <button onClick={() => setDeleteOpen(true)} className="h-10 px-4 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">삭제</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* 콘텐츠 표시 (읽기 전용) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          {/* 다국어 제목/본문 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{item.type === '일정' ? '일정명' : '제목 · 본문'} <span className="text-gray-400">(언어 전환)</span></p>
              {LangTab}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{item.title[lang] || <span className="text-gray-300 font-normal">({lang} 미입력)</span>}</h2>
            {(item.type === '소식' || item.type === '공지') && (
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{item.body?.[lang] || <span className="text-gray-300">({lang} 미입력)</span>}</p>
            )}
          </div>

          {item.type === '일정' && (
            <dl className="space-y-3 text-sm border-t border-gray-100 pt-5">
              <div className="flex"><dt className="w-24 text-gray-500">일시</dt><dd className="font-medium text-gray-900">{item.date} {item.time}</dd></div>
              <div className="flex"><dt className="w-24 text-gray-500">장소</dt><dd className="font-medium text-gray-900">{item.location || '-'}</dd></div>
            </dl>
          )}

          {item.type === '공지' && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500 mb-2">대표 이미지</p>
              {item.coverImage ? (
                <div className="aspect-video max-w-md rounded-xl bg-gradient-to-br from-purple-300 to-indigo-300 flex items-center justify-center text-white text-sm font-medium">{item.coverImage}</div>
              ) : (
                <div className="aspect-video max-w-md rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                  <PhotoIcon className="w-8 h-8 mb-1" /><span className="text-xs">미등록</span>
                </div>
              )}
            </div>
          )}

          {item.type === '소식' && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500 mb-2">이미지 {item.images && item.images.length > 0 ? `(${item.images.length}장)` : ''}</p>
              {item.images && item.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-w-lg">
                  {item.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-purple-200 to-indigo-200 flex items-center justify-center text-[11px] text-white font-medium text-center p-2 break-all">{img}</div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">미등록</p>}
            </div>
          )}

          {item.type === '소식' && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500 mb-2">연관 콘텐츠</p>
              {item.relatedContents && item.relatedContents.length > 0 ? (
                <div className="space-y-2">
                  {item.relatedContents.map((c, i) => (
                    <a key={i} href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 shrink-0">{c.platform}</span>
                      <span className="text-sm text-gray-800 flex-1 truncate">{c.name}</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">없음</p>}
            </div>
          )}

          {item.type === '공지' && item.ctaLabel && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500 mb-2">CTA 버튼</p>
              <a href={item.ctaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                {item.ctaLabel}<ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* 관리정보 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4">관리정보</h2>
          <dl className="space-y-2.5 text-sm">
            {[
              ['타입', item.type],
              ['연결 아티스트', item.groupName],
              ['공식 출처', item.type === '공지' ? '해당 없음' : (item.official ? '공식' : '미표기')],
              ['상태', status],
              [item.type === '일정' ? '일시' : '게시일', item.type === '일정' ? `${item.date} ${item.time}` : item.date],
              ['조회수', (item.views ?? 0).toLocaleString()],
              ...(item.type === '소식' ? [['좋아요', (item.likes ?? 0).toLocaleString()] as [string, string]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <ConfirmModal isOpen={publishOpen} onClose={() => setPublishOpen(false)} onConfirm={() => { doPublish(); setPublishOpen(false); }} title={status === '보관' ? '재게시할까요?' : '게시할까요?'} lines={['게시 즉시 앱 정보 피드에 노출됩니다.']} confirmLabel={status === '보관' ? '재게시' : '게시'} />
      <ConfirmModal isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} onConfirm={() => { doArchive(); setArchiveOpen(false); }} title="보관할까요?" lines={['앱 노출이 종료됩니다. 데이터는 보존되어 재게시할 수 있습니다.']} confirmLabel="보관" />
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => { toast.success(`${item.type} '${item.title.KO}'을(를) 삭제했습니다.`); router.push('/artists/feed'); }} title="삭제할까요?" lines={['삭제한 콘텐츠는 복구할 수 없습니다.']} confirmLabel="삭제" />
    </div>
  );
}
