import fs from "node:fs/promises";
import JSZip from "jszip";
import { fail, handleOptions, ok, requireMethod } from "./_lib/ai.js";

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

let cache;

function stripTags(value) {
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

function cleanExampleText(value) {
  return stripTags(value).replace(/^•\s*/, "").trim();
}

async function extractExamples(epubPath) {
  const data = await fs.readFile(epubPath);
  const zip = await JSZip.loadAsync(data);
  const examples = {};

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

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "GET")) return;

  try {
    const epubPath = process.env.DUTCH_FREQ_EPUB_PATH;
    if (!epubPath) {
      ok(response, {});
      return;
    }

    cache ??= await extractExamples(epubPath);
    ok(response, cache);
  } catch (error) {
    fail(response, error, "Failed to read EPUB");
  }
}
