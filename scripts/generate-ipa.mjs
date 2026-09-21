// One-off data generation: build src/data/wordIpa.json (sourceId -> IPA string)
// from the kaikki.org Dutch dictionary dump (a Wiktionary-derived, open data
// export - real dictionary entries, not LLM-generated).
//
// Usage:
//   node scripts/generate-ipa.mjs [path-to-kaikki-dutch.jsonl]
// If no path is given, the dump (~240MB) is downloaded to a temp file first.
//
// Words not found in the dump are left out of the output (no IPA shown for
// them in the UI) rather than guessed - see plan doc for the accepted
// partial-coverage tradeoff.

import { writeFileSync, createWriteStream, existsSync, mkdtempSync } from "node:fs";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const KAIKKI_URL = "https://kaikki.org/dictionary/Dutch/kaikki.org-dictionary-Dutch.jsonl";

function primaryLemma(word) {
  // Frequency list entries are sometimes multi-variant, e.g. "het, 't" or
  // "goed(e)" - take the first clean alternative for dictionary lookup.
  const firstAlternative = word.split(",")[0];
  return firstAlternative
    .replace(/\([^)]*\)/g, "")
    .trim()
    .toLocaleLowerCase("nl-NL");
}

async function ensureDumpPath(givenPath) {
  if (givenPath && existsSync(givenPath)) return givenPath;

  const dumpPath = join(mkdtempSync(join(tmpdir(), "kaikki-nl-")), "kaikki-dutch.jsonl");
  console.log(`Downloading Dutch dictionary dump to ${dumpPath} ...`);
  const response = await fetch(KAIKKI_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download kaikki dump: ${response.status}`);
  }
  await finished(Readable.fromWeb(response.body).pipe(createWriteStream(dumpPath)));
  return dumpPath;
}

async function buildIpaLookup(dumpPath) {
  const lookup = new Map();
  const rl = createInterface({ input: createReadStream(dumpPath, "utf8"), crlfDelay: Infinity });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount += 1;
    if (!line.trim()) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.lang_code !== "nl" || !entry.word || !Array.isArray(entry.sounds)) continue;

    const key = entry.word.toLocaleLowerCase("nl-NL");
    if (lookup.has(key)) continue;

    const ipaSound = entry.sounds.find((sound) => typeof sound.ipa === "string" && !sound.tags);
    const fallbackSound = entry.sounds.find((sound) => typeof sound.ipa === "string");
    const ipa = ipaSound?.ipa ?? fallbackSound?.ipa;
    if (ipa) lookup.set(key, ipa);
  }

  console.log(`Scanned ${lineCount} dictionary lines, ${lookup.size} unique Dutch words with IPA.`);
  return lookup;
}

function hasEspeak() {
  const probe = spawnSync("espeak-ng", ["--version"]);
  return probe.status === 0;
}

// Fallback phonemizer for words missing from the dictionary dump - rule-based,
// not a dictionary lookup, but still a real phonemizer rather than a guess.
function espeakIpaFor(word) {
  const result = spawnSync("espeak-ng", ["-q", "-v", "nl", "--ipa=3", word], { encoding: "utf8" });
  if (result.status !== 0) return undefined;
  const ipa = result.stdout.trim().replace(/\s+/g, " ");
  return ipa ? `/${ipa}/` : undefined;
}

async function main() {
  const dumpPath = await ensureDumpPath(process.argv[2]);
  const ipaLookup = await buildIpaLookup(dumpPath);

  const frequencyWords = JSON.parse(
    await import("node:fs/promises").then((fs) => fs.readFile(join(rootDir, "src/data/frequencyWords.json"), "utf8"))
  );

  const espeakAvailable = hasEspeak();
  console.log(espeakAvailable ? "espeak-ng found, using it as fallback for dump misses." : "espeak-ng not found, skipping fallback (dump-only coverage).");

  const result = {};
  let matchedFromDump = 0;
  let matchedFromEspeak = 0;
  for (const entry of frequencyWords) {
    const dumpIpa = ipaLookup.get(primaryLemma(entry.word));
    if (dumpIpa) {
      result[entry.sourceId] = dumpIpa;
      matchedFromDump += 1;
      continue;
    }

    if (espeakAvailable) {
      const espeakIpa = espeakIpaFor(primaryLemma(entry.word));
      if (espeakIpa) {
        result[entry.sourceId] = espeakIpa;
        matchedFromEspeak += 1;
      }
    }
  }

  const total = matchedFromDump + matchedFromEspeak;
  const outPath = join(rootDir, "src/data/wordIpa.json");
  writeFileSync(outPath, JSON.stringify(result), "utf8");
  console.log(
    `Wrote ${total}/${frequencyWords.length} IPA entries (${((total / frequencyWords.length) * 100).toFixed(1)}%) to ${outPath} ` +
      `[dictionary: ${matchedFromDump}, espeak fallback: ${matchedFromEspeak}]`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
