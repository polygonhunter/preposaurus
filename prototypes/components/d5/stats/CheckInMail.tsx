import { Mail } from "lucide-react";
import { formatDate } from "@/lib/supply";
import type { LiveSupply } from "../useLiveSupply";
import { CARD } from "../theme";

interface CheckInMailProps {
  name: string;
  suppliedDays: number;
  expiring: LiveSupply["expiring"];
}

const PREVIEW_LIMIT = 3;

/** Vorschau der wöchentlichen Check-in-Mail im Brief-Look. */
export function CheckInMail({ name, suppliedDays, expiring }: CheckInMailProps) {
  const shown = expiring.slice(0, PREVIEW_LIMIT);

  return (
    <section data-pop className={`${CARD} overflow-hidden`}>
      <div className="flex items-center gap-2 bg-[#3BA9F5] px-4 py-2 text-white">
        <Mail className="size-4" strokeWidth={3} />
        <span className="text-sm font-black">Vorschau Check-in-Mail</span>
      </div>
      <div className="space-y-2 p-4 text-sm font-semibold leading-relaxed">
        <p className="text-xs font-bold text-(--d5-muted)">Betreff: 🐿️ Dein Vorrat-Check dieser Woche</p>
        <p>
          <strong className="font-black">Wie sieht’s aus, {name}?</strong> Ihr seid aktuell für{" "}
          <strong className="font-black">{suppliedDays.toLocaleString("de-DE")} Tage</strong> versorgt. Schön!
        </p>
        {shown.length > 0 && (
          <>
            <p>Diese Sachen möchten bald gegessen werden:</p>
            <ul className="space-y-1 rounded-2xl bg-(--d5-soft) p-3">
              {shown.map(({ product, unit }) => (
                <li key={unit.id}>
                  • {product.name} <span className="text-(--d5-muted)">({formatDate(unit.mhd)})</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p>Ein Klick genügt: „Alles noch da“ oder kurz anpassen. Danke, dass du dranbleibst! 💛</p>
        <div className="flex gap-2 pt-1" aria-hidden>
          <span className="rounded-xl bg-[#4CC66A] px-3 py-1.5 text-xs font-black text-white shadow-[0_3px_0_#2F9E4C]">Alles noch da ✓</span>
          <span className="rounded-xl bg-(--d5-soft) px-3 py-1.5 text-xs font-black">Anpassen</span>
        </div>
      </div>
    </section>
  );
}
