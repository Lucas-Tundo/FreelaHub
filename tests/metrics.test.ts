import { describe, expect, it } from "vitest";

import {
  aggregateTrackingCounts,
  buildTemplateMetrics,
  calculateResponseRate,
} from "@/lib/metrics";

describe("calculateResponseRate", () => {
  it("calcula percentual arredondado", () => {
    expect(calculateResponseRate(2, 5)).toBe(40);
    expect(calculateResponseRate(0, 5)).toBe(0);
    expect(calculateResponseRate(3, 0)).toBe(0);
  });
});

describe("buildTemplateMetrics", () => {
  it("ordena templates por taxa de resposta", () => {
    const result = buildTemplateMetrics([
      { template: "default", enviadas: 10, respostas: 2 },
      { template: "adjusted:mais curta", enviadas: 5, respostas: 3 },
    ]);

    expect(result[0].template).toBe("adjusted:mais curta");
    expect(result[0].taxa_resposta).toBe(60);
    expect(result[1].taxa_resposta).toBe(20);
  });
});

describe("aggregateTrackingCounts", () => {
  it("agrega taxa de resposta global", () => {
    const result = aggregateTrackingCounts({
      novas: 5,
      enviadas: 3,
      respondeu: 2,
      fechou: 1,
      perdeu: 1,
      descartadas: 4,
    });

    expect(result.total_enviadas).toBe(7);
    expect(result.total_respostas).toBe(3);
    expect(result.taxa_resposta).toBe(43);
  });
});
