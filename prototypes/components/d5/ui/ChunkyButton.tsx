import type { ButtonHTMLAttributes } from "react";
import { toneVars, type Tone } from "../theme";

interface ChunkyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "px-3 py-1.5 text-sm rounded-xl",
  md: "px-4 py-2.5 text-base rounded-2xl",
  lg: "px-6 py-3.5 text-lg rounded-2xl w-full",
};

/** Dicker 3D-Knopf mit Unterkante, die beim Drücken „einrastet“. */
export function ChunkyButton({ tone = "green", size = "md", className = "", style, ...rest }: ChunkyButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      style={{ ...toneVars(tone), ...style }}
      className={`inline-flex items-center justify-center gap-2 bg-(--tone) font-extrabold text-(--tone-ink) shadow-[0_5px_0_var(--tone-edge)] transition-[transform,box-shadow] duration-75 active:translate-y-[5px] active:shadow-[0_0_0_var(--tone-edge)] disabled:translate-y-[5px] disabled:opacity-40 disabled:shadow-none ${SIZES[size]} ${className}`}
    />
  );
}
