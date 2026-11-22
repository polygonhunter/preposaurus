"use client";

import { useCallback, useState } from "react";

/** Lokaler Objekt-State, der per Teil-Update geändert wird (Einstellungen). */
export function usePatch<T extends object>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  const patch = useCallback((changes: Partial<T>) => setValue((prev) => ({ ...prev, ...changes })), []);
  return [value, patch] as const;
}
