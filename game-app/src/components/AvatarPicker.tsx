"use client";

// 아바타 선택 — 기본 6종(V01D 악기 테마) + 사진 업로드. 가입/프로필 편집 공용.
import { useRef } from "react";
import { Camera } from "lucide-react";
import { signupAvatars } from "@/lib/game-config";
import { fileToAvatarDataUrl } from "@/lib/image";
import { useLang } from "./LangProvider";

export default function AvatarPicker({
  selected,
  customImage,
  onPick,
  onCustom,
  onError,
}: {
  selected: string; // 아바타 id 또는 "custom"
  customImage: string | null; // 업로드 미리보기(dataURL 또는 기존 URL)
  onPick: (id: string) => void;
  onCustom: (dataUrl: string) => void;
  onError: () => void;
}) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {signupAvatars().map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onPick(a.id)}
          aria-label={a.id}
          aria-pressed={selected === a.id}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-[20px] ring-2 transition-transform active:scale-90 ${
            selected === a.id ? "ring-primary" : "ring-transparent"
          }`}
          style={{ background: a.bg }}
        >
          {a.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.img} alt="" className="pointer-events-none h-full w-full rounded-full object-contain p-[14%]" />
          ) : (
            a.glyph
          )}
        </button>
      ))}
      {/* 사진 업로드 슬롯 */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label={t("auth_upload")}
        aria-pressed={selected === "custom"}
        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-surface-1 ring-2 transition-transform active:scale-90 ${
          selected === "custom" ? "ring-primary" : "ring-hairline"
        }`}
      >
        {customImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={customImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-5 w-5 text-subtle" />
        )}
      </button>
      {/* 포맷 명시 — iOS가 HEIC 원본을 JPEG로 자동 변환해 전달(비Safari HEIC 디코드 실패 방지) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const url = await fileToAvatarDataUrl(f);
          if (url) onCustom(url);
          else onError();
        }}
      />
    </div>
  );
}
