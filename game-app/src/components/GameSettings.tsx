"use client";

// 게임설정 — 스테이지 배경 위 글래스 카드, 섹션(소리/플레이/일반) 그룹, 아이콘·설명 행.
// 토글은 트랙(w-12)·노브(left 명시) 절대 배치 — 노브가 트랙을 벗어나던 회귀 방지.
import { useEffect, useState } from "react";
import { Volume2, Music, Vibrate, BookOpen, Globe, type LucideIcon } from "lucide-react";
import { GAME_CONFIG } from "@/lib/game-config";
import { getHaptics, setHaptics, getOnboarding, setOnboarding, vibrate } from "@/lib/game-api";
import { soundEnabled, setSoundEnabled, sfxCoin } from "@/lib/sfx";
import { bgmEnabled, setBgmEnabled } from "@/lib/bgm";
import { playMusic, stopMusic } from "@/lib/music";
import ScreenHeader from "./ScreenHeader";
import LangSwitcher from "./LangSwitcher";
import { useLang } from "./LangProvider";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-11 w-14 shrink-0 active:scale-95"
    >
      {/* 트랙 48×28 · 노브 20 (left-1 → ON 시 +20px 이동, 항상 트랙 안쪽) */}
      <span
        className={`absolute left-1/2 top-1/2 h-7 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200 ${
          on ? "bg-primary shadow-[0_0_12px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.35)]" : "bg-black/50 ring-1 ring-white/15"
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-transform duration-200 ${
            on ? "translate-x-[20px]" : ""
          }`}
        />
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="flex items-center gap-2 px-1 text-[12px] font-black uppercase tracking-wider text-white/85">
        <span className="h-3.5 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      <div className="overflow-hidden rounded-[18px] bg-black/45 ring-1 ring-white/12 backdrop-blur">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  desc,
  divider,
  children,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 py-3 pl-3.5 pr-2 ${divider ? "border-t border-white/8" : ""}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-primary/35 to-primary/10 text-primary-400 ring-1 ring-primary/30">
        <Icon className="h-[19px] w-[19px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold leading-tight text-fg">{label}</div>
        <div className="mt-1 text-[11.5px] leading-tight text-white/45 break-keep">{desc}</div>
      </div>
      {children}
    </div>
  );
}

export default function GameSettings({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [haptics, setHapticsState] = useState(true);
  const [onboarding, setOnboardingState] = useState(true);
  const [sound, setSoundState] = useState(true);
  const [bgm, setBgmState] = useState(true);

  useEffect(() => {
    setHapticsState(getHaptics());
    setOnboardingState(getOnboarding());
    setSoundState(soundEnabled());
    setBgmState(bgmEnabled());
  }, []);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden px-safe pb-safe pt-safe">
      {/* 스테이지 배경 + 스크림 — 홈과 동일한 월드감 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {GAME_CONFIG.home.background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={GAME_CONFIG.home.background} alt="" className="h-full w-full scale-105 object-cover blur-[6px]" />
        ) : (
          <div className="stage-bg h-full w-full" />
        )}
        {/* 강한 스크림 — 무대 아트는 무드 조명으로만, 설정 정보가 주인공 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/85" />
      </div>

      <ScreenHeader title={t("settings_title")} onBack={onBack} />
      <div className="mt-5 flex flex-col gap-6">
        <Section title={t("settings_sec_sound")}>
          <Row icon={Volume2} label={t("setting_sound")} desc={t("setting_sound_desc")}>
            <Toggle
              on={sound}
              label={t("setting_sound")}
              onChange={(v) => {
                setSoundState(v);
                setSoundEnabled(v);
                if (v) sfxCoin(); // 켜짐 즉시 청각 피드백
              }}
            />
          </Row>
          <Row icon={Music} label={t("setting_bgm")} desc={t("setting_bgm_desc")} divider>
            <Toggle
              on={bgm}
              label={t("setting_bgm")}
              onChange={(v) => {
                setBgmState(v);
                setBgmEnabled(v);
                // 로비 음악 즉시 반영 (설정 화면 = 로비 구간)
                if (v) void playMusic();
                else stopMusic();
              }}
            />
          </Row>
        </Section>

        <Section title={t("settings_sec_play")}>
          <Row icon={Vibrate} label={t("setting_haptics")} desc={t("setting_haptics_desc")}>
            <Toggle
              on={haptics}
              label={t("setting_haptics")}
              onChange={(v) => {
                setHapticsState(v);
                setHaptics(v);
                if (v) vibrate(30); // 켜짐 즉시 촉각 피드백
              }}
            />
          </Row>
          <Row icon={BookOpen} label={t("setting_onboarding")} desc={t("setting_onboarding_desc")} divider>
            <Toggle
              on={onboarding}
              label={t("setting_onboarding")}
              onChange={(v) => {
                setOnboardingState(v);
                setOnboarding(v);
              }}
            />
          </Row>
        </Section>

        <Section title={t("settings_sec_general")}>
          <Row icon={Globe} label={t("setting_lang")} desc={t("setting_lang_desc")}>
            <div className="pr-1.5">
              <LangSwitcher />
            </div>
          </Row>
        </Section>
      </div>

      {/* 브랜드 푸터 */}
      <div className="mt-auto pb-1 pt-10 text-center text-[10px] font-black tracking-[0.3em] text-white/25">
        CELEB MATCH
      </div>
    </div>
  );
}
