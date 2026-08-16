import { createFileRoute } from "@tanstack/react-router";
import ProviderDetailPage from "@/pages/provider-detail";

export const Route = createFileRoute("/providers/$id")({
  head: () => ({
    meta: [
      { title: "Detail Provider — AA Hunt" },
      {
        name: "description",
        content: "Detail penawaran kredit gratis provider AI: jumlah kredit, syarat kartu kredit, dan dukungan Kling.",
      },
      { property: "og:title", content: "Detail Provider — AA Hunt" },
      { property: "og:description", content: "Informasi lengkap penawaran kredit gratis satu provider AI." },
    ],
  }),
  component: ProviderDetailPage,
});
