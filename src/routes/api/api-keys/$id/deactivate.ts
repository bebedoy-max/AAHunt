import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { serializeApiKey, type ApiKeyRow } from "@/lib/api-keys-helpers.server";

export const Route = createFileRoute("/api/api-keys/$id/deactivate")({
  server: {
    handlers: {
      PATCH: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

          const supabase = getAdminClient();
          const { data: updated, error } = await supabase
            .from("api_keys")
            .update({ is_active: false })
            .eq("id", id)
            .select("*")
            .maybeSingle<ApiKeyRow>();
          if (error) throw new Error(error.message);
          if (!updated) return json({ error: "Key not found" }, 404);

          return json(serializeApiKey(updated));
        } catch {
          return json({ error: "Failed to deactivate api key" }, 500);
        }
      },
    },
  },
});
