"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from "@/lib/filters";
import { PLATFORM_LABELS, STATUS_LABELS } from "@/lib/utils";

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

export function FilterBar({ filters, onChange, resultCount }: FilterBarProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
            placeholder="Buscar no título ou descrição..."
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
        </div>

        <div className="w-36">
          <Select
            value={filters.kind}
            onValueChange={(value) =>
              onChange({
                ...filters,
                kind: value as FilterState["kind"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="vaga">Vagas remotas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={filters.platform}
            onValueChange={(value) =>
              onChange({ ...filters, platform: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas plataformas</SelectItem>
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filters.minScore}
            onValueChange={(value) =>
              onChange({ ...filters, minScore: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Score mín." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Score: todos</SelectItem>
              <SelectItem value="50">Score ≥ 50</SelectItem>
              <SelectItem value="60">Score ≥ 60</SelectItem>
              <SelectItem value="75">Score ≥ 75</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onChange({ ...filters, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filters.hasProposal}
            onValueChange={(value) =>
              onChange({
                ...filters,
                hasProposal: value as FilterState["hasProposal"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Proposta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Proposta: todas</SelectItem>
              <SelectItem value="yes">Com proposta</SelectItem>
              <SelectItem value="no">Sem proposta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm">
          <input
            type="checkbox"
            checked={filters.weakOnly}
            onChange={(event) =>
              onChange({ ...filters, weakOnly: event.target.checked })
            }
            className="accent-primary"
          />
          Só fracas
        </label>

        {activeCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange(DEFAULT_FILTERS)}
          >
            <X className="h-4 w-4" />
            Limpar ({activeCount})
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {resultCount} resultado{resultCount !== 1 ? "s" : ""} com os filtros
        atuais
      </p>
    </div>
  );
}
