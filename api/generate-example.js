import { badRequest, fail, generateExample, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";
import { requirePremium } from "./_lib/auth.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;
  if (!(await requirePremium(request, response))) return;

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
