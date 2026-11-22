import type { Member } from "@/lib/types";
import { CARD } from "../theme";

const KIND_LABEL: Record<Member["kind"], string> = {
  erwachsen: "Erwachsen",
  kind: "Kind",
  senior: "Senior",
  baby: "Baby",
};

/** Haushaltsmitglieder als runde Avatar-Sticker. */
export function MembersRow({ members }: { members: Member[] }) {
  return (
    <section data-pop className={`${CARD} p-4`}>
      <h2 className="mb-3 text-sm font-extrabold text-(--d5-muted)">Euer Team · {members.length} Personen</h2>
      <ul className="flex gap-4">
        {members.map((m) => (
          <li key={m.id} className="flex flex-col items-center gap-1">
            <span className="grid size-14 place-items-center rounded-full border-4 border-white bg-(--d5-soft) text-3xl shadow-[0_3px_0_var(--d5-line)]">
              {m.emoji}
            </span>
            <span className="text-sm font-black">{m.name}</span>
            <span className="text-[10px] font-bold text-(--d5-muted)">{KIND_LABEL[m.kind]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
