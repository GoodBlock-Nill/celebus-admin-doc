"use client";

// 가챠 관리 — digital(재화 확률형: 가중치·확률 미리보기) + physical_box(실물 재고 소진형: 수량·1인 상한·수령 기한).
// digital 풀 행 id는 뽑기 이력 FK 보존용(제거 시 서버가 아카이브). 실물 풀은 게시 후 잠금(서버 강제, UI 안내).
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import AdminGachaWinners from "./AdminGachaWinners";
import { BTN, BTN_GHOST, Card, INPUT } from "./ui";

type Grade = "S" | "A" | "B" | "C" | "D";
type Kind = "digital" | "physical_box";
type L10n = { ko?: string; en?: string; ja?: string };
type Fulfillment = "delivery" | "mobile_ticket";
type PoolItem = {
  id?: string;
  grade: Grade;
  prize: L10n;
  is_physical: boolean;
  fulfillment: Fulfillment; // 모바일 티켓 = CELEBUS 앱 지급 (주소·수령 정보 불필요)
  requires_address: boolean;
  reward_payload: { cp?: number; item?: string; qty?: number } | null;
  weight: number | null;
  total_qty: number | null;
  remaining_qty?: number | null;
  per_user_cap: number | null;
  sort: number;
};
type GachaEvent = {
  id?: string;
  kind: Kind;
  status: "draft" | "published" | "ended" | "canceled";
  title: L10n;
  description: L10n;
  claim_days: number;
  game_gacha_pool_item?: PoolItem[];
};
type Form = GachaEvent & { pool: PoolItem[]; originalStatus?: GachaEvent["status"] };

const STATUS_LABEL: Record<GachaEvent["status"], string> = { draft: "작성 중", published: "게시 중", ended: "종료", canceled: "취소" };
const KIND_LABEL: Record<Kind, string> = { digital: "재화", physical_box: "실물 박스" };
const ITEM_OPTIONS = [
  { value: "heart", label: "하트" },
  { value: "bomb", label: "폭탄" },
  { value: "line", label: "라인" },
  { value: "shuffle", label: "셔플" },
  { value: "time", label: "시간+" },
];
const int1 = (v: string) => Math.max(1, Math.floor(Number(v) || 1));

const emptyForm = (kind: Kind): Form => ({
  kind,
  status: "draft",
  title: {},
  description: {},
  claim_days: 7,
  pool:
    kind === "digital"
      ? [
          { grade: "A", prize: { ko: "300 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 300 }, weight: 5, total_qty: null, per_user_cap: null, sort: 1 },
          { grade: "B", prize: { ko: "하트 1개" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { item: "heart", qty: 1 }, weight: 10, total_qty: null, per_user_cap: null, sort: 2 },
          { grade: "C", prize: { ko: "50 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 50 }, weight: 25, total_qty: null, per_user_cap: null, sort: 3 },
          { grade: "D", prize: { ko: "20 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 20 }, weight: 60, total_qty: null, per_user_cap: null, sort: 4 },
        ]
      : [
          // 콘서트 티켓 = 모바일 티켓 (일정 확정 후 CELEBUS 앱 지급 — 사용자 결정 2026-08-12)
          { grade: "S", prize: { ko: "V01D 콘서트 모바일 티켓" }, is_physical: true, fulfillment: "mobile_ticket", requires_address: false, reward_payload: null, weight: null, total_qty: 2, per_user_cap: 2, sort: 1 },
          { grade: "B", prize: { ko: "한정 포토카드 세트" }, is_physical: true, fulfillment: "delivery", requires_address: true, reward_payload: null, weight: null, total_qty: 30, per_user_cap: null, sort: 2 },
          { grade: "D", prize: { ko: "30 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 30 }, weight: null, total_qty: 100, per_user_cap: null, sort: 3 },
        ],
});

export default function AdminGacha() {
  const [events, setEvents] = useState<(GachaEvent & { id: string })[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [winnersFor, setWinnersFor] = useState<string | null>(null); // 당첨자 패널이 열린 이벤트
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
    if (!ev) return setForm(emptyForm("digital"));
    setForm({
      id: ev.id,
      kind: ev.kind,
      status: ev.status,
      originalStatus: ev.status,
      title: { ...ev.title },
      description: { ...ev.description },
      claim_days: ev.claim_days,
      pool: (ev.game_gacha_pool_item ?? [])
        .filter((p) => ev.kind === "physical_box" || (p.weight ?? 0) > 0)
        .sort((a, b) => a.sort - b.sort)
        .map((p) => ({ ...p, fulfillment: p.fulfillment ?? "delivery", prize: { ...p.prize }, reward_payload: p.reward_payload ? { ...p.reward_payload } : null })),
    });
  };

  const setPool = (i: number, patch: Partial<PoolItem>) =>
    setForm((f) => f && { ...f, pool: f.pool.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  const totalWeight = form?.pool.reduce((s, p) => s + (p.weight ?? 0), 0) ?? 0;
  const poolLocked = !!form?.id && form.kind === "physical_box" && form.originalStatus !== "draft";

  const save = async () => {
    if (!form || busy) return;
    const bad =
      form.pool.length === 0 ||
      form.pool.some((p) => !p.prize.ko?.trim()) ||
      (form.kind === "digital" && form.pool.some((p) => !p.weight || p.weight < 1)) ||
      (form.kind === "physical_box" && form.pool.some((p) => !p.total_qty || p.total_qty < 1));
    if (bad) return setMsg(form.kind === "digital" ? "모든 행에 상품명과 1 이상의 가중치가 필요해요." : "모든 행에 상품명과 1 이상의 수량이 필요해요.");
    setBusy(true);
    setMsg(null);
    try {
      const r = await asend<{ status?: string; error?: string }>("/api/admin/gacha", "POST", {
        id: form.id,
        kind: form.kind,
        status: form.status,
        title: form.title,
        description: form.description,
        claim_days: form.claim_days,
        pool: form.pool.map((p, i) => ({
          id: p.id,
          grade: p.grade,
          prize: p.prize,
          is_physical: p.is_physical,
          fulfillment: p.fulfillment,
          requires_address: p.requires_address,
          reward_payload: p.is_physical ? null : p.reward_payload,
          weight: form.kind === "digital" ? p.weight : null,
          total_qty: form.kind === "physical_box" ? p.total_qty : null,
          per_user_cap: p.per_user_cap,
          sort: i,
        })),
      });
      if (r.error) setMsg(r.error === "status_locked" ? "게시된 실물 이벤트는 작성 중으로 되돌릴 수 없어요." : "저장에 실패했어요. 입력값을 확인해 주세요.");
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
      <Card
        title="가챠 이벤트"
        right={
          <div className="flex gap-2">
            <button onClick={() => setForm(emptyForm("digital"))} className={BTN_GHOST}>+ 재화 가챠</button>
            <button onClick={() => setForm(emptyForm("physical_box"))} className={BTN}>+ 실물 박스</button>
          </div>
        }
      >
        {events.length === 0 ? (
          <p className="text-[13px] text-muted">아직 이벤트가 없어요. 재화 가챠(상시) 또는 실물 박스(이벤트성)를 만들어 보세요.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((ev) => (
              <div key={ev.id}>
                <div className="flex items-center gap-3 rounded-[12px] bg-surface-2 px-3.5 py-3 ring-1 ring-hairline">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${ev.kind === "physical_box" ? "bg-gold/15 text-gold" : "bg-surface-1 text-muted"}`}>
                    {KIND_LABEL[ev.kind]}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${ev.status === "published" ? "bg-primary/20 text-primary-400" : "bg-surface-1 text-muted"}`}>
                    {STATUS_LABEL[ev.status]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-fg">{ev.title.ko || "(제목 없음)"}</span>
                  {ev.kind === "physical_box" && (
                    <span className="shrink-0 text-[12px] tabular-nums text-subtle">
                      잔여 {(ev.game_gacha_pool_item ?? []).reduce((s, p) => s + (p.remaining_qty ?? 0), 0)}/
                      {(ev.game_gacha_pool_item ?? []).reduce((s, p) => s + (p.total_qty ?? 0), 0)}
                    </span>
                  )}
                  {ev.kind === "physical_box" && (
                    <button onClick={() => setWinnersFor((v) => (v === ev.id ? null : ev.id))} className={BTN_GHOST}>
                      당첨자
                    </button>
                  )}
                  <button onClick={() => openEdit(ev)} className={BTN_GHOST}>편집</button>
                </div>
                {winnersFor === ev.id && <AdminGachaWinners eventId={ev.id} />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {form && (
        <Card
          title={`${form.id ? "이벤트 편집" : "새 이벤트"} — ${KIND_LABEL[form.kind]}`}
          right={
            <div className="flex gap-2">
              <button onClick={() => setForm(null)} disabled={busy} className={BTN_GHOST}>닫기</button>
              <button onClick={() => void save()} disabled={busy} className={BTN}>저장</button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {msg && <p className="text-[13px] font-bold text-danger">{msg}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-[13.5px] text-muted">
                <span className="shrink-0">상태</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as GachaEvent["status"] })}
                  className={`${INPUT} w-32`}
                >
                  {Object.entries(STATUS_LABEL)
                    .filter(([v]) => !(poolLocked && v === "draft")) // 게시 후 실물은 작성 중 회귀 불가 (서버도 차단)
                    .map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                </select>
              </label>
              {form.kind === "physical_box" && (
                <label className="flex items-center gap-2 text-[13.5px] text-muted">
                  <span className="shrink-0">수령 기한(일)</span>
                  <input
                    value={String(form.claim_days)}
                    onChange={(e) => setForm((f) => f && { ...f, claim_days: Math.min(30, int1(e.target.value)) })}
                    inputMode="numeric"
                    className={`${INPUT} w-16 text-right tabular-nums`}
                  />
                </label>
              )}
            </div>
            {l10nRow("제목", "title")}
            {l10nRow("설명", "description")}

            {poolLocked && (
              <p className="rounded-[10px] bg-gold/10 px-3.5 py-2.5 text-[12.5px] font-bold text-gold">
                게시된 실물 박스는 풀 구성·재고를 수정할 수 없어요 (뽑기 진행 중 확률 변경 차단). 기간·문구만 수정돼요.
              </p>
            )}

            <div className={`mt-1 flex flex-col gap-1.5 ${poolLocked ? "pointer-events-none opacity-60" : ""}`}>
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
                    {form.kind === "physical_box" && (
                      <label className="flex items-center gap-1 text-[12px] font-bold text-muted">
                        <input type="checkbox" checked={p.is_physical} onChange={(e) => setPool(i, { is_physical: e.target.checked, reward_payload: e.target.checked ? null : { cp: 20 } })} className="h-4 w-4" />
                        실물
                      </label>
                    )}
                    {p.is_physical ? (
                      <>
                        <select
                          value={p.fulfillment}
                          onChange={(e) => setPool(i, { fulfillment: e.target.value as Fulfillment, ...(e.target.value === "mobile_ticket" ? { requires_address: false } : {}) })}
                          className={`${INPUT} w-32`}
                        >
                          <option value="delivery">배송</option>
                          <option value="mobile_ticket">모바일 티켓</option>
                        </select>
                        {p.fulfillment !== "mobile_ticket" && (
                          <label className="flex items-center gap-1 text-[12px] font-bold text-muted">
                            <input type="checkbox" checked={p.requires_address} onChange={(e) => setPool(i, { requires_address: e.target.checked })} className="h-4 w-4" />
                            주소 필요
                          </label>
                        )}
                        <span className="text-[12px] text-subtle">1인 상한</span>
                        <input
                          value={p.per_user_cap != null ? String(p.per_user_cap) : ""}
                          onChange={(e) => setPool(i, { per_user_cap: e.target.value === "" ? null : int1(e.target.value) })}
                          placeholder="무제한"
                          inputMode="numeric"
                          className={`${INPUT} w-16 text-right tabular-nums`}
                        />
                      </>
                    ) : (
                      <>
                        <select
                          value={p.reward_payload?.cp != null ? "cp" : "item"}
                          onChange={(e) => setPool(i, { reward_payload: e.target.value === "cp" ? { cp: 20 } : { item: "heart", qty: 1 } })}
                          className={`${INPUT} w-20`}
                        >
                          <option value="cp">CP</option>
                          <option value="item">아이템</option>
                        </select>
                        {p.reward_payload?.cp != null ? (
                          <input
                            value={String(p.reward_payload.cp)}
                            onChange={(e) => setPool(i, { reward_payload: { cp: int1(e.target.value) } })}
                            inputMode="numeric"
                            className={`${INPUT} w-20 text-right tabular-nums`}
                          />
                        ) : (
                          <>
                            <select
                              value={p.reward_payload?.item}
                              onChange={(e) => setPool(i, { reward_payload: { ...p.reward_payload, item: e.target.value } })}
                              className={`${INPUT} w-20`}
                            >
                              {ITEM_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <input
                              value={String(p.reward_payload?.qty ?? 1)}
                              onChange={(e) => setPool(i, { reward_payload: { ...p.reward_payload, qty: int1(e.target.value) } })}
                              inputMode="numeric"
                              className={`${INPUT} w-14 text-right tabular-nums`}
                            />
                          </>
                        )}
                      </>
                    )}
                    {form.kind === "digital" ? (
                      <>
                        <span className="text-[12px] text-subtle">가중치</span>
                        <input
                          value={p.weight != null ? String(p.weight) : ""}
                          onChange={(e) => setPool(i, { weight: int1(e.target.value) })}
                          inputMode="numeric"
                          className={`${INPUT} w-20 text-right tabular-nums`}
                        />
                        <span className="w-16 shrink-0 text-right text-[12.5px] font-black tabular-nums text-primary-400">{pct}%</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] text-subtle">수량</span>
                        <input
                          value={p.total_qty != null ? String(p.total_qty) : ""}
                          onChange={(e) => setPool(i, { total_qty: int1(e.target.value) })}
                          inputMode="numeric"
                          className={`${INPUT} w-20 text-right tabular-nums`}
                        />
                      </>
                    )}
                    <button type="button" onClick={() => setForm((f) => f && { ...f, pool: f.pool.filter((_, j) => j !== i) })} title="행 삭제" className="shrink-0 text-subtle hover:text-danger">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setForm(
                    (f) =>
                      f && {
                        ...f,
                        pool: [
                          ...f.pool,
                          f.kind === "digital"
                            ? { grade: "D", prize: { ko: "" }, is_physical: false, fulfillment: "delivery" as Fulfillment, requires_address: false, reward_payload: { cp: 20 }, weight: 10, total_qty: null, per_user_cap: null, sort: f.pool.length }
                            : { grade: "D", prize: { ko: "" }, is_physical: false, fulfillment: "delivery" as Fulfillment, requires_address: false, reward_payload: { cp: 20 }, weight: null, total_qty: 10, per_user_cap: null, sort: f.pool.length },
                        ],
                      }
                  )
                }
                className={`${BTN_GHOST} inline-flex w-fit items-center gap-1`}
              >
                <Plus className="h-4 w-4" /> 행 추가
              </button>
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted">
              {form.kind === "digital"
                ? `확률 = 가중치 ÷ 전체 가중치 합(${totalWeight.toLocaleString()}). 저장 즉시 유저 확률 공시에 반영돼요. 꽝 없음 — 모든 행이 보상을 지급해요.`
                : "박스 가챠 — 남은 상품 수에 비례한 균등 확률, 뽑힐 때마다 소진되고 전체 소진 시 자동 종료돼요. 실물 뽑기는 무상(랭킹 보상) 이용권 전용이에요. 실물 당첨은 수령 기한 내 정보 미입력 시 무효 처리돼요. 게시 후에는 풀·재고를 수정할 수 없으니 검토 후 게시해 주세요."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
