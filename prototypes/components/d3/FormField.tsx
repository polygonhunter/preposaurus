import type { ReactNode } from "react";
import { LABEL } from "./styles";

export const INPUT =
  "w-full rounded-2xl border border-white/80 bg-white/70 px-3.5 py-2.5 text-[15px] outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-200/50";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={`${LABEL} block px-1`}>
        {label}
      </label>
      {children}
    </div>
  );
}
