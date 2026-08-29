export interface TemplateStatsRow {
  template: string;
  enviadas: number;
  respostas: number;
}

export interface TemplateMetric {
  template: string;
  enviadas: number;
  respostas: number;
  taxa_resposta: number;
}

export interface TrackingCounts {
  novas: number;
  enviadas: number;
  respondeu: number;
  fechou: number;
  perdeu: number;
  descartadas: number;
}

export function calculateResponseRate(
  responses: number,
  sent: number,
): number {
  if (sent <= 0) return 0;
  return Math.round((responses / sent) * 100);
}

export function buildTemplateMetrics(
  rows: TemplateStatsRow[],
): TemplateMetric[] {
  return rows
    .map((row) => ({
      template: row.template,
      enviadas: row.enviadas,
      respostas: row.respostas,
      taxa_resposta: calculateResponseRate(row.respostas, row.enviadas),
    }))
    .sort((a, b) => b.taxa_resposta - a.taxa_resposta);
}

export function aggregateTrackingCounts(counts: TrackingCounts): {
  total_enviadas: number;
  total_respostas: number;
  taxa_resposta: number;
} {
  const totalEnviadas =
    counts.enviadas + counts.respondeu + counts.fechou + counts.perdeu;
  const totalRespostas = counts.respondeu + counts.fechou;

  return {
    total_enviadas: totalEnviadas,
    total_respostas: totalRespostas,
    taxa_resposta: calculateResponseRate(totalRespostas, totalEnviadas),
  };
}
