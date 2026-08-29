import { describe, expect, it } from "vitest";

import {
  buildProjectUrl,
  extractBudget,
  extractClientCountry,
  extractClientVerified,
  extractPostedAt,
  FreelancerSearchResponseSchema,
} from "@/lib/adapters/freelancer-schema";
import { computeContentHash, isKnownContentHash } from "@/lib/dedupe";

describe("computeContentHash", () => {
  it("gera hash determinístico", () => {
    const input = {
      platform: "freelancer",
      externalId: "123",
      title: "Dashboard React",
      description: "Painel interno",
    };

    const hash1 = computeContentHash(input);
    const hash2 = computeContentHash(input);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("muda hash quando conteúdo muda", () => {
    const base = {
      platform: "freelancer",
      externalId: "123",
      title: "Dashboard React",
      description: "Painel interno",
    };

    const hash1 = computeContentHash(base);
    const hash2 = computeContentHash({ ...base, description: "Outro texto" });

    expect(hash1).not.toBe(hash2);
  });
});

describe("isKnownContentHash", () => {
  it("detecta hash existente", () => {
    const known = new Set(["abc123"]);
    expect(isKnownContentHash(known, "abc123")).toBe(true);
    expect(isKnownContentHash(known, "xyz")).toBe(false);
  });
});

describe("FreelancerSearchResponseSchema", () => {
  it("valida resposta de sucesso da API", () => {
    const payload = {
      status: "success",
      result: {
        projects: [
          {
            id: 38647548,
            title: "Deploy platform",
            description: "Full description here",
            seo_url: "deploy-platform",
            budget: { minimum: 30, maximum: 250 },
            currency: { code: "USD" },
            bid_stats: { bid_count: 41, bid_avg: 154.65 },
            time_submitted: 1728049696,
            location: { country: { code: "US" } },
            owner_id: 99,
            users: [
              {
                id: 99,
                status: { payment_verified: true },
                location: { country: { code: "US" } },
              },
            ],
          },
        ],
        total_count: 1,
      },
    };

    const parsed = FreelancerSearchResponseSchema.parse(payload);
    expect(parsed.result.projects).toHaveLength(1);
    expect(parsed.result.projects[0].bid_stats?.bid_count).toBe(41);
  });

  it("rejeita resposta sem projects", () => {
    expect(() =>
      FreelancerSearchResponseSchema.parse({
        status: "success",
        result: {},
      }),
    ).toThrow();
  });
});

describe("freelancer mappers", () => {
  const sampleProject = {
    id: 38647548,
    title: "Deploy platform",
    description: "Full description",
    seo_url: "deploy-platform",
    budget: { minimum: 30, maximum: 250 },
    currency: { code: "USD" },
    bid_stats: { bid_count: 5 },
    time_submitted: 1728049696,
    owner_id: 99,
    users: [
      {
        id: 99,
        status: { payment_verified: true },
        location: { country: { code: "US" } },
      },
    ],
  };

  it("extrai campos normalizados", () => {
    expect(extractBudget(sampleProject.budget)).toBe(250);
    expect(extractClientCountry(sampleProject)).toBe("US");
    expect(extractClientVerified(sampleProject)).toBe(true);
    expect(extractPostedAt(sampleProject)).toBe("2024-10-04T13:48:16.000Z");
    expect(buildProjectUrl(sampleProject.seo_url, sampleProject.id)).toBe(
      "https://www.freelancer.com/projects/deploy-platform",
    );
  });
});
