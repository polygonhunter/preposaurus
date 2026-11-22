import type { Member } from "@/lib/types";
import { GLASS } from "./styles";

interface AppHeaderProps {
  title: string;
  today: string;
  members: Member[];
}

export function AppHeader({ title, today, members }: AppHeaderProps) {
  const dateLabel = new Date(today).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return (
    <header className="mb-5 flex items-end justify-between gap-3 px-1">
      <div>
        <p className="text-[13px] font-medium text-slate-500">{dateLabel}</p>
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-slate-900">{title}</h1>
      </div>
      <div className={`${GLASS} flex -space-x-2 rounded-full p-1`} aria-label={`${members.length} Haushaltsmitglieder`}>
        {members.map((m) => (
          <span key={m.id} aria-hidden className="grid size-8 place-items-center rounded-full bg-white text-base ring-2 ring-white/80">
            {m.emoji}
          </span>
        ))}
      </div>
    </header>
  );
}
