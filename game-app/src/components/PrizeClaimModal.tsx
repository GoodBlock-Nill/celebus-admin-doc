"use client";

// 실물 당첨 수령 모달 — 당첨 목록(기한 카운트다운) → 수령 정보 폼 (이름·연락처·주소는 상품별·개인정보 동의).
// 푸시·우편함이 없는 앱이므로 미제출 건은 매 접속 홈에서 반복 노출 (docs/weekly-rank-prize-reward-plan.md §5-4)
import { useRef, useState } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { submitPrizeClaim, type PrizeWinner } from "@/lib/game-api";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { GRADE_COLORS } from "./GachaCard";
import { useLang } from "./LangProvider";

const dday = (deadline: string) => Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));

export default function PrizeClaimModal({
  winners,
  onClose,
  onChanged,
}: {
  winners: PrizeWinner[];
  onClose: () => void;
  onChanged: () => void; // 제출 성공 후 목록 갱신
}) {
  const { t, lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  const [editing, setEditing] = useState<PrizeWinner | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

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
    onChanged();
  };

  const statusLabel = (w: PrizeWinner) => t(`prize_status_${w.status}`);
  const inputCls =
    "rounded-[12px] bg-surface-1 px-3.5 py-3 text-[14px] text-fg ring-1 ring-hairline placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/60";

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/80 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("prize_title")}
        tabIndex={-1}
        className="anim-pop-in my-auto w-full max-w-xs rounded-[22px] bg-surface-2 p-5 outline-none ring-1 ring-hairline"
      >
        <Gift className="mx-auto h-9 w-9 text-gold" />
        <div className="mt-1.5 text-center text-[17px] font-black text-fg">{t("prize_title")}</div>

        {!editing ? (
          <>
            <p className="mt-1 text-center text-[11.5px] leading-snug text-muted break-keep">{t("prize_list_hint")}</p>
            <div className="mt-3 flex flex-col gap-2">
              {winners.map((w) => {
                const grade = w.snapshot.grade ?? "S";
                const actionable = w.status === "pending" || w.status === "submitted";
                return (
                  <div key={w.id} className="rounded-[14px] bg-surface-1 px-3.5 py-3 ring-1 ring-hairline">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black" style={{ color: GRADE_COLORS[grade] }}>
                        {grade}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-black text-fg">
                        {w.snapshot.prize?.[lang] || w.snapshot.prize?.ko || ""}
                      </span>
                      {actionable && (
                        <span className="shrink-0 text-[11px] font-black text-gold">{t("prize_dday").replace("{n}", String(dday(w.claim_deadline)))}</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className={`text-[11.5px] font-bold ${w.status === "pending" ? "text-danger" : "text-muted"}`}>{statusLabel(w)}</span>
                      {actionable && (
                        <button
                          onClick={() => openForm(w)}
                          className="rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-black text-white active:scale-95"
                        >
                          {w.status === "pending" ? t("prize_input_cta") : t("prize_edit_cta")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-surface-1 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline active:scale-[0.99]"
            >
              {t("confirm")}
            </button>
          </>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <div className="text-center text-[13px] font-black text-primary-400">
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
        )}
      </div>
    </div>
  );
}
