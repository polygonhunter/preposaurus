"use client";

import { useRef } from "react";
import { bounce, useGSAP } from "./motion";
import { TABS, type TabKey } from "./tabs";
import { toneVars } from "./theme";

interface TabBarProps {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
}

/** Untere Navigation mit dicken Icon-Kacheln; der Plus-Knopf sitzt erhöht in der Mitte. */
export function TabBar({ active, onSelect }: TabBarProps) {
  const scope = useRef<HTMLElement>(null);
  const { contextSafe } = useGSAP({ scope });

  const select = contextSafe((tab: TabKey, tile: HTMLElement | null) => {
    bounce(tile, 0.7);
    onSelect(tab);
  });

  return (
    <nav
      ref={scope}
      aria-label="Hauptnavigation"
      className="sticky bottom-0 z-30 border-t-2 border-(--d5-line) bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur"
    >
      <ul className="grid grid-cols-5 items-end">
        {TABS.map(({ key, label, icon: Icon, tone }) => {
          const isActive = key === active;
          const isCenter = key === "add";
          return (
            <li key={key} className="flex justify-center">
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => select(key, event.currentTarget.firstElementChild as HTMLElement | null)}
                className="flex flex-col items-center gap-1 text-[11px] font-extrabold"
                style={toneVars(tone)}
              >
                <span
                  className={`grid place-items-center rounded-2xl transition-colors ${
                    isCenter ? "-mt-7 size-14 bg-(--tone) text-white shadow-[0_5px_0_var(--tone-edge)]" : "size-10"
                  } ${!isCenter && isActive ? "bg-(--tone) text-white shadow-[0_4px_0_var(--tone-edge)]" : ""} ${
                    !isCenter && !isActive ? "text-(--d5-muted)" : ""
                  }`}
                >
                  <Icon className={isCenter ? "size-8" : "size-5"} strokeWidth={3} />
                </span>
                <span className={isActive ? "text-(--tone-edge)" : "text-(--d5-muted)"}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
