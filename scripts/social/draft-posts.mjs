import { platformPosts } from "./campaign.mjs";

const platform = process.argv.find((arg) => arg.startsWith("--platform="))?.split("=")[1];
const entries = platform ? [[platform, platformPosts[platform]]] : Object.entries(platformPosts);

for (const [name, post] of entries) {
  if (!post) {
    console.error(`Unknown platform: ${name}`);
    process.exitCode = 1;
    continue;
  }

  console.log(`\n--- ${name.toUpperCase()} ---\n`);
  if (post.title) {
    console.log(`Title: ${post.title}\n`);
  }
  console.log(post.body ?? post.content ?? post.text);
}
