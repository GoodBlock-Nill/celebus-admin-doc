"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { getNick, setNick, getAvatar, setAvatar } from "@/lib/game-api";
import { useFocusTrap } from "@/lib/use-focus-trap";
import Avatar from "./Avatar";
import { useLang } from "./LangProvider";

// 프로필 설정 모달 — 닉네임 + 아바타. 홈 진입(최초) 시 자동 노출, 프로필 탭으로 재편집.
export default function ProfileSetup({ onClose, onSaved }: { onClose: () => void; onSaved: (nick: string, avatar: string) => void }) {
  const { t } = useLang();
  const [nick, setNickInput] = useState(() => getNick());
  const [avatar, setAvatarInput] = useState(() => getAvatar());
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);

  const pick = (id: string) => {
    setAvatarInput(id);
    setAvatar(id); // 즉시 저장(미리보기 반영)
  };

  const confirm = () => {
    setNick(nick);
    setAvatar(avatar);
    onSaved(nick.trim(), avatar);
    onClose();
  };

  return (
    <div className="anim-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("profile_setup")}
        tabIndex={-1}
        className="anim-pop-in w-full max-w-xs rounded-[22px] bg-surface-2 p-6 text-center outline-none ring-1 ring-hairline"
      >
        <div className="text-[16px] font-black">{t("profile_setup")}</div>

        <div className="mt-4 flex items-center justify-center">
          <Avatar value={avatar} size="lg" />
        </div>

        <label className="mb-1.5 mt-4 block text-left text-[11px] font-bold text-subtle">{t("nickname")}</label>
        <input
          value={nick}
          onChange={(e) => setNickInput(e.target.value.slice(0, 16))}
          maxLength={16}
          placeholder={t("nickname_ph")}
          className="w-full rounded-[14px] bg-surface-1 px-4 py-3 text-[14px] font-bold text-fg ring-1 ring-hairline placeholder:font-normal placeholder:text-subtle focus:ring-primary/40"
        />

        <div className="mb-2 mt-4 text-left text-[11px] font-bold text-subtle">{t("avatar")}</div>
        <div className="grid grid-cols-6 gap-2">
          {GAME_CONFIG.avatars.map((a) => (
            <button
              key={a.id}
              onClick={() => pick(a.id)}
              aria-label={a.id}
              aria-pressed={avatar === a.id}
              className={`flex aspect-square items-center justify-center rounded-full text-[18px] ring-2 transition-transform active:scale-90 ${
                avatar === a.id ? "ring-primary" : "ring-transparent"
              }`}
              style={{ background: a.bg }}
            >
              {a.glyph}
            </button>
          ))}
        </div>

        <button
          onClick={confirm}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[15px] font-black text-white active:scale-[0.99]"
        >
          <Check className="h-4 w-4" /> {t("confirm")}
        </button>
      </div>
    </div>
  );
}
