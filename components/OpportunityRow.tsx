"use client";

import { Badge } from "@/components/ui/badge";
import type { OpportunityRow } from "@/lib/types";
import {
  formatCurrency,
  formatRelativeTime,
  formatSalaryRange,
  getScoreBadgeClass,
  KIND_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
} from "@/lib/utils";

interface OpportunityRowProps {
  opportunity: OpportunityRow;
  isSelected: boolean;
  onSelect: () => void;
}

export function OpportunityRowItem({
  opportunity,
  isSelected,
  onSelect,
}: OpportunityRowProps) {
  const isJob = opportunity.kind === "vaga";
  const compensationLabel = isJob
    ? formatSalaryRange(opportunity.salary_min, opportunity.salary_max)
    : formatCurrency(opportunity.budget, opportunity.budget_currency);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border bg-card/30 hover:bg-accent/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{opportunity.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {KIND_LABELS[opportunity.kind] ?? opportunity.kind}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {PLATFORM_LABELS[opportunity.platform] ?? opportunity.platform}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(opportunity.posted_at)}
            </span>
            {!isJob && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {opportunity.proposals_count} propostas
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums ${getScoreBadgeClass(opportunity.score)}`}
          >
            {Math.round(opportunity.score)}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {STATUS_LABELS[opportunity.status] ?? opportunity.status}
          </Badge>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-emerald-400">
          {compensationLabel}
        </span>
      </div>
    </button>
  );
}
