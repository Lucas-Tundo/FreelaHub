import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | null,
  currency = "BRL",
): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `há ${diffMinutes} min`;
  }
  if (diffHours < 24) {
    return `há ${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays}d`;
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 75) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (score >= 50) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

export const PLATFORM_LABELS: Record<string, string> = {
  freelancer: "Freelancer.com",
  workana: "Workana",
  "99freelas": "99Freelas",
  trampos: "Trampos.co",
};

export const KIND_LABELS: Record<string, string> = {
  freelance: "Freelance",
  vaga: "Vaga",
};

export function formatSalaryRange(
  salaryMin: number | null,
  salaryMax: number | null,
  currency = "BRL",
): string {
  if (salaryMin === null && salaryMax === null) return "—";
  if (salaryMin !== null && salaryMax !== null && salaryMin !== salaryMax) {
    return `${formatCurrency(salaryMin, currency)} – ${formatCurrency(salaryMax, currency)}`;
  }
  return formatCurrency(salaryMax ?? salaryMin, currency);
}

export const STATUS_LABELS: Record<string, string> = {
  nova: "Nova",
  descartada: "Descartada",
  enviada: "Enviada",
  respondeu: "Respondeu",
  fechou: "Fechou",
  perdeu: "Perdeu",
};
