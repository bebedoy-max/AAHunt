import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { serializeApiKey, type ApiKeyRow } from "@/lib/api-keys-helpers.server";

export const Route = createFileRoute("/api/api-keys/$id/activate")({
  server: {
    handlers: {
      PATCH: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

          const supabase = getAdminClient();
          const { data: target, error: targetErr } = await supabase
            .from("api_keys")
            .select("*")
            .eq("id", id)
            .maybeSingle<ApiKeyRow>();
          if (targetErr) throw new Error(targetErr.message);
          if (!target) return json({ error: "Key not found" }, 404);

          const { error: deactivateErr } = await supabase
            .from("api_keys")
            .update({ is_active: false })
            .eq("provider", target.provider);
          if (deactivateErr) throw new Error(deactivateErr.message);

          const { data: updated, error: updateErr } = await supabase
            .from("api_keys")
            .update({ is_active: true })
            .eq("id", id)
            .select("*")
            .single<ApiKeyRow>();
          if (updateErr) throw new Error(updateErr.message);

          return json(serializeApiKey(updated));
        } catch {
          return json({ error: "Failed to activate api key" }, 500);
        }
      },
    },
  },
});
