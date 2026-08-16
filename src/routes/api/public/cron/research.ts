import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { researchState } from "@/lib/research-state.server";

const DEFAULT_TARGETS = ["providers", "codes", "content"];

/**
 * Scheduled auto-research endpoint.
 * Call it once per day (05:00 Asia/Jakarta = 22:00 UTC) from a scheduler
 * (Vercel Cron, cron-job.org, pg_cron, etc.).
 * If CRON_SECRET is set, the caller must send `Authorization: Bearer <secret>`
 * or `?secret=<secret>`.
 */
async function runScheduledResearch(request: Request) {
  const secret = process.env["CRON_SECRET"];
  if (secret) {
    const url = new URL(request.url);
    const provided =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      url.searchParams.get("secret") ??
      "";
    if (provided !== secret) return json({ error: "Unauthorized" }, 401);
  }

  try {
    if (!isSupabaseConfigured()) {
      return json(
        {
          skipped: true,
          reason: "Supabase belum terkonfigurasi: set EXT_SUPABASE_URL dan EXT_SUPABASE_SERVICE_ROLE_KEY.",
        },
        503,
      );
    }

    if (researchState.running) {
      return json({ skipped: true, reason: "A research job is already running" });
    }

    const supabase = getAdminClient();
    const { data: active, error: activeErr } = await supabase
      .from("research_jobs")
      .select("id")
      .in("status", ["pending", "running"])
      .limit(1);
    if (activeErr) throw new Error(activeErr.message);
    if (active && active.length > 0) {
      return json({ skipped: true, reason: "A research job is already running" });
    }

    const startedAt = new Date().toISOString();
    const { data: job, error: insertErr } = await supabase
      .from("research_jobs")
      .insert({
        status: "running",
        started_at: startedAt,
        targets: JSON.stringify(DEFAULT_TARGETS),
      })
      .select("*")
      .single();
    if (insertErr) throw new Error(insertErr.message);
    if (!job) return json({ error: "Failed to create research job" }, 500);

    researchState.running = true;
    void (async () => {
      try {
        const { runResearchJob } = await import("@/lib/research/gemini-research.server");
        await runResearchJob(job["id"] as number, DEFAULT_TARGETS);
      } finally {
        researchState.running = false;
      }
    })();

    return json({ started: true, id: job["id"], started_at: startedAt, targets: DEFAULT_TARGETS });
  } catch (err) {
    researchState.running = false;
    return json({ error: err instanceof Error ? err.message : "Failed to start scheduled research" }, 500);
  }
}

export const Route = createFileRoute("/api/public/cron/research")({
  server: {
    handlers: {
      GET: async ({ request }) => runScheduledResearch(request),
      POST: async ({ request }) => runScheduledResearch(request),
    },
  },
});
