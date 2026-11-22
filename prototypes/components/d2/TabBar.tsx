"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "./motion";
import { TABS, type TabKey } from "./navigation";
import { cx } from "./theme";

interface TabBarProps {
  active: TabKey;
  badges: Partial<Record<TabKey, number>>;
  onSelect: (tab: TabKey) => void;
}

/** Schwebendes Dock mit leuchtendem Indikator, der zum aktiven Tab gleitet. */
export function TabBar({ active, badges, onSelect }: TabBarProps) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const button = navRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (!button) return;
      gsap.to(indicatorRef.current, {
        x: button.offsetLeft,
        width: button.offsetWidth,
        duration: prefersReducedMotion() ? 0 : 0.45,
        ease: "power3.out",
      });
    },
    { dependencies: [active], scope: navRef },
  );

  return (
    <nav
      ref={navRef}
      aria-label="Bereiche"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-3 pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      <div className="relative flex rounded-2xl border border-white/10 bg-black/70 p-1 backdrop-blur-xl">
        <span
          ref={indicatorRef}
          aria-hidden
          className="absolute top-1 bottom-1 left-0 rounded-xl border border-(--d2-accent)/40 bg-(--d2-accent-soft) shadow-[0_0_24px_-6px_var(--d2-accent)]"
        />
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            data-tab={key}
            aria-current={active === key ? "page" : undefined}
            onClick={() => onSelect(key)}
            className={cx(
              "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] transition-colors",
              active === key ? "text-(--d2-accent)" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <Icon className="size-5" strokeWidth={1.6} />
            {label}
            {Boolean(badges[key]) && (
              <span className="absolute top-1 right-[18%] grid min-w-4 place-items-center rounded-full bg-(--d2-accent) px-1 font-(family-name:--d2-mono) text-[9px] text-black">
                {badges[key]}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
