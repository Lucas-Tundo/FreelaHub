import { chromium, type Browser, type Page } from "playwright";

const USER_AGENT =
  "FreelaBoard/1.0 (+local research tool; contact: local-only)";

export async function createScrapingBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
}

export async function createScrapingPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage({
    userAgent: USER_AGENT,
    locale: "pt-BR",
  });
  await page.setExtraHTTPHeaders({
    "Accept-Language": "pt-BR,pt;q=0.9",
  });
  return page;
}

export function isCloudflareChallenge(title: string, bodyText: string): boolean {
  const normalized = `${title}\n${bodyText}`.toLowerCase();
  return (
    normalized.includes("just a moment") ||
    normalized.includes("security verification") ||
    normalized.includes("verificação de segurança")
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function randomDelayMs(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export function parseBrazilianCurrency(value: string | null): number | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

export function timestampToIso(value: string | null): string | null {
  if (!value) return null;
  const ms = Number(value);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function extractFirstMatch(
  text: string,
  pattern: RegExp,
): string | null {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? null;
}
