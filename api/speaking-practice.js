import { fail, getSpeakingReply, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";
import { requirePremium } from "./_lib/auth.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;
  if (!(await requirePremium(request, response))) return;

  try {
    const body = await readJsonBody(request);
    const scenario = String(body.scenario ?? "").trim();
    const turns = Array.isArray(body.turns) ? body.turns : [];

    ok(response, await getSpeakingReply(scenario, turns));
  } catch (error) {
    fail(response, error, "Failed to practice speaking");
  }
}
