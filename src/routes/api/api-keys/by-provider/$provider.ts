import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { VALID_PROVIDERS } from "@/lib/api-keys-helpers.server";

export const Route = createFileRoute("/api/api-keys/by-provider/$provider")({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        try {
          const { provider } = params;
          if (!VALID_PROVIDERS.includes(provider)) {
            return json({ error: "Invalid provider" }, 400);
          }

          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("api_keys")
            .delete()
            .eq("provider", provider)
            .select("id");
          if (error) throw new Error(error.message);

          return json({ success: true, deleted: data?.length ?? 0 });
        } catch {
          return json({ error: "Failed to delete api keys" }, 500);
        }
      },
    },
  },
});
