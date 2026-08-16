import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/research/history")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabase = getAdminClient();
          const { data: jobs, error } = await supabase
            .from("research_jobs")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(50);
          if (error) throw new Error(error.message);

          return json(
            (jobs ?? []).map((job) => ({
              id: job["id"],
              status: job["status"],
              started_at: job["started_at"],
              completed_at: job["completed_at"] ?? null,
              providers_found: job["providers_found"] ?? null,
              providers_updated: job["providers_updated"] ?? null,
              error_message: job["error_message"] ?? null,
              log: job["log"] ?? null,
              targets: job["targets"] ?? null,
            })),
          );
        } catch {
          return json({ error: "Failed to get research history" }, 500);
        }
      },
    },
  },
});
