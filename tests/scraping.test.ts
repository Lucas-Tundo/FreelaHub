import { describe, expect, it } from "vitest";

import {
  isCloudflareChallenge,
  parseBrazilianCurrency,
  timestampToIso,
} from "@/lib/adapters/playwright-utils";
import {
  buildNinetyNineDescription,
  isFullyRemoteLocation,
  parseNinetyNineProposals,
  parseTramposSalaryRange,
  parseWorkanaProposals,
} from "@/lib/adapters/scraping-schemas";
import { isPathAllowed } from "@/lib/robots";

describe("parseWorkanaProposals", () => {
  it("extrai número de propostas", () => {
    expect(parseWorkanaProposals("Propostas: 12")).toBe(12);
    expect(parseWorkanaProposals(null)).toBe(0);
  });
});

describe("parseNinetyNineProposals", () => {
  it("extrai propostas do texto de informações", () => {
    expect(
      parseNinetyNineProposals("Propostas: 43 | Interessados: 50"),
    ).toBe(43);
  });
});

describe("buildNinetyNineDescription", () => {
  it("prefere descrição completa da página de detalhe", () => {
    const result = buildNinetyNineDescription(
      "preview curto",
      "Descrição completa do projeto com detalhes suficientes para gerar proposta personalizada e específica.",
    );
    expect(result).toContain("Descrição completa");
  });
});

describe("parseBrazilianCurrency", () => {
  it("converte valores em reais", () => {
    expect(parseBrazilianCurrency("R$ 50,00")).toBe(50);
    expect(parseBrazilianCurrency("R$ 1.250,00")).toBe(1250);
  });
});

describe("timestampToIso", () => {
  it("converte timestamp em ISO", () => {
    expect(timestampToIso("1787424349000")).toBe(
      new Date(1787424349000).toISOString(),
    );
  });
});

describe("isFullyRemoteLocation", () => {
  it("aceita home office e rejeita híbrido", () => {
    expect(isFullyRemoteLocation("Home office")).toBe(true);
    expect(isFullyRemoteLocation("100% remoto")).toBe(true);
    expect(isFullyRemoteLocation("São Paulo - SP (Híbrido)")).toBe(false);
    expect(isFullyRemoteLocation("São Paulo - SP")).toBe(false);
  });
});

describe("parseTramposSalaryRange", () => {
  it("extrai faixa salarial", () => {
    expect(parseTramposSalaryRange("R$ 3.500 a R$ 4.200")).toEqual({
      salaryMin: 3500,
      salaryMax: 4200,
    });
  });
});

describe("isCloudflareChallenge", () => {
  it("detecta página de challenge", () => {
    expect(
      isCloudflareChallenge(
        "Just a moment...",
        "Performing security verification",
      ),
    ).toBe(true);
    expect(isCloudflareChallenge("Jobs", "Lista de projetos")).toBe(false);
  });
});

describe("isPathAllowed", () => {
  it("respeita regras disallow do robots.txt", () => {
    const robots = `User-agent: *\nDisallow: /admin\nAllow: /jobs`;
    expect(isPathAllowed(robots, "/jobs")).toBe(true);
    expect(isPathAllowed(robots, "/admin/settings")).toBe(false);
  });
});
