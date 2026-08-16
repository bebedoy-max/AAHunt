import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient } from "@/lib/supabase.server";
import { json } from "@/lib/api-response.server";
import { serializeApiKey, VALID_PROVIDERS, type ApiKeyRow } from "@/lib/api-keys-helpers.server";

export const Route = createFileRoute("/api/api-keys/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabase = getAdminClient();
          const { data, error } = await supabase
            .from("api_keys")
            .select("*")
            .order("provider", { ascending: true })
            .order("created_at", { ascending: true });
          if (error) {
            // Table not created yet in the external Supabase project.
            if (error.code === "PGRST205") {
              console.warn("api_keys table missing — run supabase/schema.sql");
              return json([]);
            }
            throw new Error(error.message);
          }
          return json((data ?? []).map((r) => serializeApiKey(r as ApiKeyRow)));
        } catch (e) {
          console.error(e);
          return json({ error: `Failed to list api keys: ${(e as Error).message}` }, 500);
        }
      },

      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            provider?: string;
            label?: string;
            apiKey?: string;
            setActive?: boolean;
          };
          const { provider, label, apiKey, setActive } = body;

          if (!provider || !apiKey) {
            return json({ error: "provider and apiKey are required" }, 400);
          }
          if (!VALID_PROVIDERS.includes(provider)) {
            return json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}` }, 400);
          }

          const supabase = getAdminClient();
          const { data: existing, error: existingErr } = await supabase
            .from("api_keys")
            .select("id")
            .eq("provider", provider);
          if (existingErr) throw new Error(existingErr.message);

          const autoLabel = label?.trim() || `${provider} Key ${(existing?.length ?? 0) + 1}`;

          if (setActive) {
            const { error: deactivateErr } = await supabase
              .from("api_keys")
              .update({ is_active: false })
              .eq("provider", provider);
            if (deactivateErr) throw new Error(deactivateErr.message);
          }

          const { data: inserted, error: insertErr } = await supabase
            .from("api_keys")
            .insert({ provider, label: autoLabel, api_key: apiKey, is_active: setActive ?? false })
            .select("*")
            .single();
          if (insertErr) throw new Error(insertErr.message);

          return json(serializeApiKey(inserted as ApiKeyRow), 201);
        } catch {
          return json({ error: "Failed to add api key" }, 500);
        }
      },
      DELETE: async () => {
        try {
          const supabase = getAdminClient();
          const { error } = await supabase.from("api_keys").delete().neq("id", -1);
          if (error) throw new Error(error.message);
          return json({ success: true });
        } catch {
          return json({ error: "Failed to delete api keys" }, 500);
        }
      },
    },
  },
});
