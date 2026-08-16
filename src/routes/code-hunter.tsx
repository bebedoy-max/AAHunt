import { createFileRoute } from "@tanstack/react-router";
import CodeHunterPage from "@/pages/code-hunter";

export const Route = createFileRoute("/code-hunter")({
  head: () => ({
    meta: [
      { title: "Promo Codes — AA Hunt" },
      {
        name: "description",
        content: "Kode promo & diskon aktif dari berbagai platform AI — dicari & diverifikasi via AI.",
      },
      { property: "og:title", content: "Promo Codes — AA Hunt" },
      { property: "og:description", content: "Kumpulan kode promo AI terverifikasi, diperbarui otomatis." },
    ],
  }),
  component: CodeHunterPage,
});
