import { badRequest, explainExample, fail, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  try {
    const body = await readJsonBody(request);
    const sentence = String(body.sentence ?? "").trim();
    const targetLanguage = String(body.targetLanguage ?? "zh").trim();

    if (!sentence) {
      badRequest(response, "Missing sentence");
      return;
    }

    ok(response, { explanation: await explainExample(sentence, targetLanguage) });
  } catch (error) {
    fail(response, error, "Failed to explain example");
  }
}
