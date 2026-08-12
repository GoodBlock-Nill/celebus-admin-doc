"use client";

// 내 보상내역 — 실물 당첨 이력 확인 + 수령 정보 입력·수정 (더보기 메뉴에서 진입).
// 출시 앱 패턴: [진행 중|완료] 세그먼트 탭 · 입력 필요 건 최상단(기한 임박 순) · 썸네일+당첨일+상태 뱃지 · 완료 건 흐림.
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { fetchMyPrizes, submitPrizeClaim, type PrizeWinner } from "@/lib/game-api";
import { GRADE_COLORS } from "./GachaCard";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

const dday = (deadline: string) => Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
const fmtDate = (s?: string) => {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};
const isActive = (w: PrizeWinner) => w.status === "pending" || w.status === "submitted";

export default function PrizeHistoryScreen({ onBack }: { onBack: () => void }) {
  const { t, lang } = useLang();
  const [winners, setWinners] = useState<PrizeWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "done">("active");
  const [editing, setEditing] = useState<PrizeWinner | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => fetchMyPrizes().then(setWinners);
  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, []);

  const isMobile = (w: PrizeWinner) => w.fulfillment === "mobile_ticket";
  // 상태 뱃지 — 색으로 액션 필요/대기/완료를 즉시 구분
  const badge = (w: PrizeWinner): { label: string; cls: string } => {
    if (w.status === "pending") return { label: t("prize_status_pending"), cls: "bg-danger/15 text-danger" };
    if (w.status === "submitted")
      return { label: isMobile(w) ? t("prize_status_mobile_wait") : t("prize_status_submitted"), cls: "bg-primary/15 text-primary-400" };
    if (w.status === "shipped")
      return { label: isMobile(w) ? t("prize_status_mobile_done") : t("prize_status_shipped"), cls: "bg-gold/15 text-gold" };
    return { label: t(`prize_status_${w.status}`), cls: "bg-surface-2 text-subtle" };
  };

  const activeList = winners
    .filter(isActive)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "pending" ? -1 : 1)); // 입력 필요 최상단 (API는 최신순)
  const doneList = winners.filter((w) => !isActive(w));
  const list = tab === "active" ? activeList : doneList;

  const openForm = (w: PrizeWinner) => {
    setEditing(w);
    setName(w.info?.name ?? "");
    setPhone(w.info?.phone ?? "");
    setAddress(w.info?.address ?? "");
    setNote(w.info?.note ?? "");
    setAgree(!!w.info); // 기존 제출 건 수정은 동의 유지
  };

  const submit = async () => {
    if (!editing || busy) return;
    if (!name.trim() || !/^\d{5,15}$/.test(phone.trim())) return toast.error(t("prize_form_invalid"));
    if (editing.requires_address && !address.trim()) return toast.error(t("prize_address_required"));
    if (!agree) return toast.error(t("prize_agree"));
    setBusy(true);
    const res = await submitPrizeClaim({ winner_id: editing.id, name: name.trim(), phone: phone.trim(), address: address.trim(), note: note.trim() });
    setBusy(false);
    if (!res.ok) return toast.error(t("load_failed"));
    toast.success(t("prize_submit_done"));
    setEditing(null);
    void load();
  };

  const inputCls =
    "rounded-[12px] bg-surface-1 px-3.5 py-3 text-[14px] text-fg ring-1 ring-hairline placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/60";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-safe pb-safe pt-safe">
      <ScreenHeader title={t("more_prizes")} onBack={editing ? () => setEditing(null) : onBack} />

      {loading ? (
        <div className="mt-5 flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-[16px] bg-surface-1" />
          ))}
        </div>
      ) : editing ? (
        // 수령 정보 입력·수정 폼
        <div className="mt-5 flex flex-col gap-2">
          <div className="text-center text-[14px] font-black text-primary-400">
            {editing.snapshot.prize?.[lang] || editing.snapshot.prize?.ko || ""}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("prize_form_name")} className={inputCls} />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={t("prize_form_phone")}
            inputMode="numeric"
            className={inputCls}
          />
          {editing.requires_address && (
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("prize_form_address")} className={inputCls} />
          )}
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("prize_form_note")} className={inputCls} />
          <label className="mt-1 flex items-start gap-2 text-[11.5px] leading-snug text-muted break-keep">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]" />
            {t("prize_agree")}
          </label>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setEditing(null)}
              disabled={busy}
              className="flex-1 rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]"
            >
              {t("back")}
            </button>
            <button
              onClick={() => void submit()}
              disabled={busy}
              className="flex-1 rounded-full bg-primary py-3 text-[14px] font-black text-white active:scale-[0.99] disabled:opacity-50"
            >
              {t("prize_submit")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 세그먼트 탭 — 완료 건이 할 일을 밀어내지 않도록 분리 */}
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-surface-1 p-1 ring-1 ring-hairline">
            {(["active", "done"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full py-2 text-[13px] font-black transition-colors ${
                  tab === k ? "bg-primary text-white" : "text-muted"
                }`}
              >
                {k === "active" ? `${t("prize_tab_active")}${activeList.length > 0 ? ` ${activeList.length}` : ""}` : t("prize_tab_done")}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <Gift className="h-10 w-10 text-subtle" />
              <p className="text-[13px] leading-relaxed text-muted break-keep">{t("prize_history_empty")}</p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {list.map((w) => {
                const grade = w.snapshot.grade ?? "S";
                const b = badge(w);
                const actionable = !isMobile(w) && isActive(w);
                return (
                  <div
                    key={w.id}
                    className={`flex items-center gap-3 rounded-[16px] bg-surface-1 px-3 py-3 ring-1 ring-hairline ${tab === "done" ? "opacity-60" : ""}`}
                  >
                    {/* 카드 썸네일 — 이미지 없으면 등급색 선물 아이콘 */}
                    {w.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.image_url} alt="" className="h-[62px] w-[44px] shrink-0 rounded-[8px] object-cover" />
                    ) : (
                      <div
                        className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded-[8px]"
                        style={{ background: `${GRADE_COLORS[grade]}1f` }}
                      >
                        <Gift className="h-5 w-5" style={{ color: GRADE_COLORS[grade] }} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-black text-fg">{w.snapshot.prize?.[lang] || w.snapshot.prize?.ko || ""}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${b.cls}`}>{b.label}</span>
                        <span className="text-[11px] tabular-nums text-subtle">{fmtDate(w.created_at)}</span>
                      </div>
                    </div>
                    {actionable && (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {w.status === "pending" && (
                          <span className="text-[10.5px] font-black text-gold">{t("prize_dday").replace("{n}", String(dday(w.claim_deadline)))}</span>
                        )}
                        <button onClick={() => openForm(w)} className="rounded-full bg-primary px-3 py-1.5 text-[11.5px] font-black text-white active:scale-95">
                          {w.status === "pending" ? t("prize_input_cta") : t("prize_edit_cta")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "active" && list.some(isMobile) && (
            <p className="mt-3 text-[11.5px] leading-snug text-primary-400 break-keep">{t("prize_mobile_note")}</p>
          )}
          {tab === "active" && list.length > 0 && (
            <p className="mt-2 text-[11.5px] leading-snug text-subtle break-keep">{t("prize_list_hint")}</p>
          )}
        </>
      )}
    </div>
  );
}
