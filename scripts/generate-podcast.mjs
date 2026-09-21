import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { get, put } from "@vercel/blob";

import { generatePodcastDialogue, generatePodcastQuiz, explainExample } from "../api/_lib/ai.js";
import { GENRES, fetchGenreTopics, loadEnvLocal } from "./_lib/news-feeds.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

loadEnvLocal(rootDir);

function blobPathnameFor(genreKey) {
  return process.env.PODCAST_BLOB_PATHNAME_PREFIX
    ? `${process.env.PODCAST_BLOB_PATHNAME_PREFIX}${genreKey}.json`
    : `podcast/${genreKey}.json`;
}

const EPISODES_TARGET_PER_FEED = Number(process.env.PODCAST_ITEMS_PER_FEED ?? 3);
const RAW_ITEMS_PER_FEED = Number(process.env.PODCAST_RAW_ITEMS_PER_FEED ?? 15);
const LEVEL = process.env.PODCAST_LEVEL ?? "A2-B1";
const EPISODE_POOL_CAP = Number(process.env.PODCAST_POOL_CAP ?? 30);
const dateStamp = new Date().toISOString().slice(0, 10);

async function fetchExistingEpisodes(genreKey) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];

  const result = await get(blobPathnameFor(genreKey), { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200) return [];

  const data = await new Response(result.stream).json();
  return Array.isArray(data.episodes) ? data.episodes : [];
}

function mergeEpisodes(existing, fresh, cap) {
  const byId = new Map(existing.map((episode) => [episode.id, episode]));
  for (const episode of fresh) {
    byId.set(episode.id, episode);
  }
  return Array.from(byId.values()).slice(-cap);
}

async function generateGenre(genre) {
  const topics = await fetchGenreTopics(genre, {
    itemsPerFeed: EPISODES_TARGET_PER_FEED,
    rawItemsPerFeed: RAW_ITEMS_PER_FEED
  });

  if (!topics.length) {
    console.error(`[${genre.key}] no light-topic news items fetched from any feed, skipping`);
    return [];
  }

  const results = [];

  for (const topic of topics) {
    console.log(`Generating podcast episode for [${genre.key}]: [${topic.sourceName}] ${topic.headline}`);

    try {
      const turns = await generatePodcastDialogue({
        headline: topic.headline,
        summary: topic.summary,
        sourceName: topic.sourceName,
        level: LEVEL
      });
      const fullDutchText = turns.map((turn) => turn.text).join(" ");
      const explanation = await explainExample(fullDutchText, "zh", 420);
      const quiz = await generatePodcastQuiz(turns, LEVEL).catch((error) => {
        console.error(`  quiz generation failed (episode kept without quiz): ${error.message}`);
        return [];
      });

      results.push({
        id: `${genre.key}-${topic.sourceName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${dateStamp}-${results.length}`,
        sourceName: topic.sourceName,
        sourceHeadline: topic.headline,
        sourceLink: topic.link,
        level: LEVEL,
        turns,
        explanation,
        quiz,
        generatedAt: dateStamp
      });
    } catch (error) {
      console.error(`  failed: ${error.message}`);
    }
  }

  return results;
}

async function main() {
  const requestedGenre = process.env.PODCAST_GENRE;
  const genresToRun = requestedGenre ? GENRES.filter((genre) => genre.key === requestedGenre) : GENRES;

  if (!genresToRun.length) {
    throw new Error(`Unknown PODCAST_GENRE "${requestedGenre}". Known genres: ${GENRES.map((g) => g.key).join(", ")}`);
  }

  const outDir = join(rootDir, "data", "podcast");
  mkdirSync(outDir, { recursive: true });

  for (const genre of genresToRun) {
    const freshEpisodes = await generateGenre(genre);
    const existingEpisodes = await fetchExistingEpisodes(genre.key);
    const episodes = mergeEpisodes(existingEpisodes, freshEpisodes, EPISODE_POOL_CAP);
    const payload = JSON.stringify({ genre: genre.key, level: LEVEL, episodes }, null, 2);

    const outPath = join(outDir, `output-${genre.key}-${dateStamp}.json`);
    writeFileSync(outPath, payload, "utf8");
    console.log(
      `Wrote ${freshEpisodes.length} new + ${existingEpisodes.length} existing -> ${episodes.length} episodes for [${genre.key}] to ${outPath}`
    );

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const pathname = blobPathnameFor(genre.key);
      await put(pathname, payload, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      console.log(`Uploaded [${genre.key}] to Vercel Blob at ${pathname}\n`);
    } else {
      console.log(`BLOB_READ_WRITE_TOKEN not set - skipped blob upload for [${genre.key}], wrote local file only.\n`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
