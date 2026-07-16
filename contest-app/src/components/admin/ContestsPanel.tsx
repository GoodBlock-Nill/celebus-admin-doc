"use client";

// 콘테스트 CRUD + 상태 전환 (관리자 UI는 운영자 전용 — 한국어 고정)
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Languages, Eye, Loader2 } from "lucide-react";
import type { ContestRow } from "@/lib/admin-types";
import { adminFetch } from "@/lib/admin-types";
import { STATUS_LABELS } from "@/lib/contest-status";
import type { AwardType, ContestI18n, ContestPublic, ContestStatus, PrizeItem } from "@/lib/types";
import { localizeContest } from "@/lib/localize";
import { LangProvider } from "../LangProvider";
import CoverHero from "../CoverHero";
import ImageUploader from "./ImageUploader";

const AWARD_LABELS: Record<AwardType, string> = {
  popular: "인기상 (투표 순위)",
  judge: "심사상 (관리자 선정)",
};

const NEXT_ACTIONS: Record<ContestStatus, { to: ContestStatus; label: string }[]> = {
  draft: [{ to: "open", label: "게시 (접수 시작)" }],
  open: [
    { to: "voting", label: "접수 마감 (투표만)" },
    { to: "judging", label: "접수+투표 동시 마감" },
    { to: "draft", label: "게시 취소" },
  ],
  voting: [{ to: "judging", label: "투표 마감 (심사)" }],
  judging: [{ to: "announced", label: "수상 발표" }],
  announced: [{ to: "closed", label: "아카이브" }],
  closed: [],
};

const input = "w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-[13px] outline-none focus:border-primary/60";
const lbl = "mb-1 block text-[11px] font-bold text-muted";

const LANGS = [
  { key: "ko", label: "한국어" },
  { key: "en", label: "English" },
  { key: "ja", label: "日本語" },
] as const;
type LangKey = (typeof LANGS)[number]["key"];
type LField = "title" | "description" | "rules" | "prize_summary";

function fmtLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toLocal(iso: string | null): string {
  return iso ? fmtLocal(new Date(iso)) : "";
}
function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}
function nowLocal(): string {
  return fmtLocal(new Date());
}
function addDaysLocal(local: string, days: number): string {
  const base = local ? new Date(local) : new Date();
  base.setDate(base.getDate() + days);
  return fmtLocal(base);
}

function ContestForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: ContestRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    slug: initial?.slug ?? "",
    artist: initial?.artist ?? "V01D",
    contest_type: initial?.contest_type ?? "video",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    rules: initial?.rules ?? "",
    prize_summary: initial?.prize_summary ?? "",
    prizes: (initial?.prizes ?? []) as PrizeItem[],
    cover_image_url: initial?.cover_image_url ?? "",
    is_featured: initial?.is_featured ?? false,
    banner_order: (initial?.banner_order ?? null) as number | null,
    i18n: (initial?.i18n ?? {}) as ContestI18n,
    submit_start_at: toLocal(initial?.submit_start_at ?? null),
    submit_end_at: toLocal(initial?.submit_end_at ?? null),
    vote_end_at: toLocal(initial?.vote_end_at ?? null),
    announce_at: toLocal(initial?.announce_at ?? null),
  });
  const [busy, setBusy] = useState(false);
  const [contentLang, setContentLang] = useState<LangKey>("ko");
  const [translating, setTranslating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState<LangKey>("ko");

  // 다국어 필드 접근: ko는 base 컬럼, en·ja는 i18n
  const cv = (field: LField): string =>
    contentLang === "ko" ? (f[field] as string) : (f.i18n[contentLang]?.[field] ?? "");
  const setCv = (field: LField, value: string) => {
    if (contentLang === "ko") setF((s) => ({ ...s, [field]: value }));
    else
      setF((s) => ({
        ...s,
        i18n: { ...s.i18n, [contentLang]: { ...(s.i18n[contentLang] ?? {}), [field]: value } },
      }));
  };

  async function autoTranslate() {
    if (translating) return;
    if (!f.title.trim()) return toast.error("한국어 제목을 먼저 입력해주세요.");
    setTranslating(true);
    try {
      const res = await adminFetch("/api/admin/contests/translate", {
        method: "POST",
        body: JSON.stringify({
          title: f.title,
          description: f.description,
          rules: f.rules,
          prize_summary: f.prize_summary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "자동 번역 실패");
        return;
      }
      setF((s) => ({ ...s, i18n: { en: data.en, ja: data.ja } }));
      setContentLang("en");
      toast.success("자동 번역 완료 — EN·JA 탭에서 확인·수정하세요");
    } catch {
      toast.error("자동 번역 실패");
    } finally {
      setTranslating(false);
    }
  }

  // 인기상 순위 구간 → 라벨·인원수 자동 계산
  const popularLabel = (from: number, to: number) => (from === to ? `인기상 ${from}위` : `인기상 ${from}~${to}위`);

  // 빠른 추가: 인기상은 다음 순위 구간(직전 인기상 끝+1)부터, 심사상은 "심사상"
  const addPopular = () =>
    setF((s) => {
      const maxTo = s.prizes.filter((p) => p.award_type === "popular").reduce((m, p) => Math.max(m, p.rank_to ?? 0), 0);
      const from = maxTo + 1;
      return {
        ...s,
        prizes: [...s.prizes, { rank_label: popularLabel(from, from), name: "", award_type: "popular", count: 1, image_url: "", rank_from: from, rank_to: from } as PrizeItem],
      };
    });
  const addJudge = () =>
    setF((s) => ({ ...s, prizes: [...s.prizes, { rank_label: "심사상", name: "", award_type: "judge", count: 1, image_url: "" } as PrizeItem] }));
  const updPrize = (i: number, patch: Partial<PrizeItem>) =>
    setF((s) => ({ ...s, prizes: s.prizes.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const rmPrize = (i: number) => setF((s) => ({ ...s, prizes: s.prizes.filter((_, j) => j !== i) }));

  // 인기상 순위 구간 입력 → rank_from/to + 라벨 + 인원수 동시 갱신
  const setRange = (i: number, fromRaw: number | null, toRaw: number | null) => {
    const from = Math.max(1, fromRaw ?? 1);
    const to = Math.max(from, toRaw ?? from);
    updPrize(i, { rank_from: from, rank_to: to, rank_label: popularLabel(from, to), count: to - from + 1 });
  };
  // 유형 전환 시 기본값 세팅
  const changeAwardType = (i: number, type: AwardType) => {
    if (type === "popular") {
      const p = f.prizes[i];
      const from = p.rank_from ?? 1;
      const to = p.rank_to ?? from;
      updPrize(i, { award_type: "popular", rank_from: from, rank_to: to, rank_label: popularLabel(from, to), count: to - from + 1 });
    } else {
      updPrize(i, { award_type: "judge", rank_label: "심사상", rank_from: undefined, rank_to: undefined, count: 1 });
    }
  };

  // 빠른 일정: N일간 접수 → 투표 +1일 → 발표 +1일 자동 계산
  const quickSchedule = (days: number) => {
    const start = f.submit_start_at || nowLocal();
    const submitEnd = addDaysLocal(start, days);
    const voteEnd = addDaysLocal(submitEnd, 1);
    const announce = addDaysLocal(voteEnd, 1);
    setF((s) => ({ ...s, submit_start_at: start, submit_end_at: submitEnd, vote_end_at: voteEnd, announce_at: announce }));
  };
  // 순서 검증 (입력된 값만 비교)
  const dateSeq = [f.submit_start_at, f.submit_end_at, f.vote_end_at, f.announce_at].filter(Boolean);
  const dateOrderOk = dateSeq.every((d, i) => i === 0 || new Date(dateSeq[i - 1]) <= new Date(d));

  async function save() {
    if (busy) return;
    if (f.prizes.some((p) => !p.name.trim())) {
      return toast.error("보상 상품명을 모두 입력해주세요.");
    }
    if (f.prizes.some((p) => p.award_type === "judge" && !p.rank_label.trim())) {
      return toast.error("심사상 라벨을 입력해주세요.");
    }
    // 빈 로케일 제거
    const cleanI18n: ContestI18n = {};
    for (const L of ["en", "ja"] as const) {
      const loc = f.i18n[L];
      if (loc && (loc.title || loc.description || loc.rules || loc.prize_summary)) cleanI18n[L] = loc;
    }
    setBusy(true);
    try {
      const body = JSON.stringify({
        slug: f.slug.trim() || undefined, // 비우면 서버가 자동 생성
        artist: f.artist,
        contest_type: f.contest_type,
        title: f.title,
        description: f.description,
        rules: f.rules,
        prize_summary: f.prize_summary,
        prizes: f.prizes.map((p) => {
          if (p.award_type === "popular") {
            const from = Math.max(1, Number(p.rank_from) || 1);
            const to = Math.max(from, Number(p.rank_to) || from);
            return { ...p, rank_from: from, rank_to: to, rank_label: popularLabel(from, to), count: to - from + 1, image_url: p.image_url || null };
          }
          return { ...p, count: Number(p.count) || 1, image_url: p.image_url || null };
        }),
        cover_image_url: f.cover_image_url || null,
        is_featured: f.is_featured,
        banner_order: f.banner_order === null || Number.isNaN(f.banner_order) ? null : Number(f.banner_order),
        i18n: cleanI18n,
        submit_start_at: toIso(f.submit_start_at),
        submit_end_at: toIso(f.submit_end_at),
        vote_end_at: toIso(f.vote_end_at),
        announce_at: toIso(f.announce_at),
      });
      const res = initial
        ? await adminFetch(`/api/admin/contests/${initial.id}`, { method: "PATCH", body })
        : await adminFetch("/api/admin/contests", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      toast.success(initial ? "수정 완료" : "생성 완료 (draft)");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  // 미리보기용 합성 콘테스트 (previewLang로 로컬라이즈 → base에 반영, i18n 비움)
  const previewBase: ContestPublic = {
    id: "preview",
    slug: f.slug || "preview",
    artist: f.artist,
    contest_type: f.contest_type,
    title: f.title,
    description: f.description,
    rules: f.rules,
    prize_summary: f.prize_summary,
    prizes: f.prizes,
    cover_image_url: f.cover_image_url || null,
    status: "open",
    is_featured: f.is_featured,
    banner_order: f.banner_order,
    i18n: f.i18n,
    submit_start_at: toIso(f.submit_start_at),
    submit_end_at: toIso(f.submit_end_at),
    vote_end_at: toIso(f.vote_end_at),
    announce_at: toIso(f.announce_at),
    created_at: new Date().toISOString(),
  };
  const previewContest: ContestPublic = { ...previewBase, ...localizeContest(previewBase, previewLang), i18n: {} };

  const koHint = (field: LField) => (contentLang !== "ko" && f[field] ? `한국어: ${f[field] as string}` : undefined);

  return (
    <div className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lbl}>아티스트</label>
          <input value={f.artist} onChange={(e) => setF({ ...f, artist: e.target.value })} className={input} />
        </div>
        <div>
          <label className={lbl}>유형</label>
          <select
            value={f.contest_type}
            onChange={(e) => setF({ ...f, contest_type: e.target.value as "image" | "video" })}
            className={input}
          >
            <option value="video">영상 (YouTube·TikTok·릴스)</option>
            <option value="image">이미지 (X·Instagram·Threads)</option>
          </select>
        </div>
      </div>

      {/* 커버 이미지 업로드 */}
      <div>
        <label className={lbl}>커버 이미지</label>
        <ImageUploader
          value={f.cover_image_url}
          onChange={(url) => setF((s) => ({ ...s, cover_image_url: url }))}
          folder="cover"
          label="커버 업로드"
          className="h-28 w-full max-w-xs"
        />
        <p className="mt-1 text-[10px] text-muted">JPEG·PNG·GIF·WebP · 5MB 이하</p>
      </div>

      {/* 다국어 콘텐츠 (언어 탭 + 자동 번역) */}
      <div className="rounded-xl border border-hairline bg-bg/40 p-2.5">
        <div className="mb-2.5 flex items-center gap-1">
          <div className="flex gap-0.5 rounded-full bg-bg p-0.5">
            {LANGS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setContentLang(l.key)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  contentLang === l.key ? "bg-primary text-white" : "text-muted hover:text-fg"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={autoTranslate}
            disabled={translating}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary-400 hover:bg-primary/25 disabled:opacity-50"
          >
            {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
            자동 번역 (EN·JA)
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className={lbl}>제목{contentLang === "ko" ? "" : ` (${contentLang.toUpperCase()})`}</label>
            <input value={cv("title")} onChange={(e) => setCv("title", e.target.value)} className={input} placeholder={koHint("title")} />
          </div>
          <div>
            <label className={lbl}>소개</label>
            <textarea value={cv("description")} onChange={(e) => setCv("description", e.target.value)} rows={2} className={input} placeholder={koHint("description")} />
          </div>
          <div>
            <label className={lbl}>참가 규정</label>
            <textarea value={cv("rules")} onChange={(e) => setCv("rules", e.target.value)} rows={3} className={input} placeholder={koHint("rules")} />
          </div>
          <div>
            <label className={lbl}>보상 요약 (히어로 한 줄)</label>
            <input value={cv("prize_summary")} onChange={(e) => setCv("prize_summary", e.target.value)} className={input} placeholder={koHint("prize_summary") ?? "1위 V01D 전원 싸인 앨범"} />
          </div>
        </div>
      </div>

      {/* 보상 목록 */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className={lbl + " mb-0"}>보상 목록</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={addPopular}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary-400 hover:bg-primary/25"
            >
              <Plus className="h-3 w-3" /> 인기상
            </button>
            <button
              type="button"
              onClick={addJudge}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary-400 hover:bg-primary/25"
            >
              <Plus className="h-3 w-3" /> 심사상
            </button>
          </div>
        </div>
        {f.prizes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12px] text-muted">
            아직 보상이 없어요. [인기상]·[심사상]으로 상품을 추가하세요. 등수는 자동으로 채워져요.
          </p>
        ) : (
          <div className="space-y-2">
            {f.prizes.map((p, i) => (
              <div key={i} className="rounded-xl border border-border bg-bg p-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={p.award_type}
                    onChange={(e) => changeAwardType(i, e.target.value as AwardType)}
                    className={`${input} flex-1`}
                  >
                    <option value="popular">{AWARD_LABELS.popular}</option>
                    <option value="judge">{AWARD_LABELS.judge}</option>
                  </select>
                  {p.award_type === "popular" ? (
                    <div className="flex shrink-0 items-center gap-1" aria-label="순위 구간">
                      <input
                        type="number"
                        min={1}
                        value={p.rank_from ?? ""}
                        onChange={(e) => setRange(i, e.target.value === "" ? null : Number(e.target.value), p.rank_to ?? null)}
                        className={`${input} w-14 text-center`}
                        aria-label="시작 순위"
                      />
                      <span className="text-[12px] text-muted">~</span>
                      <input
                        type="number"
                        min={1}
                        value={p.rank_to ?? ""}
                        onChange={(e) => setRange(i, p.rank_from ?? null, e.target.value === "" ? null : Number(e.target.value))}
                        className={`${input} w-14 text-center`}
                        aria-label="끝 순위"
                      />
                      <span className="text-[12px] text-muted">위</span>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={p.count}
                        onChange={(e) => updPrize(i, { count: Number(e.target.value) })}
                        className={`${input} w-16 text-center`}
                        aria-label="수량"
                      />
                      <span className="text-[12px] text-muted">명</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => rmPrize(i)}
                    aria-label="보상 삭제"
                    className="shrink-0 rounded-lg p-2 text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {p.award_type === "popular" ? (
                  <p className="mb-1.5 text-[11px] font-bold text-primary-400">
                    = {p.rank_label}
                    {(p.count ?? 1) > 1 ? ` · ${p.count}명` : ""}
                  </p>
                ) : (
                  <input
                    value={p.rank_label}
                    onChange={(e) => updPrize(i, { rank_label: e.target.value })}
                    className={`${input} mb-1.5`}
                    placeholder="상 이름 (예: 심사상)"
                  />
                )}
                <input
                  value={p.name}
                  onChange={(e) => updPrize(i, { name: e.target.value })}
                  className={`${input} mb-1.5`}
                  placeholder="상품명 (예: V01D 전원 싸인 앨범)"
                />
                <div className="flex items-center gap-2">
                  <ImageUploader
                    value={p.image_url ?? ""}
                    onChange={(url) => updPrize(i, { image_url: url })}
                    folder="prize"
                    label="상품 이미지"
                    className="h-16 w-24"
                  />
                  <span className="text-[10px] text-muted">상품 이미지 (선택)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 일정 */}
      <div>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <label className={lbl + " mb-0"}>
            일정 <span className="font-normal text-subtle">(KST 기준)</span>
          </label>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-muted">빠른 설정</span>
            <button type="button" onClick={() => setF({ ...f, submit_start_at: nowLocal() })} className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-bold text-muted hover:text-fg">
              지금 시작
            </button>
            {[3, 7, 14].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => quickSchedule(d)}
                className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary-400 hover:bg-primary/25"
              >
                {d}일 진행
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["submit_start_at", "접수 시작"],
              ["submit_end_at", "접수 마감"],
              ["vote_end_at", "투표 마감"],
              ["announce_at", "발표 예정"],
            ] as const
          ).map(([k, label], i) => (
            <div key={k}>
              <label className={lbl}>
                <span className="mr-1 text-subtle">{i + 1}</span>
                {label}
              </label>
              <input type="datetime-local" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={input} />
            </div>
          ))}
        </div>
        {!dateOrderOk && (
          <p className="mt-1.5 text-[11px] font-semibold text-amber-400">
            ⚠ 일정 순서를 확인해주세요 — 접수 시작 → 접수 마감 → 투표 마감 → 발표 순이어야 해요.
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted">💡 [N일 진행]을 누르면 접수·투표·발표 일정이 한 번에 채워져요 (수정 가능).</p>
      </div>

      {/* 메인 배너 */}
      <div className="grid grid-cols-2 items-end gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-[13px] font-bold">
          <input
            type="checkbox"
            checked={f.is_featured}
            onChange={(e) => setF({ ...f, is_featured: e.target.checked })}
            className="h-4 w-4 accent-[color:var(--color-primary)]"
          />
          메인 배너에 노출
        </label>
        <div>
          <label className={lbl}>배너 순서 (작을수록 앞)</label>
          <input
            type="number"
            min={0}
            value={f.banner_order ?? ""}
            onChange={(e) => setF({ ...f, banner_order: e.target.value === "" ? null : Number(e.target.value) })}
            className={input}
            placeholder="예: 1"
            disabled={!f.is_featured}
          />
        </div>
      </div>

      {/* 고급 설정: slug·URL 직접 입력 */}
      <details className="rounded-lg border border-hairline">
        <summary className="cursor-pointer px-3 py-2 text-[12px] font-bold text-muted">고급 설정 (URL slug 직접 지정)</summary>
        <div className="space-y-2 p-3 pt-0">
          <div>
            <label className={lbl}>slug (공개 URL 경로 — 비우면 자동 생성됨)</label>
            <input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className={input} placeholder="자동 생성 (예: v01d-video-a1b2c3)" />
            <p className="mt-1 text-[10px] text-muted">공개 주소 /contest/&lt;slug&gt; 에 쓰여요. 보통 비워두면 됩니다.</p>
          </div>
          <div>
            <label className={lbl}>커버 이미지 URL 직접 입력 (업로드 대신)</label>
            <input value={f.cover_image_url} onChange={(e) => setF({ ...f, cover_image_url: e.target.value })} className={input} placeholder="https://…" />
          </div>
        </div>
      </details>

      {/* 미리보기 */}
      <div>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-bold text-muted hover:text-fg"
        >
          <Eye className="h-3.5 w-3.5" /> {showPreview ? "미리보기 닫기" : "공개 화면 미리보기"}
        </button>
        {showPreview && (
          <div className="mt-2 rounded-xl border border-hairline bg-surface-1 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted">미리보기</span>
              <div className="ml-auto flex gap-0.5 rounded-full bg-bg p-0.5">
                {LANGS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setPreviewLang(l.key)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      previewLang === l.key ? "bg-primary text-white" : "text-muted"
                    }`}
                  >
                    {l.key.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto max-w-md">
              <LangProvider>
                <CoverHero contest={previewContest} entryCount={0} voteCount={0} />
              </LangProvider>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="rounded-full border border-border px-4 py-2 text-[13px] font-bold text-muted">
          취소
        </button>
        <button
          onClick={save}
          disabled={busy || !f.title.trim()}
          className="flex-1 rounded-full bg-primary py-2 text-[13px] font-black text-white disabled:opacity-40"
        >
          {initial ? "수정 저장" : "생성 (draft)"}
        </button>
      </div>
    </div>
  );
}

export default function ContestsPanel() {
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [editing, setEditing] = useState<ContestRow | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await adminFetch("/api/admin/contests");
    const data = await res.json();
    setContests(data.contests ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function transition(c: ContestRow, to: ContestStatus, label: string) {
    if (!confirm(`'${c.title}'\n${STATUS_LABELS[c.status]} → ${STATUS_LABELS[to]} (${label})\n진행할까요?`)) return;
    const res = await adminFetch(`/api/admin/contests/${c.id}`, { method: "PATCH", body: JSON.stringify({ status: to }) });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "전환 실패");
    toast.success(`${STATUS_LABELS[to]} 전환 완료`);
    void load();
  }

  async function purgePii(c: ContestRow) {
    if (!confirm(`'${c.title}' 출품자 전화번호를 전부 파기할까요? 되돌릴 수 없어요.`)) return;
    const res = await adminFetch(`/api/admin/contests/${c.id}/purge-pii`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "파기 실패");
    toast.success(`전화번호 ${data.count}건 파기 완료`);
  }

  async function remove(c: ContestRow) {
    if (!confirm(`'${c.title}' 콘테스트를 삭제할까요? (draft만 가능)`)) return;
    const res = await adminFetch(`/api/admin/contests/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "삭제 실패");
    toast.success("삭제 완료");
    void load();
  }

  return (
    <div className="space-y-3">
      {!creating && !editing && (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-black text-white"
        >
          <Plus className="h-4 w-4" /> 새 콘테스트
        </button>
      )}
      {(creating || editing) && (
        <ContestForm
          initial={editing}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void load();
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {contests.map((c) => (
        <div key={c.id} className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">{STATUS_LABELS[c.status]}</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary-400">
              {c.contest_type === "video" ? "영상" : "이미지"}
            </span>
            {c.is_featured && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">배너{c.banner_order != null ? ` ${c.banner_order}` : ""}</span>
            )}
            <span className="truncate text-[14px] font-bold">{c.title}</span>
            <span className="ml-auto flex shrink-0 gap-1">
              <button onClick={() => setEditing(c)} aria-label="수정" className="rounded p-1.5 text-muted hover:text-fg">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {c.status === "draft" && (
                <button onClick={() => remove(c)} aria-label="삭제" className="rounded p-1.5 text-muted hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          </div>
          <p className="mb-2 text-[11px] text-muted">
            /{c.slug} · 접수마감 {c.submit_end_at ? new Date(c.submit_end_at).toLocaleString("ko") : "-"} · 투표마감{" "}
            {c.vote_end_at ? new Date(c.vote_end_at).toLocaleString("ko") : "-"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NEXT_ACTIONS[c.status].map((a) => {
              const isRollback = a.to === "draft"; // 역방향(게시 취소) — 파괴적 신호
              return (
                <button
                  key={a.to}
                  onClick={() => transition(c, a.to, a.label)}
                  className={`rounded-full border px-3 py-1 text-[12px] font-bold ${
                    isRollback
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      : "border-primary/40 bg-primary/10 text-primary-400 hover:bg-primary/20"
                  }`}
                >
                  {isRollback ? "↩ " : ""}
                  {a.label}
                  {isRollback ? "" : " →"}
                </button>
              );
            })}
            {c.status === "closed" && (
              <button
                onClick={() => purgePii(c)}
                className="rounded-full border border-danger/40 px-3 py-1 text-[12px] font-bold text-danger hover:bg-danger/10"
              >
                출품자 전화번호 파기
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
