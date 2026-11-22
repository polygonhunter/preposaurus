import type { Member } from "@/lib/types";
import { Panel } from "../ui/Panel";
import { MONO } from "../theme";

const KIND_LABEL: Record<Member["kind"], string> = {
  erwachsen: "Erwachsen",
  kind: "Kind",
  senior: "Senior",
  baby: "Baby",
};

/** Haushaltsmitglieder, für die gerechnet wird. */
export function MembersStrip({ members }: { members: Member[] }) {
  return (
    <Panel label="Haushalt" aside={<span className={`${MONO} text-[11px] text-zinc-500`}>{members.length} Personen</span>}>
      <ul className="flex flex-wrap gap-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-2 rounded-xl border border-white/[0.07] py-1.5 pr-3 pl-1.5">
            <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-lg">
              {member.emoji}
            </span>
            <span className="leading-tight">
              <span className="block text-sm text-zinc-100">{member.name}</span>
              <span className="block text-[11px] text-zinc-500">{KIND_LABEL[member.kind]}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
