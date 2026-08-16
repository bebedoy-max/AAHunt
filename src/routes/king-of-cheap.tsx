import { createFileRoute } from "@tanstack/react-router";
import KingOfCheapPage from "@/pages/king-of-cheap";

export const Route = createFileRoute("/king-of-cheap")({
  head: () => ({
    meta: [
      { title: "King of Cheap — AA Hunt" },
      {
        name: "description",
        content: "Ranking AI provider berdasarkan kualitas deal — diurutkan dari score tertinggi.",
      },
      { property: "og:title", content: "King of Cheap — AA Hunt" },
      { property: "og:description", content: "Peringkat penawaran kredit gratis AI provider terbaik." },
    ],
  }),
  component: KingOfCheapPage,
});
