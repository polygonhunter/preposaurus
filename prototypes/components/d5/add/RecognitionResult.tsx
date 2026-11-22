import type { ReactNode } from "react";
import { ChunkyButton } from "../ui/ChunkyButton";

interface RecognitionResultProps {
  title: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel: string;
}

/** Karte „Erkannt!“ mit Ergebnis-Vorschlag und Weiter-Knopf. */
export function RecognitionResult({ title, children, onNext, nextLabel }: RecognitionResultProps) {
  return (
    <div data-result className="space-y-3 rounded-3xl border-2 border-[#4CC66A] bg-[#EAFBEF] p-4 shadow-[0_4px_0_#2F9E4C]">
      <p className="text-xs font-black tracking-wide text-[#2F9E4C] uppercase">✨ {title}</p>
      <div className="text-lg font-black">{children}</div>
      <p className="text-xs font-bold text-(--d5-muted)">Nur ein Vorschlag – du kannst alles später ändern.</p>
      <ChunkyButton tone="green" size="lg" onClick={onNext}>
        {nextLabel}
      </ChunkyButton>
    </div>
  );
}
