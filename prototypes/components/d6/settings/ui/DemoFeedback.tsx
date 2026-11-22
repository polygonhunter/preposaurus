"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";

/** Rückmeldung für Demo-Aktionen (Export, Passkey …), die im Prototyp nichts wirklich auslösen. */
export function useDemoFeedback() {
  const [message, setMessage] = useState<string | null>(null);
  return { message, show: setMessage };
}

export function FeedbackLine({ message }: { message: string | null }) {
  return (
    <p aria-live="polite" className="min-h-0 px-4 text-xs text-(--d6-accent-text) empty:hidden">
      {message && (
        <span className="inline-flex items-center gap-1.5">
          <CircleCheck aria-hidden className="size-3.5" /> {message}
        </span>
      )}
    </p>
  );
}
