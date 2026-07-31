"use client";

// 아카이브·토너먼트 생성/수정 공용 — 제목·설명을 [한][영][일] 언어 탭으로 입력.
// base(ko)는 필수, en/ja는 선택(미입력 시 앱에서 한국어로 폴백). KO→EN/JA 자동 번역 버튼 제공.
import { useState } from "react";
import { toast } from "sonner";
import { Languages, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-types";
import { Btn, Label, inputCls } from "./ui";

export type LangI18n = {
  en?: { title?: string; description?: string };
  ja?: { title?: string; description?: string };
};

// 저장 직전 빈 언어/필드 제거 — 내용이 있는 것만 남긴다(없으면 undefined → 컬럼 null)
export function cleanStageI18n(i18n: LangI18n): LangI18n | undefined {
  const out: LangI18n = {};
  (["en", "ja"] as const).forEach((l) => {
    const t = i18n[l]?.title?.trim() ?? "";
    const d = i18n[l]?.description?.trim() ?? "";
    if (t || d) out[l] = { ...(t ? { title: t } : {}), ...(d ? { description: d } : {}) };
  });
  return Object.keys(out).length ? out : undefined;
}

const TABS = [
  { k: "ko" as const, label: "한국어" },
  { k: "en" as const, label: "English" },
  { k: "ja" as const, label: "日本語" },
];

export default function LangTabsFields({
  koTitle,
  koDesc,
  i18n,
  onKoTitle,
  onKoDesc,
  onI18n,
  titleLabel = "제목",
  descLabel = "설명",
  titlePlaceholder,
  descRows = 2,
}: {
  koTitle: string;
  koDesc: string;
  i18n: LangI18n;
  onKoTitle: (v: string) => void;
  onKoDesc: (v: string) => void;
  onI18n: (v: LangI18n) => void;
  titleLabel?: string;
  descLabel?: string;
  titlePlaceholder?: string;
  descRows?: number;
}) {
  const [lang, setLang] = useState<"ko" | "en" | "ja">("ko");
  const [translating, setTranslating] = useState(false);

  const setLocale = (l: "en" | "ja", field: "title" | "description", v: string) => {
    onI18n({ ...i18n, [l]: { ...i18n[l], [field]: v } });
  };

  async function translate() {
    if (!koTitle.trim() && !koDesc.trim()) {
      toast.error("한국어 내용을 먼저 입력해주세요.");
      return;
    }
    setTranslating(true);
    const res = await adminFetch("/api/admin/stage-i18n/translate", {
      method: "POST",
      body: JSON.stringify({ title: koTitle, description: koDesc }),
    });
    setTranslating(false);
    if (res.ok) {
      const j = (await res.json()) as LangI18n;
      onI18n({ en: j.en, ja: j.ja });
      toast.success("영어·일본어를 자동 번역했어요. 확인 후 저장하세요.");
    } else {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "번역 실패");
    }
  }

  const isKo = lang === "ko";
  const title = isKo ? koTitle : (i18n[lang]?.title ?? "");
  const desc = isKo ? koDesc : (i18n[lang]?.description ?? "");
  const filled = (l: "en" | "ja") => !!(i18n[l]?.title?.trim() || i18n[l]?.description?.trim());

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {TABS.map((tb) => (
            <button
              key={tb.k}
              type="button"
              onClick={() => setLang(tb.k)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
                lang === tb.k ? "bg-primary text-white" : "border border-border bg-card text-muted hover:bg-surface-2"
              }`}
            >
              {tb.label}
              {tb.k !== "ko" && filled(tb.k) && <span className={`h-1.5 w-1.5 rounded-full ${lang === tb.k ? "bg-white" : "bg-primary"}`} />}
            </button>
          ))}
        </div>
        <Btn type="button" size="sm" variant="outline" disabled={translating} onClick={translate}>
          {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          자동 번역
        </Btn>
      </div>

      <div>
        <Label>
          {titleLabel} {isKo ? <span className="text-[#c0392b]">*</span> : <span className="font-medium text-subtle">(선택 · 미입력 시 한국어)</span>}
        </Label>
        <input
          value={title}
          onChange={(e) => (isKo ? onKoTitle(e.target.value) : setLocale(lang, "title", e.target.value))}
          maxLength={isKo ? 80 : 200}
          placeholder={isKo ? titlePlaceholder : `${TABS.find((t) => t.k === lang)?.label} 제목`}
          className={inputCls}
        />
      </div>
      <div>
        <Label>{descLabel}</Label>
        <textarea
          value={desc}
          onChange={(e) => (isKo ? onKoDesc(e.target.value) : setLocale(lang, "description", e.target.value))}
          maxLength={isKo ? 500 : 2000}
          rows={descRows}
          placeholder={isKo ? undefined : `${TABS.find((t) => t.k === lang)?.label} 설명 (선택)`}
          className={`${inputCls} resize-none`}
        />
      </div>
    </div>
  );
}
