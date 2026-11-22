import { CAPTURE_STEPS, type CaptureStep } from "../data/scan-simulation";
import { MONO, cx } from "../theme/styles";

/** Schrittanzeige 01–04 als leuchtende Segmente (Design 2). */
export function CaptureSteps({ current }: { current: CaptureStep }) {
  const currentIndex = CAPTURE_STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {CAPTURE_STEPS.map((step, i) => (
        <li key={step.key} aria-current={i === currentIndex ? "step" : undefined}>
          <span
            className={cx(
              "block h-1 rounded-full transition-colors duration-500",
              i < currentIndex && "bg-(--d6-accent)/60",
              i === currentIndex && "bg-(--d6-accent) shadow-[0_0_10px_var(--d6-glow)]",
              i > currentIndex && "bg-(--d6-track)",
            )}
          />
          <span className={cx(MONO, "mt-1.5 block truncate text-[10px]", i === currentIndex ? "text-(--d6-accent-text)" : "text-(--d6-subtle)")}>
            {String(i + 1).padStart(2, "0")} {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
