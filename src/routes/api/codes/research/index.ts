import { createFileRoute } from "@tanstack/react-router";
import { codeResearchState } from "@/lib/codes-research-state.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/codes/research/")({
  server: {
    handlers: {
      POST: async () => {
        try {
          if (codeResearchState.running) {
            return json({ error: "Code research is already running" }, 409);
          }

          codeResearchState.running = true;
          codeResearchState.status = {
            status: "running",
            message: "Hunting for promo codes via AI-powered web search…",
            codesFound: 0,
            startedAt: new Date().toISOString(),
            completedAt: null,
            errorMessage: null,
          };

          const responseBody = { ...codeResearchState.status };

          void (async () => {
            try {
              const { runCodeResearchJob } = await import("@/lib/research/gemini-research.server");
              const codesFound = await runCodeResearchJob();
              codeResearchState.status = {
                status: "completed",
                message: `Found ${codesFound} promo codes — database updated.`,
                codesFound,
                startedAt: codeResearchState.status.startedAt,
                completedAt: new Date().toISOString(),
                errorMessage: null,
              };
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              codeResearchState.status = {
                status: "failed",
                message: "Code research failed.",
                codesFound: 0,
                startedAt: codeResearchState.status.startedAt,
                completedAt: new Date().toISOString(),
                errorMessage: errMsg,
              };
            } finally {
              codeResearchState.running = false;
            }
          })();

          return json(responseBody);
        } catch {
          codeResearchState.running = false;
          return json({ error: "Failed to trigger code research" }, 500);
        }
      },
    },
  },
});
