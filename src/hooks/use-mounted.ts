"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after hydration. Use before reading persisted (localStorage) state. */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
