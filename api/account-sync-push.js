import { badRequest, fail, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";
import { requireUser } from "./_lib/auth.js";
import { isPayloadTooLarge, kv, SYNC_TTL_SECONDS } from "./_lib/sync.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  const user = await requireUser(request, response);
  if (!user) return;

  try {
    const body = await readJsonBody(request);
    const updatedAt = Number(body.updatedAt);
    const payload = body.payload;

    if (!Number.isFinite(updatedAt) || !payload || typeof payload !== "object") {
      badRequest(response, "Missing updatedAt or payload");
      return;
    }

    if (isPayloadTooLarge(payload)) {
      badRequest(response, "Payload too large");
      return;
    }

    await kv.set(`account-sync:${user.id}`, { updatedAt, payload }, { ex: SYNC_TTL_SECONDS });
    ok(response, { updatedAt });
  } catch (error) {
    fail(response, error, "Failed to push sync data");
  }
}
