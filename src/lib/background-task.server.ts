import { waitUntil } from "@vercel/functions";

/** Keep asynchronous work attached to the current serverless invocation. */
export function runInBackground(task: Promise<unknown>): void {
  try {
    waitUntil(task);
  } catch {
    // Local development has no Vercel request context.
    void task;
  }
}