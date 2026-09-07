import { kv } from "@vercel/kv";

export const SYNC_TTL_SECONDS = 60 * 60 * 24 * 365;
const CODE_PATTERN = /^[A-Z0-9]{6,12}$/;
const MAX_PAYLOAD_BYTES = 400_000;

export function isValidSyncCode(code) {
  return typeof code === "string" && CODE_PATTERN.test(code);
}

export function syncKeyFor(code) {
  return `sync:${code}`;
}

export function isPayloadTooLarge(payload) {
  return Buffer.byteLength(JSON.stringify(payload ?? {}), "utf8") > MAX_PAYLOAD_BYTES;
}

export { kv };
