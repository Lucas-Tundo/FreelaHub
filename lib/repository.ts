import { getDb, runMigrations } from "@/lib/db";
import { computeContentHash } from "@/lib/dedupe";
import { scoreListing } from "@/lib/scoring";
import type { ScoringConfig } from "@/lib/scoring";
import type { RawProject } from "@/lib/adapters/types";

export interface SaveProjectResult {
  inserted: boolean;
  opportunityId: number | null;
  contentHash: string;
  score: number;
}

export function getExistingContentHashes(): Set<string> {
  runMigrations();
  const db = getDb();
  const rows = db
    .prepare("SELECT content_hash FROM opportunities")
    .all() as Array<{ content_hash: string }>;

  return new Set(rows.map((row) => row.content_hash));
}

export function saveScoredProject(
  project: RawProject,
  scoringConfig: ScoringConfig,
): SaveProjectResult {
  runMigrations();
  const db = getDb();

  const contentHash = computeContentHash({
    platform: project.platform,
    externalId: project.externalId,
    title: project.title,
    description: project.description,
  });

  const existing = db
    .prepare("SELECT id FROM opportunities WHERE content_hash = @contentHash")
    .get({ contentHash }) as { id: number } | undefined;

  if (existing) {
    return {
      inserted: false,
      opportunityId: existing.id,
      contentHash,
      score: 0,
    };
  }

  const scored = scoreListing(
    {
      kind: project.kind,
      title: project.title,
      description: project.description,
      budget: project.budget,
      proposalsCount: project.proposalsCount,
      clientVerified: project.clientVerified,
      clientCountry: project.clientCountry,
      postedAt: project.postedAt,
      salaryMin: project.salaryMin ?? null,
      salaryMax: project.salaryMax ?? null,
      remote: project.remote ?? false,
    },
    scoringConfig,
  );

  const insert = db.prepare(
    `INSERT INTO opportunities (
      kind, platform, external_id, url, title, description, budget, budget_currency,
      proposals_count, client_country, client_verified, company_name, location,
      remote, employment_type, salary_min, salary_max, posted_at, score,
      score_breakdown, content_hash
    ) VALUES (
      @kind, @platform, @externalId, @url, @title, @description, @budget, @budgetCurrency,
      @proposalsCount, @clientCountry, @clientVerified, @companyName, @location,
      @remote, @employmentType, @salaryMin, @salaryMax, @postedAt, @score,
      @scoreBreakdown, @contentHash
    )
    ON CONFLICT(platform, external_id) DO NOTHING`,
  );

  const result = insert.run({
    kind: project.kind,
    platform: project.platform,
    externalId: project.externalId,
    url: project.url,
    title: project.title,
    description: project.description,
    budget: project.budget,
    budgetCurrency: project.budgetCurrency,
    proposalsCount: project.proposalsCount,
    clientCountry: project.clientCountry,
    clientVerified: project.clientVerified ? 1 : 0,
    companyName: project.companyName ?? null,
    location: project.location ?? null,
    remote: project.remote ? 1 : 0,
    employmentType: project.employmentType ?? null,
    salaryMin: project.salaryMin ?? null,
    salaryMax: project.salaryMax ?? null,
    postedAt: project.postedAt,
    score: scored.score,
    scoreBreakdown: JSON.stringify(scored.breakdown),
    contentHash,
  });

  if (result.changes === 0) {
    const byExternal = db
      .prepare(
        "SELECT id FROM opportunities WHERE platform = @platform AND external_id = @externalId",
      )
      .get({
        platform: project.platform,
        externalId: project.externalId,
      }) as { id: number } | undefined;

    return {
      inserted: false,
      opportunityId: byExternal?.id ?? null,
      contentHash,
      score: 0,
    };
  }

  const opportunityId = Number(result.lastInsertRowid);

  db.prepare(
    `INSERT INTO tracking (opportunity_id, status)
     VALUES (@opportunityId, 'nova')
     ON CONFLICT(opportunity_id) DO NOTHING`,
  ).run({ opportunityId });

  return {
    inserted: true,
    opportunityId,
    contentHash,
    score: scored.score,
  };
}
