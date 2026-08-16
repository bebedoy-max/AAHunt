import { GoogleGenAI } from "@google/genai";

/**
 * Gemini model fallback list. Older keys can still use gemini-2.5-flash, but
 * newer API keys get a 404 ("model is no longer available to new users"),
 * so we try the current aliases first and fall through on model-not-found.
 */
const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
] as const;

/** Hard cap so one hanging request cannot freeze the whole research job. */
export const GEMINI_TIMEOUT_MS = 120_000;

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e as Error); },
    );
  });
}

function isModelUnavailable(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("no longer available") ||
    msg.includes("not supported")
  );
}

interface GeminiOptions {
  prompt: string;
  googleSearch?: boolean;
  json?: boolean;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

/** Generate text with Gemini, trying each supported model until one works. */
export async function geminiGenerate(apiKey: string, opts: GeminiOptions): Promise<string> {
  const genai = new GoogleGenAI({ apiKey });
  let lastErr: unknown = new Error("No Gemini model available");

  for (const model of GEMINI_MODELS) {
    try {
      const response = await withTimeout(
        genai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
          config: {
            ...(opts.googleSearch ? { tools: [{ googleSearch: {} }] } : {}),
            ...(opts.json ? { responseMimeType: "application/json" } : {}),
            maxOutputTokens: opts.maxOutputTokens ?? 16384,
          },
        }),
        opts.timeoutMs ?? GEMINI_TIMEOUT_MS,
        `Gemini (${model})`,
      );
      return response.text ?? "";
    } catch (err) {
      lastErr = err;
      if (isModelUnavailable(err)) continue; // try the next model name
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
