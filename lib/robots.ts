export async function fetchRobotsTxt(origin: string): Promise<string> {
  const url = new URL("/robots.txt", origin).toString();
  const response = await fetch(url, {
    headers: { "User-Agent": "FreelaBoard/1.0" },
  });

  if (!response.ok) {
    throw new Error(`robots.txt indisponível para ${origin} (HTTP ${response.status})`);
  }

  return response.text();
}

export function isPathAllowed(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split(/\r?\n/);
  let appliesToAll = false;
  let disallowRules: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const [directive, valueRaw] = line.split(":", 2);
    if (!directive || !valueRaw) continue;

    const directiveName = directive.trim().toLowerCase();
    const value = valueRaw.trim();

    if (directiveName === "user-agent") {
      appliesToAll = value === "*";
      if (!appliesToAll) {
        disallowRules = [];
      }
      continue;
    }

    if (!appliesToAll) continue;

    if (directiveName === "disallow" && value) {
      disallowRules.push(value);
    }
  }

  return !disallowRules.some((rule) => path.startsWith(rule));
}
