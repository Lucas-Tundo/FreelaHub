import { z } from "zod";

export const WorkanaListItemSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().min(1),
  budgetText: z.string().nullable(),
  proposalsText: z.string().nullable(),
  postedText: z.string().nullable(),
});

export type WorkanaListItem = z.infer<typeof WorkanaListItemSchema>;

export const NinetyNineListItemSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  infoText: z.string(),
  previewText: z.string().nullable(),
  postedAtMs: z.string().nullable(),
});

export type NinetyNineListItem = z.infer<typeof NinetyNineListItemSchema>;

export const NinetyNineDetailSchema = z.object({
  description: z.string().min(1),
  proposalsCount: z.number().int().nonnegative(),
  budgetText: z.string().nullable(),
});

export type NinetyNineDetail = z.infer<typeof NinetyNineDetailSchema>;

export function parseWorkanaProposals(text: string | null): number {
  if (!text) return 0;
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function parseNinetyNineProposals(infoText: string): number {
  const match = infoText.match(/Propostas:\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

export function buildNinetyNineDescription(
  previewText: string | null,
  detailDescription: string,
): string {
  if (detailDescription.trim().length >= 80) {
    return detailDescription.trim();
  }
  if (previewText && previewText.trim().length > 0) {
    return previewText.trim();
  }
  return detailDescription.trim();
}

export const TramposListItemSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  location: z.string().min(1),
  employmentType: z.string().nullable(),
});

export type TramposListItem = z.infer<typeof TramposListItemSchema>;

export const TramposDetailSchema = z.object({
  title: z.string().min(1),
  companyName: z.string().nullable(),
  location: z.string().min(1),
  description: z.string().min(1),
  employmentType: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  postedText: z.string().nullable(),
});

export type TramposDetail = z.infer<typeof TramposDetailSchema>;

function normalizeRemoteText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function isFullyRemoteLocation(location: string): boolean {
  const normalized = normalizeRemoteText(location);
  if (!normalized.trim()) return false;
  if (normalized.includes("hibrido")) return false;
  if (normalized.includes("presencial")) return false;
  if (normalized.includes("home office")) return true;
  if (normalized.includes("100% remoto") || normalized.includes("100 remoto")) {
    return true;
  }
  if (normalized === "remoto") return true;
  if (normalized.endsWith(" remoto") && !normalized.includes(" - ")) {
    return true;
  }
  return false;
}

export function parseTramposLocationFromCard(text: string): string | null {
  const match = text.match(/(?:EMPREGO|ESTÁGIO|FREELA)(.+?)(?:DESTAQUE|$)/i);
  return match?.[1]?.trim() ?? null;
}

export function parseTramposSalaryRange(text: string): {
  salaryMin: number | null;
  salaryMax: number | null;
} {
  const rangeMatch = text.match(
    /R\$\s*([\d.]+)\s*a\s*R\$\s*([\d.]+)/i,
  );
  if (rangeMatch) {
    return {
      salaryMin: Number(rangeMatch[1].replace(/\./g, "")),
      salaryMax: Number(rangeMatch[2].replace(/\./g, "")),
    };
  }

  const singleMatch = text.match(/R\$\s*([\d.]+)/i);
  if (singleMatch) {
    const value = Number(singleMatch[1].replace(/\./g, ""));
    return { salaryMin: value, salaryMax: value };
  }

  return { salaryMin: null, salaryMax: null };
}

export function parseTramposPostedAt(postedText: string | null): string {
  const now = new Date();
  if (!postedText) return now.toISOString();

  const normalized = normalizeRemoteText(postedText);
  const dayMatch = normalized.match(/ha\s+(\d+)\s+dia/);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  const hourMatch = normalized.match(/ha\s+(\d+)\s+h/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  }

  return now.toISOString();
}

export function buildTramposDescription(
  description: string,
  requirements: string | null,
): string {
  const parts = [description.trim()];
  if (requirements?.trim()) {
    parts.push(`Requisitos:\n${requirements.trim()}`);
  }
  return parts.join("\n\n");
}

