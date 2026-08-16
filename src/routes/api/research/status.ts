import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

const emptyStatus = {
  id: 0,
  status: "none",
  started_at: new Date(0).toISOString(),
  completed_at: null,
  providers_found: null,
  providers_updated: null,
  error_message: null,
  log: null,
};

export const Route = createFileRoute("/api/research/status")({
  server: {
    handlers: {
      GET: async () => {
        if (!isSupabaseConfigured()) return json(emptyStatus);
        try {
          const supabase = getAdminClient();
          const { data: job, error } = await supabase
            .from("research_jobs")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) throw new Error(error.message);

          if (!job) {
            return json({
              id: 0,
              status: "none",
              started_at: new Date().toISOString(),
              completed_at: null,
              providers_found: null,
              providers_updated: null,
              error_message: null,
              log: null,
            });
          }

          return json({
            id: job["id"],
            status: job["status"],
            started_at: job["started_at"],
            completed_at: job["completed_at"] ?? null,
            providers_found: job["providers_found"] ?? null,
            providers_updated: job["providers_updated"] ?? null,
            error_message: job["error_message"] ?? null,
            log: job["log"] ?? null,
            targets: job["targets"] ?? null,
          });
        } catch {
          return json({ error: "Failed to get research status" }, 500);
        }
      },
    },
  },
});
