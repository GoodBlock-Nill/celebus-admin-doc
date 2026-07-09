"use client";

import { useEffect, useState } from "react";
import { FileText, Sparkles, Siren, Star, Gift, Truck, ArrowRight, MessageSquare } from "lucide-react";
import type { AdminStats } from "@/lib/admin-types";
import type { AdminTab } from "./tabs";

export default function Overview({ headers, onNavigate }: { headers: () => Record<string, string>; onNavigate: (t: AdminTab) => void }) {
  const [s, setS] = useState<AdminStats | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/stats", { headers: headers() });
      if (res.ok) setS(await res.json());
    })();
  }, [headers]);

  const cards = [
    { icon: FileText, label: "총 글", value: s?.total, tone: "text-fg" },
    { icon: Sparkles, label: "오늘 신규", value: s?.today, tone: "text-primary-400" },
    { icon: Siren, label: "신고 대기", value: s?.reported, tone: (s?.reported ?? 0) > 0 ? "text-danger" : "text-muted" },
    { icon: Star, label: "채택", value: s?.curated, tone: "text-amber-300" },
    { icon: MessageSquare, label: "댓글 신고", value: s?.commentsReported, tone: (s?.commentsReported ?? 0) > 0 ? "text-danger" : "text-muted" },
    { icon: Gift, label: "발표 총", value: s?.prizeTotal, tone: "text-fg" },
    { icon: Truck, label: "배송 대기", value: s?.shippingPending, tone: (s?.shippingPending ?? 0) > 0 ? "text-emerald-400" : "text-muted" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-1 flex items-center gap-1.5 text-[12px] text-muted">
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </div>
            <div className={`text-2xl font-black ${c.tone}`}>{c.value ?? "–"}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => onNavigate("moderation")}
          className="flex items-center justify-between rounded-2xl border border-danger/30 bg-danger/5 p-4 text-left transition-colors hover:bg-danger/10"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-danger"><Siren className="h-4 w-4" /> 신고함 처리하기</span>
          <span className="flex items-center gap-1 text-xs text-muted">{s?.reported ?? 0}건 <ArrowRight className="h-3.5 w-3.5" /></span>
        </button>
        <button
          onClick={() => onNavigate("rewards")}
          className="flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 text-left transition-colors hover:bg-amber-400/10"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-amber-300"><Gift className="h-4 w-4" /> 보상 관리하기</span>
          <span className="flex items-center gap-1 text-xs text-muted">배송 대기 {s?.shippingPending ?? 0} <ArrowRight className="h-3.5 w-3.5" /></span>
        </button>
      </div>
    </div>
  );
}
