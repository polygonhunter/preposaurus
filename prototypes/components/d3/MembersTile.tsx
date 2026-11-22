import type { Member } from "@/lib/types";
import { GlassTile } from "./GlassTile";
import { LABEL } from "./styles";

const KIND_LABELS: Record<Member["kind"], string> = {
  erwachsen: "Erwachsen",
  kind: "Kind",
  senior: "Senior:in",
  baby: "Baby",
};

export function MembersTile({ members }: { members: Member[] }) {
  return (
    <GlassTile className="col-span-2">
      <span className={LABEL}>Haushalt · {members.length} Personen</span>
      <ul className="mt-3 flex gap-2">
        {members.map((member) => (
          <li key={member.id} className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white/60 py-3">
            <span aria-hidden className="text-3xl">{member.emoji}</span>
            <span className="text-sm font-medium">{member.name}</span>
            <span className="text-[11px] text-slate-500">{KIND_LABELS[member.kind]}</span>
          </li>
        ))}
      </ul>
    </GlassTile>
  );
}
