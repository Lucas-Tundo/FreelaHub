import type { OpportunityRow } from "@/lib/types";

export interface FilterState {
  kind: "all" | "freelance" | "vaga";
  platform: string;
  minScore: string;
  status: string;
  search: string;
  hasProposal: "all" | "yes" | "no";
  weakOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  kind: "all",
  platform: "all",
  minScore: "0",
  status: "all",
  search: "",
  hasProposal: "all",
  weakOnly: false,
};

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.kind !== "all") count += 1;
  if (filters.platform !== "all") count += 1;
  if (filters.minScore !== "0") count += 1;
  if (filters.status !== "all") count += 1;
  if (filters.search.trim()) count += 1;
  if (filters.hasProposal !== "all") count += 1;
  if (filters.weakOnly) count += 1;
  return count;
}

export function applyClientFilters(
  opportunities: OpportunityRow[],
  filters: FilterState,
): OpportunityRow[] {
  const search = filters.search.trim().toLowerCase();

  return opportunities.filter((opp) => {
    if (filters.kind !== "all" && opp.kind !== filters.kind) return false;

    if (search) {
      const haystack = `${opp.title} ${opp.description}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (filters.hasProposal === "yes" && !opp.proposal_body) return false;
    if (filters.hasProposal === "no" && opp.proposal_body) return false;
    if (filters.weakOnly && opp.proposal_is_weak !== 1) return false;

    return true;
  });
}

export function getNextOpportunityId(
  opportunities: OpportunityRow[],
  currentId: number | null,
  direction: "up" | "down",
): number | null {
  if (opportunities.length === 0) return null;
  if (currentId === null) return opportunities[0].id;

  const currentIndex = opportunities.findIndex((opp) => opp.id === currentId);
  if (currentIndex === -1) return opportunities[0].id;

  const nextIndex =
    direction === "down"
      ? Math.min(currentIndex + 1, opportunities.length - 1)
      : Math.max(currentIndex - 1, 0);

  return opportunities[nextIndex].id;
}
