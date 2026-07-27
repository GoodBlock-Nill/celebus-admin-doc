"use client";

// 회원 — 전폭 리치 테이블(CP·판수·의심) + 실시간 검색 + 필터(전체/V01D/의심). 행 클릭 → 상세 드로어.
// 닉네임·아바타는 CELEBUS 계정에서 동기화(SSO). 파괴적 액션은 2단 확인.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import Avatar from "../Avatar";
import { BTN, BTN_DANGER, BTN_GHOST, Card, DataTable, INPUT, TD, TR_HOVER, fmtDate } from "./ui";

type Row = {
  player_hash: string;
  nickname: string;
  avatar: string | null;
  is_member: boolean;
  created_at: string;
  last_login_at: string | null;
  celeb_point: number;
  scores_count: number;
  flagged: boolean;
};
type Page = { rows: Row[]; total: number; page: number };
type Detail = {
  profile: (Row & { is_member: boolean }) | null;
  celeb_point: number | null;
  best_normal: { level: number; score: number } | null;
  best_item: { level: number; score: number } | null;
  scores_count: number;
  flagged_count?: number;
  ledger: { delta: number; reason: string; created_at: string }[];
};
type Filter = "all" | "member" | "flagged";

const MISSION_LABEL: Record<string, string> = { plays: "판수", score: "누적 점수", level: "최고 레벨", high: "한 판 최고", item: "아이템 매치", normal: "일반 매치" };
const ITEM_LABEL: Record<string, string> = { bomb: "폭탄", line: "라인", shuffle: "셔플", time: "시간+", heart: "하트" };
function describeReason(reason: string): string {
  if (reason.startsWith("mission")) return `미션 보상${MISSION_LABEL[reason.split(":")[2] ?? ""] ? ` (${MISSION_LABEL[reason.split(":")[2]]})` : ""}`;
  if (reason.startsWith("daily")) return "출석 보상";
  if (reason.startsWith("weekly_reward")) return "주간 랭킹 보상";
  if (reason.startsWith("buy")) return `아이템 구매${ITEM_LABEL[reason.split(":")[1] ?? ""] ? ` (${ITEM_LABEL[reason.split(":")[1]]})` : ""}`;
  return reason;
}
const V01D = () => <span className="rounded-[4px] bg-primary px-1 py-0.5 text-[9px] font-black leading-none text-white">V01D</span>;

export default function AdminMembers() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [cpDelta, setCpDelta] = useState("");
  const [cpReason, setCpReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);

  const reload = async () => {
    const p = await aget<Page>(`/api/admin/profiles?q=${encodeURIComponent(q)}&filter=${filter}`);
    setRows(p.rows ?? []);
    setTotal(p.total ?? 0);
  };
  // 실시간 검색·필터 (디바운스)
  useEffect(() => {
    const t = setTimeout(() => void reload(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  const loadMore = async () => {
    setLoadingMore(true);
    const p = await aget<Page>(`/api/admin/profiles?q=${encodeURIComponent(q)}&filter=${filter}&offset=${rows.length}`);
    setRows((prev) => [...prev, ...(p.rows ?? [])]);
    setTotal(p.total ?? 0);
    setLoadingMore(false);
  };

  const open = async (h: string) => {
    setSel(h);
    setMsg(null);
    setArmed(null);
    setDetail(null);
    setDetail(await aget<Detail>(`/api/admin/profile?h=${h}`));
  };
  const close = () => {
    setSel(null);
    setDetail(null);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg(done);
      if (sel) setDetail(await aget<Detail>(`/api/admin/profile?h=${sel}`));
      await reload();
    } catch {
      setMsg("실패했어요. 다시 시도해주세요.");
    }
    setBusy(false);
    setArmed(null);
  };
  const danger = (key: string, fn: () => Promise<unknown>, done: string) => {
    if (armed !== key) {
      setArmed(key);
      setTimeout(() => setArmed((a) => (a === key ? null : a)), 3000);
      return;
    }
    void act(fn, done);
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "member", label: "V01D 멤버" },
    { key: "flagged", label: "⚠️ 의심" },
  ];

  return (
    <Card title={`회원 (전체 ${total.toLocaleString()}명)`}>
      {/* 검색 + 필터 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="닉네임 검색 (입력 즉시)" className={`${INPUT} w-64`} />
        <div className="flex gap-1 rounded-full bg-surface-2 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${filter === f.key ? "bg-primary text-white" : "text-muted"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable head={["회원", "보유 CP", "판수", "최근 로그인", "의심"]}>
        {rows.map((r) => (
          <tr key={r.player_hash} onClick={() => void open(r.player_hash)} className={`${TR_HOVER} cursor-pointer ${sel === r.player_hash ? "bg-primary/12" : ""}`}>
            <td className={TD}>
              <span className="flex items-center gap-2">
                <Avatar value={r.avatar} size="sm" />
                <span className="truncate font-bold">{r.nickname}</span>
                {r.is_member && <V01D />}
              </span>
            </td>
            <td className={`${TD} whitespace-nowrap text-right font-bold tabular-nums`}>{r.celeb_point.toLocaleString()}</td>
            <td className={`${TD} whitespace-nowrap text-right tabular-nums text-muted`}>{r.scores_count.toLocaleString()}</td>
            <td className={`${TD} whitespace-nowrap text-subtle`}>{fmtDate(r.last_login_at).slice(0, 12)}</td>
            <td className={`${TD} text-center`}>{r.flagged ? <span title="이상 제출 의심">⚠️</span> : ""}</td>
          </tr>
        ))}
      </DataTable>
      {rows.length === 0 && <p className="py-6 text-center text-[13px] text-subtle">결과 없음</p>}
      {rows.length < total && (
        <button onClick={() => void loadMore()} disabled={loadingMore} className={`${BTN_GHOST} mt-3 w-full`}>
          {loadingMore ? "불러오는 중…" : `더 보기 (${rows.length.toLocaleString()} / ${total.toLocaleString()})`}
        </button>
      )}

      {/* 상세 드로어 */}
      {sel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/55" onClick={close} />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[540px] overflow-y-auto bg-surface-1 p-5 shadow-2xl ring-1 ring-hairline">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-black">회원 상세</h2>
              <button onClick={close} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:text-fg">
                <X className="h-5 w-5" />
              </button>
            </header>

            {!detail?.profile ? (
              <p className="text-[13px] text-subtle">불러오는 중…</p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Avatar value={detail.profile.avatar} size="lg" />
                  <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-muted">
                    <div className="flex items-center gap-1.5 text-[16px] font-black text-fg">
                      {detail.profile.nickname}
                      {detail.profile.is_member && <V01D />}
                      {(detail.flagged_count ?? 0) > 0 && (
                        <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger">의심 점수 {detail.flagged_count}건</span>
                      )}
                    </div>
                    <div>CELEBUS 계정 연동 · 가입 {fmtDate(detail.profile.created_at)}</div>
                    <div>최근 로그인 {fmtDate(detail.profile.last_login_at)}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
                  {[
                    ["보유 CP", (detail.celeb_point ?? 0).toLocaleString()],
                    ["플레이 판수", detail.scores_count.toLocaleString()],
                    ["일반 최고", detail.best_normal ? `Lv.${detail.best_normal.level} · ${detail.best_normal.score.toLocaleString()}` : "-"],
                    ["아이템 최고", detail.best_item ? `Lv.${detail.best_item.level} · ${detail.best_item.score.toLocaleString()}` : "-"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[10px] bg-surface-2 px-3 py-2.5">
                      <div className="text-[11px] text-subtle">{label}</div>
                      <b>{value}</b>
                    </div>
                  ))}
                </div>

                <div className="mt-5 mb-1.5 text-[12px] font-bold text-subtle">운영</div>
                <button
                  disabled={busy}
                  onClick={() =>
                    act(
                      () => asend("/api/admin/member-flag", "POST", { player_hash: sel, is_member: !detail.profile?.is_member }),
                      detail.profile?.is_member ? "V01D 멤버를 해제했어요." : "V01D 멤버로 지정했어요.",
                    )
                  }
                  className={detail.profile.is_member ? BTN_GHOST : BTN}
                >
                  {detail.profile.is_member ? "V01D 멤버 해제" : "V01D 멤버 지정"}
                </button>

                <div className="mt-4 mb-1.5 text-[12px] font-bold text-subtle">CP 지급 · 회수</div>
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const d = parseInt(cpDelta, 10);
                    if (!d || !cpReason.trim()) return;
                    void act(() => asend("/api/admin/point", "POST", { player_hash: sel, delta: d, reason: cpReason.trim() }), "CP를 조정했어요.");
                    setCpDelta("");
                    setCpReason("");
                  }}
                >
                  <input value={cpDelta} onChange={(e) => setCpDelta(e.target.value.replace(/[^\d-]/g, ""))} placeholder="+지급 / -회수" className={`${INPUT} w-28`} />
                  <input value={cpReason} onChange={(e) => setCpReason(e.target.value)} placeholder="사유 (원장에 기록)" className={`${INPUT} min-w-0 flex-1`} />
                  <button type="submit" disabled={busy} className={BTN_GHOST}>
                    조정
                  </button>
                </form>

                <div className="mt-4 mb-1.5 text-[12px] font-bold text-danger">제재 · 삭제 (되돌릴 수 없어요)</div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => danger("avatar", () => asend("/api/admin/sanction", "POST", { player_hash: sel, reset_avatar: true }), "아바타를 제거했어요.")} className={BTN_DANGER}>
                    {armed === "avatar" ? "한 번 더 클릭" : "아바타 제거"}
                  </button>
                  <button disabled={busy} onClick={() => danger("scores", () => asend("/api/admin/scores-delete", "POST", { player_hash: sel }), "전체 기록을 삭제했어요.")} className={BTN_DANGER}>
                    {armed === "scores" ? "한 번 더 클릭 — 전체 기록 삭제" : "기록 전체 삭제"}
                  </button>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-subtle">
                  닉네임은 CELEBUS 계정에서 동기화돼요(게임에서 변경 불가). 부적절한 닉네임은 <b className="text-muted">금칙어</b> 탭에 등록하면 랭킹에서 자동 &lsquo;익명&rsquo; 처리돼요.
                </p>

                {msg && <p className="mt-2 text-[13px] font-bold text-primary-400">{msg}</p>}

                <div className="mt-5">
                  <div className="mb-1.5 text-[12px] font-bold text-subtle">CP 원장 (최근 20)</div>
                  <DataTable head={["변동", "사유", "시각"]}>
                    {detail.ledger.map((l, i) => (
                      <tr key={i} className={TR_HOVER}>
                        <td className={`${TD} whitespace-nowrap font-black tabular-nums ${l.delta > 0 ? "text-verified" : "text-danger"}`}>
                          {l.delta > 0 ? "+" : ""}
                          {l.delta.toLocaleString()}
                        </td>
                        <td className={`${TD} max-w-[220px] truncate text-muted`} title={describeReason(l.reason)}>
                          {describeReason(l.reason)}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-subtle`}>{fmtDate(l.created_at)}</td>
                      </tr>
                    ))}
                  </DataTable>
                  {detail.ledger.length === 0 && <p className="mt-2 text-[13px] text-subtle">기록 없음</p>}
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </Card>
  );
}
