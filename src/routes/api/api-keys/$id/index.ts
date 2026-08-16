import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { type ApiKeyRow } from "@/lib/api-keys-helpers.server";

export const Route = createFileRoute("/api/api-keys/$id/")({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("api_keys")
            .delete()
            .eq("id", id)
            .select("*")
            .maybeSingle<ApiKeyRow>();
          if (error) throw new Error(error.message);
          if (!data) return json({ error: "Key not found" }, 404);

          return json({ success: true });
        } catch {
          return json({ error: "Failed to delete api key" }, 500);
        }
      },
    },
  },
});
