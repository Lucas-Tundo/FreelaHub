import { loadConfig } from "@/lib/config";
import { fetchRobotsTxt, isPathAllowed } from "@/lib/robots";
import {
  createScrapingBrowser,
  createScrapingPage,
  randomDelayMs,
  sleep,
} from "@/lib/adapters/playwright-utils";
import {
  buildTramposDescription,
  isFullyRemoteLocation,
  parseTramposLocationFromCard,
  parseTramposPostedAt,
  parseTramposSalaryRange,
  TramposDetailSchema,
  TramposListItemSchema,
} from "@/lib/adapters/scraping-schemas";
import {
  AdapterError,
  type Adapter,
  type FetchProjectsResult,
  type RawProject,
} from "@/lib/adapters/types";

const ORIGIN = "https://trampos.co";
const LIST_SELECTOR = ".opportunity-box";
const MAX_JOBS = 10;

function buildSearchUrl(keyword: string): string {
  const url = new URL("/oportunidades", ORIGIN);
  url.searchParams.set("c", "desenvolvimento");
  url.searchParams.set("q", keyword);
  return url.toString();
}

function getPrimaryKeyword(keywords: string[]): string {
  return keywords[0] ?? "desenvolvedor";
}

async function fetchDetail(
  page: import("playwright").Page,
  url: string,
): Promise<{
  title: string;
  companyName: string | null;
  location: string;
  description: string;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  postedText: string | null;
}> {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  if (!response || !response.ok()) {
    throw new AdapterError(
      `Trampos retornou HTTP ${response?.status() ?? "unknown"} em ${url}`,
      "trampos",
      { url, status: response?.status() },
    );
  }

  const raw = await page.evaluate(() => {
    const text = document.body.innerText;
    const title = document.querySelector("h1")?.textContent?.trim() ?? "";

    const companyLine =
      text
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.includes("|") && line.length < 120) ?? null;

    const companyName = companyLine?.split("|")[0]?.trim() ?? null;
    const location =
      companyLine?.split("|")[1]?.trim() ??
      text.match(/Onde\s*\n+([^\n]+)/i)?.[1]?.trim() ??
      "";

    const description =
      text.match(/Descrição\s*\n+([\s\S]*?)(?:\nRequisitos|\nDesejável|\nOutras Informações)/i)?.[1]?.trim() ??
      "";

    const requirements =
      text.match(/Requisitos\s*\n+([\s\S]*?)(?:\nDesejável|\nOutras Informações|\nVocê atende)/i)?.[1]?.trim() ??
      null;

    const employmentType =
      text.match(/Contratação\s*\n+([^\n]+)/i)?.[1]?.trim() ?? null;

    const salaryText =
      text.match(/Faixa salarial\s*\n+([^\n]+)/i)?.[1]?.trim() ??
      text.match(/R\$\s*[\d.]+\s*a\s*R\$\s*[\d.]+/i)?.[0] ??
      null;

    const postedText =
      text.match(/há\s+\d+\s+(?:dia|hora|min)/i)?.[0] ?? null;

    return {
      title,
      companyName,
      location,
      description,
      requirements,
      employmentType,
      salaryText,
      postedText,
    };
  });

  if (!isFullyRemoteLocation(raw.location)) {
    throw new AdapterError(
      `Vaga Trampos em ${url} não é 100% remota (${raw.location})`,
      "trampos",
      { url, location: raw.location },
    );
  }

  const salary = parseTramposSalaryRange(raw.salaryText ?? "");
  const description = buildTramposDescription(
    raw.description,
    raw.requirements,
  );

  const parsed = TramposDetailSchema.parse({
    title: raw.title,
    companyName: raw.companyName,
    location: raw.location,
    description,
    employmentType: raw.employmentType,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    postedText: raw.postedText,
  });

  return parsed;
}

export function createTramposAdapter(): Adapter {
  return {
    name: "trampos",

    async fetchProjects(): Promise<FetchProjectsResult> {
      const config = loadConfig();

      if (config.worker.respect_robots_txt) {
        const robotsTxt = await fetchRobotsTxt(ORIGIN);
        if (!isPathAllowed(robotsTxt, "/oportunidades")) {
          throw new AdapterError(
            "robots.txt do Trampos bloqueia /oportunidades",
            "trampos",
          );
        }
      }

      const browser = await createScrapingBrowser();
      const page = await createScrapingPage(browser);

      try {
        const listUrl = buildSearchUrl(
          `${getPrimaryKeyword(config.scoring.keywords)} remoto`,
        );
        const listResponse = await page.goto(listUrl, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        if (!listResponse?.ok()) {
          throw new AdapterError(
            `Trampos listagem retornou HTTP ${listResponse?.status() ?? "unknown"}`,
            "trampos",
            { url: listUrl, status: listResponse?.status() },
          );
        }

        await page.waitForSelector(LIST_SELECTOR, { timeout: 20000 });

        const listItems = await page.$$eval(LIST_SELECTOR, (boxes) =>
          boxes
            .map((box) => {
              const anchor = box.querySelector<HTMLAnchorElement>(
                "a[href*='/oportunidades/']",
              );
              const href = anchor?.href ?? "";
              const externalId = href.match(/\/oportunidades\/(\d+)/)?.[1] ?? "";
              const text = box.textContent?.replace(/\s+/g, " ").trim() ?? "";
              const title =
                anchor?.querySelector("h2, h3, .title")?.textContent?.trim() ??
                anchor?.textContent
                  ?.replace(/\s+/g, " ")
                  .replace(/(?:EMPREGO|ESTÁGIO|FREELA).*/i, "")
                  .replace(/DESTAQUE.*/i, "")
                  .trim() ??
                "";

              const locationMatch = text.match(
                /(?:EMPREGO|ESTÁGIO|FREELA)(.+?)(?:DESTAQUE|$)/i,
              );
              const location = locationMatch?.[1]?.trim() ?? "";
              const employmentType =
                text.match(/(EMPREGO|ESTÁGIO|FREELA)/i)?.[1] ?? null;

              return {
                externalId,
                title,
                url: href,
                location,
                employmentType,
              };
            })
            .filter((item) => item.externalId && item.url && item.title),
        );

        const remoteCandidates = listItems.filter((item) =>
          isFullyRemoteLocation(item.location),
        );

        if (remoteCandidates.length === 0) {
          throw new AdapterError(
            `Nenhuma vaga 100% remota encontrada no Trampos (seletor ${LIST_SELECTOR})`,
            "trampos",
            { url: listUrl, selector: LIST_SELECTOR },
          );
        }

        const projects: RawProject[] = [];

        for (const item of remoteCandidates) {
          if (projects.length >= MAX_JOBS) break;

          const parsedItem = TramposListItemSchema.parse({
            ...item,
            location:
              parseTramposLocationFromCard(item.location) ?? item.location,
          });

          if (projects.length > 0) {
            const delay = randomDelayMs(
              config.worker.request_delay_min_ms,
              config.worker.request_delay_max_ms,
            );
            await sleep(delay);
          }

          try {
            const detail = await fetchDetail(page, parsedItem.url);
            const salaryReference = detail.salaryMax ?? detail.salaryMin;

            projects.push({
              kind: "vaga",
              platform: "trampos",
              externalId: parsedItem.externalId,
              url: parsedItem.url,
              title: detail.title,
              description: detail.description,
              budget: salaryReference,
              budgetCurrency: "BRL",
              proposalsCount: 0,
              clientCountry: "BR",
              clientVerified: false,
              postedAt: parseTramposPostedAt(detail.postedText),
              companyName: detail.companyName,
              location: detail.location,
              remote: true,
              employmentType: detail.employmentType,
              salaryMin: detail.salaryMin,
              salaryMax: detail.salaryMax,
            });
          } catch (error) {
            if (!(error instanceof AdapterError)) {
              throw error;
            }
          }
        }

        if (projects.length === 0) {
          throw new AdapterError(
            "Nenhuma vaga 100% remota passou na validação de detalhe no Trampos",
            "trampos",
            { url: listUrl },
          );
        }

        return {
          projects,
          metadata: {
            listUrl,
            fetched: projects.length,
            keyword: getPrimaryKeyword(config.scoring.keywords),
            remoteOnly: true,
          },
        };
      } finally {
        await browser.close();
      }
    },
  };
}
