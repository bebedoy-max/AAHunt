import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/codes/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const status = url.searchParams.get("status");

          const supabase = getAdminClient();
          let query = supabase.from("promo_codes").select("*");

          if (status) {
            query = query.eq("status", status).order("updated_at", { ascending: false });
          }

          const { data, error } = await query;
          if (error) throw new Error(error.message);

          let codes = data ?? [];
          if (!status) {
            const rank = (s: string) => (s === "active" ? 0 : s === "unverified" ? 1 : 2);
            codes = [...codes].sort((a, b) => {
              const r = rank(a["status"] as string) - rank(b["status"] as string);
              if (r !== 0) return r;
              return String(b["updated_at"]).localeCompare(String(a["updated_at"]));
            });
          }

          return json(codes);
        } catch {
          return json({ error: "Failed to list promo codes" }, 500);
        }
      },
    },
  },
});
