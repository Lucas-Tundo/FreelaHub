export interface ScoringInput {
  title: string;
  description: string;
  budget: number | null;
  proposalsCount: number;
  clientVerified: boolean;
  clientCountry: string | null;
  postedAt: string | Date;
  now?: Date;
}

export interface ScoringConfig {
  keywords: string[];
  keywordWeight: number;
  budgetBonus: number;
  priceMin: number;
  lowCompetitionBonus: number;
  freshnessBonus: number;
  verifiedClientBonus: number;
  preferredCountries: string[];
  blacklist: string[];
  blacklistPenalty: number;
}

export interface KeywordBreakdown {
  matched: string[];
  points: number;
}

export interface BudgetBreakdown {
  value: number | null;
  min: number;
  points: number;
}

export interface CompetitionBreakdown {
  count: number;
  points: number;
}

export interface FreshnessBreakdown {
  hours: number;
  points: number;
}

export interface VerifiedBreakdown {
  points: number;
}

export interface CountryBreakdown {
  country: string | null;
  points: number;
}

export interface BlacklistBreakdown {
  matched: string[];
  points: number;
}

export interface ScoreBreakdown {
  keywords: KeywordBreakdown;
  budget: BudgetBreakdown;
  competition: CompetitionBreakdown;
  freshness: FreshnessBreakdown;
  verified: VerifiedBreakdown;
  country: CountryBreakdown;
  blacklist: BlacklistBreakdown;
  total: number;
  salary?: SalaryBreakdown;
  remote?: RemoteBreakdown;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
}

export interface JobScoringInput {
  title: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  remote: boolean;
  postedAt: string | Date;
  now?: Date;
}

export interface RemoteBreakdown {
  remote: boolean;
  points: number;
}

export interface SalaryBreakdown {
  min: number | null;
  max: number | null;
  targetMin: number;
  points: number;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function scoreKeywords(
  title: string,
  description: string,
  keywords: string[],
  keywordWeight: number,
): KeywordBreakdown {
  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description);
  const matched: string[] = [];
  let points = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    const inTitle = normalizedTitle.includes(normalizedKeyword);
    const inDescription = normalizedDescription.includes(normalizedKeyword);

    if (inTitle || inDescription) {
      matched.push(keyword);
      if (inTitle) {
        points += keywordWeight * 2;
      } else {
        points += keywordWeight;
      }
    }
  }

  return { matched, points };
}

export function scoreBudget(
  budget: number | null,
  priceMin: number,
  budgetBonus: number,
): BudgetBreakdown {
  const points =
    budget !== null && budget >= priceMin ? budgetBonus : 0;

  return { value: budget, min: priceMin, points };
}

export function scoreSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  targetMin: number,
  budgetBonus: number,
): SalaryBreakdown {
  const effectiveSalary = salaryMax ?? salaryMin;
  const points =
    effectiveSalary !== null && effectiveSalary >= targetMin ? budgetBonus : 0;

  return {
    min: salaryMin,
    max: salaryMax,
    targetMin,
    points,
  };
}

export function scoreRemote(remote: boolean, bonus = 10): RemoteBreakdown {
  return {
    remote,
    points: remote ? bonus : 0,
  };
}

export function scoreCompetition(
  proposalsCount: number,
  lowCompetitionBonus: number,
): CompetitionBreakdown {
  let points: number;

  if (proposalsCount <= 2) {
    points = lowCompetitionBonus;
  } else if (proposalsCount > 20) {
    points = 0;
  } else {
    points = Math.floor(lowCompetitionBonus * (1 - proposalsCount / 20));
  }

  return { count: proposalsCount, points };
}

export function getProjectAgeHours(
  postedAt: string | Date,
  now: Date = new Date(),
): number {
  const posted =
    postedAt instanceof Date ? postedAt : new Date(postedAt);
  const diffMs = now.getTime() - posted.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

export function scoreFreshness(
  postedAt: string | Date,
  freshnessBonus: number,
  now: Date = new Date(),
): FreshnessBreakdown {
  const hours = getProjectAgeHours(postedAt, now);
  let points: number;

  if (hours <= 6) {
    points = freshnessBonus;
  } else if (hours <= 24) {
    points = Math.floor(freshnessBonus * 0.8);
  } else if (hours <= 48) {
    points = Math.floor(freshnessBonus * 0.5);
  } else if (hours <= 168) {
    points = Math.floor(freshnessBonus * 0.2);
  } else {
    points = 0;
  }

  return { hours: Math.round(hours * 10) / 10, points };
}

export function scoreVerified(
  clientVerified: boolean,
  verifiedClientBonus: number,
): VerifiedBreakdown {
  return {
    points: clientVerified ? verifiedClientBonus : 0,
  };
}

export function scoreCountry(
  clientCountry: string | null,
  preferredCountries: string[],
  bonus = 5,
): CountryBreakdown {
  if (!clientCountry) {
    return { country: null, points: 0 };
  }

  const normalizedCountry = clientCountry.toUpperCase();
  const isPreferred = preferredCountries.some(
    (country) => country.toUpperCase() === normalizedCountry,
  );

  return {
    country: clientCountry,
    points: isPreferred ? bonus : 0,
  };
}

export function scoreBlacklist(
  title: string,
  description: string,
  blacklist: string[],
  blacklistPenalty: number,
): BlacklistBreakdown {
  const combined = normalizeText(`${title} ${description}`);
  const matched: string[] = [];

  for (const phrase of blacklist) {
    if (combined.includes(normalizeText(phrase))) {
      matched.push(phrase);
    }
  }

  return {
    matched,
    points: matched.length === 0 ? 0 : matched.length * blacklistPenalty,
  };
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreProject(
  input: ScoringInput,
  config: ScoringConfig,
): ScoreResult {
  const now = input.now ?? new Date();

  const keywords = scoreKeywords(
    input.title,
    input.description,
    config.keywords,
    config.keywordWeight,
  );
  const budget = scoreBudget(
    input.budget,
    config.priceMin,
    config.budgetBonus,
  );
  const competition = scoreCompetition(
    input.proposalsCount,
    config.lowCompetitionBonus,
  );
  const freshness = scoreFreshness(
    input.postedAt,
    config.freshnessBonus,
    now,
  );
  const verified = scoreVerified(
    input.clientVerified,
    config.verifiedClientBonus,
  );
  const country = scoreCountry(
    input.clientCountry,
    config.preferredCountries,
  );
  const blacklist = scoreBlacklist(
    input.title,
    input.description,
    config.blacklist,
    config.blacklistPenalty,
  );

  const rawTotal =
    keywords.points +
    budget.points +
    competition.points +
    freshness.points +
    verified.points +
    country.points +
    blacklist.points;

  const total = clampScore(rawTotal);

  return {
    score: total,
    breakdown: {
      keywords,
      budget,
      competition,
      freshness,
      verified,
      country,
      blacklist,
      total,
    },
  };
}

export function scoreJob(
  input: JobScoringInput,
  config: ScoringConfig,
): ScoreResult {
  const now = input.now ?? new Date();

  const keywords = scoreKeywords(
    input.title,
    input.description,
    config.keywords,
    config.keywordWeight,
  );
  const salary = scoreSalary(
    input.salaryMin,
    input.salaryMax,
    config.priceMin,
    config.budgetBonus,
  );
  const remote = scoreRemote(input.remote);
  const freshness = scoreFreshness(
    input.postedAt,
    config.freshnessBonus,
    now,
  );
  const blacklist = scoreBlacklist(
    input.title,
    input.description,
    config.blacklist,
    config.blacklistPenalty,
  );

  const emptyBudget: BudgetBreakdown = {
    value: null,
    min: config.priceMin,
    points: 0,
  };
  const emptyCompetition: CompetitionBreakdown = { count: 0, points: 0 };
  const emptyVerified: VerifiedBreakdown = { points: 0 };
  const emptyCountry: CountryBreakdown = { country: null, points: 0 };

  const rawTotal =
    keywords.points +
    salary.points +
    remote.points +
    freshness.points +
    blacklist.points;

  const total = clampScore(rawTotal);

  return {
    score: total,
    breakdown: {
      keywords,
      budget: emptyBudget,
      competition: emptyCompetition,
      freshness,
      verified: emptyVerified,
      country: emptyCountry,
      blacklist,
      salary,
      remote,
      total,
    },
  };
}

export function scoreListing(
  project: {
    kind: "freelance" | "vaga";
    title: string;
    description: string;
    budget: number | null;
    proposalsCount: number;
    clientVerified: boolean;
    clientCountry: string | null;
    postedAt: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    remote?: boolean;
  },
  config: ScoringConfig,
): ScoreResult {
  if (project.kind === "vaga") {
    return scoreJob(
      {
        title: project.title,
        description: project.description,
        salaryMin: project.salaryMin ?? null,
        salaryMax: project.salaryMax ?? null,
        remote: project.remote ?? false,
        postedAt: project.postedAt,
      },
      config,
    );
  }

  return scoreProject(
    {
      title: project.title,
      description: project.description,
      budget: project.budget,
      proposalsCount: project.proposalsCount,
      clientVerified: project.clientVerified,
      clientCountry: project.clientCountry,
      postedAt: project.postedAt,
    },
    config,
  );
}

export function scoringConfigFromYaml(
  scoring: {
    keywords: string[];
    keyword_weight: number;
    budget_bonus: number;
    low_competition_bonus: number;
    freshness_bonus: number;
    verified_client_bonus: number;
    preferred_countries: string[];
    blacklist: string[];
    blacklist_penalty: number;
  },
  priceMin: number,
): ScoringConfig {
  return {
    keywords: scoring.keywords,
    keywordWeight: scoring.keyword_weight,
    budgetBonus: scoring.budget_bonus,
    priceMin,
    lowCompetitionBonus: scoring.low_competition_bonus,
    freshnessBonus: scoring.freshness_bonus,
    verifiedClientBonus: scoring.verified_client_bonus,
    preferredCountries: scoring.preferred_countries,
    blacklist: scoring.blacklist,
    blacklistPenalty: scoring.blacklist_penalty,
  };
}
