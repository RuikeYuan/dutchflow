import crypto from "node:crypto";
import http from "node:http";
import { spawn } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";

const port = Number(process.env.REDDIT_AUTH_PORT ?? 8787);
const redirectUri = process.env.REDDIT_REDIRECT_URI ?? `http://127.0.0.1:${port}/callback`;
const clientId = process.env.REDDIT_CLIENT_ID;
const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? "";
const userAgent = process.env.REDDIT_USER_AGENT ?? "DutchFlow social auth by u/RuikeYuan";
const scope = process.env.REDDIT_AUTH_SCOPE ?? "submit read identity";
const state = crypto.randomBytes(16).toString("hex");

function openBrowser(url) {
  const command =
    process.platform === "win32"
      ? "cmd"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawn(command, args, {
    detached: true,
    stdio: "ignore"
  }).unref();
}

function basicAuth() {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function exchangeCode(code) {
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    })
  });

  const data = await response.json();
  if (!response.ok || !data.refresh_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }

  return data.refresh_token;
}

async function upsertEnvFile(refreshToken) {
  const path = ".env.social.local";
  let current = "";
  try {
    current = await readFile(path, "utf8");
  } catch {
    // First-time setup.
  }

  const lines = current
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("REDDIT_REFRESH_TOKEN=") && !line.startsWith("REDDIT_USER_AGENT="));

  lines.push(`REDDIT_REFRESH_TOKEN=${refreshToken}`);
  lines.push(`REDDIT_USER_AGENT=${userAgent}`);
  await appendFile(path, `${lines.join("\n")}\n`);
}

if (!clientId) {
  console.error("Missing REDDIT_CLIENT_ID.");
  console.error("Create a Reddit app at https://www.reddit.com/prefs/apps and set its redirect URI to:");
  console.error(redirectUri);
  process.exit(1);
}

const authUrl = new URL("https://www.reddit.com/api/v1/authorize");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("state", state);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("duration", "permanent");
authUrl.searchParams.set("scope", scope);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", redirectUri);
    if (url.pathname !== "/callback") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    if (url.searchParams.get("state") !== state) {
      response.writeHead(400);
      response.end("State mismatch. Close this tab and retry.");
      return;
    }

    const error = url.searchParams.get("error");
    if (error) {
      response.writeHead(400);
      response.end(`Reddit authorization failed: ${error}`);
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      response.writeHead(400);
      response.end("Missing authorization code.");
      return;
    }

    const refreshToken = await exchangeCode(code);
    await upsertEnvFile(refreshToken);
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Reddit authorization complete. You can close this tab.");
    console.log("Saved REDDIT_REFRESH_TOKEN to .env.social.local");
    server.close();
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : String(error));
    console.error(error instanceof Error ? error.message : error);
    server.close();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Listening on ${redirectUri}`);
  console.log("Opening Reddit authorization page...");
  openBrowser(authUrl.toString());
  console.log(authUrl.toString());
});
