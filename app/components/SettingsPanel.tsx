"use client";

import { useEffect, useState } from "react";
import { REVEAL_SPEEDS, TOP_PRIZE_PRESETS, type RevealSpeed } from "@/lib/config";
import { formatPeso } from "@/lib/money";
import type { MotionPreference, Settings } from "../hooks/useSettings";

interface SettingsPanelProps {
  readonly settings: Settings;
  readonly topPrize: number;
  /** True when there is progress a Top Prize change would throw away. */
  readonly gameInProgress: boolean;
  readonly onChange: <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => void;
  readonly onTopPrize: (prize: number) => void;
  readonly onNewGame: () => void;
  readonly onClose: () => void;
}

const MOTION_LABELS: Record<MotionPreference, string> = {
  system: "Match my device",
  full: "Full motion",
  reduced: "Reduced",
};

export function SettingsPanel({
  settings,
  topPrize,
  gameInProgress,
  onChange,
  onTopPrize,
  onNewGame,
  onClose,
}: SettingsPanelProps) {
  // The Top Prize is the one setting that cannot apply in place — the Prize
  // Ladder *is* the game state, so changing it has to start a new game.
  const [pendingPrize, setPendingPrize] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chooseTopPrize = (prize: number) => {
    if (prize === topPrize) return;
    if (gameInProgress) setPendingPrize(prize);
    else onTopPrize(prize);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close settings"
        className="absolute inset-0 bg-stage/75 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-label="Settings"
        className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-stage-edge bg-stage-lift"
      >
        <header className="flex items-center justify-between border-b border-stage-edge px-5 py-4">
          <h2 className="font-display text-xl tracking-wide text-bone">
            SETTINGS
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-3 py-2 text-sm text-bone-dim transition-colors hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
          >
            Close
          </button>
        </header>

        <div className="flex flex-col gap-6 px-5 py-5">
          <Section label="Top prize">
            {/* An odd number of presets would leave the last one stranded in
                half a row, so it takes the whole width instead. */}
            <div className="grid grid-cols-2 gap-2">
              {TOP_PRIZE_PRESETS.map((prize, index) => (
                <div
                  key={prize}
                  className={
                    index === TOP_PRIZE_PRESETS.length - 1 &&
                    TOP_PRIZE_PRESETS.length % 2 === 1
                      ? "col-span-2 flex"
                      : "flex"
                  }
                >
                  <Choice
                    active={prize === topPrize}
                    onClick={() => chooseTopPrize(prize)}
                  >
                    {formatPeso(prize)}
                  </Choice>
                </div>
              ))}
            </div>

            {pendingPrize !== null && (
              <div className="mt-3 rounded-sm border border-brass-dim bg-stage/70 p-3">
                <p className="text-sm text-bone">
                  Switching to {formatPeso(pendingPrize)} starts a new game.
                  This one will be lost.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onTopPrize(pendingPrize);
                      setPendingPrize(null);
                    }}
                    className="rounded-sm bg-brass px-3 py-2 text-xs font-semibold tracking-wide text-stage uppercase transition-colors hover:bg-brass-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
                  >
                    Start new game
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingPrize(null)}
                    className="rounded-sm border border-stage-edge px-3 py-2 text-xs text-bone-dim transition-colors hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
                  >
                    Keep playing
                  </button>
                </div>
              </div>
            )}
          </Section>

          <Section label="Sound">
            <div className="flex gap-2">
              <Choice
                active={!settings.muted}
                onClick={() => onChange("muted", false)}
              >
                On
              </Choice>
              <Choice
                active={settings.muted}
                onClick={() => onChange("muted", true)}
              >
                Off
              </Choice>
            </div>

            <label className="mt-3 flex items-center gap-3 text-xs text-bone-dim">
              Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                disabled={settings.muted}
                onChange={(e) => onChange("volume", Number(e.target.value))}
                className="h-10 flex-1 cursor-pointer accent-brass disabled:cursor-not-allowed disabled:opacity-40"
              />
              <span className="tabular w-8 text-right">
                {Math.round(settings.volume * 100)}
              </span>
            </label>
          </Section>

          <Section label="Reveal speed">
            <div className="flex gap-2">
              {(Object.keys(REVEAL_SPEEDS) as RevealSpeed[]).map((speed) => (
                <Choice
                  key={speed}
                  active={settings.revealSpeed === speed}
                  onClick={() => onChange("revealSpeed", speed)}
                >
                  {speed === "normal" ? "Normal" : "Fast"}
                </Choice>
              ))}
            </div>
            <p className="mt-2 text-xs text-bone-faint">
              Fast halves every reveal. Eighteen cases open in a game.
            </p>
          </Section>

          <Section label="Motion">
            <div className="flex flex-col gap-2">
              {(Object.keys(MOTION_LABELS) as MotionPreference[]).map((mode) => (
                <Choice
                  key={mode}
                  active={settings.motion === mode}
                  onClick={() => onChange("motion", mode)}
                >
                  {MOTION_LABELS[mode]}
                </Choice>
              ))}
            </div>
            <p className="mt-2 text-xs text-bone-faint">
              Reduced removes the shake, flash and screen darkening.
            </p>
          </Section>

          <button
            type="button"
            onClick={() => {
              onNewGame();
              onClose();
            }}
            className="rounded-sm border border-stage-edge px-4 py-2.5 text-sm text-bone-dim transition-colors hover:border-brass-dim hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
          >
            Start a new game
          </button>
        </div>
      </aside>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs tracking-[0.2em] text-bone-faint uppercase">
        {label}
      </h3>
      {children}
    </section>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "tabular flex-1 rounded-sm px-3 py-2.5 text-sm transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot",
        active
          ? "bg-brass text-stage"
          : "bg-stage text-bone-dim hover:bg-stage-edge hover:text-bone",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
