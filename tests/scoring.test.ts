import { describe, expect, it } from "vitest";

import {
  clampScore,
  getProjectAgeHours,
  normalizeText,
  scoreBlacklist,
  scoreBudget,
  scoreCompetition,
  scoreCountry,
  scoreFreshness,
  scoreKeywords,
  scoreJob,
  scoreProject,
  scoreRemote,
  scoreSalary,
  scoreVerified,
  type ScoringConfig,
} from "@/lib/scoring";

const BASE_CONFIG: ScoringConfig = {
  keywords: [
    "automação",
    "n8n",
    "dashboard",
    "next.js",
    "api",
    "integração",
    "supabase",
    "app web",
  ],
  keywordWeight: 15,
  budgetBonus: 20,
  priceMin: 3000,
  lowCompetitionBonus: 15,
  freshnessBonus: 10,
  verifiedClientBonus: 5,
  preferredCountries: ["BR", "US"],
  blacklist: ["urgente e barato", "teste grátis", "preciso pra ontem"],
  blacklistPenalty: -30,
};

const FIXED_NOW = new Date("2026-08-22T18:00:00.000Z");

describe("normalizeText", () => {
  it("converte para minúsculas e remove acentos", () => {
    expect(normalizeText("Automação n8n")).toBe("automacao n8n");
    expect(normalizeText("Integração API")).toBe("integracao api");
  });
});

describe("scoreKeywords", () => {
  it("pontua keyword no título com peso 2x", () => {
    const result = scoreKeywords(
      "Automação n8n para ERP",
      "Projeto simples",
      ["automação", "n8n"],
      15,
    );

    expect(result.matched).toEqual(["automação", "n8n"]);
    expect(result.points).toBe(60);
  });

  it("pontua keyword só na descrição com peso 1x", () => {
    const result = scoreKeywords(
      "Projeto genérico",
      "Preciso de dashboard em React",
      ["dashboard"],
      15,
    );

    expect(result.matched).toEqual(["dashboard"]);
    expect(result.points).toBe(15);
  });

  it("não pontua keywords ausentes", () => {
    const result = scoreKeywords(
      "Landing page",
      "Site institucional",
      ["n8n", "supabase"],
      15,
    );

    expect(result.matched).toEqual([]);
    expect(result.points).toBe(0);
  });
});

describe("scoreBudget", () => {
  it("bonifica orçamento acima do mínimo", () => {
    const result = scoreBudget(8000, 3000, 20);
    expect(result.points).toBe(20);
  });

  it("não bonifica orçamento abaixo do mínimo", () => {
    const result = scoreBudget(1500, 3000, 20);
    expect(result.points).toBe(0);
  });

  it("não bonifica orçamento nulo", () => {
    const result = scoreBudget(null, 3000, 20);
    expect(result.points).toBe(0);
  });
});

describe("scoreCompetition", () => {
  it("dá bônus máximo com poucas propostas", () => {
    expect(scoreCompetition(0, 15).points).toBe(15);
    expect(scoreCompetition(2, 15).points).toBe(15);
  });

  it("reduz bônus conforme propostas aumentam", () => {
    expect(scoreCompetition(3, 15).points).toBe(12);
    expect(scoreCompetition(10, 15).points).toBe(7);
  });

  it("zera bônus com mais de 20 propostas", () => {
    expect(scoreCompetition(21, 15).points).toBe(0);
    expect(scoreCompetition(40, 15).points).toBe(0);
  });
});

describe("scoreFreshness", () => {
  it("dá bônus máximo para projetos com menos de 6h", () => {
    const postedAt = new Date("2026-08-22T14:00:00.000Z");
    const result = scoreFreshness(postedAt, 10, FIXED_NOW);
    expect(result.points).toBe(10);
  });

  it("reduz bônus para projetos mais antigos", () => {
    const postedAt24h = new Date("2026-08-21T18:00:00.000Z");
    const postedAt7d = new Date("2026-08-15T18:00:00.000Z");
    const postedAtOld = new Date("2026-08-01T18:00:00.000Z");

    expect(scoreFreshness(postedAt24h, 10, FIXED_NOW).points).toBe(8);
    expect(scoreFreshness(postedAt7d, 10, FIXED_NOW).points).toBe(2);
    expect(scoreFreshness(postedAtOld, 10, FIXED_NOW).points).toBe(0);
  });
});

describe("getProjectAgeHours", () => {
  it("calcula idade em horas corretamente", () => {
    const postedAt = new Date("2026-08-22T12:00:00.000Z");
    expect(getProjectAgeHours(postedAt, FIXED_NOW)).toBe(6);
  });
});

describe("scoreVerified", () => {
  it("bonifica cliente verificado", () => {
    expect(scoreVerified(true, 5).points).toBe(5);
    expect(scoreVerified(false, 5).points).toBe(0);
  });
});

describe("scoreCountry", () => {
  it("bonifica países preferidos", () => {
    expect(scoreCountry("BR", ["BR", "US"]).points).toBe(5);
    expect(scoreCountry("us", ["BR", "US"]).points).toBe(5);
  });

  it("não bonifica países fora da lista", () => {
    expect(scoreCountry("AR", ["BR", "US"]).points).toBe(0);
    expect(scoreCountry(null, ["BR", "US"]).points).toBe(0);
  });
});

describe("scoreBlacklist", () => {
  it("penaliza frases da blacklist", () => {
    const result = scoreBlacklist(
      "URGENTE: site barato",
      "Quero teste grátis antes de pagar",
      ["urgente e barato", "teste grátis", "preciso pra ontem"],
      -30,
    );

    expect(result.matched).toContain("teste grátis");
    expect(result.points).toBeLessThan(0);
  });

  it("detecta múltiplas penalidades", () => {
    const result = scoreBlacklist(
      "URGENTE e barato, preciso pra ontem",
      "teste grátis",
      ["urgente e barato", "teste grátis", "preciso pra ontem"],
      -30,
    );

    expect(result.matched).toHaveLength(3);
    expect(result.points).toBe(-90);
  });

  it("não penaliza texto limpo", () => {
    const result = scoreBlacklist(
      "Dashboard React com PostgreSQL",
      "Projeto bem definido com orçamento adequado",
      ["urgente e barato", "teste grátis"],
      -30,
    );

    expect(result.matched).toEqual([]);
    expect(result.points).toBe(0);
  });
});

describe("clampScore", () => {
  it("limita score entre 0 e 100", () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-20)).toBe(0);
    expect(clampScore(72.6)).toBe(73);
  });
});

describe("scoreProject (integração)", () => {
  it("pontua projeto ideal alto", () => {
    const result = scoreProject(
      {
        title: "Automação n8n integrando ERP",
        description: "API documentada, webhooks e integração",
        budget: 8000,
        proposalsCount: 3,
        clientVerified: true,
        clientCountry: "BR",
        postedAt: new Date("2026-08-22T16:00:00.000Z"),
        now: FIXED_NOW,
      },
      BASE_CONFIG,
    );

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.breakdown.keywords.matched).toContain("n8n");
    expect(result.breakdown.budget.points).toBe(20);
    expect(result.breakdown.verified.points).toBe(5);
    expect(result.breakdown.total).toBe(result.score);
  });

  it("penaliza projeto com blacklist e orçamento baixo", () => {
    const result = scoreProject(
      {
        title: "URGENTE: site barato para ontem",
        description: "teste grátis antes de pagar, preciso pra ontem",
        budget: 500,
        proposalsCount: 40,
        clientVerified: false,
        clientCountry: "BR",
        postedAt: new Date("2026-08-22T17:30:00.000Z"),
        now: FIXED_NOW,
      },
      BASE_CONFIG,
    );

    expect(result.score).toBeLessThanOrEqual(15);
    expect(result.breakdown.blacklist.matched.length).toBeGreaterThan(0);
    expect(result.breakdown.budget.points).toBe(0);
    expect(result.breakdown.competition.points).toBe(0);
  });

  it("pontua vagas remotas com salário na faixa", () => {
    const result = scoreJob(
      {
        title: "Desenvolvedor Next.js remoto",
        description: "API, dashboard e automação com n8n",
        salaryMin: 8000,
        salaryMax: 12000,
        remote: true,
        postedAt: new Date("2026-08-22T13:00:00.000Z"),
        now: FIXED_NOW,
      },
      BASE_CONFIG,
    );

    expect(result.score).toBeGreaterThan(60);
    expect(scoreSalary(8000, 12000, 3000, 20).points).toBe(20);
    expect(scoreRemote(true).points).toBe(10);
  });

  it("inclui breakdown completo para auditoria", () => {
    const result = scoreProject(
      {
        title: "Dashboard Next.js",
        description: "Painel interno com supabase",
        budget: 12000,
        proposalsCount: 7,
        clientVerified: true,
        clientCountry: "US",
        postedAt: new Date("2026-08-22T13:00:00.000Z"),
        now: FIXED_NOW,
      },
      BASE_CONFIG,
    );

    expect(result.breakdown).toMatchObject({
      keywords: expect.objectContaining({ matched: expect.any(Array) }),
      budget: expect.objectContaining({ value: 12000 }),
      competition: expect.objectContaining({ count: 7 }),
      freshness: expect.objectContaining({ points: expect.any(Number) }),
      verified: expect.objectContaining({ points: 5 }),
      country: expect.objectContaining({ country: "US", points: 5 }),
      blacklist: expect.objectContaining({ matched: [] }),
      total: result.score,
    });
  });
});
