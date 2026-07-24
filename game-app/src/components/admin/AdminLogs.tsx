"use client";

// 관리자 액션 감사 로그 (최근 100)
import { useEffect, useState } from "react";
import { aget } from "@/lib/admin-api";
import { Card, fmtDate } from "./ui";

type Log = { action: string; target: string | null; detail: unknown; created_at: string };

const ACTION_LABEL: Record<string, string> = {
  sanction: "제재",
  delete_scores: "기록 삭제",
  adjust_point: "CP 조정",
  banned_add: "금칙어 추가",
  banned_remove: "금칙어 삭제",
  config_update: "설정 변경",
  catalog_update: "가격 변경",
};

export default function AdminLogs() {
  const [rows, setRows] = useState<Log[]>([]);
  useEffect(() => {
    aget<Log[]>("/api/admin/logs").then(setRows).catch(() => {});
  }, []);
  return (
    <Card title="감사 로그 (최근 100)">
      <div className="flex flex-col gap-1">
        {rows.map((l, i) => (
          <div key={i} className="flex items-start gap-2 rounded-[8px] bg-surface-2 px-2.5 py-1.5 text-[11.5px]">
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 font-bold text-primary-400">
              {ACTION_LABEL[l.action] ?? l.action}
            </span>
            <span className="min-w-0 flex-1 break-all text-muted">
              {l.target ? `${l.target.slice(0, 16)}… ` : ""}
              {l.detail ? JSON.stringify(l.detail) : ""}
            </span>
            <span className="shrink-0 text-subtle">{fmtDate(l.created_at)}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="py-6 text-center text-[12px] text-subtle">기록 없음</p>}
      </div>
    </Card>
  );
}
