"use client";

import { useFlipPill } from "./motion";
import { GLASS } from "./styles";
import { TABS, type TabKey } from "./tabs";

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  const { scope, capture } = useFlipPill(active);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div ref={scope} className={`${GLASS} flex w-full max-w-[420px] justify-between rounded-[26px] p-1.5`}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
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
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10.5px] font-medium transition-colors ${
                isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isActive && (
                <span data-pill data-flip-id="d3-tab-pill" className="absolute inset-0 rounded-[20px] bg-white shadow-sm" />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} className="relative" />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
