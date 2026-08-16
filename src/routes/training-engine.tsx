import { createFileRoute } from "@tanstack/react-router";
import TrainingEnginePage from "@/pages/training-engine";

export const Route = createFileRoute("/training-engine")({
  head: () => ({
    meta: [
      { title: "Training Engine — AA Hunt" },
      {
        name: "description",
        content:
          "Database parameter untuk melatih AI researcher: tambahkan link website per kategori riset dan biarkan mesin mempelajari isinya.",
      },
      { property: "og:title", content: "Training Engine — AA Hunt" },
      {
        property: "og:description",
        content: "Latih mesin riset AA Hunt dengan sumber website nyata agar hasil research lebih akurat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingEnginePage,
});
