"use client";

// 실물 당첨자 관리 — 수령 정보 기본 마스킹([열람]·CSV는 감사 로그), 발송/무효/만료 확정/개인정보 파기.
// 기획: docs/weekly-rank-prize-reward-plan.md §4·§6 (90일 파기 — 당첨 이력은 snapshot으로 유지)
import { useCallback, useEffect, useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { BTN_GHOST, DataTable, TD, fmtDate } from "./ui";

type WinnerRow = {
  id: string;
  status: "pending" | "submitted" | "shipped" | "expired" | "revoked";
  display_expired: boolean;
  claim_deadline: string;
  snapshot: { prize?: { ko?: string }; grade?: string; nickname?: string };
  submitted_at: string | null;
  shipped_at: string | null;
  admin_memo: string | null;
  created_at: string;
  info: { name: string; phone: string; address: string | null; note: string | null; agreed_at: string } | null;
};

const STATUS_LABEL: Record<WinnerRow["status"], string> = {
  pending: "정보 대기",
  submitted: "제출 완료",
  shipped: "발송 완료",
  expired: "기한 만료",
  revoked: "무효",
};

export default function AdminGachaWinners({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WinnerRow[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    (reveal: boolean) =>
      aget<{ winners: WinnerRow[] }>(`/api/admin/gacha/winners?event_id=${eventId}&reveal=${reveal ? 1 : 0}`)
        .then((d) => {
          setRows(d.winners ?? []);
          setRevealed(reveal);
        })
        .catch(() => {}),
    [eventId]
  );
  useEffect(() => {
    void load(false);
  }, [load]);

  const act = async (id: string, action: "ship" | "revoke" | "expire" | "purge_info") => {
    if (busy) return;
    let memo = "";
    if (action === "revoke") {
      memo = window.prompt("무효 사유 (필수) — 관리자 로그에 기록돼요") ?? "";
      if (!memo.trim()) return;
    } else if (action === "ship") {
      memo = window.prompt("송장 번호·전달 메모 (선택)") ?? "";
    } else if (action === "purge_info" && !window.confirm("이 건의 수령 개인정보를 파기할까요? 당첨 이력은 유지돼요.")) {
      return;
    }
    setBusy(true);
    await asend("/api/admin/gacha/winners", "PATCH", { winner_id: id, action, memo }).catch(() => {});
    setBusy(false);
    void load(revealed);
  };

  const csv = () => {
    // 발송 대행용 — 열람 상태의 표시 값 그대로 내보냄 (마스킹 상태면 마스킹된 값. 열람·CSV 모두 감사 로그)
    const head = ["당첨일", "등급", "상품", "닉네임", "상태", "기한", "이름", "연락처", "주소", "요청사항", "메모"];
    const lines = rows.map((r) =>
      [
        fmtDate(r.created_at),
        r.snapshot.grade ?? "",
        r.snapshot.prize?.ko ?? "",
        r.snapshot.nickname || "익명",
        STATUS_LABEL[r.status],
        fmtDate(r.claim_deadline),
        r.info?.name ?? "",
        r.info?.phone ?? "",
        r.info?.address ?? "",
        r.info?.note ?? "",
        r.admin_memo ?? "",
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gacha-winners-${eventId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-muted">실물 당첨자 {rows.length}건</span>
        <div className="flex gap-2">
          <button onClick={() => void load(!revealed)} className={`${BTN_GHOST} inline-flex items-center gap-1.5`}>
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {revealed ? "마스킹" : "열람 (로그 기록)"}
          </button>
          <button onClick={csv} disabled={rows.length === 0} className={`${BTN_GHOST} inline-flex items-center gap-1.5`}>
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-subtle">아직 실물 당첨자가 없어요.</p>
      ) : (
        <DataTable head={["당첨일", "상품", "닉네임", "상태", "기한", "수령 정보", "액션"]}>
          {rows.map((r) => {
            const actionable = r.status === "pending" || r.status === "submitted";
            return (
              <tr key={r.id}>
                <td className={`${TD} whitespace-nowrap text-[12.5px] text-subtle`}>{fmtDate(r.created_at)}</td>
                <td className={`${TD} whitespace-nowrap font-bold`}>
                  <span className="mr-1 text-gold">{r.snapshot.grade}</span>
                  {r.snapshot.prize?.ko}
                </td>
                <td className={TD}>{r.snapshot.nickname || <span className="text-subtle">익명</span>}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${r.status === "submitted" ? "bg-primary/20 text-primary-400" : r.status === "shipped" ? "bg-gold/15 text-gold" : "bg-surface-2 text-muted"}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.display_expired && actionable && <span className="ml-1 text-[11px] font-bold text-danger">기한 경과</span>}
                </td>
                <td className={`${TD} whitespace-nowrap text-[12.5px] text-subtle`}>{fmtDate(r.claim_deadline)}</td>
                <td className={`${TD} min-w-[180px] text-[12.5px]`}>
                  {r.info ? (
                    <>
                      {r.info.name} · {r.info.phone}
                      {r.info.address && <div className="text-subtle">{r.info.address}</div>}
                      {revealed && r.info.note && <div className="text-subtle">요청: {r.info.note}</div>}
                    </>
                  ) : (
                    <span className="text-subtle">미제출</span>
                  )}
                  {r.admin_memo && <div className="text-[11.5px] text-gold">메모: {r.admin_memo}</div>}
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <div className="flex gap-1.5">
                    {r.status === "submitted" && (
                      <button onClick={() => void act(r.id, "ship")} disabled={busy} className={BTN_GHOST}>
                        발송 완료
                      </button>
                    )}
                    {actionable && r.display_expired && (
                      <button onClick={() => void act(r.id, "expire")} disabled={busy} className={BTN_GHOST}>
                        만료 확정
                      </button>
                    )}
                    {r.status !== "shipped" && r.status !== "revoked" && (
                      <button onClick={() => void act(r.id, "revoke")} disabled={busy} className={`${BTN_GHOST} text-danger`}>
                        무효
                      </button>
                    )}
                    {["shipped", "expired", "revoked"].includes(r.status) && r.info && (
                      <button onClick={() => void act(r.id, "purge_info")} disabled={busy} className={`${BTN_GHOST} text-danger`}>
                        정보 파기
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
      <p className="mt-2 text-[12px] leading-relaxed text-subtle">
        수령 정보는 기본 마스킹돼요. [열람]·CSV 사용은 관리자 로그에 남아요. 발송·만료·무효 후 90일이 지난 건은 [정보 파기]로
        개인정보를 삭제해 주세요 (당첨 이력은 유지).
      </p>
    </div>
  );
}
