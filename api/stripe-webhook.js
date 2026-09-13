import { fail, ok } from "./_lib/ai.js";

export const config = { api: { bodyParser: false } };

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function toIso(unixSeconds) {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : null;
}

function periodEndOf(subscription) {
  return subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end ?? null;
}

async function fetchSubscription(subscriptionId) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }
  });
  if (!response.ok) return null;
  return response.json();
}

function subscriptionFields(subscription) {
  return {
    is_premium: ["active", "trialing"].includes(subscription.status),
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    current_period_end: toIso(periodEndOf(subscription)),
    trial_end: toIso(subscription.trial_end)
  };
}

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=")));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

async function updateProfileByCustomer(customerId, fields) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(fields)
    }
  );
  if (!response.ok) throw new Error("Failed to update profile from webhook");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.statusCode = 405;
    response.end("Method not allowed");
    return;
  }

  try {
    const rawBody = await readRawBody(request);
    const signatureHeader = request.headers["stripe-signature"];

    if (!STRIPE_WEBHOOK_SECRET || !signatureHeader || typeof signatureHeader !== "string") {
      response.statusCode = 400;
      response.end("Missing signature");
      return;
    }

    const valid = await verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      response.statusCode = 400;
      response.end("Invalid signature");
      return;
    }

    const event = JSON.parse(rawBody);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.customer && session.subscription) {
        const subscription = await fetchSubscription(session.subscription);
        await updateProfileByCustomer(
          session.customer,
          subscription ? subscriptionFields(subscription) : { is_premium: true, stripe_subscription_id: session.subscription }
        );
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      await updateProfileByCustomer(subscription.customer, subscriptionFields(subscription));
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      await updateProfileByCustomer(subscription.customer, {
        is_premium: false,
        subscription_status: subscription.status
      });
    }

    ok(response, { received: true });
  } catch (error) {
    fail(response, error, "Webhook handling failed");
  }
}
