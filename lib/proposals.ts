import { getDb, runMigrations } from "@/lib/db";
import { generateProposal } from "@/lib/proposal";
import { OpportunityRowSchema, type OpportunityRow } from "@/lib/types";

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

function getOpportunityRow(id: number): OpportunityRow | null {
  runMigrations();
  const db = getDb();
  const row = db
    .prepare(`${OPPORTUNITY_SELECT} WHERE o.id = @id`)
    .get({ id });

  if (!row) return null;
  return OpportunityRowSchema.parse(row);
}

export interface SavedProposal {
  opportunityId: number;
  body: string;
  isWeak: boolean;
  weakReason: string | null;
  regeneratedCount: number;
}

export function opportunityHasProposal(opportunityId: number): boolean {
  runMigrations();
  const db = getDb();
  const row = db
    .prepare("SELECT id FROM proposals WHERE opportunity_id = @opportunityId")
    .get({ opportunityId }) as { id: number } | undefined;

  return Boolean(row);
}

export function saveProposal(
  opportunityId: number,
  body: string,
  isWeak: boolean,
  weakReason: string | null,
  templateUsed: string,
  isRegenerate: boolean,
): SavedProposal {
  runMigrations();
  const db = getDb();

  const existing = db
    .prepare(
      `SELECT regenerated_count FROM proposals WHERE opportunity_id = @opportunityId`,
    )
    .get({ opportunityId }) as { regenerated_count: number } | undefined;

  const regeneratedCount = isRegenerate
    ? (existing?.regenerated_count ?? 0) + 1
    : 0;

  db.prepare(
    `INSERT INTO proposals (
      opportunity_id, template_used, body, is_weak, weak_reason, regenerated_count
    ) VALUES (
      @opportunityId, @templateUsed, @body, @isWeak, @weakReason, @regeneratedCount
    )
    ON CONFLICT(opportunity_id) DO UPDATE SET
      template_used = excluded.template_used,
      body = excluded.body,
      is_weak = excluded.is_weak,
      weak_reason = excluded.weak_reason,
      regenerated_count = excluded.regenerated_count,
      generated_at = datetime('now')`,
  ).run({
    opportunityId,
    templateUsed,
    body,
    isWeak: isWeak ? 1 : 0,
    weakReason,
    regeneratedCount,
  });

  return {
    opportunityId,
    body,
    isWeak,
    weakReason,
    regeneratedCount,
  };
}

export async function generateAndSaveProposal(
  opportunityId: number,
  adjustment?: string,
): Promise<OpportunityRow> {
  const opportunity = getOpportunityRow(opportunityId);
  if (!opportunity) {
    throw new Error(`Oportunidade ${opportunityId} não encontrada`);
  }

  const isRegenerate = opportunityHasProposal(opportunityId);

  const generated = await generateProposal({
    kind: opportunity.kind,
    title: opportunity.title,
    description: opportunity.description,
    companyName: opportunity.company_name,
    adjustment,
  });

  saveProposal(
    opportunityId,
    generated.body,
    generated.isWeak,
    generated.weakReason,
    generated.templateUsed,
    isRegenerate,
  );

  const updated = getOpportunityRow(opportunityId);
  if (!updated) {
    throw new Error(`Falha ao recarregar oportunidade ${opportunityId}`);
  }

  return updated;
}
