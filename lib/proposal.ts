import Anthropic from "@anthropic-ai/sdk";

import { loadConfig } from "@/lib/config";
import {
  evaluateProposalQuality,
  selectRelevantCases,
  type CaseItem,
} from "@/lib/proposal-quality";
import type { OpportunityKind } from "@/lib/types";

export interface ProposalGenerationInput {
  kind: OpportunityKind;
  title: string;
  description: string;
  companyName?: string | null;
  adjustment?: string;
}

export interface ProposalGenerationResult {
  body: string;
  isWeak: boolean;
  weakReason: string | null;
  templateUsed: string;
}

function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurado no .env");
  }
  return apiKey;
}

function buildFreelanceSystemPrompt(
  profile: {
    niche: string;
    stack: string;
    price_min: number;
    price_max: number;
    price_currency: string;
  },
  maxWords: number,
): string {
  return [
    "Você escreve propostas freelancer em português do Brasil.",
    "Tom direto, sem formalidade excessiva.",
    "PROIBIDO: 'Prezado cliente', elogios genéricos, prometer prazo ou preço.",
    `Faixa de preço permitida para mencionar: ${profile.price_min}–${profile.price_max} ${profile.price_currency}. Se não couber citar preço, não cite.`,
    `Máximo ${maxWords} palavras.`,
    "Estrutura obrigatória:",
    "1) Gancho específico do projeto",
    "2) Prova de que entendeu o problema real",
    "3) Como resolveria em 3 passos numerados",
    "4) Case parecido do portfólio",
    "5) Uma pergunta de fechamento",
    "Responda APENAS com o texto da proposta, sem título ou explicações.",
  ].join("\n");
}

function buildJobSystemPrompt(
  profile: {
    niche: string;
    stack: string;
  },
  maxWords: number,
): string {
  return [
    "Você escreve cartas de candidatura para vagas remotas em português do Brasil.",
    "Tom profissional, direto e humano — sem clichês de RH.",
    "PROIBIDO: 'Prezado recrutador', 'venho por meio desta', 'sou proativo e dinâmico'.",
    `Máximo ${maxWords} palavras.`,
    "Estrutura obrigatória:",
    "1) Por que essa vaga remota faz sentido para mim",
    "2) Experiência relevante com evidência concreta",
    "3) Como contribuo nos primeiros 30 dias",
    "4) Case ou resultado mensurável do portfólio",
    "5) Fechamento curto com disponibilidade para conversar",
    "Responda APENAS com o texto da candidatura, sem título ou explicações.",
    `Perfil: ${profile.niche}. Stack: ${profile.stack}.`,
  ].join("\n");
}

function buildUserPrompt(
  input: ProposalGenerationInput,
  profile: {
    niche: string;
    stack: string;
    cases: CaseItem[];
  },
  maxWords: number,
): string {
  const relevantCases = selectRelevantCases(
    `${input.title} ${input.description}`,
    profile.cases,
    2,
  );

  const casesText =
    relevantCases.length > 0
      ? relevantCases
          .map(
            (caseItem, index) =>
              `Case ${index + 1}: ${caseItem.title} — ${caseItem.description}`,
          )
          .join("\n")
      : "Sem cases cadastrados.";

  const adjustmentText = input.adjustment
    ? `\nAjuste solicitado: ${input.adjustment}`
    : "";

  if (input.kind === "vaga") {
    return [
      `Meu perfil: ${profile.niche}. Stack: ${profile.stack}.`,
      "",
      "Vaga remota:",
      `Título: ${input.title}`,
      input.companyName ? `Empresa: ${input.companyName}` : "",
      `Descrição: ${input.description}`,
      "",
      "Cases para citar:",
      casesText,
      "",
      `Escreva a carta de candidatura (máx ${maxWords} palavras).${adjustmentText}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Meu perfil: ${profile.niche}. Stack: ${profile.stack}.`,
    "",
    "Projeto:",
    `Título: ${input.title}`,
    `Descrição: ${input.description}`,
    "",
    "Cases para citar:",
    casesText,
    "",
    `Escreva a proposta (máx ${maxWords} palavras).${adjustmentText}`,
  ].join("\n");
}

export async function generateProposal(
  input: ProposalGenerationInput,
): Promise<ProposalGenerationResult> {
  const config = loadConfig();
  const client = new Anthropic({ apiKey: getApiKey() });

  const system =
    input.kind === "vaga"
      ? buildJobSystemPrompt(config.profile, config.proposal.max_words)
      : buildFreelanceSystemPrompt(config.profile, config.proposal.max_words);

  const user = buildUserPrompt(
    input,
    config.profile,
    config.proposal.max_words,
  );

  const response = await client.messages.create({
    model: config.proposal.model,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic retornou resposta sem texto");
  }

  const body = textBlock.text.trim();
  const quality = evaluateProposalQuality(
    body,
    input.title,
    input.description,
    config.proposal.max_words,
  );

  const templateBase = input.kind === "vaga" ? "job" : "default";

  return {
    body,
    isWeak: quality.isWeak,
    weakReason: quality.weakReason,
    templateUsed: input.adjustment
      ? `${templateBase}:adjusted:${input.adjustment}`
      : templateBase,
  };
}
