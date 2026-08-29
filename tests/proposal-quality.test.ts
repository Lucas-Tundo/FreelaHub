import { describe, expect, it } from "vitest";

import {
  evaluateProposalQuality,
  extractSignificantTerms,
  selectRelevantCases,
} from "@/lib/proposal-quality";

describe("extractSignificantTerms", () => {
  it("extrai termos relevantes ignorando stopwords", () => {
    const terms = extractSignificantTerms(
      "Automação n8n integrando ERP com WhatsApp",
    );
    expect(terms).toContain("automacao");
    expect(terms).toContain("whatsapp");
    expect(terms).not.toContain("com");
  });
});

describe("selectRelevantCases", () => {
  const cases = [
    {
      title: "Automação n8n para e-commerce",
      description: "Fluxo ERP WhatsApp",
      tags: ["n8n", "whatsapp"],
    },
    {
      title: "Landing page institucional",
      description: "Site de uma página",
      tags: ["html", "css"],
    },
    {
      title: "Dashboard React",
      description: "Painel PostgreSQL",
      tags: ["dashboard", "react"],
    },
  ];

  it("prioriza cases com mais overlap", () => {
    const selected = selectRelevantCases(
      "Preciso de automação n8n com WhatsApp",
      cases,
      2,
    );

    expect(selected[0].title).toContain("n8n");
    expect(selected).toHaveLength(2);
  });
});

describe("evaluateProposalQuality", () => {
  const title = "Automação n8n integrando ERP com WhatsApp";
  const description =
    "Automatizar pedidos do ERP para notificações no WhatsApp via webhooks.";

  it("aprova proposta específica", () => {
    const body = `Vi que vocês precisam integrar ERP ao WhatsApp via n8n — já fiz fluxo parecido.

Entendo: pedidos saem do ERP mas o cliente não é avisado.

Como resolveria:
1. Mapear endpoints do ERP
2. Montar fluxo n8n com retry
3. Testar com volume real

Case: automação n8n + WhatsApp, 200 pedidos/dia.

Qual API do ERP vocês usam?`;

    const result = evaluateProposalQuality(body, title, description, 180);
    expect(result.isWeak).toBe(false);
  });

  it("marca proposta genérica como fraca", () => {
    const body =
      "Prezado cliente, sou especialista dedicado com ampla experiência em soluções inovadoras. Fico à disposição.";

    const result = evaluateProposalQuality(body, title, description, 180);
    expect(result.isWeak).toBe(true);
    expect(result.weakReason).toBeTruthy();
  });

  it("marca proposta sem detalhes do projeto como fraca", () => {
    const body =
      "Tenho experiência em projetos web e posso ajudar com qualidade. Podemos conversar?";

    const result = evaluateProposalQuality(body, title, description, 180);
    expect(result.isWeak).toBe(true);
    expect(result.weakReason).toContain("genérica");
  });
});
