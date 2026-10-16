import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** One day in milliseconds. */
export const DAY_MS = 86_400_000;

/** "1 review", "3 reviews". */
export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Merge Tailwind classes, with later classes winning conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
