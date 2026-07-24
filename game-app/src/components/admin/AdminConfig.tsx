"use client";

// 게임 설정 튜닝 — game_config 오버레이(JSONB) 편집. 빈 값 = 코드 기본값 사용.
// 저장 즉시 전 유저 다음 실행부터 반영(재배포 불필요, ConfigBoot 병합).
import { useEffect, useState } from "react";
import { aget, asend } from "@/lib/admin-api";
import { BTN, BTN_GHOST, Card, INPUT } from "./ui";

type Overlay = Record<string, Record<string, unknown>>;

// 그룹/필드 스펙 — [키, 라벨, 타입]
const GROUPS: { key: string; label: string; fields: [string, string, "num" | "text" | "bool"][] }[] = [
  {
    key: "game",
    label: "게임 시간",
    fields: [
      ["seconds", "라운드(초)", "num"],
      ["maxSeconds", "시간 상한(초)", "num"],
      ["hintSec", "힌트 대기(초, 0=끔)", "num"],
      ["timeItemSec", "시간+ 아이템(초)", "num"],
    ],
  },
  {
    key: "levels",
    label: "레벨 진행",
    fields: [
      ["baseTarget", "Lv.1 목표 점수", "num"],
      ["targetStep", "레벨당 증가", "num"],
      ["bonusSec", "레벨업 보너스(초)", "num"],
    ],
  },
  {
    key: "pacing",
    label: "페이싱·피버",
    fields: [
      ["frenzySec", "피버 진입(잔여초)", "num"],
      ["frenzyMul", "피버 배율", "num"],
      ["rushSec", "러시 진입(잔여초)", "num"],
      ["rushMul", "러시 배율", "num"],
      ["cascadeAccel", "연쇄 가속 배수", "num"],
      ["cascadeMinMs", "연쇄 최소 딜레이(ms)", "num"],
    ],
  },
  {
    key: "scoring",
    label: "보너스 점수",
    fields: [
      ["bonus4", "4매치", "num"],
      ["bonus5", "5매치", "num"],
      ["bonusCross", "교차 매치", "num"],
    ],
  },
  {
    key: "hearts",
    label: "이어하기 하트 (일반 매치)",
    fields: [
      ["start", "판당 기본 제공", "num"],
      ["slots", "표시 슬롯 수", "num"],
      ["maxPerRun", "판당 사용 상한", "num"],
      ["continueSec", "이어하기 시간(초)", "num"],
    ],
  },
  {
    key: "missions",
    label: "데일리 미션 (목표 · 보상 CP)",
    fields: [
      ["plays", "판수 목표", "num"],
      ["playsCp", "판수 보상", "num"],
      ["totalScore", "누적 점수 목표", "num"],
      ["scoreCp", "점수 보상", "num"],
      ["bestLevel", "레벨 목표", "num"],
      ["levelCp", "레벨 보상", "num"],
    ],
  },
  {
    key: "daily",
    label: "데일리 출석",
    fields: [
      ["base", "기본 보상", "num"],
      ["streakStep", "연속 증가", "num"],
      ["maxStreakDays", "최대 연속일", "num"],
    ],
  },
  {
    key: "audio",
    label: "사운드",
    fields: [
      ["volume", "효과음 볼륨(0~1)", "num"],
      ["bgmVolume", "게임 BGM 볼륨", "num"],
      ["homeVolume", "로비 음악 볼륨", "num"],
    ],
  },
  {
    key: "home",
    label: "홈 에셋 (URL)",
    fields: [
      ["background", "배경", "text"],
      ["logo", "로고", "text"],
      ["hero", "히어로", "text"],
      ["music", "로비 음악", "text"],
    ],
  },
  {
    key: "match",
    label: "게임 화면 에셋",
    fields: [["background", "스테이지 배경(URL)", "text"]],
  },
  {
    key: "specials",
    label: "스페셜 타일 이미지 (URL, 없으면 CSS)",
    fields: [
      ["line", "라인(십자)", "text"],
      ["area", "광역", "text"],
      ["color", "컬러밤", "text"],
    ],
  },
];

export default function AdminConfig() {
  const [overlay, setOverlay] = useState<Overlay>({});
  const [raw, setRaw] = useState("{}");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    aget<{ config: Overlay }>("/api/admin/config")
      .then((d) => {
        const c = d.config ?? {};
        setOverlay(c);
        setRaw(JSON.stringify(c, null, 2));
      })
      .catch(() => {});
  }, []);

  const setField = (g: string, f: string, v: string, type: "num" | "text" | "bool") => {
    setOverlay((o) => {
      const next = { ...o, [g]: { ...(o[g] as Record<string, unknown>) } };
      if (v === "") delete (next[g] as Record<string, unknown>)[f]; // 빈 값 = 기본값 복귀
      else (next[g] as Record<string, unknown>)[f] = type === "num" ? Number(v) : v;
      if (Object.keys(next[g] as object).length === 0) delete next[g];
      setRaw(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const save = async (o: Overlay) => {
    setBusy(true);
    setMsg(null);
    try {
      await asend("/api/admin/config", "PUT", { config: o });
      setMsg("저장했어요 — 유저는 다음 실행부터 반영돼요.");
    } catch {
      setMsg("저장에 실패했어요.");
    }
    setBusy(false);
  };

  const val = (g: string, f: string) => {
    const v = overlay[g]?.[f];
    return v === undefined || v === null ? "" : String(v);
  };

  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map((grp) => (
        <Card key={grp.key} title={grp.label}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {grp.fields.map(([f, label, type]) => (
              <label key={f} className="flex items-center gap-2 text-[12px] text-muted">
                <span className="w-36 shrink-0">{label}</span>
                <input
                  value={val(grp.key, f)}
                  onChange={(e) => setField(grp.key, f, e.target.value, type)}
                  placeholder="기본값"
                  inputMode={type === "num" ? "decimal" : undefined}
                  className={`${INPUT} min-w-0 flex-1 ${type === "num" ? "text-right tabular-nums" : ""}`}
                />
              </label>
            ))}
          </div>
        </Card>
      ))}

      <Card title="고급 — 오버레이 원본(JSON)">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={10}
          spellCheck={false}
          className={`${INPUT} w-full font-mono text-[11.5px] leading-relaxed`}
        />
        <div className="mt-2 flex gap-2">
          <button
            disabled={busy}
            onClick={() => {
              try {
                const parsed = JSON.parse(raw) as Overlay;
                setOverlay(parsed);
                void save(parsed);
              } catch {
                setMsg("JSON 형식이 올바르지 않아요.");
              }
            }}
            className={BTN_GHOST}
          >
            JSON으로 저장
          </button>
          <button disabled={busy} onClick={() => void save(overlay)} className={BTN}>
            폼 값 저장
          </button>
        </div>
        {msg && <p className="mt-2 text-[12px] font-bold text-primary-400">{msg}</p>}
        <p className="mt-2 text-[11px] leading-snug text-subtle">
          빈 칸 = 코드 기본값 사용. 여기 저장된 값만 기본값을 덮어써요. 타일·아바타 세트 교체는 JSON에서 tiles/avatars 배열로 지정.
        </p>
      </Card>
    </div>
  );
}
