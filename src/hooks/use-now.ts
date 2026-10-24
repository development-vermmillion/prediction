"use client";

import { useEffect, useState } from "react";

/** Ticking timestamp. Returns 0 until mounted so SSR output is stable. */
export function useNow(intervalMs = 250) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
