"use client";

// 가입/로그인 게이트 — 첫 진입 필수.
// 가입: CELEBUS 닉네임(영문 소문자·숫자·.-_) + 휴대전화(국가번호 드롭다운) + 비밀번호(확인·보기 지원) + 아바타(기본 6종/업로드).
// 로그인: 닉네임 + 비밀번호 → 다른 기기에서 계정 이어받기.
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { GAME_CONFIG, signupAvatars } from "@/lib/game-config";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/countries";
import { signup, login, saveAvatar } from "@/lib/auth-api";
import { setNick, setAvatar } from "@/lib/game-api";
import { track } from "@/lib/track";
import AvatarPicker from "./AvatarPicker";
import { useLang } from "./LangProvider";

const NICK_RE = /^[a-z0-9._-]{3,20}$/;

// 서버 거절 사유 → i18n 키
const ERR_KEY: Record<string, string> = {
  bad_nickname: "auth_err_nickname",
  nickname_taken: "auth_err_nickname_taken",
  banned_nickname: "auth_err_nickname_banned",
  bad_phone: "auth_err_phone",
  bad_password: "auth_err_password",
  invalid_credentials: "auth_err_login",
  limit: "auth_err_limit",
};

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="text-left">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-bold text-white/80">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-white/40 break-keep">{hint}</p>}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-[14px] bg-black/40 px-4 py-3 text-[14px] font-bold text-fg ring-1 ring-white/15 backdrop-blur placeholder:font-normal placeholder:text-white/30 focus:outline-none focus:ring-primary/50";

// 비밀번호 입력 + 보기 토글
function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  show,
  onToggle,
  toggleLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  show: boolean;
  onToggle: () => void;
  toggleLabel: string;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 72))}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${INPUT_CLS} pr-12`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={toggleLabel}
        aria-pressed={show}
        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white/45"
      >
        {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

export default function AuthGate({ onDone }: { onDone: (nick: string, avatar: string) => void }) {
  const { t } = useLang();
  const [tab, setTabState] = useState<"signup" | "login">("signup");
  const [nick, setNickInput] = useState("");
  const [iso, setIso] = useState(DEFAULT_COUNTRY.iso);
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [sel, setSel] = useState(signupAvatars()[0].id);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // 닉네임 사용 가능 여부 사전 확인 (제출 전 안내 — 최종 판정은 서버 가입 RPC)
  const [nickStatus, setNickStatus] = useState<"idle" | "available" | "taken">("idle");
  useEffect(() => {
    setNickStatus("idle");
    if (tab !== "signup" || !NICK_RE.test(nick)) return;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-nickname?n=${encodeURIComponent(nick)}`);
        const data = await res.json();
        if (data?.available === true) setNickStatus("available");
        else if (data?.available === false) setNickStatus("taken");
      } catch {
        /* 판정 불가 — 표시 생략 */
      }
    }, 450);
    return () => clearTimeout(id);
  }, [nick, tab]);

  const cc = COUNTRIES.find((c) => c.iso === iso)?.cc ?? DEFAULT_COUNTRY.cc;
  const filterNick = (v: string) => v.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 20);

  // 탭 전환 — 비밀번호·에러 초기화(값 잔존 방지)
  const setTab = (k: "signup" | "login") => {
    setTabState(k);
    setPw("");
    setPw2("");
    setShowPw(false);
    setErr(null);
  };

  const finish = (n: string, a: string) => {
    setNick(n);
    setAvatar(a);
    onDone(n, a);
  };

  async function submitSignup() {
    track("signup_start"); // 퍼널: 가입 제출 시도 (일 1회 dedup)
    if (!NICK_RE.test(nick)) return setErr("auth_err_nickname");
    if (!/^\d{5,15}$/.test(phone)) return setErr("auth_err_phone");
    if (pw.length < 8) return setErr("auth_err_password");
    if (pw !== pw2) return setErr("auth_err_pw_mismatch");
    setErr(null);
    setBusy(true);
    const avatarId = sel === "custom" ? signupAvatars()[0].id : sel;
    const r = await signup({ nickname: nick, phone_cc: cc, phone, password: pw, avatar: avatarId });
    if (!r.ok) {
      setBusy(false);
      setErr(ERR_KEY[r.reason] ?? "auth_err_generic");
      return;
    }
    // 업로드 아바타는 가입(세션 확보) 후 저장 — 실패 시 기본 아바타로 진행하되 통지
    let finalAvatar = r.avatar ?? avatarId;
    if (sel === "custom" && customImage?.startsWith("data:")) {
      const url = await saveAvatar({ image: customImage });
      if (url) finalAvatar = url;
      else toast.error(t("auth_err_image"));
    }
    finish(r.nickname, finalAvatar);
  }

  async function submitLogin() {
    if (!nick || !pw) return setErr("auth_err_login");
    setErr(null);
    setBusy(true);
    const r = await login({ nickname: nick, password: pw });
    if (!r.ok) {
      setBusy(false);
      setErr(ERR_KEY[r.reason] ?? "auth_err_generic");
      return;
    }
    finish(r.nickname, r.avatar ?? signupAvatars()[0].id);
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-y-auto px-5 pb-safe pt-safe">
      {/* 스테이지 배경 + 강한 스크림 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {GAME_CONFIG.home.background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={GAME_CONFIG.home.background} alt="" className="h-full w-full scale-105 object-cover blur-[6px]" />
        ) : (
          <div className="stage-bg h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/85" />
      </div>

      {/* 로고 + 환영 문구 */}
      <div className="mt-6 text-center">
        {GAME_CONFIG.home.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={GAME_CONFIG.home.logo} alt="CELEB MATCH" className="mx-auto w-[200px]" />
        ) : (
          <div className="logo-puffy font-display text-[34px] font-black">CELEB MATCH</div>
        )}
        <p className="mt-2 text-[13px] font-bold text-white/70">
          {t(tab === "signup" ? "auth_welcome" : "auth_welcome_login")}
        </p>
      </div>

      {/* 탭 */}
      <div className="mx-auto mt-5 grid w-full max-w-xs grid-cols-2 rounded-full bg-black/40 p-1 ring-1 ring-white/15 backdrop-blur">
        {(["signup", "login"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full py-2 text-[13px] font-black transition-colors ${
              tab === k ? "bg-primary text-white" : "text-white/60"
            }`}
          >
            {t(k === "signup" ? "auth_tab_signup" : "auth_tab_login")}
          </button>
        ))}
      </div>

      {/* 폼 — Enter(키보드 완료)로 제출 가능 */}
      <form
        className="mx-auto mt-5 flex w-full max-w-xs flex-col gap-4 pb-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          void (tab === "signup" ? submitSignup() : submitLogin());
        }}
      >
        <Field label={t("nickname")} htmlFor="auth-nick" hint={tab === "signup" ? t("auth_nickname_hint") : undefined}>
          <input
            id="auth-nick"
            value={nick}
            onChange={(e) => setNickInput(filterNick(e.target.value))}
            name="username"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={20}
            placeholder={t("auth_nickname_rule")}
            className={INPUT_CLS}
          />
          {tab === "signup" && nickStatus !== "idle" && (
            <p aria-live="polite" className={`mt-1.5 text-[11px] font-bold ${nickStatus === "available" ? "text-verified" : "text-danger"}`}>
              {t(nickStatus === "available" ? "auth_nick_available" : "auth_err_nickname_taken")}
            </p>
          )}
        </Field>

        {tab === "signup" && (
          <Field label={t("auth_phone_label")} htmlFor="auth-phone" hint={t("auth_phone_hint")}>
            <div className="flex gap-2">
              <select
                value={iso}
                onChange={(e) => setIso(e.target.value)}
                aria-label={t("auth_phone_label")}
                className="w-[118px] shrink-0 rounded-[14px] bg-black/40 px-2 py-3 text-[13px] font-bold text-fg ring-1 ring-white/15 backdrop-blur focus:outline-none focus:ring-primary/50"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.iso} className="bg-surface-2 text-fg">
                    {c.flag} {c.iso} {c.cc}
                  </option>
                ))}
              </select>
              <input
                id="auth-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                name="phone"
                autoComplete="tel-national"
                inputMode="numeric"
                placeholder={t("auth_phone_ph")}
                className={INPUT_CLS}
              />
            </div>
          </Field>
        )}

        <Field label={t("auth_password_label")} htmlFor="auth-pw">
          <PasswordInput
            value={pw}
            onChange={setPw}
            placeholder={t("auth_password_ph")}
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
            show={showPw}
            onToggle={() => setShowPw((v) => !v)}
            toggleLabel={t("auth_show_pw")}
          />
        </Field>

        {tab === "signup" && (
          <Field label={t("auth_password_confirm")} htmlFor="auth-pw2">
            <PasswordInput
              value={pw2}
              onChange={setPw2}
              placeholder={t("auth_password_ph")}
              autoComplete="new-password"
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              toggleLabel={t("auth_show_pw")}
            />
          </Field>
        )}

        {tab === "signup" && (
          <Field label={t("auth_avatar_label")}>
            <AvatarPicker
              selected={sel}
              customImage={customImage}
              onPick={(id) => setSel(id)}
              onCustom={(url) => {
                setCustomImage(url);
                setSel("custom");
              }}
              onError={() => setErr("auth_err_image")}
            />
          </Field>
        )}

        {err && (
          <p role="alert" aria-live="polite" className="rounded-[12px] bg-danger/15 px-3 py-2 text-[12px] font-bold text-danger break-keep">
            {t(err)}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 w-full rounded-full bg-primary py-3.5 text-[15px] font-black text-white active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "…" : t(tab === "signup" ? "auth_signup_cta" : "auth_login_cta")}
        </button>

        {/* 로그인 시 이 기기 게스트 기록 대체 고지 */}
        {tab === "login" && <p className="text-center text-[11px] leading-snug text-white/40 break-keep">{t("auth_login_note")}</p>}

        <button
          type="button"
          onClick={() => setTab(tab === "signup" ? "login" : "signup")}
          className="text-[12px] font-bold text-white/50 underline-offset-2 hover:underline"
        >
          {t(tab === "signup" ? "auth_have_account" : "auth_no_account")}{" "}
          <span className="text-primary-400">{t(tab === "signup" ? "auth_tab_login" : "auth_tab_signup")}</span>
        </button>
      </form>
    </div>
  );
}
