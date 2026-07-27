import { useMediaQuery } from "./useMediaQuery";

/** Whether the player has asked for less motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
