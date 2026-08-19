"use client";

// 럭키드로우 관리 — 신규 생성은 수량 기반 단일 모델(v2.4): 풀에 실물·재화를 행 단위로 혼합 등록,
// 남은 수량 비례 균등 확률로 뽑히고 소진 시 자동 종료. 게시 후 풀 잠금(서버 강제, UI 안내).
// 구형 재화 확률형(digital, 가중치)은 기존 이벤트 호환용으로만 편집 지원 — 신규 생성 불가.
import { useEffect, useState } from "react";
import { Gift, Plus, X } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { GRADE_COLORS, ITEM_ART } from "../GachaCard";
import AdminGachaDetail from "./AdminGachaDetail";
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
  image_url?: string | null; // 결과 카드 앞면 이미지 (업로드 — 없으면 앱이 보상 아트 폴백)
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
const KIND_LABEL: Record<Kind, string> = { digital: "재화 확률형 (구형)", physical_box: "럭키드로우" };
const ITEM_OPTIONS = [
  { value: "heart", label: "하트" },
  { value: "bomb", label: "폭탄" },
  { value: "line", label: "라인" },
  { value: "shuffle", label: "셔플" },
  { value: "time", label: "시간+" },
];
const int1 = (v: string) => Math.max(1, Math.floor(Number(v) || 1));
const ITEM_LABEL: Record<string, string> = Object.fromEntries(ITEM_OPTIONS.map((o) => [o.value, o.label]));

// 결과 카드 미리보기 — 유저 화면(GachaCard 앞면)과 동일한 규격·스타일. 이미지 비율이 다르면 잘리는 모습이 그대로 보인다.
function CardPreview({ p, defaults }: { p: PoolItem; defaults: Record<string, string | undefined> }) {
  const color = GRADE_COLORS[p.grade];
  const label = p.is_physical
    ? p.prize.ko || "(상품명)"
    : p.reward_payload?.cp != null
      ? `+${p.reward_payload.cp.toLocaleString()} CP`
      : `${ITEM_LABEL[p.reward_payload?.item ?? "heart"]} ×${p.reward_payload?.qty ?? 1}`;
  const art = p.reward_payload?.cp != null ? "/currency.png" : p.reward_payload?.item ? ITEM_ART[p.reward_payload.item] : null;
  // 폴백 체인: 행별 업로드 > 재화 기본 카드 이미지 (유저 화면과 동일)
  const img = p.image_url ?? (p.reward_payload?.cp != null ? defaults.cp : p.reward_payload?.item ? defaults[p.reward_payload.item] : undefined);
  return (
    <div className="flex w-[110px] shrink-0 flex-col items-center gap-1">
      <div
        className="relative h-[154px] w-[110px] overflow-hidden rounded-[14px]"
        style={{
          background: `radial-gradient(120% 90% at 50% 0%, ${color}30 0%, transparent 55%), linear-gradient(180deg, ${color}14 0%, var(--color-surface-2) 70%)`,
          boxShadow: `0 0 14px ${color}55, inset 0 0 0 2px ${color}`,
        }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art} alt="" className="h-12 w-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]" />
            ) : (
              <Gift className="h-10 w-10" style={{ color }} strokeWidth={1.5} />
            )}
          </div>
        )}
      </div>
      <span className="w-full truncate text-center text-[10.5px] font-black text-fg">{label}</span>
    </div>
  );
}

// 새 럭키드로우 기본 템플릿 — 운영 확정 구성 (2026-08-19 소진 속도 보정 ×2.5, 기획안 §운영 확률 설계 가이드):
// 회차당 박스 694개 · 모바일 티켓 5장(0.72%, 1인 상한 1 — 5명에게 분산) · 티켓 = 유일한 전체 최저 확률(위계 유지)
// 재화 구성 = 2회차 실운영 믹스 × 2.5 (경제 밸런스 유지·최소 1주 지속 목표 — 2회차 박스 280이 수일 내 95% 소진,
// 게시 후 재고 증량 불가라 넉넉하게. 일평균 ~100회 수요까지 7일 유지).
const emptyForm = (): Form => ({
  kind: "physical_box",
  status: "draft",
  title: {},
  description: {},
  claim_days: 7,
  pool: [
    // 콘서트 티켓 = 모바일 티켓 (일정 확정 후 CELEBUS 앱 지급 — 사용자 결정 2026-08-12)
    { grade: "S", prize: { ko: "V01D 콘서트 모바일 티켓" }, is_physical: true, fulfillment: "mobile_ticket", requires_address: false, reward_payload: null, weight: null, total_qty: 5, per_user_cap: 1, sort: 1 },
    { grade: "A", prize: { ko: "500 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 500 }, weight: null, total_qty: 33, per_user_cap: null, sort: 2 },
    { grade: "B", prize: { ko: "폭탄 1개" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { item: "bomb", qty: 1 }, weight: null, total_qty: 45, per_user_cap: null, sort: 3 },
    { grade: "B", prize: { ko: "라인 1개" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { item: "line", qty: 1 }, weight: null, total_qty: 45, per_user_cap: null, sort: 4 },
    { grade: "B", prize: { ko: "시간+ 1개" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { item: "time", qty: 1 }, weight: null, total_qty: 50, per_user_cap: null, sort: 5 },
    { grade: "C", prize: { ko: "300 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 300 }, weight: null, total_qty: 65, per_user_cap: null, sort: 6 },
    { grade: "C", prize: { ko: "셔플 1개" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { item: "shuffle", qty: 1 }, weight: null, total_qty: 88, per_user_cap: null, sort: 7 },
    { grade: "D", prize: { ko: "150 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 150 }, weight: null, total_qty: 120, per_user_cap: null, sort: 8 },
    { grade: "D", prize: { ko: "하트 1개" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { item: "heart", qty: 1 }, weight: null, total_qty: 113, per_user_cap: null, sort: 9 },
    { grade: "D", prize: { ko: "50 CP" }, is_physical: false, fulfillment: "delivery", requires_address: false, reward_payload: { cp: 50 }, weight: null, total_qty: 130, per_user_cap: null, sort: 10 },
  ],
});

export default function AdminGacha() {
  const [events, setEvents] = useState<(GachaEvent & { id: string })[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [winnersFor, setWinnersFor] = useState<string | null>(null); // 당첨자 패널이 열린 이벤트
  const [detailFor, setDetailFor] = useState<string | null>(null); // 상세 패널이 열린 이벤트 (읽기 전용 운영 현황)
  const [busy, setBusy] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null); // 카드 이미지 업로드 중인 행
  const [msg, setMsg] = useState<string | null>(null);
  // 재화 카드 기본 이미지 — 한 번 등록하면 개별 이미지 없는 재화 행에 자동 재사용 (game_config.gachaCards)
  const [cardDefaults, setCardDefaults] = useState<Record<string, string | undefined>>({});
  const [defaultsUploading, setDefaultsUploading] = useState<string | null>(null);

  const loadDefaults = () =>
    aget<{ config?: { gachaCards?: Record<string, string> } }>("/api/admin/config")
      .then((d) => setCardDefaults(d.config?.gachaCards ?? {}))
      .catch(() => {});

  const saveDefaults = async (next: Record<string, string | undefined>) => {
    setCardDefaults(next);
    try {
      // 통짜 오버레이 — 최신 config를 읽어 gachaCards만 병합 후 저장
      const cur = await aget<{ config?: Record<string, unknown> }>("/api/admin/config");
      const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
      await asend("/api/admin/config", "PUT", { config: { ...(cur.config ?? {}), gachaCards: clean } });
    } catch {
      setMsg("기본 이미지 저장에 실패했어요.");
    }
  };

  const uploadDefault = async (key: string, file?: File | null) => {
    if (!file || defaultsUploading) return;
    if (file.size > 3 * 1024 * 1024) return setMsg("이미지가 3MB를 넘어요 — 줄여서 다시 올려 주세요.");
    setDefaultsUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/gacha/image", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) await saveDefaults({ ...cardDefaults, [key]: data.url });
      else throw new Error();
    } catch {
      setMsg("업로드 실패 — JPG/PNG/WebP 3MB 이하만 가능해요.");
    }
    setDefaultsUploading(null);
  };

  // 결과 카드 이미지 업로드 — 공개 버킷 저장 후 URL을 행에 반영 (풀 저장 시 함께 기록)
  const uploadCard = async (i: number, file?: File | null) => {
    if (!file || uploadingIdx != null) return;
    if (file.size > 3 * 1024 * 1024) return setMsg("이미지가 3MB를 넘어요 — 줄여서 다시 올려 주세요.");
    setUploadingIdx(i);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/gacha/image", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) setPool(i, { image_url: data.url });
      else throw new Error();
    } catch {
      setMsg("업로드 실패 — JPG/PNG/WebP 3MB 이하만 가능해요.");
    }
    setUploadingIdx(null);
  };

  const load = () =>
    aget<{ events: (GachaEvent & { id: string })[] }>("/api/admin/gacha")
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  useEffect(() => {
    void load();
    void loadDefaults();
  }, []);

  const openEdit = (ev?: GachaEvent & { id: string }) => {
    setMsg(null);
    if (!ev) return setForm(emptyForm());
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
  // 수량 기반(박스) 폼의 확률 표시용 — 시작 시점 확률(수량 ÷ 박스 크기). 진행 중엔 잔여 비례로 변동
  const totalQty = form?.pool.reduce((s, p) => s + (p.total_qty ?? 0), 0) ?? 0;
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
          image_url: p.image_url || "",
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
        title="럭키드로우 이벤트"
        right={<button onClick={() => openEdit()} className={BTN}>+ 새 럭키드로우</button>}
      >
        {events.length === 0 ? (
          <p className="text-[13px] text-muted">아직 이벤트가 없어요. [+ 새 럭키드로우]로 실물·재화 보상을 섞어 만들 수 있어요.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((ev) => (
              <div key={ev.id}>
                <div className="flex items-center gap-3 rounded-[12px] bg-surface-2 px-3.5 py-3 ring-1 ring-hairline">
                  {ev.kind === "digital" && (
                    <span className="shrink-0 rounded-full bg-surface-1 px-2 py-0.5 text-[11px] font-bold text-muted">{KIND_LABEL.digital}</span>
                  )}
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
                    <button
                      onClick={() => setDetailFor((v) => (v === ev.id ? null : ev.id))}
                      className={detailFor === ev.id ? BTN : BTN_GHOST}
                    >
                      상세
                    </button>
                  )}
                  {ev.kind === "physical_box" && (
                    <button onClick={() => setWinnersFor((v) => (v === ev.id ? null : ev.id))} className={BTN_GHOST}>
                      당첨자
                    </button>
                  )}
                  <button onClick={() => openEdit(ev)} className={BTN_GHOST}>편집</button>
                </div>
                {detailFor === ev.id && <AdminGachaDetail eventId={ev.id} pool={ev.game_gacha_pool_item ?? []} />}
                {winnersFor === ev.id && <AdminGachaWinners eventId={ev.id} />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 재화 카드 기본 이미지 — 개별 업로드 없는 재화 행에 자동 적용 (교체 시 전체 이벤트 즉시 반영) */}
      <Card title="재화 카드 기본 이미지">
        <div className="flex flex-wrap gap-3">
          {([["cp", "CP"], ["heart", "하트"], ["bomb", "폭탄"], ["line", "라인"], ["shuffle", "셔플"], ["time", "시간+"]] as const).map(([key, label]) => (
            <div key={key} className="flex w-[92px] flex-col items-center gap-1.5">
              <label className="relative h-[129px] w-[92px] cursor-pointer overflow-hidden rounded-[12px] bg-surface-2 ring-1 ring-hairline" title={`${label} 기본 카드 이미지 (5:7 권장)`}>
                {cardDefaults[key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cardDefaults[key]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[20px] text-subtle">{defaultsUploading === key ? "…" : "+"}</span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={defaultsUploading != null}
                  onChange={(e) => void uploadDefault(key, e.target.files?.[0])}
                />
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold text-muted">{label}</span>
                {cardDefaults[key] && (
                  <button type="button" onClick={() => void saveDefaults({ ...cardDefaults, [key]: undefined })} title="제거" className="text-subtle hover:text-danger">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted break-keep">
          재화 보상(CP·아이템)의 결과 카드에 기본으로 쓰이는 이미지예요 (세로형 5:7, 권장 500×700px). 풀 행에 개별 이미지를 올리면
          그쪽이 우선하고, 여기서 교체하면 개별 이미지가 없는 모든 이벤트에 즉시 반영돼요. 업로드 즉시 저장돼요.
        </p>
      </Card>

      {form && (
        <Card
          title={form.id ? `이벤트 편집${form.kind === "digital" ? ` — ${KIND_LABEL.digital}` : ""}` : "새 럭키드로우"}
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
                    {/* 결과 카드 이미지 — 썸네일 클릭 = 업로드/교체 */}
                    <label className="relative h-10 w-7 shrink-0 cursor-pointer overflow-hidden rounded-[6px] bg-surface-1 ring-1 ring-hairline" title="결과 카드 이미지 업로드 (5:7 권장)">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[13px] text-subtle">{uploadingIdx === i ? "…" : "+"}</span>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingIdx != null}
                        onChange={(e) => void uploadCard(i, e.target.files?.[0])}
                      />
                    </label>
                    {p.image_url && (
                      <button type="button" onClick={() => setPool(i, { image_url: null })} title="이미지 제거" className="shrink-0 text-subtle hover:text-danger">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
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
                        <span className="w-16 shrink-0 text-right text-[12.5px] font-black tabular-nums text-primary-400">
                          {totalQty > 0 && p.total_qty ? ((p.total_qty / totalQty) * 100).toFixed(2) : "0"}%
                        </span>
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
              {form.kind === "physical_box" && (
                <div className="flex items-center justify-end gap-1.5 text-[12.5px] font-bold text-muted">
                  박스 크기(수량 합계) <span className="text-[14px] font-black tabular-nums text-fg">{totalQty.toLocaleString()}</span>개
                </div>
              )}
            </div>
            {/* 결과 카드 미리보기 — 유저 화면과 동일한 모습 (이미지 적용·잘림 확인용) */}
            <div className="mt-2 rounded-[12px] bg-surface-2 p-3.5 ring-1 ring-hairline">
              <div className="mb-1 text-[13px] font-bold text-fg">결과 카드 미리보기 — 유저에게 이렇게 보여요</div>
              <p className="mb-3 text-[12px] leading-relaxed text-muted break-keep">
                카드 이미지 규격: <b className="text-fg">세로형 5:7 비율, 권장 500 × 700px</b> · JPG/PNG/WebP · 3MB 이하. 비율이 다른
                이미지는 카드에 꽉 차게 잘려 보여요 — 아래 미리보기가 실제 노출 그대로예요. 이미지가 없는 행은 보상 아트로 표시돼요.
                보상명은 카드 아래에 자동 표기되니 이미지 안에 글자를 넣지 않아도 돼요.
              </p>
              <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
                {form.pool.map((p, i) => (
                  <CardPreview key={i} p={p} defaults={cardDefaults} />
                ))}
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-muted">
              {form.kind === "digital"
                ? `확률 = 가중치 ÷ 전체 가중치 합(${totalWeight.toLocaleString()}). 저장 즉시 유저 확률 공시에 반영돼요. 꽝 없음 — 모든 행이 보상을 지급해요.`
                : "행의 % 는 시작 시점 확률(수량 ÷ 박스 크기)이에요. 진행 중에는 남은 상품 수에 비례해 실시간으로 변하고(유저 공시도 잔여/전체 기준), 소진되면 자동 종료돼요. 각 행의 썸네일을 눌러 결과 카드 이미지를 올릴 수 있어요 (세로형 5:7 권장, 예: 500×700 — 없으면 앱이 보상 아트로 표시). 배송형 실물 당첨은 수령 기한 내 정보 미입력 시 무효 처리돼요. 게시 후에는 풀·재고를 수정할 수 없으니 검토 후 게시해 주세요."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
