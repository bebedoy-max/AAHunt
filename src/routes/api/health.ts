import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => json({ status: "ok" }),
    },
  },
});
