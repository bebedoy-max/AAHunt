import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/providers/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isSupabaseConfigured()) return json([]);
        try {
          const url = new URL(request.url);
          const category = url.searchParams.get("category");
          const hasKlingParam = url.searchParams.get("has_kling");
          const status = url.searchParams.get("status");
          const entityType = url.searchParams.get("entity_type");

          const supabase = getAdminClient();
          let query = supabase.from("providers").select("*");

          if (category) query = query.eq("category", category);
          if (hasKlingParam !== null) query = query.eq("has_kling", hasKlingParam === "true");
          if (status) query = query.eq("status", status);
          if (entityType) query = query.eq("entity_type", entityType);

          const { data, error } = await query
            .order("quality_score", { ascending: false })
            .order("has_kling", { ascending: false })
            .order("name", { ascending: true });

          if (error) throw new Error(error.message);
          return json(data ?? []);
        } catch {
          return json({ error: "Failed to list providers" }, 500);
        }
      },
    },
  },
});
