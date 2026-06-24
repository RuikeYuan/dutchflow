# Social Publishing

This project includes a cautious Reddit publishing helper. Use it for occasional, honest launch posts and feedback requests. Do not use it for spam, fake engagement, automated voting, or repeated cross-posting.

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

Local dry run:

```bash
npm run social:reddit
```

Local live post:

```bash
npm run social:reddit -- --live
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
