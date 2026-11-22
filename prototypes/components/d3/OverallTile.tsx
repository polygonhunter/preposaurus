import { CountUp } from "./CountUp";
import { GlassTile } from "./GlassTile";
import { ProgressRing } from "./ProgressRing";
import { LABEL } from "./styles";

export function OverallTile({ percent }: { percent: number }) {
  return (
    <GlassTile className="flex min-h-44 flex-col items-center justify-between">
      <span className={`${LABEL} self-start`}>Erfüllt</span>
      <ProgressRing percent={percent} size={104}>
        <span className="text-3xl font-extralight tracking-tight">
          <CountUp value={percent} />
          <span className="text-base text-slate-500">%</span>
        </span>
      </ProgressRing>
    </GlassTile>
  );
}
