import { loadConfig } from "@/lib/config";
import { fetchRobotsTxt, isPathAllowed } from "@/lib/robots";
import {
  createScrapingBrowser,
  createScrapingPage,
  isCloudflareChallenge,
} from "@/lib/adapters/playwright-utils";
import {
  parseWorkanaProposals,
  WorkanaListItemSchema,
} from "@/lib/adapters/scraping-schemas";
import { AdapterError, type Adapter, type FetchProjectsResult, type RawProject } from "@/lib/adapters/types";

const ORIGIN = "https://www.workana.com";
const LIST_PATH = "/jobs?language=pt&page=1";
const LIST_SELECTOR = "#projects .project-item";

function parseWorkanaBudget(budgetText: string | null): {
  value: number | null;
  currency: string;
} {
  if (!budgetText) return { value: null, currency: "USD" };

  const valueMatch = budgetText.match(/([\d.,]+)/);
  const value = valueMatch
    ? Number(valueMatch[1].replace(/\./g, "").replace(",", "."))
    : null;

  const currency = budgetText.includes("R$")
    ? "BRL"
    : budgetText.includes("USD") || budgetText.includes("US$")
      ? "USD"
      : "USD";

  return { value: Number.isNaN(value) ? null : value, currency };
}

export function createWorkanaAdapter(): Adapter {
  return {
    name: "workana",

    async fetchProjects(): Promise<FetchProjectsResult> {
      const config = loadConfig();

      if (config.worker.respect_robots_txt) {
        const robotsTxt = await fetchRobotsTxt(ORIGIN);
        if (!isPathAllowed(robotsTxt, "/jobs")) {
          throw new AdapterError(
            "robots.txt do Workana bloqueia /jobs",
            "workana",
          );
        }
      }

      const browser = await createScrapingBrowser();
      const page = await createScrapingPage(browser);

      try {
        const listUrl = `${ORIGIN}${LIST_PATH}`;
        const response = await page.goto(listUrl, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        await page.waitForTimeout(5000);

        const title = await page.title();
        const bodyText = await page.locator("body").innerText();

        if (isCloudflareChallenge(title, bodyText)) {
          throw new AdapterError(
            "Workana bloqueou a coleta via Cloudflare (challenge detectado). Coleta manual necessária ou rode o worker em ambiente com acesso humano ao site.",
            "workana",
            {
              url: listUrl,
              status: response?.status(),
              title,
            },
          );
        }

        if (!response?.ok()) {
          throw new AdapterError(
            `Workana retornou HTTP ${response?.status() ?? "unknown"}`,
            "workana",
            { url: listUrl, status: response?.status() },
          );
        }

        const hasList = (await page.locator(LIST_SELECTOR).count()) > 0;
        if (!hasList) {
          throw new AdapterError(
            `Seletor ${LIST_SELECTOR} não encontrado — layout do Workana pode ter mudado ou a página não carregou projetos`,
            "workana",
            {
              url: listUrl,
              selector: LIST_SELECTOR,
              title,
            },
          );
        }

        const listItems = await page.$$eval(LIST_SELECTOR, (items) =>
          items.slice(0, 20).map((item) => {
            const header = item.querySelector(".project-header");
            const titleNode = header?.querySelector("h2");
            const linkNode = header?.querySelector("a") as HTMLAnchorElement | null;
            const descriptionNode =
              item.querySelector(".project-body .html-text") ??
              item.querySelector(".project-body .description") ??
              item.querySelector(".project-body");
            const budgetNode = item.querySelector(".project-actions .budget");
            const bidsNode = item.querySelector(".project-body .bids");
            const dateNode = header?.querySelector(".date");

            const href = linkNode?.href ?? "";
            const externalId =
              href.match(/\/job\/([^/?#]+)/)?.[1] ??
              href.match(/(\d+)/)?.[1] ??
              "";

            return {
              externalId,
              title: titleNode?.textContent?.trim() ?? "",
              url: href.startsWith("http") ? href : `https://www.workana.com${href}`,
              description: descriptionNode?.textContent?.trim() ?? "",
              budgetText: budgetNode?.textContent?.trim() ?? null,
              proposalsText: bidsNode?.textContent?.trim() ?? null,
              postedText: dateNode?.textContent?.trim() ?? null,
            };
          }),
        );

        const projects: RawProject[] = [];

        for (const item of listItems) {
          const parsed = WorkanaListItemSchema.parse(item);

          if (!parsed.description.trim()) {
            throw new AdapterError(
              `Projeto Workana ${parsed.externalId} retornou sem descrição — seletor .project-body pode ter mudado`,
              "workana",
              { url: parsed.url, selector: ".project-body" },
            );
          }

          const budget = parseWorkanaBudget(parsed.budgetText);

          projects.push({
            kind: "freelance",
            platform: "workana",
            externalId: parsed.externalId,
            url: parsed.url,
            title: parsed.title,
            description: parsed.description,
            budget: budget.value,
            budgetCurrency: budget.currency,
            proposalsCount: parseWorkanaProposals(parsed.proposalsText),
            clientCountry: null,
            clientVerified: false,
            postedAt: new Date().toISOString(),
          });
        }

        return {
          projects,
          metadata: {
            listUrl,
            fetched: projects.length,
          },
        };
      } finally {
        await browser.close();
      }
    },
  };
}
