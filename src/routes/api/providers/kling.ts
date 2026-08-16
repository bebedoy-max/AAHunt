import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/providers/kling")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("providers")
            .select("*")
            .eq("has_kling", true)
            .order("name", { ascending: true });
          if (error) throw new Error(error.message);
          return json(data ?? []);
        } catch {
          return json({ error: "Failed to get kling providers" }, 500);
        }
      },
    },
  },
});
