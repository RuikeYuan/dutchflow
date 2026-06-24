import { platformPosts } from "./campaign.mjs";

const live = process.argv.includes("--live");
const platform = process.argv.find((arg) => arg.startsWith("--platform="))?.split("=")[1] ?? "discord";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function postDiscord() {
  const content = process.env.SOCIAL_POST_TEXT ?? platformPosts.discord.content;

  if (!live) {
    console.log("Discord dry run:\n");
    console.log(content);
    return;
  }

  const webhookUrl = requireEnv("DISCORD_WEBHOOK_URL");
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content,
      allowed_mentions: {
        parse: []
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status} ${await response.text()}`);
  }

  console.log("Posted to Discord.");
}

async function postTelegram() {
  const text = process.env.SOCIAL_POST_TEXT ?? platformPosts.telegram.text;

  if (!live) {
    console.log("Telegram dry run:\n");
    console.log(text);
    return;
  }

  const botToken = requireEnv("TELEGRAM_BOT_TOKEN");
  const chatId = requireEnv("TELEGRAM_CHAT_ID");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: false
    })
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram post failed: ${JSON.stringify(data)}`);
  }

  console.log("Posted to Telegram.");
}

try {
  if (platform === "discord") {
    await postDiscord();
  } else if (platform === "telegram") {
    await postTelegram();
  } else {
    throw new Error("Supported webhook platforms: discord, telegram");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
