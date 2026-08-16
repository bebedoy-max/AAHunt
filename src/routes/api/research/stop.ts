import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { researchState } from "@/lib/research-state.server";

async function stopResearch() {
  researchState.cancelRequested = true;

  if (!isSupabaseConfigured()) {
    researchState.running = false;
    return json({ stopped: true, jobs_stopped: 0 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("research_jobs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: "Research dihentikan oleh user",
    })
    .in("status", ["pending", "running"])
    .select("id");

  if (error) return json({ error: error.message }, 500);

  researchState.running = false;
  researchState.currentJobId = null;

  return json({ stopped: true, jobs_stopped: data?.length ?? 0 });
}

export const Route = createFileRoute("/api/research/stop")({
  server: {
    handlers: {
      POST: async () => stopResearch(),
    },
  },
});
