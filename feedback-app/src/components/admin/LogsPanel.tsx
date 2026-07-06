"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";
import type { AdminLog } from "@/lib/admin-types";

const ACTION_LABEL: Record<string, string> = {
  hide: "숨김", unhide: "숨김 해제", delete: "삭제", curate: "채택", pin: "고정",
  status: "실현상태", reply: "공식답글", draw: "추첨", prize_create: "굿즈 등록",
  prize_ship: "발송완료", prize_delete: "발표 삭제", update: "수정",
};

export default function LogsPanel({ headers }: { headers: () => Record<string, string> }) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/logs", { headers: headers() });
      if (res.ok) setLogs((await res.json()).logs ?? []);
      setLoading(false);
    })();
  }, [headers]);

  if (loading) return <p className="py-8 text-center text-sm text-muted">불러오는 중…</p>;
  if (logs.length === 0) {
    return (
      <p className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        <ScrollText className="h-6 w-6" /> 활동 로그가 없어요.
        <span className="text-[11px]">(로그 테이블 미설정 시 <code>005_admin_log.sql</code> 실행 후 기록됩니다)</span>
      </p>
    );
  }

  return (
    <div className="grid gap-1.5">
      {logs.map((l) => (
        <div key={l.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[12px]">
          <span className="rounded bg-card-2 px-1.5 py-0.5 font-bold text-fg">{ACTION_LABEL[l.action] ?? l.action}</span>
          <span className="min-w-0 flex-1 truncate text-muted">{l.detail ?? "—"}</span>
          <span className="shrink-0 text-[11px] text-muted">{format(new Date(l.created_at), "MM.dd HH:mm")}</span>
        </div>
      ))}
    </div>
  );
}
