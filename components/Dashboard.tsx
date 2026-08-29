"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Search } from "lucide-react";

import { ActivityAlert } from "@/components/ActivityAlert";
import { FilterBar } from "@/components/FilterBar";
import { KeyboardHelp } from "@/components/KeyboardHelp";
import { MetricsBar } from "@/components/MetricsBar";
import { OpportunityCard } from "@/components/OpportunityCard";
import { OpportunityRowItem } from "@/components/OpportunityRow";
import { TemplateMetrics } from "@/components/TemplateMetrics";
import { Button } from "@/components/ui/button";
import {
  applyClientFilters,
  DEFAULT_FILTERS,
  getNextOpportunityId,
  type FilterState,
} from "@/lib/filters";
import {
  isEditableTarget,
  resolveStatusShortcut,
} from "@/lib/shortcuts";
import type {
  Metrics,
  OpportunityRow,
  UpdateTrackingInput,
} from "@/lib/types";

function getServerFilterParams(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.kind !== "all") {
    params.set("kind", filters.kind);
  }
  if (filters.platform !== "all") {
    params.set("platform", filters.platform);
  }
  if (filters.minScore !== "0") {
    params.set("minScore", filters.minScore);
  }
  if (filters.status !== "all") {
    params.set("status", filters.status);
  }
  return params.toString();
}

export function Dashboard() {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchRunning, setSearchRunning] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const filteredOpportunities = useMemo(
    () => applyClientFilters(opportunities, filters),
    [opportunities, filters],
  );

  const selected =
    filteredOpportunities.find((o) => o.id === selectedId) ?? null;

  const fetchData = useCallback(async (currentFilters: FilterState) => {
    const query = getServerFilterParams(currentFilters);

    const [oppRes, metricsRes] = await Promise.all([
      fetch(`/api/opportunities?${query}`),
      fetch("/api/metrics"),
    ]);

    if (!oppRes.ok || !metricsRes.ok) {
      throw new Error("Falha ao carregar dados");
    }

    const [opps, mets] = await Promise.all([
      oppRes.json() as Promise<OpportunityRow[]>,
      metricsRes.json() as Promise<Metrics>,
    ]);

    setOpportunities(opps);
    setMetrics(mets);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData({
      ...DEFAULT_FILTERS,
      platform: filters.platform,
      minScore: filters.minScore,
      status: filters.status,
    })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [filters.platform, filters.minScore, filters.status, fetchData]);

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && filteredOpportunities.some((opp) => opp.id === prev)) {
        return prev;
      }
      return filteredOpportunities[0]?.id ?? null;
    });
  }, [filteredOpportunities]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    void fetch("/api/worker/status")
      .then((res) => res.json())
      .then((data: { running: boolean }) => {
        if (data.running) setSearchRunning(true);
      })
      .catch(() => {
        // status opcional no carregamento
      });
  }, []);

  useEffect(() => {
    if (!searchRunning) return;

    const interval = setInterval(() => {
      void fetch("/api/worker/status")
        .then((res) => res.json())
        .then(async (data: { running: boolean; lastError: string | null }) => {
          if (data.running) return;

          setSearchRunning(false);
          setActivityRefreshKey((value) => value + 1);

          try {
            await fetchData(filters);
          } catch {
            setToast("Busca concluída, mas falhou ao atualizar a lista");
            return;
          }

          if (data.lastError) {
            setToast(`Busca concluída com erro: ${data.lastError}`);
          } else {
            setToast("Busca concluída!");
          }
        })
        .catch(() => {
          // continua polling
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [searchRunning, fetchData, filters]);

  const handleStartSearch = useCallback(async (): Promise<void> => {
    const res = await fetch("/api/worker/run", { method: "POST" });

    if (res.status === 409) {
      setToast("Já existe uma busca em andamento");
      setSearchRunning(true);
      return;
    }

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setToast(payload?.error ?? "Falha ao iniciar busca");
      return;
    }

    setSearchRunning(true);
    setToast("Busca iniciada — pode levar alguns minutos");
  }, []);

  const refreshMetrics = useCallback(async (): Promise<void> => {
    const metricsRes = await fetch("/api/metrics");
    if (metricsRes.ok) {
      setMetrics((await metricsRes.json()) as Metrics);
    }
  }, []);

  const handleUpdateTracking = useCallback(
    async (id: number, input: UpdateTrackingInput): Promise<void> => {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Falha ao atualizar tracking");
      }

      const updated = (await res.json()) as OpportunityRow;
      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? updated : o)),
      );

      await refreshMetrics();
    },
    [refreshMetrics],
  );

  const handleRegenerate = useCallback(
    async (id: number, adjustment?: string): Promise<void> => {
      const res = await fetch("/api/proposals/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: id, adjustment }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Falha ao regerar proposta");
      }

      const updated = (await res.json()) as OpportunityRow;
      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? updated : o)),
      );
    },
    [],
  );

  const copyProposal = useCallback(async (opp: OpportunityRow): Promise<void> => {
    if (!opp.proposal_body) {
      setToast("Esta oportunidade não tem proposta para copiar");
      return;
    }
    await navigator.clipboard.writeText(opp.proposal_body);
    setToast("Proposta copiada!");
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === "?") {
        event.preventDefault();
        setShowHelp((value) => !value);
        return;
      }

      if (key === "j") {
        event.preventDefault();
        setSelectedId((current) =>
          getNextOpportunityId(filteredOpportunities, current, "down"),
        );
        return;
      }

      if (key === "k") {
        event.preventDefault();
        setSelectedId((current) =>
          getNextOpportunityId(filteredOpportunities, current, "up"),
        );
        return;
      }

      if (!selected) return;

      if (key === "c") {
        event.preventDefault();
        void copyProposal(selected);
        return;
      }

      if (key === "o") {
        event.preventDefault();
        window.open(selected.url, "_blank", "noopener,noreferrer");
        return;
      }

      if (key === "x") {
        event.preventDefault();
        void handleUpdateTracking(selected.id, { status: "descartada" }).catch(
          (err: unknown) => {
            const message =
              err instanceof Error ? err.message : "Falha ao descartar";
            setToast(message);
          },
        );
        return;
      }

      const status = resolveStatusShortcut(key);
      if (status) {
        event.preventDefault();

        if (status === "fechou" && selected.closed_value === null) {
          setToast("Informe o valor fechado no card antes de usar o atalho 3");
          return;
        }

        const input: UpdateTrackingInput = { status };
        if (status === "fechou" && selected.closed_value !== null) {
          input.closed_value = selected.closed_value;
        }

        void handleUpdateTracking(selected.id, input).catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Falha ao atualizar status";
          setToast(message);
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    copyProposal,
    filteredOpportunities,
    handleUpdateTracking,
    selected,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando oportunidades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Rode <code className="rounded bg-muted px-1">npm run db:init</code>{" "}
            para criar o banco de dados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">FreelaBoard</h1>
                <p className="text-sm text-muted-foreground">
                  Painel de oportunidades freelancer
                </p>
              </div>
            </div>
            <Button
              onClick={() => void handleStartSearch()}
              disabled={searchRunning}
            >
              {searchRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {searchRunning ? "Buscando..." : "Buscar oportunidades"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ActivityAlert refreshKey={activityRefreshKey} />
        {metrics && (
          <section className="mb-6 space-y-4">
            <MetricsBar metrics={metrics} />
            <TemplateMetrics metrics={metrics} />
          </section>
        )}

        <section className="mb-4 space-y-3">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            resultCount={filteredOpportunities.length}
          />
          <KeyboardHelp
            visible={showHelp}
            onToggle={() => setShowHelp((value) => !value)}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <div className="max-h-[calc(100vh-320px)] space-y-1.5 overflow-y-auto pr-1">
              {filteredOpportunities.map((opp) => (
                <OpportunityRowItem
                  key={opp.id}
                  opportunity={opp}
                  isSelected={opp.id === selectedId}
                  onSelect={() => setSelectedId(opp.id)}
                />
              ))}
              {filteredOpportunities.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma oportunidade encontrada com esses filtros.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selected ? (
              <OpportunityCard
                opportunity={selected}
                onUpdateTracking={(input) =>
                  handleUpdateTracking(selected.id, input)
                }
                onRegenerate={(adjustment) =>
                  handleRegenerate(selected.id, adjustment)
                }
                onCopy={() => setToast("Proposta copiada!")}
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">
                  Selecione uma oportunidade na lista
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
