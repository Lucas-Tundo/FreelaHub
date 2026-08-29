import { describe, expect, it } from "vitest";

import {
  applyClientFilters,
  countActiveFilters,
  DEFAULT_FILTERS,
  getNextOpportunityId,
} from "@/lib/filters";
import type { OpportunityRow } from "@/lib/types";

const BASE_OPP: OpportunityRow = {
  id: 1,
  kind: "freelance",
  platform: "freelancer",
  external_id: "fl-1",
  url: "https://example.com",
  title: "Automação n8n",
  description: "Integração ERP",
  budget: 5000,
  budget_currency: "BRL",
  proposals_count: 3,
  client_country: "BR",
  client_verified: 1,
  company_name: null,
  location: null,
  remote: 0,
  employment_type: null,
  salary_min: null,
  salary_max: null,
  posted_at: "2026-08-22T10:00:00.000Z",
  score: 80,
  score_breakdown: "{}",
  content_hash: "abc",
  created_at: "2026-08-22T10:00:00.000Z",
  status: "nova",
  sent_at: null,
  replied_at: null,
  closed_value: null,
  notes: null,
  proposal_body: "Proposta aqui",
  proposal_is_weak: 0,
  proposal_weak_reason: null,
  proposal_regenerated_count: 0,
  proposal_template_used: "default",
};

describe("applyClientFilters", () => {
  it("filtra por busca no título", () => {
    const result = applyClientFilters(
      [BASE_OPP],
      { ...DEFAULT_FILTERS, search: "n8n" },
    );
    expect(result).toHaveLength(1);
  });

  it("filtra propostas fracas", () => {
    const weak = { ...BASE_OPP, id: 2, proposal_is_weak: 1 };
    const result = applyClientFilters(
      [BASE_OPP, weak],
      { ...DEFAULT_FILTERS, weakOnly: true },
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("filtra sem proposta", () => {
    const without = { ...BASE_OPP, id: 2, proposal_body: null };
    const result = applyClientFilters(
      [BASE_OPP, without],
      { ...DEFAULT_FILTERS, hasProposal: "no" },
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("filtra por tipo vaga", () => {
    const job = { ...BASE_OPP, id: 2, kind: "vaga" as const, platform: "trampos" as const };
    const result = applyClientFilters(
      [BASE_OPP, job],
      { ...DEFAULT_FILTERS, kind: "vaga" },
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

describe("getNextOpportunityId", () => {
  const list = [
    { ...BASE_OPP, id: 1 },
    { ...BASE_OPP, id: 2 },
    { ...BASE_OPP, id: 3 },
  ];

  it("navega para baixo e para cima", () => {
    expect(getNextOpportunityId(list, 1, "down")).toBe(2);
    expect(getNextOpportunityId(list, 2, "up")).toBe(1);
  });
});

describe("countActiveFilters", () => {
  it("conta filtros ativos", () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...DEFAULT_FILTERS,
        platform: "freelancer",
        weakOnly: true,
      }),
    ).toBe(2);
  });
});
