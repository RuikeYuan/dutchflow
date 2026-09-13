import { badRequest, fail, handleOptions, ok, readJsonBody, requireMethod, translateBatch, translateExample } from "./_lib/ai.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  try {
    const body = await readJsonBody(request);
    const targetLanguage = String(body.targetLanguage ?? "en").trim();
    const sourceLanguage = String(body.sourceLanguage ?? "nl").trim();

    if (Array.isArray(body.sentences)) {
      const sentences = body.sentences.map((value) => String(value ?? "").trim());
      if (!sentences.length || sentences.some((value) => !value)) {
        badRequest(response, "Missing sentences");
        return;
      }

      ok(response, { translations: await translateBatch(sentences, targetLanguage, sourceLanguage) });
      return;
    }

    const sentence = String(body.sentence ?? "").trim();
    if (!sentence) {
      badRequest(response, "Missing sentence");
      return;
    }

    ok(response, { translation: await translateExample(sentence, targetLanguage, undefined, sourceLanguage) });
  } catch (error) {
    fail(response, error, "Failed to translate example");
  }
}
