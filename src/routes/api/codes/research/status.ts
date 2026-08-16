import { createFileRoute } from "@tanstack/react-router";
import { codeResearchState } from "@/lib/codes-research-state.server";
import { json } from "@/lib/api-response.server";

export const Route = createFileRoute("/api/codes/research/status")({
  server: {
    handlers: {
      GET: async () => json(codeResearchState.status),
    },
  },
});
