import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import {
  TRAINING_CATEGORIES,
  serializeTrainingSource,
  type TrainingSourceRow,
} from "@/lib/training/training-sources.server";

export const Route = createFileRoute("/api/training-sources/")({
  server: {
    handlers: {
      GET: async () => {
        if (!isSupabaseConfigured()) return json([]);
        try {
          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("training_sources")
            .select("*")
            .order("category", { ascending: true })
            .order("created_at", { ascending: false });
          if (error) {
            if (error.code === "PGRST205") {
              console.warn("training_sources table missing — run supabase/schema.sql");
              return json([]);
            }
            throw new Error(error.message);
          }
          return json((data ?? []).map((r) => serializeTrainingSource(r as TrainingSourceRow)));
        } catch (e) {
          return json({ error: `Failed to list training sources: ${(e as Error).message}` }, 500);
        }
      },

      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            url?: string;
            category?: string;
            label?: string;
            notes?: string;
            learnNow?: boolean;
          };
          const rawUrl = body.url?.trim();
          const category = body.category?.trim();
          if (!rawUrl || !category) return json({ error: "url dan category wajib diisi" }, 400);
          if (!(TRAINING_CATEGORIES as readonly string[]).includes(category)) {
            return json({ error: `category harus salah satu dari: ${TRAINING_CATEGORIES.join(", ")}` }, 400);
          }
          let url: string;
          try {
            const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
            if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad protocol");
            url = parsed.toString();
          } catch {
            return json({ error: "URL tidak valid" }, 400);
          }

          const supabase = getAdminClient();
          const { data: inserted, error } = await supabase
            .from("training_sources")
            .insert({
              url,
              category,
              label: body.label?.trim() || null,
              notes: body.notes?.trim() || null,
              is_active: true,
              status: "pending",
            })
            .select("*")
            .single();
          if (error) {
            if (error.code === "23505" || error.code === "23514" || error.message.includes("duplicate")) {
              return json({ error: "URL ini sudah ada di kategori tersebut" }, 409);
            }
            if (error.code === "PGRST205") {
              return json({ error: "Tabel training_sources belum ada — jalankan supabase/schema.sql" }, 503);
            }
            throw new Error(error.message);
          }

          const row = serializeTrainingSource(inserted as TrainingSourceRow);

          if (body.learnNow) {
            const { learnTrainingSource } = await import("@/lib/training/training-sources.server");
            try {
              return json(await learnTrainingSource(row.id), 201);
            } catch {
              return json(row, 201);
            }
          }
          return json(row, 201);
        } catch (e) {
          return json({ error: `Failed to add training source: ${(e as Error).message}` }, 500);
        }
      },
    },
  },
});
