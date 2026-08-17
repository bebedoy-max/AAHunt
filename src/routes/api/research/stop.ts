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
  const { data: activeJobs, error: readError } = await supabase
    .from("research_jobs")
    .select("id,log")
    .in("status", ["pending", "running"]);
  if (readError) return json({ error: readError.message }, 500);

  const stoppedAt = new Date().toISOString();
  for (const job of activeJobs ?? []) {
    const previousLog = typeof job["log"] === "string" ? job["log"] : "";
    const stopLine = `[${stoppedAt}] STOPPED BY USER`;
    const nextLog = previousLog ? `${previousLog}\n${stopLine}` : stopLine;
    const { error } = await supabase
      .from("research_jobs")
      .update({
        status: "failed",
        completed_at: stoppedAt,
        error_message: "Research dihentikan oleh user",
        log: nextLog,
      })
      .eq("id", job["id"]);
    if (error) return json({ error: error.message }, 500);
  }

  researchState.running = false;
  researchState.currentJobId = null;

  return json({ stopped: true, jobs_stopped: activeJobs?.length ?? 0 });
}

export const Route = createFileRoute("/api/research/stop")({
  server: {
    handlers: {
      POST: async () => stopResearch(),
    },
  },
});
