'use client';

import { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';
import PageHeader from '@/components/layout/PageHeader';
import SimpleTable from '@/components/clone/SimpleTable';
import SimplePagination from '@/components/clone/SimplePagination';
import { rejectionReasons as initialReasons, type RejectionReason } from '@/mock/fanquest';

type StatusFilter = 'all' | 'Active' | 'Inactive';

export default function RejectReasonsPage() {
  const [reasons, setReasons] = useState<RejectionReason[]>(initialReasons);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RejectionReason | null>(null);

  const PAGE_SIZE = 10;
  const filtered = reasons.filter((r) => statusFilter === 'all' ? true : r.status === statusFilter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = (payload: Omit<RejectionReason, 'id' | 'status'>) => {
    const next: RejectionReason = {
      ...payload,
      id: Math.max(0, ...reasons.map((r) => r.id)) + 1,
      status: 'Active',
    };
    setReasons([...reasons, next]);
    setAddOpen(false);
  };

  const handleSave = (updated: RejectionReason) => {
    setReasons(reasons.map((r) => r.id === updated.id ? updated : r));
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="반려사유 설정"
        breadcrumbItems={[
          { label: '팬퀘스트', href: '/fanquest' },
          { label: '반려사유 설정' },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className="h-10 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">상태(전체)</option>
            <option value="Active">사용</option>
            <option value="Inactive">미사용</option>
          </select>
          <ChevronUpDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="h-10 px-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />새 사유 추가
        </button>
      </div>

      <SimpleTable<RejectionReason>
        columns={[
          { key: 'status', label: '상태', width: '120px', render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {r.status === 'Active' ? '사용' : '미사용'}
            </span>
          )},
          { key: 'displayName', label: '운영자 노출명', render: (r) => <span className="text-gray-900">{r.displayName}</span> },
        ]}
        rows={paged}
        emptyMessage="검색 결과가 없습니다."
        onRowClick={(r) => setEditing(r)}
      />

      <SimplePagination page={page} totalPages={totalPages} onChange={setPage} />

      {addOpen && (
        <ReasonAddModal
          onClose={() => setAddOpen(false)}
          onSubmit={handleAdd}
        />
      )}
      {editing && (
        <ReasonEditModal
          reason={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 모달: 반려사유 추가 (FQ-101-MD-ADD)
// ─────────────────────────────────────────────

const LANGS = ['KO', 'EN', 'JA'] as const;
type Lang = typeof LANGS[number];

function ReasonAddModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: Omit<RejectionReason, 'id' | 'status'>) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [lang, setLang] = useState<Lang>('KO');
  const [messages, setMessages] = useState<Record<Lang, string>>({ KO: '', EN: '', JA: '' });

  const canSubmit = displayName.trim().length > 0 && messages.KO.trim().length > 0;

  return (
    <ModalShell title="반려사유 추가" onClose={onClose}>
      <div className="px-6 py-5 space-y-5">
        <LabeledField label="운영자 노출명" required>
          <TextWithCounter
            value={displayName}
            onChange={setDisplayName}
            placeholder="운영자 노출명 입력"
            maxLength={100}
          />
        </LabeledField>

        <LabeledField label="유저 노출 메시지" required>
          <LangRadioGroup active={lang} onChange={setLang} values={messages} />
          <TextareaWithCounter
            value={messages[lang]}
            onChange={(v) => setMessages({ ...messages, [lang]: v })}
            placeholder="유저 노출 메시지 입력"
            maxLength={200}
            rows={4}
          />
          <LangProgress values={messages} />
        </LabeledField>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          취소하기
        </button>
        <button
          disabled={!canSubmit}
          onClick={() => onSubmit({
            displayName,
            userMessageKO: messages.KO,
            userMessageEN: messages.EN,
            userMessageJA: messages.JA,
          })}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          추가하기
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────
// 모달: 반려사유 수정 (FQ-101-MD-EDIT)
// ─────────────────────────────────────────────

function ReasonEditModal({
  reason,
  onClose,
  onSubmit,
}: {
  reason: RejectionReason;
  onClose: () => void;
  onSubmit: (updated: RejectionReason) => void;
}) {
  const [displayName, setDisplayName] = useState(reason.displayName);
  const [lang, setLang] = useState<Lang>('KO');
  const [messages, setMessages] = useState<Record<Lang, string>>({
    KO: reason.userMessageKO,
    EN: reason.userMessageEN,
    JA: reason.userMessageJA,
  });
  const [status, setStatus] = useState<'Active' | 'Inactive'>(reason.status);

  const canSubmit = displayName.trim().length > 0 && messages.KO.trim().length > 0;

  return (
    <ModalShell title="반려사유 수정" onClose={onClose}>
      <div className="px-6 py-5 space-y-5">
        <LabeledField label="운영자 노출명" required>
          <TextWithCounter
            value={displayName}
            onChange={setDisplayName}
            placeholder="운영자 노출명 입력"
            maxLength={100}
          />
        </LabeledField>

        <LabeledField label="유저 노출 메시지" required>
          <LangRadioGroup active={lang} onChange={setLang} values={messages} />
          <TextareaWithCounter
            value={messages[lang]}
            onChange={(v) => setMessages({ ...messages, [lang]: v })}
            placeholder="유저 노출 메시지 입력"
            maxLength={200}
            rows={4}
          />
          <LangProgress values={messages} />
        </LabeledField>

        <LabeledField label="상태설정">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full h-11 pl-3 pr-9 border border-gray-200 rounded-lg text-sm bg-white appearance-none cursor-pointer"
            >
              <option value="Active">사용</option>
              <option value="Inactive">미사용</option>
            </select>
            <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
            미사용 처리된 반려사유는 검수 화면에서 노출되지 않습니다.
          </p>
        </LabeledField>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="h-10 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          취소하기
        </button>
        <button
          disabled={!canSubmit}
          onClick={() => onSubmit({
            ...reason,
            displayName,
            userMessageKO: messages.KO,
            userMessageEN: messages.EN,
            userMessageJA: messages.JA,
            status,
          })}
          className="h-10 px-5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          저장하기
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────
// 공용 컴포넌트
// ─────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
      {children}
    </div>
  );
}

function LabeledField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextWithCounter({ value, onChange, placeholder, maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength: number }) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="text-right text-xs text-gray-400 mt-1">{value.length}/{maxLength}자</div>
    </div>
  );
}

function TextareaWithCounter({ value, onChange, placeholder, maxLength, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength: number; rows: number }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="text-right text-xs text-gray-400 mt-1">{value.length}/{maxLength}자</div>
    </div>
  );
}

function LangRadioGroup({ active, onChange, values }: { active: Lang; onChange: (l: Lang) => void; values: Record<Lang, string> }) {
  const labels: Record<Lang, string> = { KO: '한국어(기본값)', EN: '영어', JA: '일본어' };
  return (
    <div className="flex items-center gap-4 mb-3">
      {LANGS.map((l) => (
        <label key={l} className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={active === l}
            onChange={() => onChange(l)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm text-gray-700">{labels[l]}</span>
        </label>
      ))}
    </div>
  );
}

function LangProgress({ values }: { values: Record<Lang, string> }) {
  return (
    <div className="flex items-center gap-2 mt-2 text-[11px] font-medium">
      {LANGS.map((l) => (
        <span key={l} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
          values[l].trim() ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 bg-gray-50'
        }`}>
          {l}{values[l].trim() && ' ✓'}
        </span>
      ))}
    </div>
  );
}
