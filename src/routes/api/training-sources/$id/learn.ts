import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/training-sources/$id/learn")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);
          const { learnTrainingSource } = await import("@/lib/training/training-sources.server");
          return json(await learnTrainingSource(id));
        } catch (e) {
          return json({ error: (e as Error).message }, 500);
        }
      },
    },
  },
});
