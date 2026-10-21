// One-off data generation: append a "Subtitles" list to
// src/data/frequencyWords.json with high-frequency words that the frequency
// dictionary does not cover.
//
// Sources (both open data, not LLM-generated):
// - OpenSubtitles 2018 Dutch frequency list (hermitdave/FrequencyWords,
//   CC-BY-SA-4.0): word ranks and counts.
// - kaikki.org Dutch dictionary dump (Wiktionary, CC-BY-SA): lemma lookup,
//   part of speech, de/het gender and English glosses.
//
// Usage:
//   node scripts/generate-subtitle-words.mjs <nl_50k.txt> <kaikki-dutch.jsonl> [count]
//
// Inflected forms are folded into their lemma ("gaat" counts toward "gaan"),
// so the list ranks lemmas, not surface forms. Words already in any existing
// list are skipped. Words with no usable Wiktionary entry are left out rather
// than guessed; scripts/subtitle-word-overrides.json holds the reviewed fixes. Rerunning replaces the previous Subtitles list.

import { readFileSync, writeFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "src", "data", "frequencyWords.json");
// Hand-reviewed corrections: noise words to drop (English subtitle bleed,
// names, slurs, stray forms) and clearer glosses where Wiktionary's first
// senses are obscure ("spion" is a spy, not a dog breed).
const overrides = JSON.parse(readFileSync(join(__dirname, "subtitle-word-overrides.json"), "utf8"));
const droppedWords = new Set(overrides.drop);

const LIST_NAME = "Subtitles";
const SOURCE_PREFIX = "O";

const [subtitlePath, dumpPath, countArg] = process.argv.slice(2);
if (!subtitlePath || !dumpPath) {
  console.error("Usage: node scripts/generate-subtitle-words.mjs <nl_50k.txt> <kaikki-dutch.jsonl> [count]");
  process.exit(1);
}
const targetCount = Number(countArg ?? 3000);

const posLabels = {
  noun: "noun",
  verb: "verb",
  adj: "adj",
  adv: "adv",
  num: "num",
  pron: "pron",
  prep: "prep",
  conj: "conj",
  intj: "interj",
  article: "art"
};

// Senses with these tags are not useful for a learner list.
const skipSenseTags = new Set(["obsolete", "archaic", "dated", "dialectal", "rare", "misspelling", "nonstandard"]);

function normalize(value) {
  return value.toLocaleLowerCase("nl-NL").trim();
}

function headKey(word) {
  return normalize(word.split(",")[0].replace(/\([^)]*\)/g, ""));
}

function usableSenses(entry) {
  return (entry.senses ?? []).filter(
    (sense) =>
      sense.glosses?.length &&
      !sense.form_of &&
      !(sense.tags ?? []).some((tag) => tag === "form-of" || skipSenseTags.has(tag))
  );
}

function nounGender(entry) {
  const template = (entry.head_templates ?? []).find((item) => item.name === "nl-noun");
  if (!template) return null;
  const args = template.args ?? {};
  const genders = [args["1"], args.g2, args.g3]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim());
  if (genders.includes("p") && genders.length === 1) return "pl";
  const articles = [];
  for (const gender of genders) {
    const article = gender === "m" ? "de(m)" : gender === "f" ? "de(f)" : gender === "n" ? "het" : gender === "c" ? "de" : null;
    if (article && !articles.includes(article)) articles.push(article);
  }
  // "m" plus "f" is the common Dutch "de" noun.
  if (articles.includes("de(m)") && articles.includes("de(f)")) {
    articles.splice(articles.indexOf("de(m)"), 1, "de");
    articles.splice(articles.indexOf("de(f)"), 1);
  }
  return articles.length ? articles.join("/") : null;
}

const referenceGloss = /^(alternative|obsolete|archaic|dated|nonstandard|informal|eye dialect|euphemistic)? ?(form|spelling|plural|diminutive|abbreviation|initialism|synonym|contraction|clipping|superlative|comparative)( degree)? of /i;

function cleanGloss(gloss) {
  if (referenceGloss.test(gloss)) return "";
  return gloss
    .replace(/\([^)]*\)/g, "")
    .split(";")[0]
    .replace(/\s+/g, " ")
    .replace(/[.:]$/, "")
    .trim()
    .replace(/^(a|an|the) /i, "");
}

function translationFor(senses) {
  const parts = [];
  for (const sense of senses) {
    const gloss = cleanGloss(sense.glosses[sense.glosses.length - 1]);
    if (!gloss || gloss.length > 40) continue;
    for (const item of gloss.split(/,\s*/)) {
      if (item && !parts.includes(item) && parts.length < 3) parts.push(item);
    }
    if (parts.length >= 3) break;
  }
  return parts.join(", ");
}

// Inflection-table tags whose forms are the same word as the lemma. Gender
// pairs such as "kater" (masculine of "kat") are different words and stay out.
const inflectionTags = new Set(["plural", "comparative", "superlative", "participle", "past", "present", "diminutive"]);

function addFormOf(formOf, form, lemma) {
  if (!form || !lemma || form === lemma) return;
  if (!formOf.has(form)) formOf.set(form, []);
  if (!formOf.get(form).includes(lemma)) formOf.get(form).push(lemma);
}

async function readDictionary() {
  const lemmas = new Map();
  const formOf = new Map();
  const names = new Set();
  const rl = createInterface({ input: createReadStream(dumpPath, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    if (entry.lang_code !== "nl") continue;
    const word = normalize(entry.word ?? "");
    if (!word) continue;

    if (entry.pos === "name") names.add(word);
    for (const sense of entry.senses ?? []) {
      for (const target of sense.form_of ?? []) addFormOf(formOf, word, normalize(target.word ?? ""));
    }
    for (const form of entry.forms ?? []) {
      if ((form.tags ?? []).some((tag) => inflectionTags.has(tag))) addFormOf(formOf, normalize(form.form ?? ""), word);
    }

    const pos = posLabels[entry.pos];
    // Lowercase lookup word must match the headword exactly: skips proper
    // nouns such as "Jan" that only exist capitalised.
    if (!pos || entry.word !== entry.word.toLocaleLowerCase("nl-NL")) continue;
    const senses = usableSenses(entry);
    const translation = translationFor(senses);
    if (!translation) continue;
    if (!lemmas.has(word)) lemmas.set(word, []);
    lemmas.get(word).push({ pos, gender: pos === "noun" ? nounGender(entry) : null, translation });
  }
  return { lemmas, formOf, names };
}

function partOfSpeechFor(info) {
  if (info.pos !== "noun") return info.pos;
  return info.gender ? `noun, ${info.gender}` : "noun";
}

const rawData = readFileSync(dataPath, "utf8");
const existing = JSON.parse(rawData).filter((word) => word.list !== LIST_NAME);
const existingKeys = new Set();
for (const word of existing) {
  for (const variant of word.word.split(",")) {
    const key = normalize(variant.replace(/\([^)]*\)/g, ""));
    if (key) existingKeys.add(key);
  }
  existingKeys.add(headKey(word.word));
}

console.log("Reading dictionary dump ...");
const { lemmas, formOf, names } = await readDictionary();
console.log(`Lemmas with glosses: ${lemmas.size}, inflected forms: ${formOf.size}`);

const subtitleRows = readFileSync(subtitlePath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim().split(/\s+/))
  .filter((parts) => parts.length === 2)
  .map(([word, count]) => ({ word: normalize(word), count: Number(count) }));
const totalCount = subtitleRows.reduce((sum, row) => sum + row.count, 0);

const lemmaCounts = new Map();
for (const row of subtitleRows) {
  if (!/^[a-zà-öø-ÿ'’-]{2,}$/.test(row.word)) continue;
  // A surface form already covered by the existing lists, or an inflection of
  // a word they cover, is skipped: "niet" must not resurface as the verb
  // "nieten", nor "kan" (form of "kunnen") as the noun "jug".
  if (existingKeys.has(row.word)) continue;
  const formTargets = formOf.get(row.word) ?? [];
  if (formTargets.some((candidate) => existingKeys.has(candidate))) continue;
  const lemmaOptions = formTargets.filter((candidate) => lemmas.has(candidate));
  // Given names that double as rare common nouns ("peter" godfather, "bob"
  // bobsleigh) are almost always the name in subtitles.
  if (names.has(row.word)) continue;
  // Participle adjectives ("vernietigd") fold into their verb.
  const ownLemma = lemmas.has(row.word) && !(lemmas.get(row.word)[0].pos === "adj" && lemmaOptions.length) ? row.word : null;
  const lemma = ownLemma ?? lemmaOptions[0];
  if (!lemma) continue;
  lemmaCounts.set(lemma, (lemmaCounts.get(lemma) ?? 0) + row.count);
}

const picked = [...lemmaCounts]
  .filter(([lemma]) => !existingKeys.has(lemma) && !droppedWords.has(lemma))
  .sort((a, b) => b[1] - a[1])
  .slice(0, targetCount);

const added = picked.map(([lemma, count], index) => {
  const info = lemmas.get(lemma)[0];
  return {
    rank: index + 1,
    word: lemma,
    partOfSpeech: overrides.partOfSpeech[lemma] ?? partOfSpeechFor(info),
    translation: overrides.translations[lemma] ?? info.translation,
    list: LIST_NAME,
    sourceId: `${SOURCE_PREFIX}${index + 1}`,
    perMillion: Number(((count / totalCount) * 1_000_000).toFixed(2))
  };
});

// Append to the raw text instead of re-serialising the whole file, so the
// existing entries keep their exact bytes (e.g. "34.0" stays "34.0").
let baseText = rawData.replace(/\s*\]\s*$/, "");
const firstAddedMarker = baseText.indexOf(`"sourceId": "${SOURCE_PREFIX}1"`);
if (firstAddedMarker !== -1) {
  baseText = baseText.slice(0, baseText.lastIndexOf("{", firstAddedMarker)).replace(/,\s*$/, "");
}
const addedText = added
  .map((word) => JSON.stringify(word, null, 2).replace(/^/gm, "  "))
  .join(",\n")
  .replace(/\n/g, "\r\n");
writeFileSync(dataPath, `${baseText},\r\n${addedText}\r\n]`);
console.log(`Added ${added.length} ${LIST_NAME} words (existing ${existing.length}).`);
