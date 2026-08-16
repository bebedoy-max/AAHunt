import { createFileRoute } from "@tanstack/react-router";
import ResearchPage from "@/pages/research";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Operations — AA Hunt" },
      {
        name: "description",
        content: "Pilih jenis riset yang ingin dijalankan, lalu mulai scan provider, promo code, dan konten.",
      },
      { property: "og:title", content: "Research Operations — AA Hunt" },
      { property: "og:description", content: "Trigger riset AI dan pantau log job secara real-time." },
    ],
  }),
  component: ResearchPage,
});
