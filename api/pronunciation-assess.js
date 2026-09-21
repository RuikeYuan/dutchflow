import { assessPronunciation, fail, handleOptions, ok, readRawBody, requireMethod, sendJson } from "./_lib/ai.js";
import { requirePremium } from "./_lib/auth.js";

export const config = { api: { bodyParser: false } };

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;
  if (!(await requirePremium(request, response))) return;

  const referenceText = String(request.headers["x-reference-text"] ?? "").trim();
  if (!referenceText) {
    sendJson(response, 400, { error: "Missing X-Reference-Text header" });
    return;
  }

  try {
    const wavBuffer = await readRawBody(request);
    if (!wavBuffer.length) {
      sendJson(response, 400, { error: "Missing audio body" });
      return;
    }

    const assessment = await assessPronunciation(wavBuffer, decodeURIComponent(referenceText));
    ok(response, assessment);
  } catch (error) {
    fail(response, error, "Failed to assess pronunciation");
  }
}
