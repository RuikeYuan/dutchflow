import { badRequest, fail, handleOptions, ok, readJsonBody, requireMethod } from "./_lib/ai.js";
import { requireUser } from "./_lib/auth.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_ORIGINS = new Set([
  "https://dutchflow.banbar.online",
  "https://dutch-frequency-app.vercel.app",
  "http://localhost:5173"
]);

function resolveOrigin(request) {
  const origin = request.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  return "https://dutchflow.banbar.online";
}

async function getProfile(userId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id,is_premium`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  if (!response.ok) throw new Error("Failed to read profile");
  const rows = await response.json();
  return rows?.[0] ?? null;
}

async function saveStripeCustomerId(userId, customerId) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({ stripe_customer_id: customerId })
  });
  if (!response.ok) throw new Error("Failed to save Stripe customer id");
}

async function stripeRequest(path, body) {
  const params = new URLSearchParams(body);
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Stripe request failed");
  }
  return data;
}

export default async function handler(request, response) {
  if (handleOptions(request, response) || !requireMethod(request, response, "POST")) return;

  const user = await requireUser(request, response);
  if (!user) return;

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    fail(response, new Error("Stripe is not configured"), "Stripe is not configured");
    return;
  }

  try {
    const body = await readJsonBody(request);
    const action = String(body.action ?? "checkout");
    const origin = resolveOrigin(request);
    const profile = await getProfile(user.id);

    if (action === "portal") {
      if (!profile?.stripe_customer_id) {
        badRequest(response, "No subscription to manage");
        return;
      }
      const session = await stripeRequest("billing_portal/sessions", {
        customer: profile.stripe_customer_id,
        return_url: origin
      });
      ok(response, { url: session.url });
      return;
    }

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripeRequest("customers", {
        email: user.email ?? "",
        "metadata[supabase_user_id]": user.id
      });
      customerId = customer.id;
      await saveStripeCustomerId(user.id, customerId);
    }

    const session = await stripeRequest("checkout/sessions", {
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": STRIPE_PRICE_ID,
      "line_items[0][quantity]": "1",
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      "metadata[supabase_user_id]": user.id,
      "subscription_data[metadata][supabase_user_id]": user.id
    });
    ok(response, { url: session.url });
  } catch (error) {
    fail(response, error, "Failed to create billing session");
  }
}
