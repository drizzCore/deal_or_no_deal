import { useEffect, useState } from "react";
import type { RevealSpeed } from "@/lib/config";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** "system" follows the operating system; the others override it either way. */
export type MotionPreference = "system" | "full" | "reduced";

export interface Settings {
  readonly muted: boolean;
  /** 0 to 1. */
  readonly volume: number;
  readonly revealSpeed: RevealSpeed;
  readonly motion: MotionPreference;
}

const DEFAULTS: Settings = {
  muted: false,
  volume: 0.7,
  revealSpeed: "normal",
  motion: "system",
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const systemPrefersReduced = usePrefersReducedMotion();

  const reducedMotion =
    settings.motion === "system"
      ? systemPrefersReduced
      : settings.motion === "reduced";

  /**
   * The CSS cannot read React state, and the media query alone cannot express
   * "the player asked for motion even though the OS said not to". So the
   * resolved preference is stamped on the document and the stylesheet keys off
   * that as well as the media query.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (settings.motion === "system") root.removeAttribute("data-motion");
    else root.setAttribute("data-motion", settings.motion);
  }, [settings.motion]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  return { settings, update, reducedMotion };
}
