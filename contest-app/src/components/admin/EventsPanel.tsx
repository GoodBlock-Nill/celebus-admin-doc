"use client";

// 관리자: 모먼트 토너먼트 — 아카이브 단위 개최, 발표 시 3종 수상 자동 계산.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Check } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import ImageUploader from "./ImageUploader";
import { TournamentCardPreview } from "./AppPreview";
import { Badge, Btn, Card, Empty, Label, inputCls, useConfirm } from "./ui";
import LangTabsFields, { cleanStageI18n, type LangI18n } from "./LangTabsFields";

type EventRow = {
  id: string;
  stage_id: string;
  title: string;
  description: string;
  status: "open" | "announced" | "closed";
  ends_at: string | null;
  reward_type?: "reward" | "popularity";
  reward?: string;
  cover_url?: string | null;
  i18n?: LangI18n;
  awards: { fan?: { title: string } | null; artist?: { title: string } | null; uploader?: { handle: string } | null } | null;
  created_at: string;
  stages: { title: string } | null;
};
type StageOpt = { id: string; title: string; is_official: boolean };

// 공식 카테고리 라벨 (스코프 선택용)
const OFFICIAL_CATS: { v: string; l: string }[] = [
  { v: "v1de0", l: "V1DE0" },
  { v: "album01", l: "1st Mini Album [01]" },
  { v: "oncam", l: "ON CAM" },
  { v: "log", l: "LOG" },
  { v: "azit", l: "AZIT" },
  { v: "stud10", l: "STUD10" },
  { v: "outv", l: "OUT THE V01D" },
  { v: "shorts", l: "Shorts" },
];

const STATUS_LABEL: Record<EventRow["status"], string> = { open: "진행중", announced: "발표됨", closed: "종료" };
const STATUS_TONE: Record<EventRow["status"], "green" | "amber" | "gray"> = { open: "green", announced: "amber", closed: "gray" };

export default function EventsPanel() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [stages, setStages] = useState<StageOpt[]>([]);
  const [form, setForm] = useState({
    archiveType: "d10v" as "d10v" | "v01d", // D10V=팬 복수 / V01D=공식 단일
    stage_id: "", // V01D 단일 공식 아카이브
    stage_ids: [] as string[], // D10V 복수 팬 아카이브
    title: "",
    description: "",
    ends_at: "",
    reward_type: "popularity" as "reward" | "popularity",
    reward: "",
    category: "",
    cover_url: "",
    i18n: {} as LangI18n,
  });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // 수정 중인 토너먼트
  const { confirm, confirmEl } = useConfirm();

  const load = useCallback(async () => {
    const [evRes, stRes] = await Promise.all([adminFetch("/api/admin/events"), adminFetch("/api/admin/stages")]);
    const ev = await evRes.json();
    const st = await stRes.json();
    setEvents(ev.events ?? []);
    setStages((st.stages ?? []).map((s: { id: string; title: string; is_official?: boolean }) => ({ id: s.id, title: s.title, is_official: Boolean(s.is_official) })));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const fanStages = stages.filter((s) => !s.is_official);
  const officialStages = stages.filter((s) => s.is_official);
  // 선택된 참가 아카이브 집합
  const stageIds = form.archiveType === "v01d" ? (form.stage_id ? [form.stage_id] : []) : form.stage_ids;
  const showCategory = form.archiveType === "v01d" && !!form.stage_id; // 카테고리 스코프는 V01D 전용

  function toggleFanStage(id: string) {
    setForm((f) => ({ ...f, stage_ids: f.stage_ids.includes(id) ? f.stage_ids.filter((x) => x !== id) : [...f.stage_ids, id] }));
  }

  const resetForm = () => setForm({ archiveType: "d10v", stage_id: "", stage_ids: [], title: "", description: "", ends_at: "", reward_type: "popularity", reward: "", category: "", cover_url: "", i18n: {} });

  async function create() {
    if (busy || stageIds.length === 0 || !form.title.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/events", {
      method: "POST",
      body: JSON.stringify({
        stage_ids: stageIds,
        title: form.title.trim(),
        description: form.description.trim(),
        ends_at: form.ends_at ? new Date(form.ends_at + "T23:59:59+09:00").toISOString() : null,
        reward_type: form.reward_type,
        reward: form.reward_type === "reward" ? form.reward.trim() : "",
        category: form.archiveType === "v01d" ? form.category || null : null, // 카테고리는 V01D 전용
        cover_url: form.cover_url || null,
        i18n: cleanStageI18n(form.i18n),
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("토너먼트를 열었어요.");
      resetForm();
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "생성 실패");
    }
  }

  async function setStatus(id: string, status: EventRow["status"]) {
    const res = await adminFetch(`/api/admin/events/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (res.ok) {
      toast.success(status === "announced" ? "결과를 발표했어요. (3종 수상 자동 계산)" : "변경했어요.");
      void load();
    } else {
      toast.error("변경 실패");
    }
  }

  async function announce(id: string) {
    if (!(await confirm({ title: "결과 발표", body: "발표 후에는 플레이가 중단되고 수상이 확정돼요.", confirmLabel: "발표하기" }))) return;
    void setStatus(id, "announced");
  }

  async function close(id: string) {
    if (!(await confirm({ title: "토너먼트 종료", body: "종료하면 목록에서 비노출돼요.", confirmLabel: "종료", danger: true }))) return;
    void setStatus(id, "closed");
  }

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-muted">
        토너먼트는 아카이브 단위로 열려요. 해당 아카이브의 공개 영상 전체가 자동 출전하고, <b className="text-fg">발표하기</b> 시 팬인기상·아티스트인기상·최다업로드상이 자동 계산돼요.
      </p>

      {/* 생성 폼 */}
      <Card className="space-y-4 p-4">
        {/* 아카이브 타입 — D10V(팬·복수) / V01D(공식·단일) */}
        <div>
          <Label>아카이브 타입</Label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { k: "d10v", title: "D10V 팬 아카이브", desc: "팬 영상 · 복수 선택" },
              { k: "v01d", title: "V01D 공식", desc: "공식 영상 · 단일" },
            ] as const).map((o) => (
              <button
                key={o.k}
                type="button"
                onClick={() => setForm({ ...form, archiveType: o.k, stage_id: "", stage_ids: [], category: "" })}
                className={`rounded-xl border p-3 text-left transition-colors ${form.archiveType === o.k ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-surface-2"}`}
              >
                <div className={`text-[13px] font-extrabold ${form.archiveType === o.k ? "text-primary-strong" : "text-fg"}`}>{o.title}</div>
                <div className="text-[11px] text-muted">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {form.archiveType === "v01d" ? (
          <>
            {/* V01D — 단일 공식 아카이브 */}
            <div>
              <Label>공식 아카이브</Label>
              <select value={form.stage_id} onChange={(e) => setForm({ ...form, stage_id: e.target.value, category: "" })} className={inputCls}>
                <option value="">공식 아카이브 선택</option>
                {officialStages.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              {officialStages.length === 0 && <p className="mt-1 text-[11px] text-subtle">공식 아카이브가 없어요. ‘아카이브’ 탭에서 먼저 만들어주세요.</p>}
            </div>
            {/* 카테고리 스코프 */}
            {showCategory && (
              <div>
                <Label>대상 범위 <span className="font-medium text-subtle">(공식영상 카테고리)</span></Label>
                <div className="flex flex-wrap gap-1.5">
                  {[{ v: "", l: "전체" }, ...OFFICIAL_CATS].map((c) => (
                    <button
                      key={c.v || "all"}
                      type="button"
                      onClick={() => setForm({ ...form, category: c.v })}
                      className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors ${form.category === c.v ? "border-primary bg-primary text-white" : "border-border bg-card text-muted hover:bg-surface-2"}`}
                    >
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // D10V — 팬 아카이브 복수 선택
          <div>
            <Label>참가 아카이브 <span className="font-medium text-subtle">(복수 선택 · 선택 영상 전체 합산)</span></Label>
            {fanStages.length === 0 ? (
              <p className="text-[12px] text-subtle">팬 아카이브가 없어요. ‘아카이브’ 탭에서 먼저 만들어주세요.</p>
            ) : (
              <div className="space-y-1.5">
                {fanStages.map((s) => {
                  const on = form.stage_ids.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleFanStage(s.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${on ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-surface-2"}`}
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${on ? "border-primary bg-primary text-white" : "border-border"}`}>
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="truncate text-[13px] font-bold text-fg">{s.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {form.stage_ids.length > 0 && <p className="mt-1.5 text-[11.5px] font-bold text-primary-strong">{form.stage_ids.length}개 아카이브 선택됨</p>}
          </div>
        )}

        <LangTabsFields
          koTitle={form.title}
          koDesc={form.description}
          i18n={form.i18n}
          onKoTitle={(v) => setForm({ ...form, title: v })}
          onKoDesc={(v) => setForm({ ...form, description: v })}
          onI18n={(v) => setForm({ ...form, i18n: v })}
          titleLabel="토너먼트명"
          descLabel="소개"
          titlePlaceholder="토너먼트명 (예: 부산 버스킹 모먼트 토너먼트)"
          descRows={2}
        />

        <div>
          <Label>종료일 <span className="font-medium text-subtle">(선택)</span></Label>
          <input
            type="date"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className={inputCls}
          />
        </div>

        {/* 대표 커버 — 없으면 앱에서 참가작 콜라주로 대체 */}
        <div>
          <Label>대표 커버 <span className="font-medium text-subtle">(선택 · 미지정 시 참가작 콜라주)</span></Label>
          <div className="flex flex-wrap items-start gap-3">
            <ImageUploader value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} folder="cover" label="커버 업로드" className="h-[112px] w-40" />
            <div>
              <div className="mb-1 text-[11px] font-bold text-subtle">앱 미리보기</div>
              <TournamentCardPreview coverUrl={form.cover_url} title={form.title} description={form.description} rewardType={form.reward_type} reward={form.reward} />
            </div>
          </div>
        </div>

        {/* 토너먼트 유형 — 인기투표형 / 보상형 */}
        <div>
          <Label>토너먼트 유형</Label>
          <div className="flex gap-2">
            {([
              { v: "popularity", l: "인기투표형", d: "보상 없이 순위만" },
              { v: "reward", l: "보상형", d: "우승 보상 있음" },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setForm({ ...form, reward_type: o.v })}
                className={`flex-1 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${form.reward_type === o.v ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-surface-2"}`}
              >
                <div className={`text-[13px] font-bold ${form.reward_type === o.v ? "text-primary-strong" : "text-fg"}`}>{o.l}</div>
                <div className="text-[11px] text-subtle">{o.d}</div>
              </button>
            ))}
          </div>
        </div>

        {form.reward_type === "reward" && (
          <div>
            <Label>보상 내용</Label>
            <input
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: e.target.value })}
              maxLength={200}
              placeholder="보상 내용 (예: 우승 업로더에게 V01D 응원봉 + 공식 SNS 소개)"
              className={inputCls}
            />
          </div>
        )}

        <Btn variant="primary" className="w-full py-3" disabled={busy || stageIds.length === 0 || !form.title.trim()} onClick={create}>
          <Plus className="h-4 w-4" /> 토너먼트 열기
        </Btn>
      </Card>

      {/* 목록 */}
      <div className="space-y-2">
        {events.map((e) => (
          <Card key={e.id} className="p-3.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-bold text-fg">{e.title}</span>
                  <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                </div>
                <div className="mt-0.5 text-[11.5px] text-subtle">
                  {e.stages?.title ?? "?"} {e.ends_at ? `· ~${e.ends_at.slice(0, 10)}` : ""}
                </div>
                {e.status === "announced" && e.awards && (
                  <div className="mt-1 text-[11.5px] text-muted">
                    🏆 팬: {e.awards.fan?.title ?? "-"} · 아티스트: {e.awards.artist?.title ?? "-"} · 업로드: @{e.awards.uploader?.handle ?? "-"}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {e.status !== "closed" && (
                <Btn size="sm" variant="outline" onClick={() => setEditingId(editingId === e.id ? null : e.id)}>
                  {editingId === e.id ? "수정 닫기" : "수정"}
                </Btn>
              )}
              {e.status === "open" && (
                <Btn size="sm" variant="primary" onClick={() => void announce(e.id)}>발표하기</Btn>
              )}
              {e.status !== "closed" && (
                <Btn size="sm" variant="danger" onClick={() => void close(e.id)}>종료</Btn>
              )}
              {e.status === "closed" && (
                <Btn size="sm" variant="outline" onClick={() => void setStatus(e.id, "open")}>다시 열기</Btn>
              )}
            </div>
            {editingId === e.id && (
              <EventEditForm event={e} onSaved={() => { setEditingId(null); void load(); }} onCancel={() => setEditingId(null)} />
            )}
          </Card>
        ))}
        {events.length === 0 && <Empty>토너먼트가 없어요.</Empty>}
      </div>
      {confirmEl}
    </div>
  );
}

// 토너먼트 수정 폼 (인라인) — PATCH 지원 필드만: 토너먼트명·소개·다국어·종료일·커버·유형·보상.
// 참가 아카이브는 생성 시 확정이라 수정 불가.
function EventEditForm({ event, onSaved, onCancel }: { event: EventRow; onSaved: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    title: event.title,
    description: event.description ?? "",
    ends_at: event.ends_at ? event.ends_at.slice(0, 10) : "",
    reward_type: event.reward_type ?? ("popularity" as "reward" | "popularity"),
    reward: event.reward ?? "",
    cover_url: event.cover_url ?? "",
    i18n: (event.i18n ?? {}) as LangI18n,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy || !f.title.trim()) return;
    setBusy(true);
    const res = await adminFetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: f.title.trim(),
        description: f.description.trim(),
        ends_at: f.ends_at ? new Date(f.ends_at + "T23:59:59+09:00").toISOString() : null,
        reward_type: f.reward_type,
        reward: f.reward_type === "reward" ? f.reward.trim() : "",
        cover_url: f.cover_url || null,
        i18n: cleanStageI18n(f.i18n),
      }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("토너먼트를 수정했어요.");
      onSaved();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "수정 실패");
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-primary/30 bg-primary-soft/20 p-3">
      <LangTabsFields
        koTitle={f.title}
        koDesc={f.description}
        i18n={f.i18n}
        onKoTitle={(v) => setF({ ...f, title: v })}
        onKoDesc={(v) => setF({ ...f, description: v })}
        onI18n={(v) => setF({ ...f, i18n: v })}
        titleLabel="토너먼트명"
        descLabel="소개"
        titlePlaceholder="토너먼트명"
        descRows={2}
      />
      <div>
        <Label>종료일 <span className="font-medium text-subtle">(선택)</span></Label>
        <input type="date" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} className={inputCls} />
      </div>
      <div>
        <Label>대표 커버 <span className="font-medium text-subtle">(선택 · 미지정 시 참가작 콜라주)</span></Label>
        <div className="flex flex-wrap items-start gap-3">
          <ImageUploader value={f.cover_url} onChange={(url) => setF({ ...f, cover_url: url })} folder="cover" label="커버 업로드" className="h-[112px] w-40" />
          <div>
            <div className="mb-1 text-[11px] font-bold text-subtle">앱 미리보기</div>
            <TournamentCardPreview coverUrl={f.cover_url} title={f.title} description={f.description} rewardType={f.reward_type} reward={f.reward} />
          </div>
        </div>
      </div>
      <div>
        <Label>토너먼트 유형</Label>
        <div className="flex gap-2">
          {([
            { v: "popularity", l: "인기투표형", d: "보상 없이 순위만" },
            { v: "reward", l: "보상형", d: "우승 보상 있음" },
          ] as const).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setF({ ...f, reward_type: o.v })}
              className={`flex-1 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${f.reward_type === o.v ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-surface-2"}`}
            >
              <div className={`text-[13px] font-bold ${f.reward_type === o.v ? "text-primary-strong" : "text-fg"}`}>{o.l}</div>
              <div className="text-[11px] text-subtle">{o.d}</div>
            </button>
          ))}
        </div>
      </div>
      {f.reward_type === "reward" && (
        <div>
          <Label>보상 내용</Label>
          <input value={f.reward} onChange={(e) => setF({ ...f, reward: e.target.value })} maxLength={200} placeholder="보상 내용" className={inputCls} />
        </div>
      )}
      <div className="flex gap-2 pt-0.5">
        <Btn variant="outline" className="flex-1" onClick={onCancel}>취소</Btn>
        <Btn variant="primary" className="flex-1" disabled={busy || !f.title.trim()} onClick={() => void save()}>저장</Btn>
      </div>
      <p className="text-[11px] leading-relaxed text-subtle">※ 참가 아카이브는 생성 시 확정돼 수정할 수 없어요. 바꾸려면 새 토너먼트를 열어주세요.</p>
    </div>
  );
}
