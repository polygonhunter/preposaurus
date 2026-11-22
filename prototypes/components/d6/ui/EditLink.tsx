import { ArrowRight } from "lucide-react";

interface EditLinkProps {
  label: string;
  /** Übergibt die umgebende Kachel als Quelle für den Flip-Übergang. */
  onEdit: (tile: HTMLElement | null) => void;
}

/** Dezentes „Bearbeiten →“: Dashboard zeigt an, geändert wird in den Einstellungen. */
export function EditLink({ label, onEdit }: EditLinkProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => onEdit(event.currentTarget.closest<HTMLElement>("[data-tile]"))}
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-(--d6-muted) transition hover:text-(--d6-accent-text) active:scale-95"
    >
      Bearbeiten <ArrowRight aria-hidden className="size-3.5" />
    </button>
  );
}
