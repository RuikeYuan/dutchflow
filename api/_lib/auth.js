import { sendJson } from "./ai.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getBearerToken(request) {
  const header = request.headers.authorization ?? request.headers.Authorization;
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

export async function getAuthedUser(request) {
  const token = getBearerToken(request);
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) return null;
    const user = await response.json();
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

export async function isPremiumUser(userId) {
  if (!userId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=is_premium`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    if (!response.ok) return false;
    const rows = await response.json();
    return Boolean(rows?.[0]?.is_premium);
  } catch {
    return false;
  }
}

export async function requireUser(request, response) {
  const user = await getAuthedUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Sign-in required" });
    return null;
  }
  return user;
}

export async function requirePremium(request, response) {
  const user = await requireUser(request, response);
  if (!user) return null;

  const premium = await isPremiumUser(user.id);
  if (!premium) {
    sendJson(response, 402, { error: "Premium membership required" });
    return null;
  }
  return user;
}
