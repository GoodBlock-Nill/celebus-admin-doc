"use client";

// 게임 설정 튜닝 — game_config 오버레이(JSONB) 편집. 빈 칸 = 코드 기본값 사용.
// 저장 즉시 전 유저 다음 실행부터 반영(ConfigBoot 병합). 상단 저장 바 + 항목별 기본값·변경 표시.
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { aget, asend } from "@/lib/admin-api";
import { GAME_CONFIG } from "@/lib/game-config";
import AdminRewards, { type RewardsOverlay } from "./AdminRewards";
import { BTN, BTN_GHOST, Card, INPUT } from "./ui";

type Overlay = Record<string, Record<string, unknown>>;
const DEFAULTS = GAME_CONFIG as unknown as Record<string, Record<string, unknown>>;

// 그룹/필드 스펙 — [키, 라벨, 타입]
const GROUPS: { key: string; label: string; fields: [string, string, "num" | "text"][] }[] = [
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
      ["bonus4", "4매치(라인)", "num"],
      ["bonus5", "5매치(컬러밤)", "num"],
      ["bonusCross", "교차 매치(광역)", "num"],
      ["bonusSquare", "2×2 정사각", "num"],
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
      ["price", "구매 가격(CP)", "num"],
    ],
  },
  {
    key: "pass",
    label: "CELEB PASS (시즌 누적 트랙)",
    fields: [
      ["xpBase", "판당 기본 XP (0=끔)", "num"],
      ["xpSecCap", "시간 가산 상한(초)", "num"],
      ["xpSecDiv", "가산 나눗값(초당 XP 밀도)", "num"],
      ["perLevel", "레벨당 필요 XP", "num"],
      ["maxLevel", "최대 레벨", "num"],
      ["defaultCp", "레벨당 기본 보상 CP", "num"],
    ],
  },
  {
    key: "coasting",
    label: "순항 구간 (피로 완화)",
    fields: [
      ["warmupSec", "오늘 첫 판 웜업(초, 0=끔)", "num"],
      ["streakT1Days", "스트릭 1단 기준(일)", "num"],
      ["streakT1Sec", "스트릭 1단 보너스(초)", "num"],
      ["streakT2Days", "스트릭 2단 기준(일)", "num"],
      ["streakT2Sec", "스트릭 2단 보너스(초)", "num"],
      ["graceThreshold", "라스트 스퍼트 임계(레벨 진행 0~1)", "num"],
      ["graceSec", "라스트 스퍼트(초, 0=끔)", "num"],
      ["gracePerRun", "판당 스퍼트 횟수", "num"],
    ],
  },
  {
    key: "integrity",
    label: "점수 무결성 (어뷰징 방어)",
    fields: [
      ["minSecPerLevel", "레벨당 최소 시간(초)", "num"],
      ["maxScorePerSec", "초당 점수율 상한(초과=거부)", "num"],
      ["suspectScorePerSec", "초당 점수율 의심(초과=플래그)", "num"],
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
      ["music", "로비 음악", "text"],
      ["parentAppUrl", "CELEBUS 복귀 주소", "text"],
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
  const [saved, setSaved] = useState("{}"); // 마지막 저장본(JSON 문자열) — 변경 여부 판정
  const [raw, setRaw] = useState("{}");
  const [showRaw, setShowRaw] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    aget<{ config: Overlay }>("/api/admin/config")
      .then((d) => {
        const c = d.config ?? {};
        setOverlay(c);
        setSaved(JSON.stringify(c));
        setRaw(JSON.stringify(c, null, 2));
      })
      .catch(() => {});
  }, []);

  const dirty = JSON.stringify(overlay) !== saved;

  const setField = (g: string, f: string, v: string, type: "num" | "text") => {
    setOverlay((o) => {
      const next = { ...o, [g]: { ...(o[g] as Record<string, unknown>) } };
      if (v === "") delete (next[g] as Record<string, unknown>)[f]; // 빈 값 = 기본값 복귀
      else (next[g] as Record<string, unknown>)[f] = type === "num" ? Number(v) : v;
      if (Object.keys(next[g] as object).length === 0) delete next[g];
      setRaw(JSON.stringify(next, null, 2));
      return next;
    });
    setMsg(null);
  };

  const save = async (o: Overlay = overlay) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await asend<{ status?: string; error?: string }>("/api/admin/config", "PUT", { config: o });
      if (r.error) {
        setMsg(r.error === "bad_rewards" ? "주간 랭킹 보상 값이 올바르지 않아 저장하지 못했어요." : "저장에 실패했어요.");
      } else {
        setSaved(JSON.stringify(o));
        setRaw(JSON.stringify(o, null, 2));
        setMsg("저장했어요 — 유저는 다음 게임 실행부터 반영돼요.");
      }
    } catch {
      setMsg("저장에 실패했어요.");
    }
    setBusy(false);
  };

  const revert = () => {
    const c = JSON.parse(saved) as Overlay;
    setOverlay(c);
    setRaw(JSON.stringify(c, null, 2));
    setMsg(null);
  };

  // rewards 그룹은 배열·중첩 구조라 GROUPS 폼 대신 전용 폼(AdminRewards)으로 편집
  const setRewards = (v: RewardsOverlay | undefined) => {
    setOverlay((o) => {
      const next = { ...o };
      if (v === undefined) delete next.rewards;
      else next.rewards = v as unknown as Record<string, unknown>;
      setRaw(JSON.stringify(next, null, 2));
      return next;
    });
    setMsg(null);
  };

  const val = (g: string, f: string) => {
    const v = overlay[g]?.[f];
    return v === undefined || v === null ? "" : String(v);
  };
  const def = (g: string, f: string) => DEFAULTS[g]?.[f];

  return (
    <div className="flex flex-col gap-4">
      {/* 저장 바 (상단 고정) */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-[12px] bg-surface-2 px-4 py-3 shadow-lg ring-1 ring-hairline">
        <div className="min-w-0 text-[13.5px]">
          {dirty ? (
            <span className="font-bold text-gold">저장되지 않은 변경이 있어요</span>
          ) : (
            <span className="text-muted">모든 변경이 저장됨 · 빈 칸은 기본값을 사용해요</span>
          )}
          {msg && <span className="ml-2 font-bold text-primary-400">{msg}</span>}
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={revert} disabled={!dirty || busy} className={BTN_GHOST}>
            변경 취소
          </button>
          <button onClick={() => void save()} disabled={!dirty || busy} className={BTN}>
            저장
          </button>
        </div>
      </div>

      {GROUPS.map((grp) => (
        <Card key={grp.key} title={grp.label}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {grp.fields.map(([f, label, type]) => {
              const overridden = val(grp.key, f) !== "";
              const d = def(grp.key, f);
              return (
                <label key={f} className="flex items-center gap-2 text-[13.5px] text-muted">
                  <span className="flex w-40 shrink-0 items-center gap-1.5">
                    {label}
                    {overridden && <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">변경</span>}
                  </span>
                  <input
                    value={val(grp.key, f)}
                    onChange={(e) => setField(grp.key, f, e.target.value, type)}
                    placeholder={d != null ? `기본값 ${d}` : "기본값"}
                    inputMode={type === "num" ? "decimal" : undefined}
                    className={`${INPUT} min-w-0 flex-1 ${type === "num" ? "text-right tabular-nums" : ""}`}
                  />
                  {overridden && (
                    <button
                      type="button"
                      onClick={() => setField(grp.key, f, "", type)}
                      title="기본값으로 되돌리기"
                      className="shrink-0 text-subtle transition-colors hover:text-fg"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </label>
              );
            })}
          </div>
        </Card>
      ))}

      <AdminRewards value={overlay.rewards as RewardsOverlay | undefined} onChange={setRewards} />

      {/* 고급 — 원본 JSON (접이식). 데일리 미션 pool·타일·아바타 등 배열/중첩 값 편집용 */}
      <Card title="고급 — 오버레이 원본(JSON)">
        <button onClick={() => setShowRaw((v) => !v)} className={BTN_GHOST}>
          {showRaw ? "접기" : "펼치기 (데일리 미션·타일·아바타 등)"}
        </button>
        {showRaw && (
          <div className="mt-3">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={12}
              spellCheck={false}
              className={`${INPUT} w-full font-mono text-[12.5px] leading-relaxed`}
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
                className={BTN}
              >
                JSON으로 저장
              </button>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              여기 저장된 값만 코드 기본값을 덮어써요. 데일리 미션은 <b className="text-fg">missions.pool</b>(배열)·
              <b className="text-fg">missions.count</b>, 타일·아바타 세트는 tiles/avatars 배열로 지정해요.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
