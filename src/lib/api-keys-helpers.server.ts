const PREFIX_MAP: Record<string, string[]> = {
  gemini: ["AIza", "AQ"],
  openai: ["sk-"],
  tavily: ["tvly-"],
  exa: ["exa-"],
  firecrawl: ["fc-"],
  serper: [],
  perplexity: ["pplx-"],
  groq: ["gsk_"],
};

export const VALID_PROVIDERS = [
  "gemini", "tavily", "exa", "firecrawl", "serper", "openai", "perplexity", "groq",
];

export function checkPrefixValid(provider: string, apiKey: string): boolean {
  const prefixes = PREFIX_MAP[provider] ?? [];
  if (prefixes.length === 0) return true;
  return prefixes.some((p) => apiKey.startsWith(p));
}

export function maskKey(apiKey: string): string {
  const first = apiKey.slice(0, 6);
  const last = apiKey.slice(-4);
  const middle = Math.max(0, apiKey.length - 10);
  return `${first}${"•".repeat(middle)}${last}`;
}

export interface ApiKeyRow {
  id: number;
  provider: string;
  label: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
}

export function serializeApiKey(row: ApiKeyRow) {
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    apiKey: maskKey(row.api_key),
    isActive: row.is_active,
    createdAt: row.created_at,
    prefixValid: checkPrefixValid(row.provider, row.api_key),
  };
}
