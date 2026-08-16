import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/training-sources/learn-all")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("training_sources")
            .select("id")
            .eq("is_active", true)
            .in("status", ["pending", "failed"]);
          if (error) throw new Error(error.message);
          const ids = (data ?? []).map((r) => (r as { id: number }).id);
          if (ids.length === 0) return json({ learned: 0, failed: 0, message: "Tidak ada sumber yang perlu dipelajari." });

          const { learnTrainingSource } = await import("@/lib/training/training-sources.server");
          let learned = 0;
          let failed = 0;
          for (const id of ids) {
            try {
              const row = await learnTrainingSource(id);
              if (row.status === "learned") learned++;
              else failed++;
            } catch {
              failed++;
            }
          }
          return json({ learned, failed, message: `Selesai: ${learned} dipelajari, ${failed} gagal.` });
        } catch (e) {
          return json({ error: (e as Error).message }, 500);
        }
      },
    },
  },
});
