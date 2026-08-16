import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/pages/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Free Credits Dashboard — AA Hunt" },
      {
        name: "description",
        content:
          "Tracker real-time kredit gratis AI provider dari seluruh dunia — diperbarui otomatis via AI research.",
      },
      { property: "og:title", content: "Free Credits Dashboard — AA Hunt" },
      {
        property: "og:description",
        content: "Pantau provider AI yang menawarkan kredit gratis, termasuk dukungan Kling motion control.",
      },
    ],
  }),
  component: DashboardPage,
});
