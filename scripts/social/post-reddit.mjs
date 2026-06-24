const requiredEnv = [
  "REDDIT_CLIENT_ID",
  "REDDIT_CLIENT_SECRET",
  "REDDIT_REFRESH_TOKEN",
  "REDDIT_USER_AGENT",
  "REDDIT_SUBREDDIT"
];

const live = process.argv.includes("--live");
const title =
  process.env.REDDIT_POST_TITLE ??
  "I built DutchFlow, a simple Dutch frequency vocabulary trainer";
const text =
  process.env.REDDIT_POST_TEXT ??
  [
    "Hi! I built DutchFlow, a small web app for learning Dutch vocabulary by frequency.",
    "",
    "It includes browsing, notebook cards, spaced review, sentence shadowing, and AI-powered example sentences.",
    "",
    "App: https://dutch-frequency-app.vercel.app",
    "Repo: https://github.com/RuikeYuan/dutchflow",
    "",
    "I would love feedback from Dutch learners: what would make this more useful for daily study?"
  ].join("\n");

function getMissingEnv() {
  return requiredEnv.filter((name) => !process.env[name]);
}

function basicAuth(clientId, clientSecret) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function getAccessToken() {
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(process.env.REDDIT_CLIENT_ID, process.env.REDDIT_CLIENT_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.REDDIT_REFRESH_TOKEN
    })
  });

  if (!response.ok) {
    throw new Error(`Reddit token request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Reddit did not return an access token");
  }

  return data.access_token;
}

async function submitPost(accessToken) {
  const response = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT
    },
    body: new URLSearchParams({
      api_type: "json",
      kind: "self",
      sr: process.env.REDDIT_SUBREDDIT,
      title,
      text,
      resubmit: "true",
      sendreplies: "true"
    })
  });

  const data = await response.json();
  if (!response.ok || data?.json?.errors?.length) {
    throw new Error(`Reddit submit failed: ${JSON.stringify(data)}`);
  }

  return data;
}

const missingEnv = getMissingEnv();
if (missingEnv.length) {
  console.error(`Missing environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

console.log(`Target subreddit: r/${process.env.REDDIT_SUBREDDIT}`);
console.log(`Title: ${title}`);
console.log(`Mode: ${live ? "live" : "dry-run"}`);

if (!live) {
  console.log("\nPost body:\n");
  console.log(text);
  console.log("\nDry run only. Add --live to publish.");
  process.exit(0);
}

try {
  const accessToken = await getAccessToken();
  const result = await submitPost(accessToken);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
