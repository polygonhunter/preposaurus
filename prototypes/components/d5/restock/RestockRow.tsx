"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import type { RestockItem } from "@/lib/types";
import { burstConfetti } from "../confetti";
import { bounce } from "../motion";

interface RestockRowProps {
  item: RestockItem;
  onToggle: (id: string) => void;
}

/** Abhakbare Zeile mit dicker Checkbox; Abhaken feiert kurz mit Konfetti. */
export function RestockRow({ item, onToggle }: RestockRowProps) {
  const box = useRef<HTMLSpanElement>(null);

  const toggle = () => {
    bounce(box.current, 0.6);
    if (!item.done) burstConfetti(box.current, 16);
    onToggle(item.id);
  };

  return (
    <li data-pop>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        onClick={toggle}
        className={`flex w-full items-center gap-3 rounded-3xl border-2 p-3 text-left transition-colors ${
          item.done ? "border-transparent bg-(--d5-soft)" : "border-(--d5-line) bg-white shadow-[0_4px_0_var(--d5-line)]"
        }`}
      >
        <span
          ref={box}
          className={`grid size-9 shrink-0 place-items-center rounded-xl border-[3px] ${
            item.done ? "border-[#2F9E4C] bg-[#4CC66A] text-white" : "border-(--d5-line) bg-white text-transparent"
          }`}
        >
          <Check className="size-5" strokeWidth={4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-black ${item.done ? "text-(--d5-muted) line-through" : ""}`}>{item.label}</span>
          <span className="block text-sm font-bold text-(--d5-muted)">{item.amount}</span>
        </span>
      </button>
    </li>
  );
}
