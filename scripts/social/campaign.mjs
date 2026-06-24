export const app = {
  name: "DutchFlow",
  url: "https://dutch-frequency-app.vercel.app",
  repo: "https://github.com/RuikeYuan/dutchflow",
  tagline: "a simple Dutch frequency vocabulary trainer",
  audience: "Dutch learners and language-learning builders"
};

export const posts = {
  short: [
    `I built ${app.name}, ${app.tagline}.`,
    "",
    "It has frequency-based word browsing, notebook cards, spaced review, sentence shadowing, and AI example sentences.",
    "",
    app.url
  ].join("\n"),
  feedback: [
    `I built ${app.name} for learning Dutch vocabulary by frequency.`,
    "",
    "The app focuses on the words learners are most likely to see first, then adds review cards, pronunciation, example sentences, and light speaking practice.",
    "",
    `Try it: ${app.url}`,
    `Code: ${app.repo}`,
    "",
    "If you are learning Dutch, what would make this more useful for daily study?"
  ].join("\n"),
  builder: [
    `Small launch: ${app.name}`,
    "",
    "A Vite + React app for studying Dutch vocabulary with frequency data, local progress, AI-generated examples, translation, grammar notes, and speaking practice.",
    "",
    `Live: ${app.url}`,
    `Repo: ${app.repo}`,
    "",
    "I am keeping it intentionally simple: fast word lookup, cards, review, and sentence practice instead of a heavy course platform."
  ].join("\n")
};

export const platformPosts = {
  reddit: {
    title: `I built ${app.name}, a simple Dutch frequency vocabulary trainer`,
    body: posts.feedback
  },
  discord: {
    content: posts.builder
  },
  telegram: {
    text: posts.short
  },
  linkedin: {
    text: [
      `I shipped ${app.name}, ${app.tagline}.`,
      "",
      "It combines frequency-based vocabulary study with review cards, pronunciation, AI examples, translations, grammar notes, and speaking practice.",
      "",
      `Live app: ${app.url}`,
      `GitHub: ${app.repo}`,
      "",
      "I built it as a focused language-learning tool: lightweight, practical, and easy to return to every day."
    ].join("\n")
  },
  x: {
    text: [
      `I built ${app.name}: ${app.tagline}.`,
      "",
      "Frequency words, notebook cards, spaced review, sentence shadowing, AI examples, and speaking practice.",
      "",
      app.url
    ].join("\n")
  }
};
