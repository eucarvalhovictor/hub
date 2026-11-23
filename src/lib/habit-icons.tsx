import * as React from "react";
import {
  BookOpen,
  Coffee,
  Droplets,
  Dumbbell,
  HeartPulse,
  Moon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/** Ícones disponíveis para hábitos. O valor é persistido na coluna `habits.emoji`. */
export const HABIT_ICONS: ReadonlyArray<{
  value: string;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "droplets", label: "Água", icon: Droplets },
  { value: "dumbbell", label: "Exercício", icon: Dumbbell },
  { value: "book-open", label: "Leitura", icon: BookOpen },
  { value: "heart-pulse", label: "Saúde", icon: HeartPulse },
  { value: "coffee", label: "Pausa", icon: Coffee },
  { value: "moon", label: "Descanso", icon: Moon },
];

/** Valores usados em versões anteriores (escritos como escapes), convertidos aos ícones atuais. */
const LEGACY_ICONS: Record<string, string> = {
  "\u{1F4A7}": "droplets", // gota
  "\u{1F3CB}\uFE0F": "dumbbell", // halteres
  "\u{1F3CB}": "dumbbell",
  "\u{1F4DA}": "book-open", // livros
  "\u{1F4D6}": "book-open", // livro aberto
  "\u2764\uFE0F": "heart-pulse", // coração
  "\u2615": "coffee", // café
  "\u{1F319}": "moon", // lua
  "\u2728": "sparkles", // brilhos
  "\u2705": "check", // checkbox
};

function resolveIcon(value: string | null): LucideIcon {
  const key = LEGACY_ICONS[value ?? ""] ?? value ?? "";
  return HABIT_ICONS.find((item) => item.value === key)?.icon ?? Sparkles;
}

export function HabitIcon({
  value,
  className,
}: {
  value: string | null;
  className?: string;
}) {
  const Icon = resolveIcon(value);
  return <Icon className={className} aria-hidden="true" />;
}
