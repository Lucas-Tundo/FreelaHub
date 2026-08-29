import "server-only";

import { getDb, runMigrations } from "@/lib/db";
import {
  OpportunityRowSchema,
  TrackingStatusSchema,
  type OpportunityRow,
  type TrackingStatus,
  type UpdateTrackingInput,
} from "@/lib/types";

const OPPORTUNITY_SELECT = `
  SELECT
    o.*,
    COALESCE(t.status, 'nova') AS status,
    t.sent_at,
    t.replied_at,
    t.closed_value,
    t.notes,
    p.body AS proposal_body,
    p.is_weak AS proposal_is_weak,
    p.weak_reason AS proposal_weak_reason,
    p.regenerated_count AS proposal_regenerated_count,
    p.template_used AS proposal_template_used
  FROM opportunities o
  LEFT JOIN tracking t ON t.opportunity_id = o.id
  LEFT JOIN proposals p ON p.opportunity_id = o.id
`;

export interface OpportunityFilters {
  platform?: string;
  kind?: "freelance" | "vaga";
  minScore?: number;
  status?: TrackingStatus;
}

function ensureDb(): void {
  runMigrations();
}

export function listOpportunities(
  filters: OpportunityFilters = {},
): OpportunityRow[] {
  ensureDb();
  const db = getDb();

  const conditions: string[] = [];
  const params: Record<string, string | number> = {};

  if (filters.platform) {
    conditions.push("o.platform = @platform");
    params.platform = filters.platform;
  }

  if (filters.kind) {
    conditions.push("o.kind = @kind");
    params.kind = filters.kind;
  }

  if (filters.minScore !== undefined) {
    conditions.push("o.score >= @minScore");
    params.minScore = filters.minScore;
  }

  if (filters.status) {
    conditions.push("COALESCE(t.status, 'nova') = @status");
    params.status = filters.status;
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `${OPPORTUNITY_SELECT} ${where} ORDER BY o.score DESC, o.posted_at DESC`,
    )
    .all(params);

  return rows.map((row) => OpportunityRowSchema.parse(row));
}

export function getOpportunityById(id: number): OpportunityRow | null {
  ensureDb();
  const db = getDb();
  const row = db
    .prepare(`${OPPORTUNITY_SELECT} WHERE o.id = @id`)
    .get({ id });

  if (!row) return null;
  return OpportunityRowSchema.parse(row);
}

export function updateTracking(
  id: number,
  input: UpdateTrackingInput,
): OpportunityRow {
  ensureDb();
  const db = getDb();

  const existing = getOpportunityById(id);
  if (!existing) {
    throw new Error(`Oportunidade ${id} não encontrada`);
  }

  const status = input.status ?? existing.status;
  TrackingStatusSchema.parse(status);

  const now = new Date().toISOString();

  let sentAt = existing.sent_at;
  let repliedAt = existing.replied_at;

  if (status === "enviada" && !sentAt) {
    sentAt = now;
  }
  if (
    (status === "respondeu" || status === "fechou") &&
    !repliedAt
  ) {
    repliedAt = now;
  }

  const closedValue =
    input.closed_value !== undefined
      ? input.closed_value
      : existing.closed_value;

  if (status === "fechou" && (closedValue === null || closedValue === undefined)) {
    throw new Error("Informe o valor fechado ao marcar como fechou");
  }

  const notes =
    input.notes !== undefined ? input.notes : (existing.notes ?? "");

  db.prepare(
    `INSERT INTO tracking (opportunity_id, status, sent_at, replied_at, closed_value, notes, updated_at)
     VALUES (@id, @status, @sentAt, @repliedAt, @closedValue, @notes, @updatedAt)
     ON CONFLICT(opportunity_id) DO UPDATE SET
       status = excluded.status,
       sent_at = COALESCE(tracking.sent_at, excluded.sent_at),
       replied_at = COALESCE(tracking.replied_at, excluded.replied_at),
       closed_value = excluded.closed_value,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
  ).run({
    id,
    status,
    sentAt,
    repliedAt,
    closedValue,
    notes,
    updatedAt: now,
  });

  const updated = getOpportunityById(id);
  if (!updated) {
    throw new Error(`Falha ao atualizar oportunidade ${id}`);
  }
  return updated;
}
