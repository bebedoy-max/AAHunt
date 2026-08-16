import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { researchState } from "@/lib/research-state.server";

export const Route = createFileRoute("/api/research/trigger")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (researchState.running) {
            return json({ error: "A research job is already running" }, 409);
          }

          const supabase = getAdminClient();
          const { data: active, error: activeErr } = await supabase
            .from("research_jobs")
            .select("id")
            .in("status", ["pending", "running"])
            .limit(1);
          if (activeErr) throw new Error(activeErr.message);
          if (active && active.length > 0) {
            return json({ error: "A research job is already running" }, 409);
          }

          let body: { targets?: unknown } = {};
          try {
            body = (await request.json()) as { targets?: unknown };
          } catch {
            body = {};
          }
          const targets: string[] =
            Array.isArray(body.targets) && body.targets.length > 0
              ? (body.targets as unknown[]).filter((t): t is string => typeof t === "string")
              : ["providers", "codes", "content"];

          const startedAt = new Date().toISOString();
          const { data: job, error: insertErr } = await supabase
            .from("research_jobs")
            .insert({ status: "running", started_at: startedAt, targets: JSON.stringify(targets) })
            .select("*")
            .single();
          if (insertErr) throw new Error(insertErr.message);
          if (!job) return json({ error: "Failed to create research job" }, 500);

          researchState.running = true;
          researchState.cancelRequested = false;
          researchState.currentJobId = job["id"] as number;
          void (async () => {
            try {
              const { runResearchJob } = await import("@/lib/research/gemini-research.server");
              await runResearchJob(job["id"] as number, targets);
            } finally {
              researchState.running = false;
              researchState.cancelRequested = false;
              researchState.currentJobId = null;
            }
          })();

          return json({
            id: job["id"],
            status: job["status"],
            started_at: job["started_at"],
            completed_at: null,
            providers_found: null,
            providers_updated: null,
            error_message: null,
            log: null,
            targets: job["targets"],
          });
        } catch {
          researchState.running = false;
          return json({ error: "Failed to trigger research" }, 500);
        }
      },
    },
  },
});
