import { fail, handleOptions, ok, requireMethod } from "./_lib/ai.js";
import { isValidSyncCode, kv, syncKeyFor } from "./_lib/sync.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "GET")) return;

  try {
    const url = new URL(request.url, "http://localhost");
    const code = (url.searchParams.get("code") ?? "").trim().toUpperCase();

    if (!isValidSyncCode(code)) {
      ok(response, { updatedAt: 0, payload: null });
      return;
    }

    const record = await kv.get(syncKeyFor(code));
    ok(response, record ?? { updatedAt: 0, payload: null });
  } catch (error) {
    fail(response, error, "Failed to pull sync data");
  }
}
