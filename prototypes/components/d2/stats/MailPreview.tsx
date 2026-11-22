import { Mail } from "lucide-react";
import type { ExpiringUnit } from "@/lib/supply";
import { Panel } from "../ui/Panel";
import { MONO } from "../theme";

interface MailPreviewProps {
  expiring: ExpiringUnit[];
  openRestock: number;
}

function uniqueNames(units: ExpiringUnit[]): string[] {
  return [...new Set(units.map((u) => u.product.name))];
}

function joinGerman(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} und ${names.at(-1)}`;
}

/** Vorschau der wöchentlichen Check-in-Mail, gebaut aus den echten Ampeldaten. */
export function MailPreview({ expiring, openRestock }: MailPreviewProps) {
  const expired = uniqueNames(expiring.filter((e) => e.ampel === "rot"));
  const dueSoon = uniqueNames(expiring.filter((e) => e.ampel === "orange"));
  const parts = [
    expired.length > 0 && `${joinGerman(expired)} ${expired.length === 1 ? "ist" : "sind"} abgelaufen`,
    dueSoon.length > 0 && `${joinGerman(dueSoon)} bald fällig`,
  ].filter(Boolean);

  return (
    <Panel label="Vorschau Check-in-Mail">
      <article className="rounded-xl border border-white/[0.07] bg-black/40">
        <header className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
          <Mail className="size-4 text-(--d2-accent)" />
          <div className="min-w-0">
            <p className="truncate text-sm text-zinc-100">Wie sieht’s aus?</p>
            <p className={`${MONO} text-[10px] text-zinc-500`}>Preposaurus · wöchentlicher Check-in</p>
          </div>
        </header>
        <div className="grid gap-2 px-3 py-3 text-sm leading-relaxed text-zinc-300">
          <p>
            Wie sieht’s aus? Zeit für einen Blick in den Vorrat
            {parts.length > 0 ? `: ${parts.join(", ")}.` : ". Alles im grünen Bereich."}
          </p>
          {openRestock > 0 && <p>Auf der Nachkaufen-Liste stehen {openRestock} Dinge.</p>}
          <p className="text-zinc-500">Zwei Minuten reichen. Danke, dass du dranbleibst.</p>
        </div>
      </article>
    </Panel>
  );
}
