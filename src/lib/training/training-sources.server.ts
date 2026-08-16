import { getAdminClient } from "../supabase.server";
import { geminiGenerate } from "../research/gemini-model.server";

/** Kategori riset yang didukung mesin training. */
export const TRAINING_CATEGORIES = [
  "provider_aggregator",
  "blog_tutorial",
  "social_media",
  "news",
  "promo_code",
] as const;

export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export const TRAINING_CATEGORY_LABELS: Record<string, string> = {
  provider_aggregator: "Provider/Aggregator AI",
  blog_tutorial: "Blog/Tutorial",
  social_media: "Sosial Media",
  news: "Berita",
  promo_code: "Promo Code",
};

export interface TrainingSourceRow {
  id: number;
  url: string;
  category: string;
  label: string | null;
  notes: string | null;
  is_active: boolean;
  status: string; // pending | learning | learned | failed
  site_name: string | null;
  summary: string | null;
  knowledge: string | null; // JSON string
  content_chars: number | null;
  error_message: string | null;
  last_learned_at: string | null;
  created_at: string;
}

export interface LearnedKnowledge {
  site_name: string;
  what_it_is: string;
  why_useful: string;
  key_entities: string[];
  search_queries: string[];
  extraction_hints: string[];
  update_frequency: string | null;
  reliability: string | null;
}

export function serializeTrainingSource(row: TrainingSourceRow) {
  let knowledge: LearnedKnowledge | null = null;
  if (row.knowledge) {
    try {
      knowledge = JSON.parse(row.knowledge) as LearnedKnowledge;
    } catch {
      knowledge = null;
    }
  }
  return {
    id: row.id,
    url: row.url,
    category: row.category,
    categoryLabel: TRAINING_CATEGORY_LABELS[row.category] ?? row.category,
    label: row.label,
    notes: row.notes,
    isActive: row.is_active,
    status: row.status,
    siteName: row.site_name,
    summary: row.summary,
    knowledge,
    contentChars: row.content_chars,
    errorMessage: row.error_message,
    lastLearnedAt: row.last_learned_at,
    createdAt: row.created_at,
  };
}

async function keysFor(provider: string): Promise<string[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("api_key, is_active")
      .eq("provider", provider);
    if (error || !data) return [];
    return (data as { api_key: string; is_active: boolean }[])
      .sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0))
      .map((r) => r.api_key);
  } catch {
    return [];
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ambil isi halaman sungguhan: Firecrawl scrape → fallback fetch HTML. */
export async function fetchPageContent(url: string): Promise<{ text: string; via: string }> {
  const fcKeys = await keysFor("firecrawl");
  for (const key of fcKeys) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      if (!res.ok) throw new Error(`Firecrawl ${res.status}`);
      const data = (await res.json()) as { data?: { markdown?: string } };
      const md = data.data?.markdown?.trim();
      if (md) return { text: md, via: "firecrawl" };
    } catch {
      /* coba key/metode berikutnya */
    }
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AAHuntTrainingBot/1.0; +https://aahunt.app) AppleWebKit/537.36 Chrome/122 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Gagal fetch halaman (HTTP ${res.status})`);
  const body = await res.text();
  const text = htmlToText(body);
  if (text.length < 200) throw new Error("Halaman terbaca tapi isinya terlalu sedikit untuk dipelajari.");
  return { text, via: "direct-fetch" };
}

const LEARN_PROMPT = (url: string, category: string, content: string) => `
You are training a research engine that hunts for FREE AI credits, free trials, and promo codes.
Analyze the REAL page content below (fetched from ${url}, research category: ${TRAINING_CATEGORY_LABELS[category] ?? category})
and distill reusable knowledge that will make future research on this source more accurate.

Return STRICT JSON only, no markdown:
{
  "site_name": "short name of the site/source",
  "what_it_is": "1-2 sentences: what this source publishes",
  "why_useful": "1-2 sentences: how it helps find free AI credits / promo codes",
  "key_entities": ["providers, brands, products or authors repeatedly mentioned (max 15)"],
  "search_queries": ["8-14 high-yield search queries (include site: operators for this domain where useful)"],
  "extraction_hints": ["4-8 concrete hints: where offers/codes appear, wording patterns, page paths, expiry conventions"],
  "update_frequency": "how often it seems to publish, or null",
  "reliability": "high | medium | low + one clause why"
}

PAGE CONTENT:
"""
${content.substring(0, 28000)}
"""
`;

function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}

async function analyzeWithLLM(prompt: string): Promise<string> {
  const geminiKeys = await keysFor("gemini");
  for (const key of geminiKeys) {
    try {
      const out = await geminiGenerate(key, { prompt, json: true, maxOutputTokens: 4096 });
      if (out.trim()) return out;
    } catch {
      /* next key */
    }
  }
  const openaiKeys = await keysFor("openai");
  for (const key of openaiKeys) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const out = data.choices?.[0]?.message?.content ?? "";
      if (out.trim()) return out;
    } catch {
      /* next key */
    }
  }
  throw new Error("Tidak ada API key Gemini/OpenAI aktif untuk menganalisis halaman.");
}

/** Benar-benar fetch halaman + analisis LLM, lalu simpan pengetahuannya ke DB. */
export async function learnTrainingSource(id: number): Promise<ReturnType<typeof serializeTrainingSource>> {
  const supabase = getAdminClient();
  const { data: row, error } = await supabase.from("training_sources").select("*").eq("id", id).single();
  if (error || !row) throw new Error(error?.message ?? "Training source tidak ditemukan");
  const source = row as TrainingSourceRow;

  await supabase.from("training_sources").update({ status: "learning", error_message: null }).eq("id", id);

  try {
    const { text, via } = await fetchPageContent(source.url);
    const raw = await analyzeWithLLM(LEARN_PROMPT(source.url, source.category, text));
    const k = parseJsonLoose<LearnedKnowledge>(raw);

    const knowledge: LearnedKnowledge = {
      site_name: k.site_name ?? source.url,
      what_it_is: k.what_it_is ?? "",
      why_useful: k.why_useful ?? "",
      key_entities: Array.isArray(k.key_entities) ? k.key_entities.slice(0, 15) : [],
      search_queries: Array.isArray(k.search_queries) ? k.search_queries.slice(0, 14) : [],
      extraction_hints: Array.isArray(k.extraction_hints) ? k.extraction_hints.slice(0, 8) : [],
      update_frequency: k.update_frequency ?? null,
      reliability: k.reliability ?? null,
    };

    const { data: updated, error: upErr } = await supabase
      .from("training_sources")
      .update({
        status: "learned",
        site_name: knowledge.site_name,
        summary: `${knowledge.what_it_is} ${knowledge.why_useful}`.trim(),
        knowledge: JSON.stringify(knowledge),
        content_chars: text.length,
        error_message: null,
        last_learned_at: new Date().toISOString(),
        notes: source.notes ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);
    console.info(`Training source #${id} learned via ${via} (${text.length} chars)`);
    return serializeTrainingSource(updated as TrainingSourceRow);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { data: failed } = await supabase
      .from("training_sources")
      .update({ status: "failed", error_message: msg.substring(0, 500) })
      .eq("id", id)
      .select("*")
      .single();
    if (failed) return serializeTrainingSource(failed as TrainingSourceRow);
    throw err;
  }
}

/** Konteks training siap-pakai untuk prompt riset + query tambahan. */
export async function getTrainingContext(
  categories: TrainingCategory[] | string[],
): Promise<{ context: string; queries: string[]; sourceCount: number }> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("training_sources")
      .select("*")
      .eq("is_active", true)
      .eq("status", "learned")
      .in("category", categories as string[]);
    if (error || !data || data.length === 0) return { context: "", queries: [], sourceCount: 0 };

    const rows = data as TrainingSourceRow[];
    const blocks: string[] = [];
    const queries: string[] = [];

    for (const r of rows) {
      let k: LearnedKnowledge | null = null;
      try {
        k = r.knowledge ? (JSON.parse(r.knowledge) as LearnedKnowledge) : null;
      } catch {
        k = null;
      }
      if (!k) continue;
      blocks.push(
        [
          `• SOURCE: ${k.site_name} (${r.url}) — category: ${TRAINING_CATEGORY_LABELS[r.category] ?? r.category}`,
          `  What it is: ${k.what_it_is}`,
          `  Why useful: ${k.why_useful}`,
          k.key_entities.length ? `  Key entities: ${k.key_entities.join(", ")}` : "",
          k.extraction_hints.length ? `  Extraction hints: ${k.extraction_hints.join(" | ")}` : "",
          k.reliability ? `  Reliability: ${k.reliability}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
      queries.push(...k.search_queries);
    }

    if (blocks.length === 0) return { context: "", queries: [], sourceCount: 0 };

    const context = `
=== TRAINED SOURCE KNOWLEDGE (learned from real pages — prioritize these sources) ===
${blocks.join("\n\n")}

INSTRUCTIONS: Actively search and cross-check the trained sources above (use site: operators on their domains),
apply their extraction hints, and prefer offers you can trace back to them. Still include other sources you find.
=== END TRAINED SOURCE KNOWLEDGE ===
`;
    return { context, queries: Array.from(new Set(queries)).slice(0, 24), sourceCount: blocks.length };
  } catch {
    return { context: "", queries: [], sourceCount: 0 };
  }
}
