'use client';

import { toast } from '@/components/ui/Toast';
import {
  cheererCount, avgCheer, achieveRate,
  type SupportEvent, type SupportStatus,
} from '@/mock/support';
import SupportForm, { type EditableScope } from './SupportForm';

// 상태 → 수정 가능 범위 — [CEB-BO-SUP-201] §3.1
function scopeOf(status: SupportStatus): EditableScope {
  if (status === '임시저장') return 'all';
  if (status === '모집중') return 'limited';
  return 'none';
}

export default function InfoTab({
  event, status, onEditingChange,
}: {
  event: SupportEvent;
  status: SupportStatus;
  onEditingChange?: (editing: boolean) => void;
}) {
  const scope = scopeOf(status);
  const showStats = status !== '임시저장';

  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="응원자 수" value={`${cheererCount(event).toLocaleString()}명`} />
          <StatCard label="누적 응원" value={`${event.accumulatedDuk.toLocaleString()} 덕력`} />
          <StatCard label="평균 응원량" value={`${avgCheer(event).toLocaleString()} 덕력`} />
          <StatCard label="달성률" value={`${achieveRate(event)}%`} highlight={achieveRate(event) >= 100} />
        </div>
      )}

      <SupportForm
        mode="edit"
        initial={event}
        editableScope={scope}
        onEditingChange={onEditingChange}
        onSaved={() => toast.success('저장되었습니다.')}
      />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}
