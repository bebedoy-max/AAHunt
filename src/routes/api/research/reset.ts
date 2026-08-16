import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/research/reset")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const supabase = getAdminClient();
          const { data: providersDeleted, error: providersErr } = await supabase
            .from("providers")
            .delete()
            .neq("id", -1)
            .select("id");
          if (providersErr) throw new Error(providersErr.message);

          const { data: codesDeleted, error: codesErr } = await supabase
            .from("promo_codes")
            .delete()
            .neq("id", -1)
            .select("id");
          if (codesErr) throw new Error(codesErr.message);

          return json({
            message: "Semua data berhasil direset",
            providers_deleted: providersDeleted?.length ?? 0,
            codes_deleted: codesDeleted?.length ?? 0,
          });
        } catch {
          return json({ error: "Failed to reset data" }, 500);
        }
      },
    },
  },
});
