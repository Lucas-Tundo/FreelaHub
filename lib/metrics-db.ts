import { getDb, runMigrations } from "@/lib/db";
import {
  aggregateTrackingCounts,
  buildTemplateMetrics,
  type TrackingCounts,
} from "@/lib/metrics";
import { MetricsSchema, TrackingStatusSchema, type Metrics } from "@/lib/types";

function getTrackingCounts(): TrackingCounts {
  runMigrations();
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT COALESCE(t.status, 'nova') AS status, COUNT(*) AS count
       FROM opportunities o
       LEFT JOIN tracking t ON t.opportunity_id = o.id
       GROUP BY COALESCE(t.status, 'nova')`,
    )
    .all() as Array<{ status: string; count: number }>;

  const counts: TrackingCounts = {
    novas: 0,
    enviadas: 0,
    respondeu: 0,
    fechou: 0,
    perdeu: 0,
    descartadas: 0,
  };

  for (const row of rows) {
    const status = TrackingStatusSchema.parse(row.status);
    switch (status) {
      case "nova":
        counts.novas = row.count;
        break;
      case "enviada":
        counts.enviadas = row.count;
        break;
      case "respondeu":
        counts.respondeu = row.count;
        break;
      case "fechou":
        counts.fechou = row.count;
        break;
      case "perdeu":
        counts.perdeu = row.count;
        break;
      case "descartada":
        counts.descartadas = row.count;
        break;
      default: {
        const _exhaustive: never = status;
        throw new Error(`Status desconhecido: ${String(_exhaustive)}`);
      }
    }
  }

  return counts;
}

export function getMetrics(): Metrics {
  runMigrations();
  const db = getDb();

  const novasHoje = db
    .prepare(
      `SELECT COUNT(*) AS count FROM opportunities
       WHERE date(created_at) = date('now')`,
    )
    .get() as { count: number };

  const trackingCounts = getTrackingCounts();
  const aggregated = aggregateTrackingCounts(trackingCounts);

  const valorFechado = db
    .prepare(
      `SELECT COALESCE(SUM(closed_value), 0) AS total
       FROM tracking WHERE status = 'fechou'`,
    )
    .get() as { total: number };

  const templateRows = db
    .prepare(
      `SELECT
        p.template_used AS template,
        COUNT(*) AS enviadas,
        SUM(CASE WHEN t.status IN ('respondeu', 'fechou') THEN 1 ELSE 0 END) AS respostas
       FROM proposals p
       INNER JOIN tracking t ON t.opportunity_id = p.opportunity_id
       WHERE t.status IN ('enviada', 'respondeu', 'fechou', 'perdeu')
       GROUP BY p.template_used`,
    )
    .all() as Array<{
      template: string;
      enviadas: number;
      respostas: number;
    }>;

  return MetricsSchema.parse({
    novas_hoje: novasHoje.count,
    enviadas: trackingCounts.enviadas,
    respondeu: trackingCounts.respondeu,
    fechou: trackingCounts.fechou,
    perdeu: trackingCounts.perdeu,
    descartadas: trackingCounts.descartadas,
    taxa_resposta: aggregated.taxa_resposta,
    valor_fechado: valorFechado.total,
    templates: buildTemplateMetrics(templateRows),
  });
}
