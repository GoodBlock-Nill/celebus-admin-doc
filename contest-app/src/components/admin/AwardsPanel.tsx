"use client";

// 심사·수상·배송 관리: 인기상 확정(finalize) + 심사상 등록 + 클레임/배송
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, Trophy } from "lucide-react";
import type { AwardRow, ContestRow, EntryRow } from "@/lib/admin-types";
import { adminFetch } from "@/lib/admin-types";

export default function AwardsPanel({ contests }: { contests: ContestRow[] }) {
  const judgeable = contests.filter((c) => ["judging", "announced", "closed"].includes(c.status));
  const [contestId, setContestId] = useState(judgeable[0]?.id ?? "");
  const contest = contests.find((c) => c.id === contestId);
  const [awards, setAwards] = useState<AwardRow[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [showInfo, setShowInfo] = useState<Record<string, boolean>>({});

  // finalize 폼: "인기상 1위:상품, 인기상 2위:상품" 줄 단위
  const [finalizeText, setFinalizeText] = useState("인기상 1위:V01D 싸인 앨범\n인기상 2위:\n인기상 3위:");
  // 심사상 폼
  const [judgeEntry, setJudgeEntry] = useState("");
  const [judgeName, setJudgeName] = useState("심사상");
  const [judgePrize, setJudgePrize] = useState("");

  const load = useCallback(async () => {
    if (!contestId) return;
    const [aRes, eRes] = await Promise.all([
      adminFetch(`/api/admin/awards?contest_id=${contestId}`),
      adminFetch(`/api/admin/entries?contest_id=${contestId}`),
    ]);
    setAwards((await aRes.json()).awards ?? []);
    setEntries((await eRes.json()).entries ?? []);
  }, [contestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasPopular = awards.some((a) => a.award_type === "popular");

  async function finalize() {
    const list = finalizeText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [award_name, prize = ""] = l.split(":");
        return { award_name: award_name.trim(), prize: prize.trim() };
      });
    if (!list.length) return toast.error("수상 항목을 입력하세요");
    if (!confirm(`인기상 ${list.length}개를 현재 득표순으로 확정할까요?\n확정 후에는 되돌릴 수 없어요.`)) return;
    const res = await adminFetch(`/api/admin/contests/${contestId}/finalize`, {
      method: "POST",
      body: JSON.stringify({ awards: list }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "확정 실패");
    toast.success(`인기상 ${data.count}건 확정`);
    void load();
  }

  async function addJudge() {
    if (!judgeEntry) return toast.error("출품작을 선택하세요");
    const res = await adminFetch("/api/admin/awards", {
      method: "POST",
      body: JSON.stringify({ contest_id: contestId, entry_id: judgeEntry, award_name: judgeName, prize: judgePrize }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "등록 실패");
    toast.success("심사상 등록");
    setJudgeEntry("");
    void load();
  }

  async function patchAward(a: AwardRow, body: Record<string, unknown>, msg: string) {
    const res = await adminFetch(`/api/admin/awards/${a.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) return toast.error("처리 실패");
    toast.success(msg);
    void load();
  }

  async function removeAward(a: AwardRow) {
    if (!confirm(`'${a.award_name} @${a.handle}' 수상을 취소할까요?`)) return;
    const res = await adminFetch(`/api/admin/awards/${a.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("취소 실패");
    toast.success("수상 취소");
    void load();
  }

  function exportCsv() {
    const rows = awards
      .filter((a) => a.claim_info)
      .map((a) =>
        [a.award_name, a.handle, a.prize, a.claim_info?.name, a.claim_info?.phone, a.claim_info?.email, a.claim_info?.address, a.claim_info?.memo ?? "", a.claim_status]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      );
    const csv = ["수상,핸들,상품,수령자,연락처,이메일,주소,메모,상태", ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `awards-${contest?.slug ?? "contest"}.csv`;
    a.click();
  }

  if (!judgeable.length) {
    return <p className="py-10 text-center text-[13px] text-muted">심사 단계(judging 이후) 콘테스트가 없어요</p>;
  }

  const candidates = entries
    .filter((e) => !e.hidden && !e.disqualified)
    .sort((a, b) => b.vote_count - a.vote_count);

  return (
    <div className="space-y-4">
      <select value={contestId} onChange={(e) => setContestId(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-[12px]">
        {judgeable.map((c) => (
          <option key={c.id} value={c.id}>
            [{c.status}] {c.title}
          </option>
        ))}
      </select>

      {/* 인기상 확정 */}
      {contest?.status === "judging" && !hasPopular && (
        <div className="rounded-2xl border border-gold/40 bg-card p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-[14px] font-black">
            <Trophy className="h-4 w-4 text-gold" /> 인기상 확정 (득표순 snapshot)
          </h3>
          <p className="mb-2 text-[11.5px] text-muted">한 줄 = 1순위. 형식: 상 이름:상품 (위→아래 = 1위→N위)</p>
          <textarea value={finalizeText} onChange={(e) => setFinalizeText(e.target.value)} rows={3} className="mb-2 w-full rounded-lg border border-border bg-bg px-2.5 py-2 font-mono text-[12px] outline-none" />
          {/* 현재 순위 미리보기 */}
          <div className="mb-3 rounded-xl bg-bg p-2 text-[11.5px] text-muted">
            {candidates.slice(0, 5).map((e, i) => (
              <p key={e.id}>
                {i + 1}위 · {e.vote_count}표 · @{e.handle} — {e.title}
              </p>
            ))}
            {!candidates.length && <p>후보 출품작 없음</p>}
          </div>
          <button onClick={finalize} className="w-full rounded-full bg-gold py-2 text-[13px] font-black text-black">
            인기상 확정
          </button>
        </div>
      )}

      {/* 심사상 등록 */}
      {contest?.status === "judging" && (
        <div className="rounded-2xl border border-primary/40 bg-card p-4">
          <h3 className="mb-2 text-[14px] font-black">🎖 심사상 등록</h3>
          <div className="space-y-2">
            <select value={judgeEntry} onChange={(e) => setJudgeEntry(e.target.value)} className="w-full rounded-lg border border-border bg-bg px-2 py-2 text-[12px]">
              <option value="">출품작 선택...</option>
              {candidates.map((e) => (
                <option key={e.id} value={e.id}>
                  @{e.handle} — {e.title} ({e.vote_count}표)
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input value={judgeName} onChange={(e) => setJudgeName(e.target.value)} placeholder="상 이름" className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-2 text-[12px] outline-none" />
              <input value={judgePrize} onChange={(e) => setJudgePrize(e.target.value)} placeholder="상품" className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-2 text-[12px] outline-none" />
              <button onClick={addJudge} className="rounded-lg bg-primary px-4 text-[12px] font-black text-white">
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수상·배송 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-black">수상 내역 ({awards.length})</h3>
          {awards.some((a) => a.claim_info) && (
            <button onClick={exportCsv} className="rounded-full border border-border px-3 py-1 text-[11px] font-bold text-muted hover:text-fg">
              배송 CSV 내보내기
            </button>
          )}
        </div>
        {awards.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${a.award_type === "popular" ? "bg-gold/20 text-gold" : "bg-primary/20 text-primary-400"}`}>
                {a.award_type === "popular" ? "인기상" : "심사상"}
              </span>
              <span className="text-[13px] font-bold">{a.award_name}</span>
              <span className="text-[12px] text-muted">@{a.handle}</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    a.claim_status === "shipped"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : a.claim_status === "claimed"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-white/10 text-muted"
                  }`}
                >
                  {a.claim_status === "none" ? "미접수" : a.claim_status === "claimed" ? "접수됨" : "발송완료"}
                </span>
                <button onClick={() => removeAward(a)} aria-label="수상 취소" className="rounded p-1 text-muted hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
            {a.prize && <p className="mt-1 text-[12px] text-muted">🎁 {a.prize}</p>}

            {a.claim_info && (
              <div className="mt-2 rounded-xl bg-bg p-2.5 text-[12px]">
                <button
                  onClick={() => setShowInfo({ ...showInfo, [a.id]: !showInfo[a.id] })}
                  className="mb-1 inline-flex items-center gap-1 font-bold text-muted hover:text-fg"
                >
                  {showInfo[a.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} 배송정보{" "}
                  {showInfo[a.id] ? "가리기" : "보기"}
                </button>
                {showInfo[a.id] ? (
                  <div className="space-y-0.5 text-fg/90">
                    <p>{a.claim_info.name} · {a.claim_info.phone} · {a.claim_info.email}</p>
                    <p>{a.claim_info.address}</p>
                    {a.claim_info.memo && <p className="text-muted">메모: {a.claim_info.memo}</p>}
                  </div>
                ) : (
                  <p className="text-muted">••• (마스킹됨)</p>
                )}
                <div className="mt-2 flex gap-1.5">
                  {a.claim_status === "claimed" && (
                    <button onClick={() => patchAward(a, { claim_status: "shipped" }, "발송 완료 처리")} className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                      발송 완료
                    </button>
                  )}
                  {a.claim_status === "shipped" && (
                    <button
                      onClick={() => confirm("배송정보를 파기할까요? 되돌릴 수 없어요.") && patchAward(a, { purge_claim_info: true }, "배송정보 파기")}
                      className="rounded-full border border-danger/40 px-3 py-1 text-[11px] font-bold text-danger"
                    >
                      개인정보 파기
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {!awards.length && <p className="py-6 text-center text-[12px] text-muted">아직 수상 내역이 없어요</p>}
      </div>
    </div>
  );
}
