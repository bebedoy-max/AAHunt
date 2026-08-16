import { createFileRoute } from "@tanstack/react-router";
import ApiKeysPage from "@/pages/api-keys";

export const Route = createFileRoute("/api-keys")({
  head: () => ({
    meta: [
      { title: "API Keys & Providers — AA Hunt" },
      {
        name: "description",
        content: "Kelola API key research & structuring: Gemini, Tavily, Exa, Firecrawl, Serper, Groq, dan lainnya.",
      },
      { property: "og:title", content: "API Keys & Providers — AA Hunt" },
      { property: "og:description", content: "Tambah dan rotasi API key yang dipakai mesin riset AA Hunt." },
    ],
  }),
  component: ApiKeysPage,
});
