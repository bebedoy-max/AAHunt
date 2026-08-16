import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { serializeTrainingSource, type TrainingSourceRow } from "@/lib/training/training-sources.server";

export const Route = createFileRoute("/api/training-sources/$id/")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);
          const body = (await request.json()) as { isActive?: boolean; notes?: string; label?: string };
          const patch: Record<string, unknown> = {};
          if (typeof body.isActive === "boolean") patch["is_active"] = body.isActive;
          if (typeof body.notes === "string") patch["notes"] = body.notes.trim() || null;
          if (typeof body.label === "string") patch["label"] = body.label.trim() || null;
          if (Object.keys(patch).length === 0) return json({ error: "Tidak ada perubahan" }, 400);

          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("training_sources")
            .update(patch)
            .eq("id", id)
            .select("*")
            .single();
          if (error) throw new Error(error.message);
          return json(serializeTrainingSource(data as TrainingSourceRow));
        } catch (e) {
          return json({ error: `Failed to update training source: ${(e as Error).message}` }, 500);
        }
      },

      DELETE: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);
          const supabase = getAdminClient();
          const { error } = await supabase.from("training_sources").delete().eq("id", id);
          if (error) throw new Error(error.message);
          return json({ success: true });
        } catch (e) {
          return json({ error: `Failed to delete training source: ${(e as Error).message}` }, 500);
        }
      },
    },
  },
});
