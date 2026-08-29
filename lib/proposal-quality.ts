import { normalizeText } from "@/lib/scoring";

const STOPWORDS = new Set([
  "para",
  "com",
  "uma",
  "uns",
  "por",
  "que",
  "dos",
  "das",
  "nos",
  "nas",
  "seu",
  "sua",
  "seus",
  "suas",
  "este",
  "esta",
  "esse",
  "essa",
  "como",
  "mais",
  "muito",
  "preciso",
  "precisamos",
  "projeto",
  "busco",
  "buscamos",
  "the",
  "and",
  "for",
  "with",
]);

const GENERIC_PHRASES = [
  "prezado cliente",
  "prezado senhor",
  "prezada cliente",
  "cordiais saudacoes",
  "a disposicao",
  "especialista dedicado",
  "solucoes inovadoras",
  "ampla experiencia",
  "garanto qualidade",
  "fico a disposicao",
];

export interface CaseItem {
  title: string;
  description: string;
  tags: string[];
}

export interface ProposalQualityResult {
  isWeak: boolean;
  weakReason: string | null;
  wordCount: number;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function extractSignificantTerms(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));

  return [...new Set(words)];
}

export function selectRelevantCases(
  projectText: string,
  cases: CaseItem[],
  limit = 2,
): CaseItem[] {
  const projectTerms = new Set(extractSignificantTerms(projectText));

  const ranked = cases
    .map((caseItem) => {
      const caseText = `${caseItem.title} ${caseItem.description} ${caseItem.tags.join(" ")}`;
      const caseTerms = extractSignificantTerms(caseText);
      const overlap = caseTerms.filter((term) => projectTerms.has(term)).length;
      return { caseItem, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap);

  return ranked.slice(0, limit).map((entry) => entry.caseItem);
}

export function evaluateProposalQuality(
  body: string,
  projectTitle: string,
  projectDescription: string,
  maxWords: number,
): ProposalQualityResult {
  const wordCount = countWords(body);
  const normalizedBody = normalizeText(body);

  if (wordCount === 0) {
    return {
      isWeak: true,
      weakReason: "Proposta vazia",
      wordCount,
    };
  }

  if (wordCount > maxWords + 15) {
    return {
      isWeak: true,
      weakReason: `Proposta muito longa (${wordCount} palavras, máx ${maxWords})`,
      wordCount,
    };
  }

  for (const phrase of GENERIC_PHRASES) {
    if (normalizedBody.includes(phrase)) {
      return {
        isWeak: true,
        weakReason: `Tom genérico detectado: "${phrase}"`,
        wordCount,
      };
    }
  }

  const projectTerms = extractSignificantTerms(`${projectTitle} ${projectDescription}`);
  const matchedTerms = projectTerms.filter((term) => normalizedBody.includes(term));

  if (projectTerms.length > 0 && matchedTerms.length < 2) {
    return {
      isWeak: true,
      weakReason:
        "Proposta genérica: não cita detalhes específicos suficientes do projeto",
      wordCount,
    };
  }

  return {
    isWeak: false,
    weakReason: null,
    wordCount,
  };
}
