"use client";

import { TABS, type TabKey } from "../data/tabs";
import { useFlipPill } from "../motion/hooks";
import { GLASS, cx } from "../theme/styles";

interface TabBarProps {
  /** `null` = kein Tab aktiv (z. B. während die Einstellungen offen sind) */
  active: TabKey | null;
  badges: Partial<Record<TabKey, number>>;
  onChange: (tab: TabKey) => void;
}

/** Schwebendes Glas-Dock; die leuchtende Markierung gleitet per Flip zum aktiven Tab. */
export function TabBar({ active, badges, onChange }: TabBarProps) {
  const { scope, capture } = useFlipPill<HTMLDivElement>(active ?? "");

  return (
    <nav aria-label="Bereiche" className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div ref={scope} className={cx(GLASS, "flex w-full max-w-[420px] justify-between rounded-[26px] p-1.5")}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
          const badge = badges[key];
          return (
            <button
              key={key}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (isActive) return;
                capture();
                onChange(key);
              }}
              className={cx(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10.5px] font-medium transition-colors",
                isActive ? "text-(--d6-accent-text)" : "text-(--d6-muted) hover:text-(--d6-text)",
              )}
            >
              {isActive && (
                <span
                  data-pill
                  className="absolute inset-0 rounded-[20px] border border-(--d6-accent)/40 bg-(--d6-accent-soft) shadow-[0_0_22px_-6px_var(--d6-glow)]"
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} className="relative" />
              <span className="relative">{label}</span>
              {Boolean(badge) && (
                <span className="absolute right-[18%] top-1 grid min-w-4 place-items-center rounded-full bg-(--d6-ink) px-1 font-(family-name:--d6-mono) text-[9px] text-(--d6-on-ink)">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
