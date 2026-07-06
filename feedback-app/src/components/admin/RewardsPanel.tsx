"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Truck, Trash2, Copy, Download, PackageCheck, Gift, Star, Plus } from "lucide-react";
import type { AdminPrize, AdminPost, ClaimInfo } from "@/lib/admin-types";

function shippingRows(prizes: AdminPrize[]) {
  // 배송 대기 = 신청완료(claimed) — 아직 발송 전
  return prizes.filter((p) => p.claim_status === "claimed" && p.claim_info);
}

function toTsv(rows: AdminPrize[]): string {
  const head = ["닉네임", "수령자", "이메일", "연락처", "주소", "메모", "굿즈", "회차"].join("\t");
  const body = rows.map((p) => {
    const c: ClaimInfo = p.claim_info ?? {};
    return [p.nickname, c.name ?? "", c.email ?? "", c.phone ?? "", c.address ?? "", c.memo ?? "", p.prize, p.round].join("\t");
  });
  return [head, ...body].join("\n");
}

function currentLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function RewardsPanel({ headers }: { headers: () => Record<string, string> }) {
  const [prizes, setPrizes] = useState<AdminPrize[]>([]);
  const [curatedPosts, setCuratedPosts] = useState<AdminPost[]>([]);
  const [round, setRound] = useState(currentLabel());
  const [goods, setGoods] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [pr, po] = await Promise.all([
      fetch("/api/admin/prizes", { headers: headers() }),
      fetch("/api/admin/posts?status=curated&sort=recent", { headers: headers() }),
    ]);
    if (pr.ok) setPrizes((await pr.json()).prizes ?? []);
    if (po.ok) setCuratedPosts((await po.json()).posts ?? []);
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const rewardedPostIds = useMemo(() => new Set(prizes.map((p) => p.post_id)), [prizes]);

  async function register(post: AdminPost) {
    const prize = (goods[post.id] ?? "").trim();
    if (!prize) return toast.error("굿즈명을 입력해주세요.");
    if (!round.trim()) return toast.error("회차 라벨을 입력해주세요.");
    const res = await fetch("/api/admin/prizes", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ post_id: post.id, nickname: post.nickname, prize, round: round.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "등록 실패");
    toast.success("보상을 등록했어요. 발표에 노출됩니다.");
    setGoods((g) => ({ ...g, [post.id]: "" }));
    await load();
  }

  async function setStatus(pz: AdminPrize, claim_status: AdminPrize["claim_status"]) {
    const res = await fetch(`/api/admin/prizes/${pz.id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ claim_status }) });
    if (res.ok) setPrizes((arr) => arr.map((x) => (x.id === pz.id ? { ...x, claim_status } : x)));
    else toast.error("처리 실패");
  }

  async function del(pz: AdminPrize) {
    if (!confirm("이 보상을 삭제할까요?")) return;
    const res = await fetch(`/api/admin/prizes/${pz.id}`, { method: "DELETE", headers: headers() });
    if (res.ok) setPrizes((arr) => arr.filter((x) => x.id !== pz.id));
    else toast.error("삭제 실패");
  }

  const pending = useMemo(() => shippingRows(prizes), [prizes]);

  async function copyList() {
    try {
      await navigator.clipboard.writeText(toTsv(pending));
      toast.success("배송 리스트를 복사했어요.");
    } catch {
      toast.error("복사에 실패했어요.");
    }
  }
  function downloadCsv() {
    const csv = toTsv(pending).replace(/\t/g, ",");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fanvoice-shipping-${pending[0]?.round ?? "list"}.csv`;
    a.click();
  }

  // 회차별 그룹 (prizes 는 round desc, created desc)
  const groups = useMemo(() => {
    const m = new Map<string, AdminPrize[]>();
    for (const p of prizes) (m.get(p.round) ?? m.set(p.round, []).get(p.round)!).push(p);
    return Array.from(m.entries());
  }, [prizes]);

  const inp = "rounded-lg border border-border bg-bg px-2.5 py-2 text-xs outline-none focus:border-primary/60";

  return (
    <div className="grid gap-5">
      {/* 채택 글에 보상 주기 */}
      <section className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-black"><Star className="h-4 w-4 text-amber-300" /> 채택 글에 보상 주기</h2>
          <label className="flex items-center gap-1.5 text-[12px] text-muted">
            회차 라벨
            <input value={round} onChange={(e) => setRound(e.target.value)} className={inp} placeholder="예: 2026-07" />
          </label>
        </div>

        {curatedPosts.length === 0 ? (
          <p className="text-[12px] text-muted">채택된 글이 없어요. <b className="text-fg">글 관리</b> 탭에서 팬 목소리를 먼저 채택(⭐)하세요.</p>
        ) : (
          <div className="grid gap-2">
            {curatedPosts.map((post) => {
              const done = rewardedPostIds.has(post.id);
              return (
                <div key={post.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-fg">@{post.nickname} <span className="font-normal text-muted">· {post.title || post.body}</span></p>
                  </div>
                  {done ? (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">보상 등록됨</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={goods[post.id] ?? ""}
                        onChange={(e) => setGoods((g) => ({ ...g, [post.id]: e.target.value.slice(0, 80) }))}
                        placeholder="굿즈명 (예: V01D 사인 포카)"
                        className={`${inp} w-44`}
                      />
                      <button onClick={() => register(post)} className="flex items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1.5 text-[11px] font-bold text-black hover:bg-amber-300">
                        <Plus className="h-3 w-3" /> 보상 등록
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 배송 대기 강조 */}
      {pending.length > 0 && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-black text-emerald-400"><Truck className="h-4 w-4" /> 배송 대기 {pending.length}건</h2>
            <div className="flex gap-2">
              <button onClick={copyList} className="flex items-center gap-1 rounded-full bg-card-2 px-3 py-1 text-[11px] font-semibold text-muted hover:text-fg"><Copy className="h-3 w-3" /> 리스트 복사</button>
              <button onClick={downloadCsv} className="flex items-center gap-1 rounded-full bg-card-2 px-3 py-1 text-[11px] font-semibold text-muted hover:text-fg"><Download className="h-3 w-3" /> CSV</button>
            </div>
          </div>
          <div className="grid gap-1.5">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg bg-bg/60 p-2 text-[12px]">
                <span className="font-bold text-fg">@{p.nickname}</span>
                <span className="truncate text-muted">{p.claim_info?.name} · {p.claim_info?.email} · {p.claim_info?.phone} · {p.claim_info?.address}</span>
                <button onClick={() => setStatus(p, "shipped")} className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-400">
                  <PackageCheck className="h-3 w-3" /> 발송완료
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 회차별 보상 발표 */}
      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
          <Gift className="mx-auto mb-2 h-6 w-6" />
          아직 등록된 보상이 없어요.
        </p>
      ) : (
        groups.map(([round, items]) => (
          <section key={round}>
            <h3 className="mb-2 text-sm font-bold">{round} <span className="font-medium text-muted">· {items.length}명</span></h3>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {items.map((pz) => (
                <div key={pz.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-bold text-amber-300">채택</span>
                    <span className="font-bold text-fg">@{pz.nickname}</span>
                    <span className="truncate text-muted">· {pz.prize}</span>
                    <span className={`ml-auto rounded px-1.5 ${pz.claim_status === "none" ? "bg-white/10 text-muted" : pz.claim_status === "claimed" ? "bg-primary/20 text-primary-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                      {pz.claim_status === "none" ? "미신청" : pz.claim_status === "claimed" ? "신청완료" : "발송완료"}
                    </span>
                  </div>
                  {pz.claim_info && (
                    <div className="mt-2 rounded-lg bg-bg/60 p-2 text-[12px] text-fg/90">
                      <p>📦 {pz.claim_info.name} · {pz.claim_info.phone}</p>
                      {pz.claim_info.email && <p className="text-muted">✉️ {pz.claim_info.email}</p>}
                      <p className="text-muted">{pz.claim_info.address}</p>
                      {pz.claim_info.memo && <p className="text-muted">메모: {pz.claim_info.memo}</p>}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    {pz.claim_status === "claimed" && (
                      <button onClick={() => setStatus(pz, "shipped")} className="flex items-center gap-1 rounded-full bg-card-2 px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-emerald-400"><Truck className="h-3 w-3" /> 발송완료 처리</button>
                    )}
                    <button onClick={() => del(pz)} className="flex items-center gap-1 rounded-full bg-card-2 px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-danger"><Trash2 className="h-3 w-3" /> 삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
