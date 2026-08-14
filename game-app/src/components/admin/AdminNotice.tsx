"use client";

// 홈 팝업 공지 관리 — 홈 진입 시 표시되는 팝업(이미지·제목·본문·CTA)의 등록·스케줄링·재노출 정책.
// 게시 중(기간 내 + 켜짐) 공지는 유저 홈 진입 즉시 반영(부팅 캐시 없음).
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { pickL10n, type Lang } from "@/lib/i18n";
import { BTN, BTN_DANGER, BTN_GHOST, Card, DataTable, INPUT, TD, TR_HOVER, fmtDate } from "./ui";

type L10n = { ko?: string; en?: string; ja?: string };
type Notice = {
  id?: string;
  enabled: boolean;
  sort: number;
  title: L10n;
  body: L10n;
  image_url: string | null;
  cta_label: L10n;
  cta_url: string | null;
  policy: "always" | "daily" | "once";
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string;
};

const POLICY_LABEL: Record<string, string> = { always: "매번 표시", daily: "오늘 하루 닫기", once: "한 번만" };
const EMPTY: Notice = { enabled: false, sort: 100, title: {}, body: {}, image_url: null, cta_label: {}, cta_url: null, policy: "daily", starts_at: null, ends_at: null };

// 버튼 동작 — 앱 내 화면 선택지 (cta_url에 /?screen=X 로 저장, 팝업에서 새 탭 없이 화면 전환)
const APP_SCREENS: { v: string; l: string }[] = [
  { v: "gacha", l: "럭키드로우" },
  { v: "shop", l: "아이템 상점" },
  { v: "leaderboard", l: "랭킹" },
  { v: "items", l: "내 아이템" },
  { v: "mypage", l: "마이페이지" },
  { v: "prizes", l: "당첨 내역" },
  { v: "more", l: "더보기" },
  { v: "settings", l: "설정" },
  { v: "theme", l: "테마" },
];
const screenFromUrl = (url: string | null): string | null => url?.match(/^\/\?screen=([a-z]+)$/)?.[1] ?? null;

// KST datetime-local ↔ ISO 변환 (관리자 브라우저 시간대 무관)
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 16) : "");
const toIso = (local: string) => (local ? new Date(local + ":00+09:00").toISOString() : null);

// 노출 상태 파생 — 켜짐 여부 + 기간
function statusOf(n: Notice): { label: string; cls: string } {
  if (!n.enabled) return { label: "꺼짐", cls: "bg-surface-2 text-subtle" };
  const now = Date.now();
  if (n.starts_at && new Date(n.starts_at).getTime() > now) return { label: "예약", cls: "bg-gold/15 text-gold" };
  if (n.ends_at && new Date(n.ends_at).getTime() <= now) return { label: "종료", cls: "bg-surface-2 text-subtle" };
  return { label: "노출중", cls: "bg-primary/15 text-primary-400" };
}

export default function AdminNotice() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [form, setForm] = useState<Notice>(EMPTY);
  const [previewLang, setPreviewLang] = useState<Lang>("ko");
  const [armed, setArmed] = useState<string | null>(null); // 2단계 삭제 confirm
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 이미지 업로드 — 공개 버킷 저장 후 URL을 폼에 반영(공지 저장 시 함께 기록)
  const upload = async (file?: File | null) => {
    if (!file || uploading) return;
    if (file.size > 3 * 1024 * 1024) {
      setMsg("이미지가 3MB를 넘어요 — 줄여서 다시 올려 주세요");
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/notice-image", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) set({ image_url: data.url });
      else throw new Error();
    } catch {
      setMsg("업로드 실패 — JPG/PNG/WebP 3MB 이하만 가능해요");
      setTimeout(() => setMsg(null), 4000);
    }
    setUploading(false);
  };

  const load = async () => setRows(await aget<Notice[]>("/api/admin/notice"));
  useEffect(() => {
    void load().catch(() => {});
  }, []);

  const set = (patch: Partial<Notice>) => setForm((f) => ({ ...f, ...patch }));
  const setL = (field: "title" | "body" | "cta_label", lang: Lang, v: string) => set({ [field]: { ...form[field], [lang]: v } });

  const save = async (n: Notice) => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await asend("/api/admin/notice", "POST", n);
      setMsg(n.id ? "저장했어요" : "등록했어요");
      if (!n.id) setForm(EMPTY);
      await load();
    } catch {
      setMsg("저장 실패 — 한국어 제목·URL 형식(https:// 또는 /)·기간 순서를 확인해 주세요");
    }
    setBusy(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const remove = async (id: string) => {
    if (armed !== id) {
      setArmed(id);
      setTimeout(() => setArmed((a) => (a === id ? null : a)), 3000);
      return;
    }
    setBusy(true);
    await asend(`/api/admin/notice?id=${id}`, "DELETE");
    setArmed(null);
    if (form.id === id) setForm(EMPTY);
    await load();
    setBusy(false);
  };

  const pTitle = pickL10n(form.title, previewLang);
  const pBody = pickL10n(form.body, previewLang);
  const pCta = pickL10n(form.cta_label, previewLang);

  return (
    <div className="flex flex-col gap-4">
      {/* ── 목록 ── */}
      <Card
        title="등록된 공지"
        right={
          <button onClick={() => setForm(EMPTY)} className={`${BTN_GHOST} flex items-center gap-1`}>
            <Plus className="h-3.5 w-3.5" /> 새 공지
          </button>
        }
      >
        {rows.length === 0 ? (
          <p className="text-[13px] text-subtle">등록된 공지가 없어요. 아래에서 첫 공지를 만들어 보세요.</p>
        ) : (
          <DataTable head={["순서", "상태", "제목", "기간 (KST)", "정책", "", ""]}>
            {rows.map((r) => {
              const st = statusOf(r);
              return (
                <tr key={r.id} className={TR_HOVER}>
                  <td className={`${TD} w-12 text-center tabular-nums`}>{r.sort}</td>
                  <td className={TD}>
                    <button
                      onClick={() => void save({ ...r, enabled: !r.enabled })}
                      title="탭하여 켜기/끄기"
                      className={`rounded-full px-2 py-0.5 text-[11px] font-black ${st.cls}`}
                    >
                      {st.label}
                    </button>
                  </td>
                  <td className={`${TD} max-w-[220px] truncate font-bold`}>{r.title.ko ?? "-"}</td>
                  <td className={`${TD} whitespace-nowrap text-[12px] text-subtle`}>
                    {r.starts_at || r.ends_at ? `${r.starts_at ? fmtDate(r.starts_at) : "즉시"} ~ ${r.ends_at ? fmtDate(r.ends_at) : "무기한"}` : "상시"}
                  </td>
                  <td className={TD}>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">{POLICY_LABEL[r.policy]}</span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <button onClick={() => setForm(r)} className={BTN_GHOST}>
                      수정
                    </button>
                  </td>
                  <td className={`${TD} text-right`}>
                    <button onClick={() => void remove(r.id!)} disabled={busy} className={BTN_DANGER}>
                      {armed === r.id ? "한 번 더 — 삭제" : "삭제"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Card>

      {/* ── 편집 + 미리보기 ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <Card title={form.id ? "공지 수정" : "새 공지"}>
          <div className="flex flex-col gap-3">
            {(["ko", "en", "ja"] as Lang[]).map((lg) => (
              <div key={lg} className="rounded-[12px] bg-surface-2 p-3">
                <div className="mb-2 text-[12px] font-black text-muted">
                  {lg === "ko" ? "한국어 (필수)" : lg === "en" ? "English" : "日本語"}
                </div>
                <input
                  value={form.title[lg] ?? ""}
                  onChange={(e) => setL("title", lg, e.target.value)}
                  placeholder={lg === "ko" ? "제목" : "제목 — 비우면 한국어로 표시"}
                  className={`${INPUT} block w-full`}
                />
                <textarea
                  value={form.body[lg] ?? ""}
                  onChange={(e) => setL("body", lg, e.target.value)}
                  placeholder={lg === "ko" ? "본문 (줄바꿈 유지)" : "본문 — 비우면 한국어로 표시"}
                  rows={3}
                  className={`${INPUT} mt-2 block w-full resize-y`}
                />
                <input
                  value={form.cta_label[lg] ?? ""}
                  onChange={(e) => setL("cta_label", lg, e.target.value)}
                  placeholder="버튼 문구 (선택)"
                  className={`${INPUT} mt-2 block w-full`}
                />
              </div>
            ))}

            <div className="text-[12px] font-bold text-muted">
              이미지 (선택)
              <div className="mt-1 flex items-start gap-3">
                {form.image_url ? (
                  <div className="relative w-40 shrink-0 overflow-hidden rounded-[10px] ring-1 ring-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image_url} alt="" className="aspect-[5/3] w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-[5/3] w-40 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-[11px] text-subtle ring-1 ring-hairline">
                    이미지 없음
                  </div>
                )}
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <label className={`${BTN_GHOST} cursor-pointer`}>
                      {uploading ? "업로드 중…" : form.image_url ? "이미지 교체" : "이미지 업로드"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => void upload(e.target.files?.[0])}
                      />
                    </label>
                    {form.image_url && (
                      <button onClick={() => set({ image_url: null })} className={BTN_GHOST}>
                        제거
                      </button>
                    )}
                  </div>
                  <p className="text-[11.5px] font-normal leading-relaxed text-subtle break-keep">
                    권장 규격: <b className="text-muted">가로 1200 × 세로 720px (5:3 비율)</b> · JPG/PNG/WebP · 3MB 이하.
                    팝업에서 가로 꽉 차게, 세로는 최대 높이에 맞춰 표시돼요 — 5:3보다 세로가 길면 위아래가 잘려 보일 수 있어요.
                  </p>
                </div>
              </div>
            </div>
            <label className="block text-[12px] font-bold text-muted">
              버튼 동작 (선택 — 버튼 문구와 함께 설정해야 표시)
              <select
                value={screenFromUrl(form.cta_url) ?? (form.cta_url != null ? "custom" : "")}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") set({ cta_url: null });
                  else if (v === "custom") set({ cta_url: "" });
                  else set({ cta_url: `/?screen=${v}` });
                }}
                className={`${INPUT} mt-1 block w-full`}
              >
                <option value="">동작 없음</option>
                <optgroup label="앱 내 화면으로 이동 (새 탭 없이 전환)">
                  {APP_SCREENS.map((s) => (
                    <option key={s.v} value={s.v}>{s.l}</option>
                  ))}
                </optgroup>
                <option value="custom">외부 링크 직접 입력…</option>
              </select>
              {screenFromUrl(form.cta_url) == null && form.cta_url != null && (
                <input
                  value={form.cta_url}
                  onChange={(e) => set({ cta_url: e.target.value })}
                  placeholder="https://…"
                  className={`${INPUT} mt-1.5 block w-full`}
                />
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12px] font-bold text-muted">
                재노출 정책
                <select
                  value={form.policy}
                  onChange={(e) => set({ policy: e.target.value as Notice["policy"] })}
                  className={`${INPUT} mt-1 block w-full`}
                >
                  <option value="always">매번 표시</option>
                  <option value="daily">오늘 하루 보지 않기 제공</option>
                  <option value="once">한 번만 표시</option>
                </select>
              </label>
              <label className="block text-[12px] font-bold text-muted">
                순서 (작을수록 먼저)
                <input
                  type="number"
                  value={form.sort}
                  onChange={(e) => set({ sort: parseInt(e.target.value, 10) || 0 })}
                  className={`${INPUT} mt-1 block w-full`}
                />
              </label>
            </div>
            <p className="-mt-1 text-[11.5px] text-subtle">
              매번=진입마다 · 오늘 하루=닫으면 재노출, &ldquo;오늘 하루 보지 않기&rdquo; 선택 시 그날 숨김 · 한 번만=닫으면 다시 안 보여요
            </p>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12px] font-bold text-muted">
                시작 (KST, 비우면 즉시)
                <input type="datetime-local" value={toLocal(form.starts_at)} onChange={(e) => set({ starts_at: toIso(e.target.value) })} className={`${INPUT} mt-1 block w-full`} />
              </label>
              <label className="block text-[12px] font-bold text-muted">
                종료 (KST, 비우면 무기한)
                <input type="datetime-local" value={toLocal(form.ends_at)} onChange={(e) => set({ ends_at: toIso(e.target.value) })} className={`${INPUT} mt-1 block w-full`} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-[13px] font-bold">
              <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-4 w-4 accent-[var(--color-primary)]" />
              게시 (끄면 저장돼도 노출 안 됨)
            </label>

            <div className="flex items-center gap-3">
              <button onClick={() => void save(form)} disabled={busy || !(form.title.ko ?? "").trim()} className={BTN}>
                {form.id ? "저장" : "등록"}
              </button>
              {form.id && (
                <button onClick={() => setForm(EMPTY)} className={BTN_GHOST}>
                  새 공지로 전환
                </button>
              )}
              {msg && <span className="text-[12.5px] font-bold text-muted">{msg}</span>}
            </div>
          </div>
        </Card>

        {/* 미리보기 — 실제 팝업과 동일 마크업의 정적 목업 */}
        <Card
          title="미리보기"
          right={
            <div className="flex gap-1">
              {(["ko", "en", "ja"] as Lang[]).map((lg) => (
                <button
                  key={lg}
                  onClick={() => setPreviewLang(lg)}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
                    previewLang === lg ? "bg-primary text-white ring-primary" : "bg-surface-2 text-muted ring-hairline"
                  }`}
                >
                  {lg.toUpperCase()}
                </button>
              ))}
            </div>
          }
        >
          <div className="mx-auto w-full max-w-xs overflow-hidden rounded-[22px] bg-surface-2 text-center ring-1 ring-hairline">
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="" className="max-h-48 w-full object-cover" />
            )}
            <div className="p-6">
              <div className="text-[17px] font-black break-keep">{pTitle || "제목"}</div>
              {pBody && <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted break-keep">{pBody}</p>}
              {pCta && form.cta_url && (
                <div className="btn-ornate mt-4 w-full rounded-[16px] py-3 text-[14px] font-black text-white">{pCta}</div>
              )}
              <div className="mt-3 w-full rounded-full bg-primary py-3 text-[14px] font-black text-white">
                {previewLang === "en" ? "Close" : previewLang === "ja" ? "閉じる" : "닫기"}
              </div>
              {form.policy === "daily" && (
                <div className="mt-2.5 text-[12px] font-bold text-subtle underline underline-offset-2">
                  {previewLang === "en" ? "Don't show again today" : previewLang === "ja" ? "今日は表示しない" : "오늘 하루 보지 않기"}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            게시 중 공지는 유저가 홈에 들어올 때 바로 반영돼요. 동시에 여러 개면 순서대로 최대 3개까지 표시돼요.
          </p>
        </Card>
      </div>
    </div>
  );
}
