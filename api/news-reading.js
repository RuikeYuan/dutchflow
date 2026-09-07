import { get } from "@vercel/blob";
import { fail, handleOptions, ok, requireMethod } from "./_lib/ai.js";

const KNOWN_GENRES = ["algemeen", "cultuur", "tech", "sport", "economie"];
const DEFAULT_GENRE = "algemeen";
const CACHE_TTL_MS = 60 * 60 * 1000;

const cacheByGenre = new Map();

function blobPathnameFor(genreKey) {
  return process.env.NEWS_READING_BLOB_PATHNAME_PREFIX
    ? `${process.env.NEWS_READING_BLOB_PATHNAME_PREFIX}${genreKey}.json`
    : `news-reading/${genreKey}.json`;
}

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "GET")) return;

  try {
    const url = new URL(request.url, "http://localhost");
    const requestedGenre = url.searchParams.get("genre") ?? DEFAULT_GENRE;
    const genre = KNOWN_GENRES.includes(requestedGenre) ? requestedGenre : DEFAULT_GENRE;

    const cached = cacheByGenre.get(genre);
    const fresh = cached && Date.now() - cached.cachedAt < CACHE_TTL_MS;

    if (fresh) {
      ok(response, cached.data);
      return;
    }

    const pathname = blobPathnameFor(genre);
    const result = await get(pathname, { access: "private" }).catch(() => null);

    if (!result || result.statusCode !== 200) {
      ok(response, { genre, level: "", items: [] });
      return;
    }

    const data = await new Response(result.stream).json();
    cacheByGenre.set(genre, { data, cachedAt: Date.now() });
    ok(response, data);
  } catch (error) {
    fail(response, error, "Failed to read news reading passages");
  }
}
