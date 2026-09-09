import { badRequest, explainGrammarNode, fail, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  try {
    const body = await readJsonBody(request);
    const nodeTitle = String(body.nodeTitle ?? "").trim();
    const path = String(body.path ?? "").trim();
    const hint = String(body.hint ?? "").trim();
    const targetLanguage = String(body.targetLanguage ?? "zh").trim();

    if (!nodeTitle) {
      badRequest(response, "Missing nodeTitle");
      return;
    }

    ok(response, { explanation: await explainGrammarNode(nodeTitle, path, hint, targetLanguage) });
  } catch (error) {
    fail(response, error, "Failed to explain grammar node");
  }
}
