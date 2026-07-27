import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query without setting state in an effect.
 * Reports false on the server so the first paint matches, then corrects on
 * hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
