import { useEffect, useState } from "react";

/** Counts down from `initialSeconds`; restart() resets it. */
export function useCountdown(initialSeconds: number): { seconds: number; restart: () => void } {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds, tick]);

  function restart() {
    setSeconds(initialSeconds);
    setTick((t) => t + 1);
  }

  return { seconds, restart };
}