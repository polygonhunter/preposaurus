const STEPS = ["Verpackung", "Nährwerte", "MHD-Serie", "Fertig"];

/** Fortschritt durch die Foto-Schritte als dicke Punkte mit Beschriftung. */
export function StepDots({ current }: { current: number }) {
  return (
    <ol className="flex items-start justify-between gap-1" aria-label="Schritte">
      {STEPS.map((label, index) => {
        const state = index < current ? "done" : index === current ? "active" : "todo";
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1" aria-current={state === "active" ? "step" : undefined}>
            <span
              className={`grid size-8 place-items-center rounded-full text-sm font-black transition-colors ${
                state === "done"
                  ? "bg-[#4CC66A] text-white shadow-[0_3px_0_#2F9E4C]"
                  : state === "active"
                    ? "bg-[#3BA9F5] text-white shadow-[0_3px_0_#1F86D0]"
                    : "bg-(--d5-soft) text-(--d5-muted)"
              }`}
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            <span className="text-[10px] font-extrabold text-(--d5-muted)">
              {label}
              {index === 1 && " (optional)"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
