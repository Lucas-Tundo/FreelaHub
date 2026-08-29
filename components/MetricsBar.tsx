"use client";

import { Inbox, Send, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { Metrics } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface MetricsBarProps {
  metrics: Metrics;
}

const METRIC_ITEMS = [
  {
    key: "novas_hoje" as const,
    label: "Novas hoje",
    icon: Inbox,
    format: (v: number) => String(v),
  },
  {
    key: "enviadas" as const,
    label: "Aguardando resposta",
    icon: Send,
    format: (v: number) => String(v),
  },
  {
    key: "taxa_resposta" as const,
    label: "Taxa de resposta",
    icon: TrendingUp,
    format: (v: number) => `${v}%`,
  },
  {
    key: "valor_fechado" as const,
    label: "Valor fechado",
    icon: Wallet,
    format: (v: number) => formatCurrency(v),
  },
];

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRIC_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className="bg-card/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold tabular-nums">
                    {item.format(metrics[item.key])}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          Respondeu: <strong className="text-foreground">{metrics.respondeu}</strong>
        </span>
        <span>
          Fechou: <strong className="text-foreground">{metrics.fechou}</strong>
        </span>
        <span>
          Perdeu: <strong className="text-foreground">{metrics.perdeu}</strong>
        </span>
        <span>
          Descartadas: <strong className="text-foreground">{metrics.descartadas}</strong>
        </span>
      </div>
    </div>
  );
}
