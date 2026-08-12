"use client";

// 내 보상내역 — 실물 당첨 전체 이력 확인 + 수령 정보 입력·수정 (더보기 메뉴에서 진입).
// 홈 반복 리마인드 모달 대신 이 화면이 상시 확인처 (사용자 결정 2026-08-12). 뽑기 직후 CTA는 유지.
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { fetchMyPrizes, submitPrizeClaim, type PrizeWinner } from "@/lib/game-api";
import { GRADE_COLORS } from "./GachaCard";
import ScreenHeader from "./ScreenHeader";
import { useLang } from "./LangProvider";

const dday = (deadline: string) => Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));

export default function PrizeHistoryScreen({ onBack }: { onBack: () => void }) {
  const { t, lang } = useLang();
  const [winners, setWinners] = useState<PrizeWinner[]>([]);
  const [loading, setLoading] = useState(true);
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
  const statusLabel = (w: PrizeWinner) => {
    if (isMobile(w) && w.status === "submitted") return t("prize_status_mobile_wait");
    if (isMobile(w) && w.status === "shipped") return t("prize_status_mobile_done");
    return t(`prize_status_${w.status}`);
  };

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
            <div key={i} className="h-[84px] animate-pulse rounded-[16px] bg-surface-1" />
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
      ) : winners.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-3 text-center">
          <Gift className="h-10 w-10 text-subtle" />
          <p className="text-[13px] leading-relaxed text-muted break-keep">{t("prize_history_empty")}</p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2">
            {winners.map((w) => {
              const grade = w.snapshot.grade ?? "S";
              const actionable = !isMobile(w) && (w.status === "pending" || w.status === "submitted");
              return (
                <div key={w.id} className="rounded-[16px] bg-surface-1 px-4 py-3.5 ring-1 ring-hairline">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: GRADE_COLORS[grade] }} />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-black text-fg">
                      {w.snapshot.prize?.[lang] || w.snapshot.prize?.ko || ""}
                    </span>
                    {actionable && (
                      <span className="shrink-0 text-[11px] font-black text-gold">{t("prize_dday").replace("{n}", String(dday(w.claim_deadline)))}</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className={`text-[12px] font-bold ${w.status === "pending" ? "text-danger" : "text-muted"}`}>{statusLabel(w)}</span>
                    {actionable && (
                      <button onClick={() => openForm(w)} className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-black text-white active:scale-95">
                        {w.status === "pending" ? t("prize_input_cta") : t("prize_edit_cta")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {winners.some(isMobile) && (
            <p className="mt-3 text-[11.5px] leading-snug text-primary-400 break-keep">{t("prize_mobile_note")}</p>
          )}
          <p className="mt-2 text-[11.5px] leading-snug text-subtle break-keep">{t("prize_list_hint")}</p>
        </>
      )}
    </div>
  );
}
