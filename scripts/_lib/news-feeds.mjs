import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function loadEnvLocal(rootDir) {
  const envPath = join(rootDir, ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export const GENRES = [
  {
    key: "algemeen",
    feeds: [
      { name: "NOS", url: "https://feeds.nos.nl/nosnieuwsalgemeen" },
      { name: "NU.nl", url: "https://www.nu.nl/rss/Algemeen" }
    ]
  },
  {
    key: "cultuur",
    feeds: [
      { name: "NOS", url: "https://feeds.nos.nl/nosnieuwscultuurenmedia" },
      { name: "NU.nl", url: "https://www.nu.nl/rss/Achterklap" }
    ]
  },
  {
    key: "tech",
    feeds: [
      { name: "NOS", url: "https://feeds.nos.nl/nosnieuwstech" },
      { name: "NU.nl", url: "https://www.nu.nl/rss/Tech" }
    ]
  },
  {
    key: "sport",
    feeds: [
      { name: "NOS", url: "https://feeds.nos.nl/nossportalgemeen" },
      { name: "NU.nl", url: "https://www.nu.nl/rss/Sport" }
    ]
  },
  {
    key: "economie",
    feeds: [
      { name: "NOS", url: "https://feeds.nos.nl/nosnieuwseconomie" },
      { name: "NU.nl", url: "https://www.nu.nl/rss/Economie" }
    ]
  }
];

// Skip topics that are heavy on war, death, crime, or disaster - not great subject
// matter for casual listening/reading practice even when the generated text is original.
const BLOCKED_KEYWORDS = [
  "oorlog",
  "dood",
  "doden",
  "gedood",
  "overleden",
  "moord",
  "vermoord",
  "aanval",
  "aanslag",
  "gewond",
  "slachtoffer",
  "crimineel",
  "misdaad",
  "verkracht",
  "zelfmoord",
  "ramp",
  "gijzeling",
  "terreur",
  "explosie",
  "schietpartij",
  "steekpartij",
  "brand in",
  "misbruik"
];

export function isHeavyTopic(topic) {
  const text = `${topic.headline} ${topic.summary}`.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => text.includes(keyword));
}

function decodeEntities(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

async function fetchFeedItems(feed, rawItemsPerFeed) {
  const response = await fetch(feed.url, {
    headers: { "User-Agent": "dutch-frequency-app content generator" }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${feed.name} feed: ${response.status}`);
  }

  const xml = await response.text();
  const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);

  return items.slice(0, rawItemsPerFeed).map((block) => ({
    sourceName: feed.name,
    headline: extractTag(block, "title"),
    summary: extractTag(block, "description"),
    link: extractTag(block, "link")
  }));
}

export async function fetchGenreTopics(genre, { itemsPerFeed, rawItemsPerFeed }) {
  const perFeed = await Promise.all(
    genre.feeds.map((feed) =>
      fetchFeedItems(feed, rawItemsPerFeed).catch((error) => {
        console.error(`[${genre.key}/${feed.name}] skipped:`, error.message);
        return [];
      })
    )
  );

  const topics = [];
  for (const feedItems of perFeed) {
    const light = feedItems.filter((topic) => topic.headline && !isHeavyTopic(topic));
    const dropped = feedItems.length - light.length;
    if (dropped > 0) {
      console.log(`[${genre.key}/${feedItems[0]?.sourceName ?? "feed"}] dropped ${dropped} heavy-topic headline(s)`);
    }
    topics.push(...light.slice(0, itemsPerFeed));
  }

  return topics;
}
