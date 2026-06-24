# Dutch Frequency Trainer

一个基于荷兰语词频数据的学习 app，支持：

- 高频词浏览和分类筛选
- 荷兰语、英文释义、词性搜索
- 单词本，本地浏览器保存
- 荷兰语读音，使用浏览器 Speech Synthesis
- 抽认卡练习，优先使用单词本内容
- AI 电子人口语陪练，支持场景对话、语音输入、AI 追问和简短纠错
- 本地开发服务器自动读取 EPUB 里的例句，无需手动导入

## Run

```bash
npm install
npm run dev
```

默认地址：

```text
http://127.0.0.1:5180
```

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

词频数据来自本地 EPUB：

```text
C:\Users\humao\Downloads\vdoc.pub_a-frequency-dictionary-of-dutch.epub
```

应用只提取学习所需的词条字段：词、词性、英文释义、词频列表、排名、频率。

开发服务器会自动从这个本地 EPUB 读取书中例句，并通过 `/api/book-examples` 提供给前端。
如果 EPUB 不在默认路径，可以用环境变量指定：

```bash
$env:DUTCH_FREQ_EPUB_PATH="D:\path\to\a-frequency-dictionary-of-dutch.epub"
npm run dev
```

## LLM Examples

每个单词卡和练习页都有一个 AI 例句按钮。配置环境变量后可自动生成并保存该词的新例句：

Gemini：

```bash
$env:GEMINI_API_KEY="your_gemini_api_key"
$env:GEMINI_MODEL="gemini-2.5-flash-lite"
$env:PORT="5173"
npm run dev
```

```bash
$env:OPENAI_API_KEY="your_api_key"
npm run dev
```

也可以使用 OpenAI-compatible 服务：

```bash
$env:LLM_API_KEY="your_api_key"
$env:LLM_API_URL="https://api.openai.com/v1/chat/completions"
$env:LLM_MODEL="gpt-4o-mini"
npm run dev
```

生成的例句保存在浏览器本地，显示优先级为：AI 生成例句、书中例句、自动模板句。

例句区也可以选择中文、English、Deutsch 翻译，翻译同样使用上面的 LLM 配置，并保存在浏览器本地。

口语陪练页同样使用上面的 Gemini 或 OpenAI-compatible 配置。语音输入依赖浏览器麦克风权限和 Speech Recognition；如果浏览器不支持，也可以直接输入荷兰语句子练习。

例句不会写入源码数据文件。运行 `npm run dev` 时，Vite 本地服务会从上面的 EPUB 路径读取例句，并通过 `/api/book-examples` 提供给前端。
