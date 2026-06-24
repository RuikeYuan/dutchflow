import { badRequest, fail, generateExample, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  try {
    const body = await readJsonBody(request);
    const word = String(body.word ?? "").trim();
    const translation = String(body.translation ?? "").trim();
    const partOfSpeech = String(body.partOfSpeech ?? "").trim();

    if (!word) {
      badRequest(response, "Missing word");
      return;
    }

    ok(response, { example: await generateExample(word, translation, partOfSpeech) });
  } catch (error) {
    fail(response, error, "Failed to generate example");
  }
}
