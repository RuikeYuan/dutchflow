const defaultQueries = [
  "learn Dutch",
  "Dutch language",
  "language learning",
  "vocabulary learning",
  "side project",
  "web app"
];

const fallbackSubreddits = [
  {
    display_name: "learndutch",
    display_name_prefixed: "r/learndutch",
    title: "Learn Dutch",
    public_description: "A community for people learning Dutch.",
    subscribers: 0
  },
  {
    display_name: "languagelearning",
    display_name_prefixed: "r/languagelearning",
    title: "Language Learning",
    public_description: "Discussion for language learners.",
    subscribers: 0
  },
  {
    display_name: "SideProject",
    display_name_prefixed: "r/SideProject",
    title: "Side Project",
    public_description: "Share and get feedback on side projects.",
    subscribers: 0
  },
  {
    display_name: "webdev",
    display_name_prefixed: "r/webdev",
    title: "webdev",
    public_description: "Web development discussion.",
    subscribers: 0
  },
  {
    display_name: "InternetIsBeautiful",
    display_name_prefixed: "r/InternetIsBeautiful",
    title: "Internet Is Beautiful",
    public_description: "Interesting, beautiful, or useful websites.",
    subscribers: 0
  }
];

const positiveTerms = [
  "dutch",
  "language",
  "learning",
  "learn",
  "vocabulary",
  "education",
  "student",
  "sideproject",
  "webdev",
  "feedback",
  "showcase"
];

const cautionTerms = [
  "no self-promotion",
  "no self promotion",
  "self promotion",
  "advertising",
  "promotion",
  "spam",
  "no links",
  "no surveys",
  "approval"
];

function getQueries() {
  const value = process.argv.find((arg) => arg.startsWith("--queries="))?.split("=")[1];
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : defaultQueries;
}

function getLimit() {
  const value = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 8);
  return Number.isFinite(value) ? Math.max(1, Math.min(value, 25)) : 8;
}

function basicAuth(clientId, clientSecret) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function getAccessToken() {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET || !process.env.REDDIT_REFRESH_TOKEN) {
    return "";
  }

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(process.env.REDDIT_CLIENT_ID, process.env.REDDIT_CLIENT_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT ?? "DutchFlow discovery script"
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
  return data.access_token ?? "";
}

async function redditGet(path, accessToken) {
  const headers = {
    "User-Agent": process.env.REDDIT_USER_AGENT ?? "DutchFlow discovery script"
  };
  const baseUrl = accessToken ? "https://oauth.reddit.com" : "https://www.reddit.com";
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const suffix = accessToken ? path : `${path}.json`;
  const response = await fetch(`${baseUrl}${suffix}`, { headers });
  if (!response.ok) {
    throw new Error(`Reddit GET failed: ${response.status} ${path}`);
  }

  return response.json();
}

function subredditText(subreddit) {
  return [
    subreddit.display_name,
    subreddit.title,
    subreddit.public_description,
    subreddit.description
  ]
    .join(" ")
    .toLowerCase();
}

function scoreSubreddit(subreddit, rules) {
  const text = subredditText(subreddit);
  let score = 0;

  for (const term of positiveTerms) {
    if (text.includes(term)) score += 8;
  }

  const subscribers = Number(subreddit.subscribers ?? 0);
  if (subscribers > 1000) score += 5;
  if (subscribers > 10000) score += 8;
  if (subscribers > 100000) score += 6;
  if (subscribers > 1000000) score -= 5;
  if (subreddit.over18) score -= 20;

  const ruleText = rules
    .map((rule) => `${rule.short_name ?? ""} ${rule.description ?? ""}`.toLowerCase())
    .join(" ");
  const cautions = cautionTerms.filter((term) => ruleText.includes(term));
  score -= cautions.length * 12;

  return {
    score,
    cautions
  };
}

async function searchSubreddits(query, limit, accessToken) {
  const data = await redditGet(`/subreddits/search?q=${encodeURIComponent(query)}&limit=${limit}`, accessToken);
  return data?.data?.children?.map((child) => child.data) ?? [];
}

async function getRules(displayName, accessToken) {
  try {
    const data = await redditGet(`/r/${displayName}/about/rules`, accessToken);
    return data?.rules ?? [];
  } catch {
    return [];
  }
}

const queries = getQueries();
const limit = getLimit();
const accessToken = await getAccessToken();
const seen = new Map();

if (!accessToken) {
  console.error("No Reddit OAuth credentials found. Using the built-in shortlist only.");
  console.error("Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REFRESH_TOKEN, and REDDIT_USER_AGENT for live discovery.\n");
  for (const subreddit of fallbackSubreddits) {
    seen.set(subreddit.display_name_prefixed, subreddit);
  }
} else {
  for (const query of queries) {
    const subreddits = await searchSubreddits(query, limit, accessToken);
    for (const subreddit of subreddits) {
      seen.set(subreddit.display_name_prefixed, subreddit);
    }
  }
}

const results = [];
for (const subreddit of seen.values()) {
  const rules = accessToken ? await getRules(subreddit.display_name, accessToken) : [];
  const { score, cautions } = scoreSubreddit(subreddit, rules);
  results.push({
    subreddit: subreddit.display_name_prefixed,
    score,
    subscribers: subreddit.subscribers ?? 0,
    title: subreddit.title ?? "",
    description: subreddit.public_description ?? "",
    cautions,
    url: `https://www.reddit.com/${subreddit.display_name_prefixed}/`
  });
}

results.sort((a, b) => b.score - a.score || b.subscribers - a.subscribers);

console.log(JSON.stringify(results.slice(0, 20), null, 2));
