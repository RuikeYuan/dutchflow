import { fail, handleOptions, ok, requireMethod } from "./_lib/ai.js";
import { requireUser } from "./_lib/auth.js";
import { kv } from "./_lib/sync.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "GET")) return;

  const user = await requireUser(request, response);
  if (!user) return;

  try {
    const record = await kv.get(`account-sync:${user.id}`);
    ok(response, record ?? { updatedAt: 0, payload: null });
  } catch (error) {
    fail(response, error, "Failed to pull sync data");
  }
}
