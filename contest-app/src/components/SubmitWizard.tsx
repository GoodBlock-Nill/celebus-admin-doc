"use client";

// 출품 3스텝: ①링크 확인(미리보기) → ②작품 소개 → ③동의·비밀번호 → 완료(공유 유도)
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Link2, PartyPopper, ShieldCheck } from "lucide-react";
import { sb } from "@/lib/supabase-browser";
import type { ContestPublic, ResolvedUrl } from "@/lib/types";
import { canSubmit } from "@/lib/contest-status";
import { PLATFORM_LABELS } from "@/lib/i18n";
import { PlatformIcon } from "./PlatformBadge";
import Shell from "./Shell";
import ShareModal from "./ShareModal";
import ErrorState from "./ErrorState";
import { useLang } from "./LangProvider";

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  const { t } = useLang();
  const items = [t("sw_step1"), t("sw_step2"), t("sw_step3")];
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {items.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold ${
              step >= i + 1 ? "bg-primary text-white" : "bg-card text-muted"
            }`}
          >
            {i + 1}. {label}
          </span>
          {i < 2 && <span className="h-px w-4 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function SubmitBody({ slug }: { slug: string }) {
  const { t } = useLang();
  const [contest, setContest] = useState<ContestPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [url, setUrl] = useState("");
  const [resolved, setResolved] = useState<ResolvedUrl | null>(null);
  const [resolving, setResolving] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [handle, setHandle] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [agree, setAgree] = useState(false);
  const [agreeOfficial, setAgreeOfficial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [share, setShare] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("contests_public").select("*").eq("slug", slug).maybeSingle();
      setContest((data as ContestPublic) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-card" />;
  if (!contest) return <ErrorState />;

  if (!canSubmit(contest) && !doneId) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-sm text-muted">{t("submit_closed")}</p>
        <Link href={`/contest/${slug}`} className="text-sm font-bold text-primary-400">
          ← {contest.title}
        </Link>
      </div>
    );
  }

  async function resolve() {
    if (!url.trim() || resolving || !contest) return;
    setResolving(true);
    setResolved(null);
    try {
      const res = await fetch("/api/resolve-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contest_id: contest.id, url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "invalid") toast.error(t("sw_invalid_url"));
        else if (data.code === "wrong_type_video") toast.error(t("sw_wrong_type_video"));
        else if (data.code === "wrong_type_image") toast.error(t("sw_wrong_type_image"));
        else toast.error(data.error ?? t("err_network"));
        return;
      }
      if (data.duplicate) {
        toast.error(t("sw_duplicate"));
        return;
      }
      setResolved(data as ResolvedUrl);
      if (data.oembed?.title && !title) setTitle(String(data.oembed.title).slice(0, 80));
      // 핸들은 링크 작성자로 강제(도용 방지) — 자동 추출 불가 시에만 수동 입력
      setHandle(data.authorHandle ?? "");
    } catch {
      toast.error(t("err_network"));
    } finally {
      setResolving(false);
    }
  }

  async function submit() {
    if (busy || !contest || !resolved) return;
    if (!agree) return toast.error(t("sw_agree_err"));
    if (!agreeOfficial) return toast.error(t("sw_agree_official_err"));
    setBusy(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contest_id: contest.id,
          url: resolved.canonicalUrl,
          title: title.trim(),
          description: desc.trim(),
          // 자동 확인된 핸들은 서버가 링크에서 다시 추출 — 수동 입력분만 전송
          ...(resolved.authorHandle ? {} : { handle: handle.trim() }),
          celebus_nickname: nickname.trim(),
          phone: phone.trim(),
          password: pw,
          agree: true,
          agree_official: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "duplicate") toast.error(t("sw_duplicate"));
        else if (data.code === "closed") toast.error(t("err_closed"));
        else toast.error(data.error ?? t("err_create"));
        return;
      }
      setDoneId(data.id);
    } catch {
      toast.error(t("err_network"));
    } finally {
      setBusy(false);
    }
  }

  // 완료 화면 — 축하 모먼트 (아이콘 팝인 + 컨페티 낙하)
  if (doneId) {
    const confetti = [
      { left: "12%", color: "#8b5cf6", delay: "0ms" },
      { left: "24%", color: "#f5c451", delay: "90ms" },
      { left: "38%", color: "#7c9cff", delay: "40ms" },
      { left: "50%", color: "#a78bfa", delay: "150ms" },
      { left: "62%", color: "#f0a868", delay: "70ms" },
      { left: "76%", color: "#f5c451", delay: "120ms" },
      { left: "88%", color: "#8b5cf6", delay: "30ms" },
    ];
    return (
      <div className="relative overflow-hidden py-14 text-center">
        {/* 컨페티 */}
        <div className="pointer-events-none absolute inset-x-0 top-8 mx-auto max-w-xs" aria-hidden>
          {confetti.map((c, i) => (
            <span key={i} className="confetti-piece" style={{ left: c.left, background: c.color, animationDelay: c.delay }} />
          ))}
        </div>
        <div className="anim-pop-in mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <PartyPopper className="h-8 w-8 text-primary-400" />
        </div>
        <h1 className="mb-1 text-xl font-black">{t("sw_done_title")}</h1>
        <p className="mb-8 text-[13px] text-muted">{t("sw_done_sub")}</p>
        <div className="mx-auto flex max-w-xs flex-col gap-2">
          <button
            onClick={() => setShare(true)}
            className="rounded-full bg-primary hover:bg-primary-strong py-3 text-[14px] font-black text-white"
          >
            {t("share_title")}
          </button>
          <Link
            href={`/entry/${doneId}`}
            className="rounded-full border border-border bg-card py-3 text-[14px] font-bold text-fg"
          >
            {t("sw_done_view")}
          </Link>
        </div>
        {share && <ShareModal path={`/entry/${doneId}`} label={title} onClose={() => setShare(false)} />}
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary/60";

  return (
    <div>
      <h1 className="mb-1 text-center text-lg font-black">{t("sw_title")}</h1>
      <p className="mb-5 truncate text-center text-[12px] text-muted">{contest.title}</p>
      <StepDots step={step} />

      {step === 1 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && resolve()}
              placeholder={t("sw_url_ph")}
              className={input}
              autoFocus
            />
            <button
              onClick={resolve}
              disabled={resolving}
              className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {resolving ? "..." : t("sw_resolve")}
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <Link2 className="h-3.5 w-3.5" /> {t("sw_url_help")}
          </p>

          {resolved && (
            <div className="rounded-2xl border border-primary/40 bg-card p-3">
              {resolved.oembed?.thumbnail_url && (
                <div className="mb-2 aspect-video w-full overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolved.oembed.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <PlatformIcon platform={resolved.platform} className="h-4 w-4" />
                <span className="font-bold text-fg/90">{PLATFORM_LABELS[resolved.platform]}</span>
                <span className="truncate">{resolved.oembed?.title ?? resolved.canonicalUrl}</span>
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-3 w-full rounded-full bg-primary py-2.5 text-[14px] font-black text-white"
              >
                {t("sw_preview_ok")} →
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t("sw_title_ph")} className={input} autoFocus />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} rows={3} placeholder={t("sw_desc_ph")} className={input} />
          <div>
            {resolved?.authorHandle ? (
              <>
                <div className={`${input} flex items-center gap-1.5 bg-card text-muted`}>
                  <ShieldCheck className="h-4 w-4 shrink-0 text-verified" />
                  <span className="truncate font-bold text-fg">@{resolved.authorHandle}</span>
                </div>
                <p className="mt-1 text-[12px] font-semibold text-verified">{t("sw_handle_locked")}</p>
              </>
            ) : (
              <>
                <input value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={41} placeholder={t("sw_handle_ph")} className={input} />
                <p className="mt-1 text-[12px] text-amber-400">{t("sw_handle_manual_warn")}</p>
              </>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(1)} className="rounded-full border border-border bg-card px-5 py-2.5 text-[13px] font-bold text-muted">
              {t("back")}
            </button>
            <button
              onClick={() => {
                if (!title.trim()) return toast.error(t("sw_title_ph"));
                if (!resolved?.authorHandle && !handle.trim()) return toast.error(t("sw_handle_ph"));
                setStep(3);
              }}
              className="flex-1 rounded-full bg-primary py-2.5 text-[14px] font-black text-white"
            >
              {t("next")} →
            </button>
          </div>
        </div>
      )}

      {step === 3 && resolved && (
        <div className="space-y-3">
          {/* 요약 */}
          <div className="rounded-2xl border border-border bg-card p-3 text-[13px]">
            <p className="mb-1 flex items-center gap-1.5 font-bold">
              <PlatformIcon platform={resolved.platform} className="h-3.5 w-3.5" /> {title}
            </p>
            <p className="flex items-center gap-1 text-muted">
              @{(resolved.authorHandle ?? handle).replace(/^@+/, "")}
              {resolved.authorHandle && <ShieldCheck className="h-3.5 w-3.5 text-verified" />}
            </p>
          </div>
          {/* CELEBUS 신원 — 본인 확인·보상 연락용 (비공개) */}
          <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
            <p className="text-[12px] font-bold text-primary-400">{t("sw_identity_title")}</p>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} placeholder={t("sw_celebus_nickname_ph")} className={input} autoFocus />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder={t("sw_phone_ph")} className={input} />
            <p className="text-[12px] leading-snug text-muted">{t("sw_identity_help")}</p>
          </div>
          <div>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} maxLength={64} placeholder={t("sw_pw_ph")} className={input} />
            <p className="mt-1 text-[12px] font-semibold text-primary-400">{t("sw_pw_help")}</p>
          </div>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-card p-3 text-[13px] leading-snug">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#8b5cf6]" />
            <span>
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-primary-400" />
              {t("sw_agree")}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-card p-3 text-[13px] leading-snug">
            <input type="checkbox" checked={agreeOfficial} onChange={(e) => setAgreeOfficial(e.target.checked)} className="mt-0.5 accent-[#8b5cf6]" />
            <span>
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-primary-400" />
              {t("sw_agree_official")}
            </span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(2)} className="rounded-full border border-border bg-card px-5 py-2.5 text-[13px] font-bold text-muted">
              {t("back")}
            </button>
            <button
              onClick={submit}
              disabled={busy || pw.length < 4 || !agree || !agreeOfficial || !nickname.trim() || phone.trim().length < 9}
              className="flex-1 rounded-full bg-primary hover:bg-primary-strong py-2.5 text-[14px] font-black text-white disabled:opacity-40"
            >
              {busy ? "..." : t("sw_submit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmitWizard({ slug }: { slug: string }) {
  return (
    <Shell>
      <div className="mx-auto max-w-md">
        <SubmitBody slug={slug} />
      </div>
    </Shell>
  );
}
