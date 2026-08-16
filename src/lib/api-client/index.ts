// Auto-configures API base URL from VITE_API_BASE_URL env variable.
import { setBaseUrl } from "./custom-fetch";

const envApiUrl = import.meta.env['VITE_API_BASE_URL'] as string | undefined;
if (envApiUrl) {
  setBaseUrl(envApiUrl.replace(/\/+$/, ""));
}

export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
