import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/providers/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isFinite(id)) {
            return json({ error: "Invalid provider ID" }, 400);
          }

          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("providers")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (error) throw new Error(error.message);
          if (!data) return json({ error: "Provider not found" }, 404);

          return json(data);
        } catch {
          return json({ error: "Failed to get provider" }, 500);
        }
      },
    },
  },
});
