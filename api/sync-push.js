import { badRequest, fail, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";
import { isPayloadTooLarge, isValidSyncCode, kv, syncKeyFor, SYNC_TTL_SECONDS } from "./_lib/sync.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  try {
    const body = await readJsonBody(request);
    const code = String(body.code ?? "").trim().toUpperCase();
    const updatedAt = Number(body.updatedAt);
    const payload = body.payload;

    if (!isValidSyncCode(code)) {
      badRequest(response, "Invalid sync code");
      return;
    }

    if (!Number.isFinite(updatedAt) || !payload || typeof payload !== "object") {
      badRequest(response, "Missing updatedAt or payload");
      return;
    }

    if (isPayloadTooLarge(payload)) {
      badRequest(response, "Payload too large");
      return;
    }

    await kv.set(syncKeyFor(code), { updatedAt, payload }, { ex: SYNC_TTL_SECONDS });
    ok(response, { updatedAt });
  } catch (error) {
    fail(response, error, "Failed to push sync data");
  }
}
