"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  OpportunityRow,
  TrackingStatus,
  UpdateTrackingInput,
} from "@/lib/types";
import {
  formatCurrency,
  formatRelativeTime,
  formatSalaryRange,
  getScoreBadgeClass,
  KIND_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
} from "@/lib/utils";

interface OpportunityCardProps {
  opportunity: OpportunityRow;
  onUpdateTracking: (input: UpdateTrackingInput) => Promise<void>;
  onRegenerate: (adjustment?: string) => Promise<void>;
  onCopy?: () => void;
}

export function OpportunityCard({
  opportunity,
  onUpdateTracking,
  onRegenerate,
  onCopy,
}: OpportunityCardProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [adjustment, setAdjustment] = useState("");
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [notes, setNotes] = useState(opportunity.notes ?? "");
  const [closedValue, setClosedValue] = useState(
    opportunity.closed_value?.toString() ?? "",
  );
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [savingTracking, setSavingTracking] = useState(false);

  const scoreBreakdown = parseScoreBreakdown(opportunity.score_breakdown);

  useEffect(() => {
    setNotes(opportunity.notes ?? "");
    setClosedValue(opportunity.closed_value?.toString() ?? "");
  }, [opportunity.id, opportunity.notes, opportunity.closed_value]);

  async function handleCopy(): Promise<void> {
    if (!opportunity.proposal_body) return;
    await navigator.clipboard.writeText(opportunity.proposal_body);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate(): Promise<void> {
    setRegenerating(true);
    setRegenerateError(null);
    try {
      await onRegenerate(adjustment.trim() || undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao regerar proposta";
      setRegenerateError(message);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleStatusChange(status: TrackingStatus): Promise<void> {
    setTrackingError(null);
    setSavingTracking(true);

    try {
      const input: UpdateTrackingInput = { status, notes };

      if (status === "fechou") {
        const value = Number(closedValue);
        if (!closedValue || Number.isNaN(value) || value <= 0) {
          setTrackingError("Informe o valor fechado antes de marcar como fechou");
          return;
        }
        input.closed_value = value;
      }

      await onUpdateTracking(input);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao atualizar tracking";
      setTrackingError(message);
    } finally {
      setSavingTracking(false);
    }
  }

  async function handleSaveNotes(): Promise<void> {
    setTrackingError(null);
    setSavingTracking(true);
    try {
      await onUpdateTracking({ notes });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao salvar notas";
      setTrackingError(message);
    } finally {
      setSavingTracking(false);
    }
  }

  const isJob = opportunity.kind === "vaga";
  const compensationLabel = isJob
    ? formatSalaryRange(opportunity.salary_min, opportunity.salary_max)
    : formatCurrency(opportunity.budget, opportunity.budget_currency);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3 border-b border-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-snug">
              {opportunity.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {KIND_LABELS[opportunity.kind] ?? opportunity.kind}
              </Badge>
              <span>{PLATFORM_LABELS[opportunity.platform]}</span>
              <span>·</span>
              <span>{formatRelativeTime(opportunity.posted_at)}</span>
              {!isJob && (
                <>
                  <span>·</span>
                  <span>{opportunity.proposals_count} propostas</span>
                </>
              )}
              {isJob && opportunity.remote === 1 && (
                <Badge variant="success" className="text-[10px]">
                  Remoto
                </Badge>
              )}
              {!isJob && opportunity.client_verified === 1 && (
                <Badge variant="success" className="text-[10px]">
                  Verificado
                </Badge>
              )}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-bold tabular-nums ${getScoreBadgeClass(opportunity.score)}`}
          >
            {Math.round(opportunity.score)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-emerald-400">{compensationLabel}</span>
          {isJob && opportunity.company_name && (
            <span className="text-muted-foreground">{opportunity.company_name}</span>
          )}
          {isJob && opportunity.employment_type && (
            <span className="text-muted-foreground">
              {opportunity.employment_type}
            </span>
          )}
          {!isJob && opportunity.client_country && (
            <span className="text-muted-foreground">
              {opportunity.client_country}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div>
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isJob ? "Descrição da vaga" : "Descrição do projeto"}
          </h4>
          <p className="text-sm leading-relaxed text-foreground/90">
            {opportunity.description}
          </p>
        </div>

        {scoreBreakdown && (
          <div>
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Score breakdown
            </h4>
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              {JSON.stringify(scoreBreakdown, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isJob ? "Candidatura" : "Proposta"}
            </h4>
            <div className="flex items-center gap-2">
              {opportunity.proposal_template_used && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {opportunity.proposal_template_used}
                </Badge>
              )}
              {opportunity.proposal_is_weak === 1 && (
                <Badge variant="warning" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Proposta fraca
                </Badge>
              )}
            </div>
          </div>

          {opportunity.proposal_body ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {opportunity.proposal_body}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {isJob
                ? "Candidatura ainda não gerada (score abaixo do threshold ou aguardando worker)"
                : "Proposta ainda não gerada (score abaixo do threshold ou aguardando worker)"}
            </div>
          )}

          {opportunity.proposal_weak_reason && (
            <p className="mt-1 text-xs text-amber-400">
              {opportunity.proposal_weak_reason}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Ajuste ao regerar (opcional): &quot;mais curta&quot;, &quot;mais
            técnica&quot;, &quot;sem preço&quot;
          </label>
          <input
            type="text"
            value={adjustment}
            onChange={(event) => setAdjustment(event.target.value)}
            placeholder="Ex: mais curta"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
          {regenerateError && (
            <p className="text-xs text-red-400">{regenerateError}</p>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tracking
          </h4>

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            {opportunity.sent_at && (
              <span>Enviada: {formatRelativeTime(opportunity.sent_at)}</span>
            )}
            {opportunity.replied_at && (
              <span>Respondeu: {formatRelativeTime(opportunity.replied_at)}</span>
            )}
            {opportunity.closed_value !== null && (
              <span>
                Valor fechado: {formatCurrency(opportunity.closed_value)}
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Anotações sobre o cliente, call, objeções..."
            />
            <Button
              size="sm"
              variant="ghost"
              className="mt-1"
              disabled={savingTracking}
              onClick={() => void handleSaveNotes()}
            >
              Salvar notas
            </Button>
          </div>

          {(opportunity.status === "fechou" || closedValue) && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Valor fechado (R$)
              </label>
              <input
                type="number"
                min="0"
                value={closedValue}
                onChange={(event) => setClosedValue(event.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                placeholder="Ex: 8500"
              />
            </div>
          )}

          {trackingError && (
            <p className="text-xs text-red-400">{trackingError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button
            size="sm"
            onClick={() => void handleCopy()}
            disabled={!opportunity.proposal_body}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {isJob ? "Copiar candidatura" : "Copiar proposta"}
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(opportunity.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            {isJob ? "Abrir vaga" : "Abrir projeto"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={regenerating}
            onClick={() => void handleRegenerate()}
          >
            <RefreshCw
              className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
            />
            {regenerating ? "Gerando..." : "Regerar"}
          </Button>

          <div className="ml-auto w-40">
            <Select
              value={opportunity.status}
              disabled={savingTracking}
              onValueChange={(value) =>
                void handleStatusChange(value as TrackingStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function parseScoreBreakdown(
  raw: string,
): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
