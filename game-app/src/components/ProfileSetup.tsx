"use client";

// 프로필 편집 모달 — 닉네임은 계정 식별자(변경 불가 표시), 아바타만 변경(기본 6종/업로드, 서버 저장).
import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { getNick, getAvatar, setAvatar } from "@/lib/game-api";
import { saveAvatar } from "@/lib/auth-api";
import { useFocusTrap } from "@/lib/use-focus-trap";
import Avatar from "./Avatar";
import AvatarPicker from "./AvatarPicker";
import { useLang } from "./LangProvider";

export default function ProfileSetup({ onClose, onSaved }: { onClose: () => void; onSaved: (nick: string, avatar: string) => void }) {
  const { t } = useLang();
  const nick = getNick();
  const current = getAvatar();
  const isUrl = /^https?:\/\//.test(current);
  const [sel, setSel] = useState(isUrl ? "custom" : current);
  const [customImage, setCustomImage] = useState<string | null>(isUrl ? current : null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);

  async function confirm() {
    setBusy(true);
    let value: string | null = null;
    if (sel === "custom") {
      if (customImage?.startsWith("data:")) value = await saveAvatar({ image: customImage });
      else value = current; // 기존 업로드 이미지 유지(변경 없음)
    } else {
      value = await saveAvatar({ avatar: sel });
    }
    setBusy(false);
    if (!value) {
      toast.error(t("auth_err_generic"));
      return;
    }
    setAvatar(value);
    onSaved(nick, value);
    onClose();
  }

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-black/75 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("profile_setup")}
        tabIndex={-1}
        className="anim-pop-in my-auto w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        <div className="text-[16px] font-black">{t("profile_setup")}</div>

        {/* 미리보기 */}
        <div className="mt-4 flex items-center justify-center">
          {sel === "custom" && customImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={customImage} alt="" className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-hairline" />
          ) : (
            <Avatar value={sel} size="lg" />
          )}
        </div>

        {/* 닉네임 — 계정 식별자, 변경 불가 */}
        <label className="mb-1.5 mt-4 block text-left text-[11px] font-bold text-subtle">{t("nickname")}</label>
        <div className="w-full rounded-[14px] bg-surface-1 px-4 py-3 text-left text-[14px] font-bold text-muted ring-1 ring-hairline">
          {nick}
        </div>
        <p className="mt-1 text-left text-[10.5px] text-subtle">{t("profile_nickname_fixed")}</p>

        <div className="mb-2 mt-4 text-left text-[11px] font-bold text-subtle">{t("avatar")}</div>
        <AvatarPicker
          selected={sel}
          customImage={customImage}
          onPick={(id) => setSel(id)}
          onCustom={(url) => {
            setCustomImage(url);
            setSel("custom");
          }}
          onError={() => toast.error(t("auth_err_image"))}
        />

        <button
          onClick={confirm}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99] disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> {busy ? "…" : t("confirm")}
        </button>
      </div>
    </div>
  );
}
