"use client";

import { useEffect, useState } from "react";
import { getHaptics, setHaptics, getOnboarding, setOnboarding } from "@/lib/game-api";
import { soundEnabled, setSoundEnabled } from "@/lib/sfx";
import ScreenHeader from "./ScreenHeader";
import LangSwitcher from "./LangSwitcher";
import { useLang } from "./LangProvider";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-surface-3"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-[14px] bg-surface-1 px-4 py-3.5 ring-1 ring-hairline">
      <span className="text-[14px] font-bold text-fg">{label}</span>
      {children}
    </div>
  );
}

export default function GameSettings({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  const [haptics, setHapticsState] = useState(true);
  const [onboarding, setOnboardingState] = useState(true);
  const [sound, setSoundState] = useState(true);

  useEffect(() => {
    setHapticsState(getHaptics());
    setOnboardingState(getOnboarding());
    setSoundState(soundEnabled());
  }, []);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-4">
      <ScreenHeader title={t("settings_title")} onBack={onBack} />
      <div className="mt-5 flex flex-col gap-2">
        <Row label={t("setting_lang")}>
          <LangSwitcher />
        </Row>
        <Row label={t("setting_haptics")}>
          <Toggle
            on={haptics}
            onChange={(v) => {
              setHapticsState(v);
              setHaptics(v);
            }}
          />
        </Row>
        <Row label={t("setting_onboarding")}>
          <Toggle
            on={onboarding}
            onChange={(v) => {
              setOnboardingState(v);
              setOnboarding(v);
            }}
          />
        </Row>
        <Row label={t("setting_sound")}>
          <Toggle
            on={sound}
            onChange={(v) => {
              setSoundState(v);
              setSoundEnabled(v);
            }}
          />
        </Row>
      </div>
    </div>
  );
}
