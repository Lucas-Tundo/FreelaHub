import { loadConfig } from "@/lib/config";
import { fetchRobotsTxt, isPathAllowed } from "@/lib/robots";
import {
  createScrapingBrowser,
  createScrapingPage,
  parseBrazilianCurrency,
  randomDelayMs,
  sleep,
  timestampToIso,
} from "@/lib/adapters/playwright-utils";
import {
  buildNinetyNineDescription,
  NinetyNineDetailSchema,
  NinetyNineListItemSchema,
  parseNinetyNineProposals,
} from "@/lib/adapters/scraping-schemas";
import { AdapterError, type Adapter, type FetchProjectsResult, type RawProject } from "@/lib/adapters/types";

const ORIGIN = "https://www.99freelas.com.br";
const LIST_SELECTOR = "li.result-item";
const MAX_PROJECTS = 10;

function buildSearchUrl(keyword: string): string {
  const url = new URL("/projects", ORIGIN);
  url.searchParams.set("q", keyword);
  return url.toString();
}

function getPrimaryKeyword(keywords: string[]): string {
  return keywords[0] ?? "automação";
}

async function fetchDetail(
  page: import("playwright").Page,
  url: string,
): Promise<{ description: string; proposalsCount: number; budget: number | null }> {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  if (!response || !response.ok()) {
    throw new AdapterError(
      `99Freelas retornou HTTP ${response?.status() ?? "unknown"} em ${url}`,
      "99freelas",
      { url, status: response?.status() },
    );
  }

  const raw = await page.evaluate(() => {
    const text = document.body.innerText;
    const descriptionHeading = [...document.querySelectorAll("h1, h2, h3, h4")]
      .find((heading) =>
        heading.textContent?.toLowerCase().includes("descrição do projeto"),
      );

    let description = "";
    if (descriptionHeading?.nextElementSibling) {
      description = descriptionHeading.nextElementSibling.textContent?.trim() ?? "";
    }

    if (!description) {
      description =
        text.match(/Descrição do Projeto:\s*([\s\S]*?)(?:# Habilidades|# Atividades|$)/i)?.[1]?.trim() ??
        "";
    }

    return {
      description,
      proposalsCount: text.match(/Propostas:\s*(\d+)/i)?.[1] ?? "0",
      budgetText: text.match(/Valor Mínimo:\s*([^\n]+)/i)?.[1] ?? null,
    };
  });

  const parsed = NinetyNineDetailSchema.parse({
    description: raw.description,
    proposalsCount: Number(raw.proposalsCount),
    budgetText: raw.budgetText,
  });

  return {
    description: parsed.description,
    proposalsCount: parsed.proposalsCount,
    budget: parseBrazilianCurrency(parsed.budgetText),
  };
}

export function create99FreelasAdapter(): Adapter {
  return {
    name: "99freelas",

    async fetchProjects(): Promise<FetchProjectsResult> {
      const config = loadConfig();

      if (config.worker.respect_robots_txt) {
        const robotsTxt = await fetchRobotsTxt(ORIGIN);
        if (!isPathAllowed(robotsTxt, "/projects")) {
          throw new AdapterError(
            "robots.txt do 99Freelas bloqueia /projects",
            "99freelas",
          );
        }
      }

      const browser = await createScrapingBrowser();
      const page = await createScrapingPage(browser);

      try {
        const listUrl = buildSearchUrl(getPrimaryKeyword(config.scoring.keywords));
        const listResponse = await page.goto(listUrl, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        if (!listResponse?.ok()) {
          throw new AdapterError(
            `99Freelas listagem retornou HTTP ${listResponse?.status() ?? "unknown"}`,
            "99freelas",
            { url: listUrl, status: listResponse?.status() },
          );
        }

        await page.waitForSelector(LIST_SELECTOR, { timeout: 20000 });

        const listItems = await page.$$eval(
          LIST_SELECTOR,
          (items, maxProjects) =>
            items.slice(0, maxProjects).map((li) => {
            const titleAnchor = li.querySelector(
              "h1.title a",
            ) as HTMLAnchorElement | null;

            const infoText =
              li.querySelector("p.item-text.information")?.textContent?.trim() ??
              "";

            const clone = li.cloneNode(true) as HTMLElement;
            clone.querySelector(".flags")?.remove();
            clone.querySelector("hgroup")?.remove();
            clone.querySelector(".item-text.information")?.remove();
            clone.querySelector(".item-text.habilidades")?.remove();
            clone.querySelector(".item-text.client")?.remove();
            const previewText = clone.textContent?.trim() ?? "";

            return {
              externalId: li.getAttribute("data-id") ?? "",
              title: titleAnchor?.textContent?.trim() ?? "",
              url: titleAnchor?.href ?? "",
              infoText,
              previewText: previewText || null,
              postedAtMs:
                li.querySelector("b.datetime")?.getAttribute("cp-datetime") ??
                null,
            };
          }),
          MAX_PROJECTS,
        );

        if (listItems.length === 0) {
          throw new AdapterError(
            `Seletor ${LIST_SELECTOR} não retornou itens — layout do 99Freelas pode ter mudado`,
            "99freelas",
            { url: listUrl, selector: LIST_SELECTOR },
          );
        }

        const projects: RawProject[] = [];

        for (const item of listItems) {
          const parsedItem = NinetyNineListItemSchema.parse(item);

          if (projects.length > 0) {
            const delay = randomDelayMs(
              config.worker.request_delay_min_ms,
              config.worker.request_delay_max_ms,
            );
            await sleep(delay);
          }

          const detail = await fetchDetail(page, parsedItem.url);
          const description = buildNinetyNineDescription(
            parsedItem.previewText,
            detail.description,
          );

          if (!description.trim()) {
            throw new AdapterError(
              `Projeto 99Freelas ${parsedItem.externalId} sem descrição utilizável`,
              "99freelas",
              { url: parsedItem.url },
            );
          }

          const postedAt =
            timestampToIso(parsedItem.postedAtMs) ?? new Date().toISOString();

          projects.push({
            kind: "freelance",
            platform: "99freelas",
            externalId: parsedItem.externalId,
            url: parsedItem.url,
            title: parsedItem.title,
            description,
            budget: detail.budget,
            budgetCurrency: "BRL",
            proposalsCount:
              detail.proposalsCount || parseNinetyNineProposals(parsedItem.infoText),
            clientCountry: "BR",
            clientVerified: false,
            postedAt,
          });
        }

        return {
          projects,
          metadata: {
            listUrl,
            fetched: projects.length,
            keyword: getPrimaryKeyword(config.scoring.keywords),
          },
        };
      } finally {
        await browser.close();
      }
    },
  };
}
