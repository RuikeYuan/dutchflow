import { kv } from "@vercel/kv";

export const SYNC_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_PAYLOAD_BYTES = 400_000;

export function isPayloadTooLarge(payload) {
  return Buffer.byteLength(JSON.stringify(payload ?? {}), "utf8") > MAX_PAYLOAD_BYTES;
}

export { kv };
