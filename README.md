# Dutch Frequency Trainer

A Dutch vocabulary learning app built on frequency data. Features:

- Browse high-frequency words with category filtering
- Search by Dutch word, English definition, or part of speech
- Personal word list saved in the browser (localStorage)
- Dutch pronunciation via browser Speech Synthesis
- Flashcard practice, prioritizing words from your word list
- AI conversation partner for spoken practice: scenario dialogues, voice input, follow-up questions, and brief corrections
- Dev server automatically reads example sentences from the EPUB — no manual import needed

## Run

```bash
npm install
npm run dev
```

Default address:

```text
http://127.0.0.1:5180
```

## Automatic Deploy

This repo includes a GitHub Actions workflow at `.github/workflows/vercel-production.yml`.
After pushing the repo to GitHub, add these repository secrets:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

For the current Vercel project:

```text
VERCEL_ORG_ID=team_lzShNBk8YbGLHxpepr5rFLFn
VERCEL_PROJECT_ID=prj_Iz1n8h8yxlwOXPkcZuAWTU52xFHw
```

Then every push to `main` runs `npm run build` and deploys to Vercel Production.

## iOS / App Store

This project is prepared for iOS packaging with Capacitor.

```bash
npm run ios:sync
npm run ios:open
```

`npm run ios:sync` builds the React app and copies the production files into the native iOS project under `ios/`.
`npm run ios:open` must be run on macOS with Xcode installed. From Xcode, set your Apple Developer Team, confirm the bundle identifier, add final app icons and screenshots, then archive for TestFlight or App Store submission.

The current bundle identifier is:

```text
com.humao.dutchfrequency
```

Native iOS builds include the static study app. Development-only Vite endpoints such as `/api/book-examples`, `/api/generate-example`, and `/api/translate-example` are not bundled into the app; those features need a hosted API before App Store release.

For a hosted production API, set:

```bash
$env:VITE_API_BASE_URL="https://your-api.example.com"
npm run ios:sync
```

Before App Store submission:

- Replace the placeholder support email in `public/support.html`.
- Deploy the app or static pages so Apple can access `/privacy.html` and `/support.html`.
- In Xcode, set your Apple Developer Team and confirm the Bundle Identifier.
- Add final iOS app icons in Xcode's asset catalog.
- Capture App Store screenshots on iPhone display sizes.
- Fill App Privacy answers based on enabled features: local study data, optional microphone/speech recognition, and optional AI API requests.
- Archive and upload the build to App Store Connect for TestFlight review.

## Data

Frequency data is sourced from a local EPUB:

```text
C:\Users\humao\Downloads\vdoc.pub_a-frequency-dictionary-of-dutch.epub
```

The app extracts only the fields needed for study: word, part of speech, English definition, frequency list, rank, and frequency score.

The dev server automatically reads example sentences from the EPUB and serves them via `/api/book-examples`. If the EPUB is not at the default path, specify it with an environment variable:

```bash
$env:DUTCH_FREQ_EPUB_PATH="D:\path\to\a-frequency-dictionary-of-dutch.epub"
npm run dev
```

In production there's no EPUB file to read from. Book sentences are pre-extracted once and uploaded to a private Vercel Blob store (`BOOK_EXAMPLES_BLOB_PATHNAME` env var + `BLOB_READ_WRITE_TOKEN`); `api/book-examples.js` fetches that blob instead. Re-upload with `vercel blob put <file> --pathname <name> --access private` and update the env var if the source EPUB changes.

## LLM Examples

Each word card and practice page has an AI example button. Set the appropriate environment variable to auto-generate and save new example sentences for any word.

Gemini:

```bash
$env:GEMINI_API_KEY="your_gemini_api_key"
$env:GEMINI_MODEL="gemini-2.5-flash-lite"
$env:PORT="5173"
npm run dev
```

OpenAI:

```bash
$env:OPENAI_API_KEY="your_api_key"
npm run dev
```

Or any OpenAI-compatible endpoint:

```bash
$env:LLM_API_KEY="your_api_key"
$env:LLM_API_URL="https://api.openai.com/v1/chat/completions"
$env:LLM_MODEL="gpt-4o-mini"
npm run dev
```

Generated sentences are saved in the browser. Display priority: AI-generated → book example → auto template.

The example section also supports Chinese, English, and German translations, generated via the same LLM config and saved locally.

The conversation practice page uses the same Gemini or OpenAI-compatible config. Voice input requires browser microphone permission and Speech Recognition support; if unavailable, you can type Dutch sentences directly.

Generated examples are never written back to the source data files. When running `npm run dev`, the Vite dev server reads sentences from the EPUB path above and serves them via `/api/book-examples`.
