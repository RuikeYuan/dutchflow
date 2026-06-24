import { askWordQuestion, badRequest, fail, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  try {
    const body = await readJsonBody(request);
    const word = String(body.word ?? "").trim();
    const translation = String(body.translation ?? "").trim();
    const partOfSpeech = String(body.partOfSpeech ?? "").trim();
    const sentence = String(body.sentence ?? "").trim();
    const question = String(body.question ?? "").trim();
    const turns = Array.isArray(body.turns) ? body.turns : [];

    if (!word) {
      badRequest(response, "Missing word");
      return;
    }

    if (!question) {
      badRequest(response, "Missing question");
      return;
    }

    ok(response, {
      answer: await askWordQuestion({
        word,
        translation,
        partOfSpeech,
        sentence,
        question,
        turns
      })
    });
  } catch (error) {
    fail(response, error, "Failed to answer word question");
  }
}
