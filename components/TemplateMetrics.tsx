"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metrics } from "@/lib/types";

interface TemplateMetricsProps {
  metrics: Metrics;
}

export function TemplateMetrics({ metrics }: TemplateMetricsProps) {
  if (metrics.templates.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Taxa de resposta por template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Template</th>
                <th className="pb-2 pr-4 font-medium">Enviadas</th>
                <th className="pb-2 pr-4 font-medium">Respostas</th>
                <th className="pb-2 font-medium">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {metrics.templates.map((row) => (
                <tr key={row.template} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-xs">{row.template}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.enviadas}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.respostas}</td>
                  <td className="py-2 tabular-nums font-semibold text-emerald-400">
                    {row.taxa_resposta}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
