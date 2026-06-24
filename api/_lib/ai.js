function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.end(JSON.stringify(payload));
}

export function handleOptions(request, response) {
  if (request.method !== "OPTIONS") return false;
  sendJson(response, 204, {});
  return true;
}

export function requireMethod(request, response, method) {
  if (request.method === method) return true;
  sendJson(response, 405, { error: "Method not allowed" });
  return false;
}

export async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

export function ok(response, payload) {
  sendJson(response, 200, payload);
}

export function badRequest(response, message) {
  sendJson(response, 400, { error: message });
}

export function fail(response, error, fallbackMessage = "Request failed") {
  sendJson(response, 500, {
    error: error instanceof Error ? error.message : fallbackMessage
  });
}

function sanitizeExample(value) {
  return value
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonObject(value) {
  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTransientStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function callGemini(prompt, temperature, maxOutputTokens) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const maxAttempts = Number(process.env.LLM_RETRY_ATTEMPTS ?? 3);
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature,
              maxOutputTokens
            }
          })
        }
      );

      if (!response.ok) {
        const error = new Error(`Gemini request failed: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return sanitizeExample(data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join(" ") ?? "");
    } catch (error) {
      lastError = error;
      const status = typeof error?.status === "number" ? error.status : 0;
      if (attempt >= maxAttempts || (status && !isTransientStatus(status))) {
        throw error;
      }

      await sleep(350 * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}

async function callOpenAiCompatible(messages, temperature, maxTokens) {
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseUrl = process.env.LLM_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("Missing LLM_API_KEY or OPENAI_API_KEY");
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  return sanitizeExample(data.choices?.[0]?.message?.content ?? "");
}

async function callLlm(systemPrompt, userPrompt, temperature, maxTokens) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(`${systemPrompt}\n\n${userPrompt}`, temperature, maxTokens);
    } catch (error) {
      if (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY) {
        throw error;
      }
    }
  }

  return callOpenAiCompatible(
        [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature,
        maxTokens
      );
}

export async function generateExample(word, translation, partOfSpeech) {
  const systemPrompt =
    "You create short, natural Dutch example sentences for language learners. Return only one Dutch sentence, no explanation.";
  const userPrompt = `Word: ${word}\nPart of speech: ${partOfSpeech}\nEnglish meaning: ${translation}\nCreate one simple A1-A2 Dutch sentence using this exact word or its natural inflected form.`;
  const example = await callLlm(systemPrompt, userPrompt, 0.4, 60);

  if (!example) {
    throw new Error("LLM returned an empty example");
  }

  return example;
}

export async function translateExample(sentence, targetLanguage) {
  const languageName =
    targetLanguage === "zh"
      ? "Simplified Chinese"
      : targetLanguage === "de"
        ? "German"
        : "English";
  const systemPrompt = "Translate Dutch example sentences for language learners. Return only the translation, no explanation.";
  const userPrompt = `Translate this Dutch sentence into ${languageName}:\n${sentence}`;
  const translated = await callLlm(systemPrompt, userPrompt, 0.2, 80);

  if (!translated) {
    throw new Error("LLM returned an empty translation");
  }

  return translated;
}

export async function explainExample(sentence) {
  const systemPrompt =
    "You explain Dutch grammar for Chinese-speaking A1-A2 learners. Be concise, accurate, and practical.";
  const userPrompt = [
    `Dutch sentence: ${sentence}`,
    "用中文讲解这句荷兰语。",
    "请按 4-6 行输出，每行一个要点。",
    "必须包含：整体句型、关键词/短语、动词变化、介词/冠词/代词等细节、自然表达提示。",
    "不要输出 Markdown 表格，不要太长。"
  ].join("\n");
  const explanation = await callLlm(systemPrompt, userPrompt, 0.25, 260);

  if (!explanation) {
    throw new Error("LLM returned an empty grammar explanation");
  }

  return explanation;
}

export async function getSpeakingReply(scenario, turns) {
  const transcript = turns
    .map((turn) => {
      const role = turn.role === "learner" ? "Learner" : "Tutor";
      return `${role}: ${String(turn.text ?? "").trim()}`;
    })
    .filter((line) => !line.endsWith(":"))
    .join("\n");
  const prompt = [
    "You are a warm 1-on-1 Dutch speaking tutor for an A1-A2 learner.",
    scenario,
    "Keep the conversation in simple Dutch. Ask exactly one natural follow-up question.",
    "If the learner made a mistake, give one short correction in English or Chinese-friendly simple English.",
    "Return strict JSON only with this shape: {\"reply\":\"Dutch tutor reply\",\"feedback\":\"short correction or encouragement\"}.",
    "",
    transcript
  ].join("\n");
  const raw = process.env.GEMINI_API_KEY
    ? await callGemini(prompt, 0.45, 160)
    : await callOpenAiCompatible(
        [
          {
            role: "system",
            content: "You are a Dutch speaking tutor. Return strict JSON only with keys reply and feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        0.45,
        160
      );
  const data = parseJsonObject(raw);
  const reply = sanitizeExample(String(data.reply ?? ""));
  const feedback = sanitizeExample(String(data.feedback ?? ""));

  if (!reply) {
    throw new Error("LLM returned an empty speaking reply");
  }

  return {
    reply,
    feedback
  };
}
