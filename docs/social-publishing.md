# Social Publishing

Brand: Forab AI
Product: DutchFlow by Forab AI

This project includes cautious social publishing helpers. Use them for occasional, honest launch posts and feedback requests. Do not use them for spam, fake engagement, automated voting, or repeated cross-posting.

See `docs/community-targets.md` for a first-pass list of learner communities and suggested post angles.

## Drafts

Generate platform-specific drafts:

```bash
npm run social:draft
npm run social:draft -- --platform=reddit
npm run social:draft -- --platform=linkedin
```

## Discover Communities

Find potentially relevant Reddit communities and score them by topic fit, size, and rule cautions:

```bash
npm run social:discover
npm run social:discover -- --queries="learn Dutch,language learning,side project" --limit=10
```

The output is a shortlist, not permission to post. Open each subreddit, read the latest rules, and prefer asking moderators when self-promotion rules are unclear.

You can also run `Discover Social Communities` manually from GitHub Actions. If Reddit OAuth secrets are present, it uses live Reddit search and rule checks. Without those secrets, it falls back to the built-in shortlist.

## Reddit Setup

Create a Reddit app at:

```text
https://www.reddit.com/prefs/apps
```

Use a script or installed app, then create a refresh token with the `submit` scope.

Required environment variables:

```text
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
REDDIT_REFRESH_TOKEN
REDDIT_USER_AGENT
REDDIT_SUBREDDIT
```

One-click local authorization after you have a Reddit app:

```bash
$env:REDDIT_CLIENT_ID="your_client_id"
$env:REDDIT_CLIENT_SECRET="your_client_secret"
npm run social:reddit-auth
```

The script opens Reddit in your browser. Click Allow once. It saves `REDDIT_REFRESH_TOKEN` to `.env.social.local`.

Your Reddit app redirect URI must be:

```text
http://127.0.0.1:8787/callback
```

Local dry run:

```bash
npm run social:reddit
```

Local live post:

```bash
npm run social:reddit -- --live
```

## Discord

Create a Discord webhook in your server channel, then set:

```text
DISCORD_WEBHOOK_URL
```

Dry run:

```bash
npm run social:webhook -- --platform=discord
```

Live post:

```bash
npm run social:webhook -- --platform=discord --live
```

## Telegram

Create a bot with BotFather, add it to your channel or chat, then set:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Dry run:

```bash
npm run social:webhook -- --platform=telegram
```

Live post:

```bash
npm run social:webhook -- --platform=telegram --live
```

GitHub Actions:

1. Add the same Reddit values as repository secrets.
2. Run `Post to Reddit` manually from the Actions tab.
3. Leave `live=false` for preview. Set `live=true` only when the post is ready.

## Suggested Communities

Check each subreddit's self-promotion rules before posting:

```text
languagelearning
learndutch
dutch
SideProject
webdev
InternetIsBeautiful
```

## Safer Posting Rhythm

Start with one relevant community. Reply manually to comments. If people find it useful, post a different angle to another community later. Real conversation beats automation here.
