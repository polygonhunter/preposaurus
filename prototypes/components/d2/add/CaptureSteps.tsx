import { CAPTURE_STEPS, type CaptureStep } from "./scan-simulation";
import { MONO, cx } from "../theme";

/** Schrittanzeige 01–04 als leuchtende Segmente. */
export function CaptureSteps({ current }: { current: CaptureStep }) {
  const currentIndex = CAPTURE_STEPS.findIndex((s) => s.key === current);
  return (
    <ol data-reveal className="grid grid-cols-4 gap-1.5">
      {CAPTURE_STEPS.map((step, i) => (
        <li key={step.key} aria-current={i === currentIndex ? "step" : undefined}>
          <span
            className={cx(
              "block h-1 rounded-full transition-colors duration-500",
              i < currentIndex && "bg-(--d2-accent)/60",
              i === currentIndex && "bg-(--d2-accent) shadow-[0_0_10px_var(--d2-accent)]",
              i > currentIndex && "bg-white/10",
            )}
          />
          <span className={cx(MONO, "mt-1.5 block text-[10px]", i === currentIndex ? "text-(--d2-accent)" : "text-zinc-500")}>
            {String(i + 1).padStart(2, "0")} {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
