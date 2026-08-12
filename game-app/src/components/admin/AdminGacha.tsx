"use client";

// 가챠 관리 (Phase 3: 재화 확률형) — 이벤트 목록·생성/수정 + 풀(등급·가중치·보상) 편집 + 확률 미리보기.
// 풀 행의 id는 뽑기 이력 FK 보존용 — 제거된 행은 서버가 삭제 시도 후 불가하면 아카이브(추첨·공시 제외).
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { BTN, BTN_GHOST, Card, INPUT } from "./ui";

type Grade = "S" | "A" | "B" | "C" | "D";
type L10n = { ko?: string; en?: string; ja?: string };
type PoolItem = {
  id?: string;
  grade: Grade;
  prize: L10n;
  reward_payload: { cp?: number; item?: string; qty?: number };
  weight: number | null;
  sort: number;
};
type GachaEvent = {
  id?: string;
  status: "draft" | "published" | "ended" | "canceled";
  title: L10n;
  description: L10n;
  game_gacha_pool_item?: PoolItem[];
};

const STATUS_LABEL: Record<GachaEvent["status"], string> = { draft: "작성 중", published: "게시 중", ended: "종료", canceled: "취소" };
const ITEM_OPTIONS = [
  { value: "heart", label: "하트" },
  { value: "bomb", label: "폭탄" },
  { value: "line", label: "라인" },
  { value: "shuffle", label: "셔플" },
  { value: "time", label: "시간+" },
];
const EMPTY_FORM: GachaEvent & { pool: PoolItem[] } = {
  status: "draft",
  title: {},
  description: {},
  pool: [
    { grade: "A", prize: { ko: "300 CP" }, reward_payload: { cp: 300 }, weight: 5, sort: 1 },
    { grade: "B", prize: { ko: "하트 1개" }, reward_payload: { item: "heart", qty: 1 }, weight: 10, sort: 2 },
    { grade: "C", prize: { ko: "50 CP" }, reward_payload: { cp: 50 }, weight: 25, sort: 3 },
    { grade: "D", prize: { ko: "20 CP" }, reward_payload: { cp: 20 }, weight: 60, sort: 4 },
  ],
};

export default function AdminGacha() {
  const [events, setEvents] = useState<(GachaEvent & { id: string; created_at?: string })[]>([]);
  const [form, setForm] = useState<(GachaEvent & { pool: PoolItem[] }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () =>
    aget<{ events: (GachaEvent & { id: string })[] }>("/api/admin/gacha")
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  useEffect(() => {
    void load();
  }, []);

  const openEdit = (ev?: GachaEvent & { id: string }) => {
    setMsg(null);
    if (!ev) return setForm(structuredClone(EMPTY_FORM));
    setForm({
      id: ev.id,
      status: ev.status,
      title: { ...ev.title },
      description: { ...ev.description },
      pool: (ev.game_gacha_pool_item ?? [])
        .filter((p) => (p.weight ?? 0) > 0) // 아카이브 행은 폼에서 제외
        .sort((a, b) => a.sort - b.sort)
        .map((p) => ({ id: p.id, grade: p.grade, prize: { ...p.prize }, reward_payload: { ...p.reward_payload }, weight: p.weight, sort: p.sort })),
    });
  };

  const setPool = (i: number, patch: Partial<PoolItem>) =>
    setForm((f) => f && { ...f, pool: f.pool.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  const totalWeight = form?.pool.reduce((s, p) => s + (p.weight ?? 0), 0) ?? 0;

  const save = async () => {
    if (!form || busy) return;
    if (form.pool.length === 0 || form.pool.some((p) => !p.prize.ko?.trim() || !p.weight || p.weight < 1)) {
      return setMsg("모든 행에 상품명(한국어)과 1 이상의 가중치가 필요해요.");
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await asend<{ status?: string; error?: string }>("/api/admin/gacha", "POST", {
        id: form.id,
        status: form.status,
        title: form.title,
        description: form.description,
        pool: form.pool.map((p, i) => ({ id: p.id, grade: p.grade, prize: p.prize, reward_payload: p.reward_payload, weight: p.weight, sort: i })),
      });
      if (r.error) setMsg("저장에 실패했어요. 입력값을 확인해 주세요.");
      else {
        setForm(null);
        await load();
      }
    } catch {
      setMsg("저장에 실패했어요.");
    }
    setBusy(false);
  };

  const l10nRow = (label: string, key: "title" | "description") => (
    <div className="flex flex-col gap-1.5 sm:flex-row">
      {(["ko", "en", "ja"] as const).map((lg) => (
        <input
          key={lg}
          value={form?.[key][lg] ?? ""}
          onChange={(e) => setForm((f) => f && { ...f, [key]: { ...f[key], [lg]: e.target.value } })}
          placeholder={`${label} (${lg.toUpperCase()})${lg === "ko" ? " — 필수" : ""}`}
          className={`${INPUT} min-w-0 flex-1`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Card title="재화 가챠 이벤트" right={<button onClick={() => openEdit()} className={BTN}>새 이벤트</button>}>
        {events.length === 0 ? (
          <p className="text-[13px] text-muted">아직 이벤트가 없어요. [새 이벤트]로 재화 뽑기를 만들어 보세요.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-[12px] bg-surface-2 px-3.5 py-3 ring-1 ring-hairline">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${ev.status === "published" ? "bg-primary/20 text-primary-400" : "bg-surface-1 text-muted"}`}>
                  {STATUS_LABEL[ev.status]}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-fg">{ev.title.ko || "(제목 없음)"}</span>
                <span className="shrink-0 text-[12px] text-subtle">아이템 {(ev.game_gacha_pool_item ?? []).filter((p) => (p.weight ?? 0) > 0).length}종</span>
                <button onClick={() => openEdit(ev)} className={BTN_GHOST}>
                  편집
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {form && (
        <Card
          title={form.id ? "이벤트 편집" : "새 이벤트"}
          right={
            <div className="flex gap-2">
              <button onClick={() => setForm(null)} disabled={busy} className={BTN_GHOST}>닫기</button>
              <button onClick={() => void save()} disabled={busy} className={BTN}>저장</button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {msg && <p className="text-[13px] font-bold text-danger">{msg}</p>}
            <label className="flex items-center gap-2 text-[13.5px] text-muted">
              <span className="w-16 shrink-0">상태</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as GachaEvent["status"] })}
                className={`${INPUT} flex-1`}
              >
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            {l10nRow("제목", "title")}
            {l10nRow("설명", "description")}

            {/* 풀 편집 — 등급·상품명(ko)·보상·가중치·확률 */}
            <div className="mt-1 flex flex-col gap-1.5">
              {form.pool.map((p, i) => {
                const pct = totalWeight > 0 && p.weight ? ((p.weight / totalWeight) * 100).toFixed(2) : "0";
                return (
                  <div key={i} className="flex flex-wrap items-center gap-1.5 rounded-[12px] bg-surface-2 px-2.5 py-2 ring-1 ring-hairline">
                    <select value={p.grade} onChange={(e) => setPool(i, { grade: e.target.value as Grade })} className={`${INPUT} w-16`}>
                      {(["S", "A", "B", "C", "D"] as const).map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                    <input
                      value={p.prize.ko ?? ""}
                      onChange={(e) => setPool(i, { prize: { ...p.prize, ko: e.target.value } })}
                      placeholder="상품명 (KO)"
                      className={`${INPUT} w-36 min-w-0 flex-1`}
                    />
                    <select
                      value={p.reward_payload.cp != null ? "cp" : "item"}
                      onChange={(e) => setPool(i, { reward_payload: e.target.value === "cp" ? { cp: 20 } : { item: "heart", qty: 1 } })}
                      className={`${INPUT} w-24`}
                    >
                      <option value="cp">CP</option>
                      <option value="item">아이템</option>
                    </select>
                    {p.reward_payload.cp != null ? (
                      <input
                        value={String(p.reward_payload.cp)}
                        onChange={(e) => setPool(i, { reward_payload: { cp: Math.max(1, Math.floor(Number(e.target.value) || 1)) } })}
                        inputMode="numeric"
                        className={`${INPUT} w-20 text-right tabular-nums`}
                      />
                    ) : (
                      <>
                        <select
                          value={p.reward_payload.item}
                          onChange={(e) => setPool(i, { reward_payload: { ...p.reward_payload, item: e.target.value } })}
                          className={`${INPUT} w-24`}
                        >
                          {ITEM_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <input
                          value={String(p.reward_payload.qty ?? 1)}
                          onChange={(e) => setPool(i, { reward_payload: { ...p.reward_payload, qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) } })}
                          inputMode="numeric"
                          className={`${INPUT} w-14 text-right tabular-nums`}
                        />
                      </>
                    )}
                    <span className="text-[12px] text-subtle">가중치</span>
                    <input
                      value={p.weight != null ? String(p.weight) : ""}
                      onChange={(e) => setPool(i, { weight: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                      inputMode="numeric"
                      className={`${INPUT} w-20 text-right tabular-nums`}
                    />
                    <span className="w-16 shrink-0 text-right text-[12.5px] font-black tabular-nums text-primary-400">{pct}%</span>
                    <button type="button" onClick={() => setForm((f) => f && { ...f, pool: f.pool.filter((_, j) => j !== i) })} title="행 삭제" className="shrink-0 text-subtle hover:text-danger">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setForm((f) => f && { ...f, pool: [...f.pool, { grade: "D", prize: { ko: "" }, reward_payload: { cp: 20 }, weight: 10, sort: f.pool.length }] })}
                className={`${BTN_GHOST} inline-flex w-fit items-center gap-1`}
              >
                <Plus className="h-4 w-4" /> 행 추가
              </button>
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted">
              확률 = 가중치 ÷ 전체 가중치 합({totalWeight.toLocaleString()}). 저장 즉시 유저 확률 공시 화면에 그대로 반영돼요. 꽝 없음 —
              모든 행이 보상을 지급해요. 게시 중 변경도 가능하며 전부 관리자 로그에 남아요.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
