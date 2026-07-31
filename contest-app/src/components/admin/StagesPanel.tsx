"use client";

// 관리자: 아카이브(공연 컨테이너) 관리 — 생성·수정·상태 전환. 유저 업로드는 open 아카이브에만 가능.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import { Badge, Btn, Card, Empty, Label, inputCls } from "./ui";
import LangTabsFields, { cleanStageI18n, type LangI18n } from "./LangTabsFields";
import ImageUploader from "./ImageUploader";
import { CoverCardPreview } from "./AppPreview";

type StageRow = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  event_date: string | null;
  status: "open" | "archived";
  hidden: boolean;
  post_count: number;
  is_official: boolean;
  created_at: string;
  i18n?: LangI18n | null;
  category?: string | null;
};

// D10V(팬) 아카이브 카테고리
const CAT_OPTIONS: { v: string; l: string }[] = [
  { v: "concert", l: "콘서트" },
  { v: "busking", l: "버스킹" },
  { v: "festival", l: "페스티벌" },
  { v: "fanmeeting", l: "팬미팅" },
  { v: "event", l: "행사" },
  { v: "fanmade", l: "팬메이드" },
];

const EMPTY = { title: "", description: "", event_date: "", cover_url: "", is_official: false, category: "", i18n: {} as LangI18n };

export default function StagesPanel() {
  const [stages, setStages] = useState<StageRow[]>([]);
  const [editing, setEditing] = useState<StageRow | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/stages");
    const j = await res.json();
    setStages(j.stages ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(s: StageRow | "new") {
    setEditing(s);
    setForm(s === "new" ? EMPTY : { title: s.title, description: s.description, event_date: s.event_date ?? "", cover_url: s.cover_url ?? "", is_official: s.is_official, category: s.category ?? "", i18n: s.i18n ?? {} });
  }

  async function save() {
    if (busy || !form.title.trim()) return;
    setBusy(true);
    const body = JSON.stringify({
      title: form.title.trim(),
      description: form.description.trim(),
      event_date: form.event_date || null,
      cover_url: form.cover_url.trim() || null,
      is_official: form.is_official,
      category: form.is_official ? null : form.category || null, // 카테고리는 D10V(팬) 아카이브 전용
      i18n: cleanStageI18n(form.i18n),
    });
    const res =
      editing !== "new" && editing
        ? await adminFetch(`/api/admin/stages/${editing.id}`, { method: "PATCH", body })
        : await adminFetch("/api/admin/stages", { method: "POST", body });
    setBusy(false);
    if (res.ok) {
      toast.success("저장했어요.");
      setEditing(null);
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "저장 실패");
    }
  }

  async function patch(id: string, patch: Record<string, unknown>, done: string) {
    const res = await adminFetch(`/api/admin/stages/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (res.ok) {
      toast.success(done);
      void load();
    } else toast.error("변경 실패");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted">유저는 &lsquo;진행중&rsquo; 아카이브에만 영상을 올릴 수 있어요. 보관하면 열람만 가능해요.</p>
        <Btn variant="primary" size="sm" className="shrink-0" onClick={() => openEdit("new")}>
          <Plus className="h-4 w-4" /> 아카이브 생성
        </Btn>
      </div>

      {stages.length === 0 ? (
        <Empty>아카이브가 없어요. 첫 아카이브를 생성해보세요.</Empty>
      ) : (
        <div className="space-y-2">
          {stages.map((s) => (
            <Card key={s.id} className="p-3.5">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-[14px] font-bold text-fg">{s.title}</span>
                    {s.is_official && <Badge tone="primary">V01D 공식</Badge>}
                    <Badge tone={s.status === "open" ? "green" : "gray"}>{s.status === "open" ? "진행중" : "보관"}</Badge>
                    {s.hidden && <Badge tone="neutral">숨김</Badge>}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-subtle">
                    {s.event_date ?? "일자 미정"} · 영상 {s.post_count}개
                  </div>
                </div>
                <Btn variant="ghost" size="sm" aria-label="수정" onClick={() => openEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </Btn>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => patch(s.id, { status: s.status === "open" ? "archived" : "open" }, s.status === "open" ? "보관했어요." : "다시 열었어요.")}
                >
                  {s.status === "open" ? "보관하기" : "다시 열기"}
                </Btn>
                <Btn variant="outline" size="sm" onClick={() => patch(s.id, { hidden: !s.hidden }, s.hidden ? "공개했어요." : "숨겼어요.")}>
                  {s.hidden ? "공개하기" : "숨기기"}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 생성/수정 폼 */}
      {editing && (
        <div className="anim-backdrop-in fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-fg">{editing === "new" ? "아카이브 생성" : "아카이브 수정"}</h3>
              <button onClick={() => setEditing(null)} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:bg-surface-2 hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <LangTabsFields
              koTitle={form.title}
              koDesc={form.description}
              i18n={form.i18n}
              onKoTitle={(v) => setForm({ ...form, title: v })}
              onKoDesc={(v) => setForm({ ...form, description: v })}
              onI18n={(v) => setForm({ ...form, i18n: v })}
              titleLabel="아카이브명"
              titlePlaceholder="예: 2026 여름 부산 버스킹"
              descRows={2}
            />
            <div>
              <Label>날짜</Label>
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <Label>대표 커버 이미지 (선택)</Label>
              <div className="flex flex-wrap items-start gap-3">
                <ImageUploader value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} folder="cover" label="커버 업로드" className="h-[112px] w-40" />
                <div>
                  <div className="mb-1 text-[11px] font-bold text-subtle">앱 미리보기</div>
                  <CoverCardPreview coverUrl={form.cover_url} title={form.title} description={form.description} />
                </div>
              </div>
            </div>
            {/* 카테고리 — D10V(팬) 아카이브 전용 */}
            {!form.is_official && (
              <div>
                <Label>카테고리 <span className="font-medium text-subtle">(선택 · D10V 아카이브 분류)</span></Label>
                <div className="flex flex-wrap gap-1.5">
                  {CAT_OPTIONS.map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => setForm({ ...form, category: form.category === c.v ? "" : c.v })}
                      className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors ${
                        form.category === c.v ? "border-primary bg-primary text-white" : "border-border bg-card text-muted hover:bg-surface-2"
                      }`}
                    >
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-3 py-3">
              <input type="checkbox" checked={form.is_official} onChange={(e) => setForm({ ...form, is_official: e.target.checked })} className="h-4 w-4 accent-primary" />
              <span className="text-[13px] font-bold text-fg">V01D 공식 아카이브 (열람 전용 · 팬 업로드 불가)</span>
            </label>
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" className="flex-1 py-3" onClick={() => setEditing(null)}>취소</Btn>
              <Btn variant="primary" className="flex-[2] py-3" disabled={busy || !form.title.trim()} onClick={save}>
                {editing === "new" ? "생성하기" : "저장하기"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
