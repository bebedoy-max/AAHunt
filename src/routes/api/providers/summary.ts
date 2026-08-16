import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/providers/summary")({
  server: {
    handlers: {
      GET: async () => {
        if (!isSupabaseConfigured()) {
          return json({
            total_providers: 0,
            kling_providers: 0,
            active_providers: 0,
            no_credit_card_required: 0,
            categories: [],
            last_research_at: null,
          });
        }
        try {
          const supabase = getAdminClient();
          const { data: all, error } = await supabase.from("providers").select("*");
          if (error) throw new Error(error.message);
          const rows = (all ?? []) as Array<{
            category: string;
            has_kling: boolean;
            status: string;
            requires_credit_card: boolean;
          }>;

          const catMap: Record<string, number> = {};
          for (const p of rows) {
            catMap[p.category] = (catMap[p.category] ?? 0) + 1;
          }

          const { data: lastJobs } = await supabase
            .from("research_jobs")
            .select("completed_at")
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
            .limit(1);

          return json({
            total_providers: rows.length,
            kling_providers: rows.filter((p) => p.has_kling).length,
            active_providers: rows.filter((p) => p.status === "active").length,
            no_credit_card_required: rows.filter((p) => !p.requires_credit_card).length,
            categories: Object.entries(catMap).map(([category, count]) => ({ category, count })),
            last_research_at: lastJobs?.[0]?.completed_at ?? null,
          });
        } catch {
          return json({ error: "Failed to get summary" }, 500);
        }
      },
    },
  },
});
