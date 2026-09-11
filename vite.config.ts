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

async function translateExample(sentence: string, targetLanguage: string, maxTokens = 80) {
  const languageName =
    targetLanguage === "zh"
      ? "Simplified Chinese"
      : targetLanguage === "de"
        ? "German"
        : "English";
  const systemPrompt = "Translate Dutch example sentences for language learners. Return only the translation, no explanation.";
  const userPrompt = `Translate this Dutch sentence into ${languageName}:\n${sentence}`;
  const translated = process.env.GEMINI_API_KEY
    ? await callGemini(`${systemPrompt}\n\n${userPrompt}`, 0.2, maxTokens)
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
        maxTokens
      );

  if (!translated) {
    throw new Error("LLM returned an empty translation");
  }
  return translated;
}

async function generateLongNewsReading({
  headline,
  summary,
  sourceName,
  level = "A2-B1"
}: {
  headline: string;
  summary?: string;
  sourceName?: string;
  level?: string;
}) {
  const systemPrompt =
    "You write original long-form Dutch reading passages for language learners. You take inspiration from a real news topic but you never copy, translate, or closely paraphrase the source text - you write an entirely new, multi-paragraph article of your own about the same general subject.";
  const userPrompt = [
    `News topic for inspiration (source: ${sourceName ?? "unknown"}):`,
    `Headline: ${headline}`,
    summary ? `Summary: ${summary}` : "",
    "",
    `Write one original Dutch reading passage (4-6 short paragraphs, about 250-350 words total) at ${level} level about this general topic.`,
    'Start with a short original Dutch title, then the separator "|||" on its own, then the article body as separate paragraphs, each separated by "|||" on its own.',
    'Example shape: Title text|||First paragraph.|||Second paragraph.|||Third paragraph.',
    'Do not use "|||" anywhere except as that separator, and do not use any other formatting (no blank lines, no markdown, no numbering).',
    "Do not mention or quote the source. Do not attribute invented statements to real, specifically named people, companies, or officials - if someone needs to say something, describe it generically (for example 'volgens een woordvoerder' or 'zeggen buurtbewoners') rather than inventing a real name.",
    "Return only the title and passage in that exact format - no explanation, no extra text."
  ]
    .filter(Boolean)
    .join("\n");
  const passage = process.env.GEMINI_API_KEY
    ? await callGemini(`${systemPrompt}\n\n${userPrompt}`, 0.65, 900)
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
        0.65,
        900
      );

  if (!passage) {
    throw new Error("LLM returned an empty long news reading passage");
  }
  return passage;
}

async function translateLongNewsReading(longText: string, targetLanguage: string, maxTokens = 900) {
  const languageName =
    targetLanguage === "zh"
      ? "Simplified Chinese"
      : targetLanguage === "de"
        ? "German"
        : targetLanguage === "es"
          ? "Spanish"
          : targetLanguage === "nl"
            ? "Dutch"
            : "English";
  const systemPrompt = "Translate Dutch reading passages for language learners. Return only the translation, no explanation.";
  const userPrompt = [
    `Translate this Dutch passage into ${languageName}.`,
    'It uses "|||" as a separator between its title and paragraphs. Keep every "|||" separator exactly as-is, in the same positions - translate only the surrounding text.',
    "",
    longText
  ].join("\n");
  const translated = process.env.GEMINI_API_KEY
    ? await callGemini(`${systemPrompt}\n\n${userPrompt}`, 0.2, maxTokens)
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
        maxTokens
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
        "请对这个具体的语法知识点做详细、系统的讲解，帮助学习者真正掌握，而不是泛泛而谈或点到为止。",
        "按顺序写出以下几部分，内容要具体、扎实：",
        "1. 用两三句话说明这个知识点的核心规则、适用范围或用法。",
        "2. 如果有构成规则或变形规则，具体给出规则和形式；如果分几种情况，请分别说明每种情况。",
        "3. 给出 3-4 个包含这个知识点的荷兰语例句，覆盖不同的使用场景或人称/时态，每个例句后面附中文翻译。",
        "4. 指出中文母语学习者在这个知识点上最容易犯的 2-3 个错误，说明为什么会错、正确的做法是什么。",
        "5. 如果这个知识点容易和另一个相近的语法点混淆，用一两句话说明两者的区别；如果没有明显容易混淆的点，可以省略这一条。",
        "6. 给一个简短的记忆技巧，并附一个可以让学习者自我检测的小练习或小问题。",
        "以上每个部分必须独立成行（用换行分隔），不要写成一整段；只有这 6 个大点本身在行首用数字加句点标出序号。",
        "第 3 点的多个例句和第 4 点的多条错误如果需要分行列出，每条另起一行但不要再单独加数字编号（不要出现嵌套编号），可以用“- ”开头或者不加任何前缀。",
        "不要输出 Markdown 表格或加粗符号，不要有多余的开场白，直接开始讲解。"
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 760
  },
  en: {
    systemPrompt:
      "You are a Dutch grammar teacher giving an in-depth explanation of one specific grammar point to an A1-A2 learner. Be accurate, specific, and use real examples.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Dutch grammar topic: ${pathText} / ${nodeTitle}`,
        hint ? `Existing short hint: ${hint}` : "",
        "",
        "Give a detailed, systematic explanation of this specific grammar point so the learner truly understands it, not just a one-line summary.",
        "Structure your answer in this order, with concrete, substantial content:",
        "1. Two or three sentences on the core rule, scope, or usage.",
        "2. If there is a formation or inflection rule, spell it out concretely; if it has several cases, cover each one.",
        "3. Give 3-4 Dutch example sentences that illustrate this point across different contexts, persons, or tenses, each followed by its English translation.",
        "4. Point out 2-3 common mistakes learners make with this point, explaining why the mistake happens and what the correct form is.",
        "5. If this point is easily confused with a closely related grammar point, briefly explain the difference in one or two sentences; omit this if there is no obvious point of confusion.",
        "6. Give one short memory tip, plus a small self-check question or exercise the learner can try.",
        "Put each of these parts on its own line (separated by line breaks) — do not run them together into one paragraph; only these 6 top-level parts get a number and a period at the start of the line.",
        "If part 3's multiple examples or part 4's multiple mistakes need their own lines, put each on its own line but do NOT add a separate number to each one (no nested numbering) — use a \"- \" prefix or no prefix at all.",
        "Do not use Markdown tables or bold markers, and do not add a preamble — start directly with the explanation."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 680
  },
  nl: {
    systemPrompt:
      "Je bent een docent Nederlandse grammatica die één specifiek grammaticapunt diepgaand uitlegt aan een A1-A2 taalleerder. Wees nauwkeurig, concreet en gebruik echte voorbeelden.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Nederlands grammaticaonderwerp: ${pathText} / ${nodeTitle}`,
        hint ? `Bestaande korte hint: ${hint}` : "",
        "",
        "Geef een gedetailleerde, systematische uitleg van dit specifieke grammaticapunt, zodat de leerder het echt begrijpt, niet slechts een eenregelige samenvatting.",
        "Structureer je antwoord in deze volgorde, met concrete, inhoudelijke uitleg:",
        "1. Twee of drie zinnen over de kernregel, het toepassingsgebied of het gebruik.",
        "2. Als er een vorm- of verbuigingsregel is, leg die concreet uit; behandel elk geval apart als er meerdere zijn.",
        "3. Geef 3-4 Nederlandse voorbeeldzinnen die dit punt illustreren in verschillende contexten, personen of tijden, elk met een korte toelichting waarom de vorm zo is.",
        "4. Wijs op 2-3 veelgemaakte fouten die taalleerders bij dit punt maken, en leg uit waarom die fout ontstaat en wat de juiste vorm is.",
        "5. Als dit punt makkelijk verward wordt met een verwant grammaticapunt, leg het verschil in één of twee zinnen uit; laat dit weg als er geen duidelijk verwarringspunt is.",
        "6. Geef één korte geheugensteun, plus een kleine zelftoetsvraag of oefening die de leerder kan proberen.",
        "Zet elk van deze onderdelen op een eigen regel (gescheiden door regeleinden) — voeg ze niet samen tot één alinea; alleen deze 6 hoofdonderdelen krijgen een nummer en een punt aan het begin van de regel.",
        "Als de meerdere voorbeelden bij punt 3 of de meerdere fouten bij punt 4 elk op een eigen regel moeten staan, geef ze dan geen eigen nummer (geen geneste nummering) — gebruik een \"- \" ervoor of helemaal geen voorvoegsel.",
        "Gebruik geen Markdown-tabellen of vetgedrukte tekens, en begin niet met een inleidende zin — begin direct met de uitleg."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 680
  },
  es: {
    systemPrompt:
      "Eres un profesor de gramática neerlandesa que da una explicación detallada de un punto gramatical concreto a un estudiante de nivel A1-A2. Sé preciso, concreto y usa ejemplos reales.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Tema de gramática neerlandesa: ${pathText} / ${nodeTitle}`,
        hint ? `Pista breve existente: ${hint}` : "",
        "",
        "Da una explicación detallada y sistemática de este punto gramatical concreto para que el estudiante lo entienda de verdad, no solo un resumen de una línea.",
        "Estructura tu respuesta en este orden, con contenido concreto y sustancioso:",
        "1. Dos o tres frases sobre la regla principal, su alcance o su uso.",
        "2. Si hay una regla de formación o flexión, explícala de forma concreta; si tiene varios casos, cubre cada uno.",
        "3. Da 3-4 frases de ejemplo en neerlandés que ilustren este punto en distintos contextos, personas o tiempos verbales, cada una seguida de su traducción al español.",
        "4. Señala 2-3 errores comunes que cometen los estudiantes con este punto, explicando por qué ocurre el error y cuál es la forma correcta.",
        "5. Si este punto se confunde fácilmente con otro punto gramatical relacionado, explica la diferencia en una o dos frases; omite esto si no hay un punto de confusión evidente.",
        "6. Da un consejo breve para recordarlo, más una pequeña pregunta o ejercicio de autoevaluación que el estudiante pueda probar.",
        "Pon cada una de estas partes en su propia línea (separadas por saltos de línea) — no las juntes en un solo párrafo; solo estas 6 partes principales llevan un número y un punto al inicio de la línea.",
        "Si los varios ejemplos del punto 3 o los varios errores del punto 4 necesitan ir cada uno en su propia línea, no les pongas su propio número (nada de numeración anidada) — usa un prefijo \"- \" o ningún prefijo.",
        "No uses tablas Markdown ni negritas, y no añadas una introducción — empieza directamente con la explicación."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 680
  },
  de: {
    systemPrompt:
      "Du bist ein Lehrer für niederländische Grammatik und gibst einem A1-A2-Lernenden eine ausführliche Erklärung zu einem bestimmten Grammatikpunkt. Sei präzise, korrekt und praxisnah.",
    buildUserPrompt: (pathText, nodeTitle, hint) =>
      [
        `Niederländisches Grammatikthema: ${pathText} / ${nodeTitle}`,
        hint ? `Vorhandener kurzer Hinweis: ${hint}` : "",
        "",
        "Gib eine ausführliche, systematische Erklärung zu diesem konkreten Grammatikpunkt, damit der Lernende ihn wirklich versteht, nicht nur eine einzeilige Zusammenfassung.",
        "Strukturiere deine Antwort in dieser Reihenfolge, mit konkretem, gehaltvollem Inhalt:",
        "1. Zwei bis drei Sätze zur Kernregel, ihrem Geltungsbereich oder ihrer Verwendung.",
        "2. Falls es eine Bildungs- oder Flexionsregel gibt, erkläre sie konkret; behandle jeden Fall einzeln, falls es mehrere gibt.",
        "3. Gib 3-4 niederländische Beispielsätze, die diesen Punkt in unterschiedlichen Kontexten, Personen oder Zeitformen veranschaulichen, jeweils gefolgt von der deutschen Übersetzung.",
        "4. Weise auf 2-3 häufige Fehler hin, die Lernende bei diesem Punkt machen, und erkläre, warum der Fehler entsteht und was die korrekte Form ist.",
        "5. Falls dieser Punkt leicht mit einem verwandten Grammatikpunkt verwechselt wird, erkläre den Unterschied in ein bis zwei Sätzen; lasse dies weg, wenn es keinen offensichtlichen Verwechslungspunkt gibt.",
        "6. Gib einen kurzen Merktipp sowie eine kleine Selbsttestfrage oder Übung, die der Lernende ausprobieren kann.",
        "Setze jeden dieser Teile in eine eigene Zeile (durch Zeilenumbrüche getrennt) — fasse sie nicht zu einem einzigen Absatz zusammen; nur diese 6 Hauptteile bekommen am Zeilenanfang eine Nummer mit Punkt.",
        "Falls die mehreren Beispiele bei Punkt 3 oder die mehreren Fehler bei Punkt 4 jeweils eine eigene Zeile brauchen, gib ihnen keine eigene Nummer (keine verschachtelte Nummerierung) — verwende ein \"- \" davor oder gar kein Präfix.",
        "Verwende keine Markdown-Tabellen oder Fettschrift, und beginne nicht mit einer Einleitung — starte direkt mit der Erklärung."
      ]
        .filter(Boolean)
        .join("\n"),
    maxTokens: 680
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

        server.middlewares.use("/api/expand-news-reading", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          try {
            const body = await readJsonBody(request);
            const headline = String(body.headline ?? "").trim();
            const summary = String(body.summary ?? "").trim();
            const sourceName = String(body.sourceName ?? "").trim();
            const level = String(body.level ?? "A2-B1").trim();
            const targetLanguage = String(body.targetLanguage ?? "zh").trim();

            if (!headline) {
              response.statusCode = 400;
              response.setHeader("Content-Type", "application/json; charset=utf-8");
              response.end(JSON.stringify({ error: "Missing headline" }));
              return;
            }

            const longText = await generateLongNewsReading({ headline, summary, sourceName, level });
            const translation = await translateLongNewsReading(longText, targetLanguage, 900);
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ longText, translation }));
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(
              JSON.stringify({ error: error instanceof Error ? error.message : "Failed to expand news reading" })
            );
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
