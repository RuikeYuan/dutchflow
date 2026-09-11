import {
  badRequest,
  fail,
  generateLongNewsReading,
  handleOptions,
  ok,
  readJsonBody,
  requireMethod,
  translateLongNewsReading
} from "./_lib/ai.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  try {
    const body = await readJsonBody(request);
    const headline = String(body.headline ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const sourceName = String(body.sourceName ?? "").trim();
    const level = String(body.level ?? "A2-B1").trim();
    const targetLanguage = String(body.targetLanguage ?? "zh").trim();

    if (!headline) {
      badRequest(response, "Missing headline");
      return;
    }

    const longText = await generateLongNewsReading({ headline, summary, sourceName, level });
    const translation = await translateLongNewsReading(longText, targetLanguage, 900);

    ok(response, { longText, translation });
  } catch (error) {
    fail(response, error, "Failed to expand news reading");
  }
}
