import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import process from "node:process";
import JSZip from "jszip";
import { defineConfig, loadEnv } from "vite";

const defaultEpubPath = "C:/Users/humao/Downloads/vdoc.pub_a-frequency-dictionary-of-dutch.epub";
const exampleChapterPaths = [
  "OEBPS/06_Chapter3.html",
  "OEBPS/06_Chapter3_1.html",
  "OEBPS/07_Chapter4.html",
  "OEBPS/07_Chapter4_1.html",
  "OEBPS/08_Chapter5.html",
  "OEBPS/08_Chapter5_1.html",
  "OEBPS/09_Chapter6.html",
  "OEBPS/10_Chapter7.html",
  "OEBPS/11_Chapter8.html",
  "OEBPS/11_Chapter8_1.html",
  "OEBPS/11_Chapter8_2.html",
  "OEBPS/11_Chapter8_3.html"
];

function stripTags(value: string) {
  return value
    .replace(/<a\b[^>]*\/>/g, "")
    .replace(/<a\b[^>]*>/g, "")
    .replace(/<\/a>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^[•\u2022]\s*/, "")
    .trim();
}

function cleanExampleText(value: string) {
  return stripTags(value).replace(/^•\s*/, "").trim();
}

async function extractExamples() {
  const data = await fs.readFile(getEpubPath());
  const zip = await JSZip.loadAsync(data);
  const examples: Record<string, string> = {};

  for (const path of exampleChapterPaths) {
    const entry = zip.file(path);
    if (!entry) continue;

    const html = await entry.async("text");
    const parts = html.match(/<p\s+class="(?:simple|simple-para|sim)"[^>]*>[\s\S]*?<\/p>/g) ?? [];
    let currentId = "";

    for (const part of parts) {
      if (part.includes('class="simple"')) {
        currentId = part.match(/<a\s+id="([CFNSWG]\d+)"\s*\/>/)?.[1] ?? "";
        continue;
      }

      if (part.includes('class="simple-para"') && currentId && !examples[currentId]) {
        const example = cleanExampleText(part);
        if (example) {
          examples[currentId] = example;
        }
        continue;
      }

      if (part.includes('class="sim"')) {
        currentId = "";
      }
    }
  }

  return examples;
}

function readJsonBody(request: IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
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

function sanitizeExample(value: string) {
  return value
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonObject(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as Record<string, unknown>) : {};
  }
}

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

function getEpubPath() {
  return process.env.DUTCH_FREQ_EPUB_PATH ?? defaultEpubPath;
}

async function callGemini(prompt: string, temperature: number, maxOutputTokens: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

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
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return sanitizeExample(data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join(" ") ?? "");
}

async function callOpenAiCompatible(messages: ChatMessage[], temperature: number, maxTokens: number) {
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

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return sanitizeExample(data.choices?.[0]?.message?.content ?? "");
}

async function generateExample(word: string, translation: string, partOfSpeech: string) {
  const systemPrompt =
    "You create short, natural Dutch example sentences for language learners. Return only one Dutch sentence, no explanation.";
  const userPrompt = `Word: ${word}\nPart of speech: ${partOfSpeech}\nEnglish meaning: ${translation}\nCreate one simple A1-A2 Dutch sentence using this exact word or its natural inflected form.`;
  const example = process.env.GEMINI_API_KEY
    ? await callGemini(`${systemPrompt}\n\n${userPrompt}`, 0.4, 60)
    : await callOpenAiCompatible(
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
        0.4,
        60
      );

  if (!example) {
    throw new Error("LLM returned an empty example");
  }
  return example;
}

async function translateExample(sentence: string, targetLanguage: string) {
  const languageName =
    targetLanguage === "zh"
      ? "Simplified Chinese"
      : targetLanguage === "de"
        ? "German"
        : "English";
  const systemPrompt = "Translate Dutch example sentences for language learners. Return only the translation, no explanation.";
  const userPrompt = `Translate this Dutch sentence into ${languageName}:\n${sentence}`;
  const translated = process.env.GEMINI_API_KEY
    ? await callGemini(`${systemPrompt}\n\n${userPrompt}`, 0.2, 80)
    : await callOpenAiCompatible(
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
        0.2,
        80
      );

  if (!translated) {
    throw new Error("LLM returned an empty translation");
  }
  return translated;
}

const GRAMMAR_EXPLANATION_PROMPTS: Record<
  string,
  { systemPrompt: string; buildUserPrompt: (sentence: string, forSpeech: boolean) => string; maxTokens: number }
> = {
  en: {
    systemPrompt:
      "You explain Dutch grammar for A1-A2 learners in clear spoken English. Be concise, accurate, and practical.",
    buildUserPrompt: (sentence, forSpeech) =>
      [
        `Dutch sentence: ${sentence}`,
        forSpeech ? "Explain this Dutch sentence in English for audio playback." : "Explain this Dutch sentence in English.",
        forSpeech ? "Use 3-5 short spoken lines." : "Use 4-6 short lines, one point per line.",
        "Mention the sentence pattern, key words or phrases, verb form, articles/pronouns/prepositions when relevant, and one natural usage tip.",
        forSpeech ? "Wrap every Dutch word or Dutch phrase that should be pronounced in Dutch as [[nl:word or phrase]]." : "",
        forSpeech ? "Do not use the [[nl:...]] marker for English words." : "",
        "Do not use Markdown tables. Do not be long."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 220
  },
  zh: {
    systemPrompt: "You explain Dutch grammar for Chinese-speaking A1-A2 learners. Be concise, accurate, and practical.",
    buildUserPrompt: (sentence) =>
      [
        `Dutch sentence: ${sentence}`,
        "用中文讲解这句荷兰语。",
        "请按 4-6 行输出，每行一个要点。",
        "必须包含：整体句型、关键单词/短语、动词变化、介词/冠词/代词等细节、自然表达提示。",
        "不要输出 Markdown 表格，不要太长。"
      ].join("\n"),
    maxTokens: 260
  },
  nl: {
    systemPrompt:
      "Je legt Nederlandse grammatica uit aan A1-A2 taalleerders in duidelijke, natuurlijke taal. Wees beknopt, accuraat en praktisch.",
    buildUserPrompt: (sentence) =>
      [
        `Nederlandse zin: ${sentence}`,
        "Leg deze Nederlandse zin uit.",
        "Gebruik 4-6 korte regels, één punt per regel.",
        "Behandel verplicht: de zinsbouw, kernwoorden/uitdrukkingen, werkwoordsvorm, lidwoorden/voorzetsels/voornaamwoorden waar relevant, en een natuurlijke gebruikstip.",
        "Gebruik geen Markdown-tabellen. Houd het kort."
      ].join("\n"),
    maxTokens: 220
  },
  es: {
    systemPrompt: "Explicas la gramática neerlandesa a estudiantes hispanohablantes de nivel A1-A2. Sé conciso, preciso y práctico.",
    buildUserPrompt: (sentence) =>
      [
        `Frase en neerlandés: ${sentence}`,
        "Explica esta frase en neerlandés, en español.",
        "Usa entre 4 y 6 líneas breves, una idea por línea.",
        "Debes incluir: la estructura de la oración, palabras o frases clave, la forma verbal, artículos/preposiciones/pronombres cuando sea relevante, y un consejo de uso natural.",
        "No uses tablas Markdown. No te extiendas demasiado."
      ].join("\n"),
    maxTokens: 220
  },
  de: {
    systemPrompt: "Du erklärst niederländische Grammatik für deutschsprachige A1-A2-Lernende. Sei präzise, korrekt und praxisnah.",
    buildUserPrompt: (sentence) =>
      [
        `Niederländischer Satz: ${sentence}`,
        "Erkläre diesen niederländischen Satz auf Deutsch.",
        "Verwende 4-6 kurze Zeilen, einen Punkt pro Zeile.",
        "Behandle unbedingt: den Satzbau, Schlüsselwörter/-phrasen, die Verbform, Artikel/Präpositionen/Pronomen wo relevant, und einen natürlichen Anwendungstipp.",
        "Keine Markdown-Tabellen. Fasse dich kurz."
      ].join("\n"),
    maxTokens: 220
  }
};

async function explainExample(sentence: string, targetLanguage = "zh", forSpeech = false) {
  const prompts = GRAMMAR_EXPLANATION_PROMPTS[targetLanguage] ?? GRAMMAR_EXPLANATION_PROMPTS.en;
  const systemPrompt = prompts.systemPrompt;
  const userPrompt = prompts.buildUserPrompt(sentence, forSpeech);
  const explanation = process.env.GEMINI_API_KEY
    ? await callGemini(`${systemPrompt}\n\n${userPrompt}`, 0.25, prompts.maxTokens)
    : await callOpenAiCompatible(
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
        0.25,
        prompts.maxTokens
      );

  if (!explanation) {
    throw new Error("LLM returned an empty grammar explanation");
  }
  return explanation;
}

const GRAMMAR_NODE_PROMPTS: Record<
  string,
  { systemPrompt: string; buildUserPrompt: (pathText: string, nodeTitle: string, hint: string) => string; maxTokens: number }
> = {
  zh: {
    systemPrompt: "你是一名教荷兰语语法的老师，为中文母语的 A1-A2 学习者做深入讲解。准确、具体、有例句。",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `荷兰语语法知识点：${pathText} / ${nodeTitle}`,
        hint ? `已有简要提示：${hint}` : "",
        "",
        "请对这个具体的语法知识点做详细讲解，帮助学习者真正掌握，而不是泛泛而谈。",
        "按顺序写出以下几部分：",
        "1. 用一两句话说明这个知识点的核心规则或用法。",
        "2. 如果有构成规则或变形规则，具体给出规则和形式。",
        "3. 给出 2-3 个包含这个知识点的荷兰语例句，每个例句后面附中文翻译。",
        "4. 指出中文母语学习者在这个知识点上最容易犯的 1-2 个错误。",
        "5. 给一个简短的记忆或练习建议。",
        "这 5 个部分必须各自独立成行（用换行分隔），不要写成一整段。",
        "不要输出 Markdown 表格或加粗符号，不要有多余的开场白，直接开始讲解。"
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 520
  },
  en: {
    systemPrompt:
      "You are a Dutch grammar teacher giving an in-depth explanation of one specific grammar point to an A1-A2 learner. Be accurate, specific, and use real examples.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Dutch grammar topic: ${pathText} / ${nodeTitle}`,
        hint ? `Existing short hint: ${hint}` : "",
        "",
        "Give a detailed explanation of this specific grammar point so the learner truly understands it, not just a one-line summary.",
        "Structure your answer in this order:",
        "1. One or two sentences on the core rule or usage.",
        "2. If there is a formation or inflection rule, spell it out concretely.",
        "3. Give 2-3 Dutch example sentences that illustrate this point, each followed by its English translation.",
        "4. Point out 1-2 common mistakes learners make with this point.",
        "5. Give one short memory or practice tip.",
        "Put each of these 5 parts on its own line (separated by line breaks) — do not run them together into one paragraph.",
        "Do not use Markdown tables or bold markers, and do not add a preamble — start directly with the explanation."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 460
  },
  nl: {
    systemPrompt:
      "Je bent een docent Nederlandse grammatica die één specifiek grammaticapunt diepgaand uitlegt aan een A1-A2 taalleerder. Wees nauwkeurig, concreet en gebruik echte voorbeelden.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Nederlands grammaticaonderwerp: ${pathText} / ${nodeTitle}`,
        hint ? `Bestaande korte hint: ${hint}` : "",
        "",
        "Geef een gedetailleerde uitleg van dit specifieke grammaticapunt, zodat de leerder het echt begrijpt, niet slechts een eenregelige samenvatting.",
        "Structureer je antwoord in deze volgorde:",
        "1. Eén of twee zinnen over de kernregel of het gebruik.",
        "2. Als er een vorm- of verbuigingsregel is, leg die concreet uit.",
        "3. Geef 2-3 Nederlandse voorbeeldzinnen die dit punt illustreren, elk met een korte toelichting waarom de vorm zo is.",
        "4. Wijs op 1-2 veelgemaakte fouten die taalleerders bij dit punt maken.",
        "5. Geef één korte geheugensteun of oefentip.",
        "Zet elk van deze 5 onderdelen op een eigen regel (gescheiden door regeleinden) — voeg ze niet samen tot één alinea.",
        "Gebruik geen Markdown-tabellen of vetgedrukte tekens, en begin niet met een inleidende zin — begin direct met de uitleg."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 460
  },
  es: {
    systemPrompt:
      "Eres un profesor de gramática neerlandesa que da una explicación detallada de un punto gramatical concreto a un estudiante de nivel A1-A2. Sé preciso, concreto y usa ejemplos reales.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Tema de gramática neerlandesa: ${pathText} / ${nodeTitle}`,
        hint ? `Pista breve existente: ${hint}` : "",
        "",
        "Da una explicación detallada de este punto gramatical concreto para que el estudiante lo entienda de verdad, no solo un resumen de una línea.",
        "Estructura tu respuesta en este orden:",
        "1. Una o dos frases sobre la regla o el uso principal.",
        "2. Si hay una regla de formación o flexión, explícala de forma concreta.",
        "3. Da 2-3 frases de ejemplo en neerlandés que ilustren este punto, cada una seguida de su traducción al español.",
        "4. Señala 1-2 errores comunes que cometen los estudiantes con este punto.",
        "5. Da un consejo breve para recordarlo o practicarlo.",
        "Pon cada una de estas 5 partes en su propia línea (separadas por saltos de línea) — no las juntes en un solo párrafo.",
        "No uses tablas Markdown ni negritas, y no añadas una introducción — empieza directamente con la explicación."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 460
  },
  de: {
    systemPrompt:
      "Du bist ein Lehrer für niederländische Grammatik und gibst einem A1-A2-Lernenden eine ausführliche Erklärung zu einem bestimmten Grammatikpunkt. Sei präzise, korrekt und praxisnah.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Niederländisches Grammatikthema: ${pathText} / ${nodeTitle}`,
        hint ? `Vorhandener kurzer Hinweis: ${hint}` : "",
        "",
        "Gib eine ausführliche Erklärung zu diesem konkreten Grammatikpunkt, damit der Lernende ihn wirklich versteht, nicht nur eine einzeilige Zusammenfassung.",
        "Strukturiere deine Antwort in dieser Reihenfolge:",
        "1. Ein bis zwei Sätze zur Kernregel oder Verwendung.",
        "2. Falls es eine Bildungs- oder Flexionsregel gibt, erkläre sie konkret.",
        "3. Gib 2-3 niederländische Beispielsätze, die diesen Punkt veranschaulichen, jeweils gefolgt von der deutschen Übersetzung.",
        "4. Weise auf 1-2 häufige Fehler hin, die Lernende bei diesem Punkt machen.",
        "5. Gib einen kurzen Merk- oder Übungstipp.",
        "Setze jeden dieser 5 Teile in eine eigene Zeile (durch Zeilenumbrüche getrennt) — fasse sie nicht zu einem einzigen Absatz zusammen.",
        "Verwende keine Markdown-Tabellen oder Fettschrift, und beginne nicht mit einer Einleitung — starte direkt mit der Erklärung."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 460
  }
};

async function explainGrammarNode(nodeTitle: string, pathText: string, hint: string, targetLanguage = "zh") {
  const prompts = GRAMMAR_NODE_PROMPTS[targetLanguage] ?? GRAMMAR_NODE_PROMPTS.en;
  const systemPrompt = prompts.systemPrompt;
  const userPrompt = prompts.buildUserPrompt(pathText, nodeTitle, hint);
  const explanation = process.env.GEMINI_API_KEY
    ? await callGemini(`${systemPrompt}\n\n${userPrompt}`, 0.3, prompts.maxTokens)
    : await callOpenAiCompatible(
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
        0.3,
        prompts.maxTokens
      );

  if (!explanation) {
    throw new Error("LLM returned an empty grammar node explanation");
  }
  return explanation;
}

async function getSpeakingReply(
  scenario: string,
  turns: Array<{ role?: unknown; text?: unknown; feedback?: unknown }>
) {
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
            content:
              "You are a Dutch speaking tutor. Return strict JSON only with keys reply and feedback."
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

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
  plugins: [
    react(),
    {
      name: "local-book-examples",
      configureServer(server) {
        let cache: Record<string, string> | null = null;

        server.middlewares.use("/api/book-examples", async (_request, response) => {
          try {
            cache ??= await extractExamples();
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(cache));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to read EPUB" }));
          }
        });

        server.middlewares.use("/api/generate-example", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          try {
            const body = await readJsonBody(request);
            const word = String(body.word ?? "").trim();
            const translation = String(body.translation ?? "").trim();
            const partOfSpeech = String(body.partOfSpeech ?? "").trim();

            if (!word) {
              response.statusCode = 400;
              response.setHeader("Content-Type", "application/json; charset=utf-8");
              response.end(JSON.stringify({ error: "Missing word" }));
              return;
            }

            const example = await generateExample(word, translation, partOfSpeech);
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ example }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate example" }));
          }
        });

        server.middlewares.use("/api/translate-example", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          try {
            const body = await readJsonBody(request);
            const sentence = String(body.sentence ?? "").trim();
            const targetLanguage = String(body.targetLanguage ?? "en").trim();

            if (!sentence) {
              response.statusCode = 400;
              response.setHeader("Content-Type", "application/json; charset=utf-8");
              response.end(JSON.stringify({ error: "Missing sentence" }));
              return;
            }

            const translation = await translateExample(sentence, targetLanguage);
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ translation }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to translate example" }));
          }
        });

        server.middlewares.use("/api/explain-example", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          try {
            const body = await readJsonBody(request);
            const sentence = String(body.sentence ?? "").trim();
            const targetLanguage = String(body.targetLanguage ?? "zh").trim();
            const forSpeech = Boolean(body.forSpeech);

            if (!sentence) {
              response.statusCode = 400;
              response.setHeader("Content-Type", "application/json; charset=utf-8");
              response.end(JSON.stringify({ error: "Missing sentence" }));
              return;
            }

            const explanation = await explainExample(sentence, targetLanguage, forSpeech);
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ explanation }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to explain example" }));
          }
        });

        server.middlewares.use("/api/explain-grammar-node", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          try {
            const body = await readJsonBody(request);
            const nodeTitle = String(body.nodeTitle ?? "").trim();
            const path = String(body.path ?? "").trim();
            const hint = String(body.hint ?? "").trim();
            const targetLanguage = String(body.targetLanguage ?? "zh").trim();

            if (!nodeTitle) {
              response.statusCode = 400;
              response.setHeader("Content-Type", "application/json; charset=utf-8");
              response.end(JSON.stringify({ error: "Missing nodeTitle" }));
              return;
            }

            const explanation = await explainGrammarNode(nodeTitle, path, hint, targetLanguage);
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ explanation }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(
              JSON.stringify({ error: error instanceof Error ? error.message : "Failed to explain grammar node" })
            );
          }
        });

        server.middlewares.use("/api/news-reading", async (request, response) => {
          try {
            const knownGenres = ["algemeen", "cultuur", "tech", "sport", "economie"];
            const url = new URL(request.url ?? "/api/news-reading", "http://localhost");
            const requestedGenre = url.searchParams.get("genre") ?? "algemeen";
            const genre = knownGenres.includes(requestedGenre) ? requestedGenre : "algemeen";
            const pathname = process.env.NEWS_READING_BLOB_PATHNAME_PREFIX
              ? `${process.env.NEWS_READING_BLOB_PATHNAME_PREFIX}${genre}.json`
              : `news-reading/${genre}.json`;
            const { get } = await import("@vercel/blob");
            const result = await get(pathname, { access: "private" }).catch(() => null);
            const data =
              result && result.statusCode === 200 ? await new Response(result.stream).json() : { genre, level: "", items: [] };
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(data));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(
              JSON.stringify({ error: error instanceof Error ? error.message : "Failed to read news reading passages" })
            );
          }
        });

        server.middlewares.use("/api/podcast", async (request, response) => {
          try {
            const knownGenres = ["algemeen", "cultuur", "tech", "sport", "economie"];
            const url = new URL(request.url ?? "/api/podcast", "http://localhost");
            const requestedGenre = url.searchParams.get("genre") ?? "algemeen";
            const genre = knownGenres.includes(requestedGenre) ? requestedGenre : "algemeen";
            const pathname = process.env.PODCAST_BLOB_PATHNAME_PREFIX
              ? `${process.env.PODCAST_BLOB_PATHNAME_PREFIX}${genre}.json`
              : `podcast/${genre}.json`;
            const { get } = await import("@vercel/blob");
            const result = await get(pathname, { access: "private" }).catch(() => null);
            const data =
              result && result.statusCode === 200
                ? await new Response(result.stream).json()
                : { genre, level: "", episodes: [] };
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(data));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to read podcast episodes" }));
          }
        });

        server.middlewares.use("/api/sync-pull", async (request, response) => {
          try {
            const url = new URL(request.url ?? "/api/sync-pull", "http://localhost");
            const code = (url.searchParams.get("code") ?? "").trim().toUpperCase();
            response.setHeader("Content-Type", "application/json; charset=utf-8");

            if (!/^[A-Z0-9]{6,12}$/.test(code)) {
              response.end(JSON.stringify({ updatedAt: 0, payload: null }));
              return;
            }

            const { kv } = await import("@vercel/kv");
            const record = await kv.get(`sync:${code}`);
            response.end(JSON.stringify(record ?? { updatedAt: 0, payload: null }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to pull sync data" }));
          }
        });

        server.middlewares.use("/api/sync-push", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          try {
            const body = await readJsonBody(request);
            const code = String(body.code ?? "")
              .trim()
              .toUpperCase();
            const updatedAt = Number(body.updatedAt);
            const payload = body.payload;
            response.setHeader("Content-Type", "application/json; charset=utf-8");

            if (!/^[A-Z0-9]{6,12}$/.test(code) || !Number.isFinite(updatedAt) || !payload || typeof payload !== "object") {
              response.statusCode = 400;
              response.end(JSON.stringify({ error: "Invalid sync request" }));
              return;
            }

            const { kv } = await import("@vercel/kv");
            await kv.set(`sync:${code}`, { updatedAt, payload }, { ex: 60 * 60 * 24 * 365 });
            response.end(JSON.stringify({ updatedAt }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to push sync data" }));
          }
        });

        server.middlewares.use("/api/speaking-practice", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          try {
            const body = await readJsonBody(request);
            const scenario = String(body.scenario ?? "").trim();
            const turns = Array.isArray(body.turns) ? body.turns : [];

            const result = await getSpeakingReply(scenario, turns);
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(result));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to practice speaking" }));
          }
        });
      }
    }
  ],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 5180)
  }
  };
});
