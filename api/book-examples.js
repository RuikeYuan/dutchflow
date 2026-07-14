import { get } from "@vercel/blob";
import { fail, handleOptions, ok, requireMethod } from "./_lib/ai.js";

let cache;

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "GET")) return;

  try {
    if (!cache) {
      const pathname = process.env.BOOK_EXAMPLES_BLOB_PATHNAME;
      if (!pathname) {
        ok(response, {});
        return;
      }

      const result = await get(pathname, { access: "private" });
      if (!result || result.statusCode !== 200) {
        ok(response, {});
        return;
      }

      cache = await new Response(result.stream).json();
    }

    ok(response, cache);
  } catch (error) {
    fail(response, error, "Failed to read book examples");
  }
}
