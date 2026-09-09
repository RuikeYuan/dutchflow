import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  Languages,
  Layers3,
  Mic,
  Pause,
  Play,
  Podcast,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Square,
  Volume2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { grammarGuideChapters, grammarGuideParts, type GrammarChapter, type GrammarNode } from "./data/grammarGuide";
import frequencyWords from "./data/frequencyWords.json";

type DutchWord = {
  rank: number;
  word: string;
  partOfSpeech: string;
  translation: string;
  translationZh?: string;
  list: string;
  sourceId: string;
  frequency?: number;
};

type ViewMode = "landing" | "browse" | "notebook" | "study" | "speaking" | "grammar" | "reading" | "podcast" | "method";
type UiLanguage = "zh" | "en" | "nl" | "es" | "de";
type ExampleTranslationLanguage = "zh" | "en" | "de";
type CardMeaningLanguage = "en" | "zh";
type SpeechLanguage = "zh-CN" | "en-US" | "nl-NL";
type SpeechItem = { text: string; language: SpeechLanguage };
type WordAnswerTurn = {
  role: "user" | "assistant";
  text: string;
};
type SyncPayload = {
  notebook: string[];
  autoPlayMuted: string[];
  generatedExamples: Record<string, string>;
  exampleTranslations: Record<string, string>;
  exampleGrammar: Record<string, string>;
  spokenGrammar: Record<string, string>;
  wordAnswers: Record<string, WordAnswerTurn[]>;
  studyProgress: Record<string, StudyProgress>;
};
type SyncStatus = "idle" | "syncing" | "synced" | "error";
type GrammarNodeEntry = {
  node: GrammarNode;
  path: string[];
  depth: number;
};

const words = frequencyWords as DutchWord[];
const defaultNotebookWordCount = 3000;
const wordLookup = new Map<string, DutchWord>();
for (const word of words) {
  const variants = word.word
    .split(",")
    .map((value) => cleanWord(value))
    .filter(Boolean);
  for (const variant of variants) {
    wordLookup.set(normalize(variant), word);
  }
}
const notebookStorageKey = "dutch-frequency-app-notebook";
const defaultNotebookMigrationKey = "dutch-frequency-app-default-notebook-3000";
const languageStorageKey = "dutch-frequency-app-ui-language";
const generatedExamplesStorageKey = "dutch-frequency-app-generated-examples";
const exampleTranslationsStorageKey = "dutch-frequency-app-example-translations";
const exampleGrammarStorageKey = "dutch-frequency-app-example-grammar";
const spokenGrammarStorageKey = "dutch-frequency-app-spoken-grammar-v2";
const wordAnswersStorageKey = "dutch-frequency-app-word-answers";
const autoPlayMutedStorageKey = "dutch-frequency-app-autoplay-muted";
const defaultAutoPlaySelectionMigrationKey = "dutch-frequency-app-default-autoplay-selection-fiction20";
const studyProgressStorageKey = "dutch-frequency-app-study-progress";
const syncCodeStorageKey = "dutch-frequency-app-sync-code";
const syncUpdatedAtStorageKey = "dutch-frequency-app-sync-updated-at";
const syncCodeCharset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const listNames = ["All", "Core", "Fiction", "Newspapers", "Spoken", "Web", "General"];
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const apiAvailable = import.meta.env.DEV || import.meta.env.PROD || Boolean(apiBaseUrl);

const exampleTranslationLanguages: Record<ExampleTranslationLanguage, string> = {
  zh: "中文",
  en: "English",
  de: "Deutsch"
};
const defaultExampleTranslationLanguage: ExampleTranslationLanguage = "en";

const languageNames: Record<UiLanguage, string> = {
  zh: "中文",
  en: "English",
  nl: "Nederlands",
  es: "Español",
  de: "Deutsch"
};

type LandingCopy = {
  navFeatures: string;
  navMethod: string;
  navData: string;
  navCta: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroScreenshotAlt: string;
  statsWords: string;
  statsCategories: string;
  statsFeatures: string;
  featuresTitle: string;
  featuresSubtitle: string;
  featureExampleTitle: string;
  featureExampleBody: string;
  featureSrsTitle: string;
  featureSrsBody: string;
  featureSpeakingTitle: string;
  featureSpeakingBody: string;
  featureReadingTitle: string;
  featureReadingBody: string;
  featurePodcastTitle: string;
  featurePodcastBody: string;
  featureSyncTitle: string;
  featureSyncBody: string;
  methodTitle: string;
  methodSubtitle: string;
  step1Title: string;
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step3Title: string;
  step3Body: string;
  step4Title: string;
  step4Body: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  footerLeft: string;
  footerRight: string;
};

const translations: Record<
  UiLanguage,
  {
    appName: string;
    title: string;
    subtitle: string;
    language: string;
    landing: LandingCopy;
    statsWords: string;
    statsNotebook: string;
    statsCurrent: string;
    searchPlaceholder: string;
    jumpToRankPlaceholder: string;
    jumpToRankButton: string;
    viewLabel: string;
    modeBrowse: string;
    modeNotebook: string;
    modeStudy: string;
    modeSpeaking: string;
    modeGrammar: string;
    modeReading: string;
    modeMethod: string;
    readingTitle: string;
    readingSubtitle: string;
    readingLoading: string;
    readingFailed: string;
    readingEmpty: string;
    autoPlayGenres: string;
    stopAutoPlayGenres: string;
    autoPlayingGenre: (label: string) => string;
    syncLabel: string;
    syncHint: string;
    syncGenerate: string;
    syncDisable: string;
    syncCopy: string;
    syncCopied: string;
    syncEnterCodePlaceholder: string;
    syncLink: string;
    syncLinkConfirm: string;
    syncStatusSyncing: string;
    syncStatusSynced: string;
    syncStatusError: string;
    modePodcast: string;
    podcastTitle: string;
    podcastSubtitle: string;
    podcastLoading: string;
    podcastFailed: string;
    podcastEmpty: string;
    podcastPlay: string;
    podcastPause: string;
    podcastPlaying: string;
    podcastShowTranscript: string;
    podcastHideTranscript: string;
    filtersLabel: string;
    playPronunciation: string;
    autoPlayNotebook: string;
    stopAutoPlayNotebook: string;
    autoPlayExampleGrammar: string;
    loopAutoPlay: string;
    includeInAutoPlay: string;
    excludeFromAutoPlay: string;
    resetAutoPlaySelection: string;
    selectFictionTop20AutoPlay: string;
    addToNotebook: string;
    removeFromNotebook: string;
    noTranslation: string;
    docsLabel: string;
    resultCount: (count: number) => string;
    showingResults: (shown: number, total: number) => string;
    loadMore: string;
    clearNotebook: string;
    addAllToNotebook: string;
    emptyState: string;
    previous: string;
    next: string;
    showAnswer: string;
    hideAnswer: string;
    random: string;
    studyQueue: string;
    reset: string;
    reviewAgain: string;
    reviewHard: string;
    reviewKnown: string;
    reviewDueNow: string;
    reviewDueLater: (value: string) => string;
    reviewLevel: (level: number) => string;
    speakingTitle: string;
    speakingSubtitle: string;
    speakingScenario: string;
    speakingStart: string;
    speakingStop: string;
    speakingSend: string;
    speakingPlaceholder: string;
    speakingListening: string;
    speakingThinking: string;
    speakingTeacher: string;
    speakingLearner: string;
    speakingFeedback: string;
    speakingEmpty: string;
    speakingError: string;
    exampleSentence: string;
    playSentence: string;
    speechUnsupported: string;
    examplesReady: (count: number) => string;
    examplesLoading: string;
    examplesImportFailed: string;
    examplesOffline: string;
    generateExample: string;
    generatingExample: string;
    generatedExampleSaved: string;
    generationFailed: string;
    translateExample: string;
    translatingExample: string;
    translationFailed: string;
    exampleTranslation: string;
    explainGrammar: string;
    explainingGrammar: string;
    grammarExplanation: string;
    grammarFailed: string;
    askWord: string;
    askingWord: string;
    wordQuestionPlaceholder: string;
    wordAnswer: string;
    wordAnswerFailed: string;
    list: Record<string, string>;
    pos: Record<string, string>;
  }
> = {
  zh: {
    appName: "Dutch Frequency Trainer",
    title: "荷兰语高频词学习",
    subtitle: "基于 Frequency Dictionary 词频数据，按核心词、场景词和通用词逐步学习。",
    language: "界面语言",
    landing: {
      navFeatures: "功能",
      navMethod: "学习路径",
      navData: "词库数据",
      navCta: "开始学习",
      heroEyebrow: "AI 驱动 · 荷兰语词频学习",
      heroTitle: "从 5813 个高频词，\n学到能读懂真实荷兰语。",
      heroSubtitle:
        "按词频排序的核心词、小说、新闻、口语、网络、通用六大分类，配合 AI 例句、间隔重复练习、AI 口语陪练和每日 AI 阅读——一条从零到能读会说的路径。",
      heroCtaPrimary: "免费开始学习",
      heroCtaSecondary: "看看有什么功能",
      heroScreenshotAlt: "词频卡片截图",
      statsWords: "高频词条",
      statsCategories: "场景分类",
      statsFeatures: "学习功能",
      featuresTitle: "背单词只是起点，真正学会需要这些",
      featuresSubtitle: "每个功能都直接解决“背完就忘”“不敢开口”“看不懂真实内容”这几个荷兰语学习者最常卡住的地方。",
      featureExampleTitle: "AI 生成例句",
      featureExampleBody: "每个单词一键生成贴合语境的荷兰语例句，附中英翻译和语法讲解，而不是孤立背单词。",
      featureSrsTitle: "间隔重复练习",
      featureSrsBody: "根据记忆曲线安排复习节奏，快遗忘的词优先出现，学习时间花在刀刃上。",
      featureSpeakingTitle: "AI 口语陪练",
      featureSpeakingBody: "选择生活场景，AI 老师提问、你用荷兰语回答，实时纠错，敢开口才是真的会。",
      featureReadingTitle: "每日 AI 阅读",
      featureReadingBody: "每天生成灵感来自荷兰新闻话题的原创短文（A2–B1 难度），配中文翻译和语法讲解。",
      featurePodcastTitle: "AI 播客对话",
      featurePodcastBody: "两位虚拟主播用简单荷兰语聊时事，配文字稿和讲解，练听力像追剧一样自然。",
      featureSyncTitle: "跨设备同步",
      featureSyncBody: "一个同步码，手机和电脑之间的单词本、学习进度自动保持一致。",
      methodTitle: "从核心词到能听懂真实对话，四步走完。",
      methodSubtitle: "按词频学习意味着你先掌握覆盖率最高的词——通常前 2000 个高频词就能覆盖日常文本 90% 以上的内容。",
      step1Title: "打好核心词基础",
      step1Body: "先集中学最高频的核心词，覆盖日常表达的地基。",
      step2Title: "按场景扩展词汇",
      step2Body: "小说、新闻、口语、网络分类，按兴趣和需求补充。",
      step3Title: "真实语境里巩固",
      step3Body: "每日阅读、播客对话，让生词在真实内容里反复出现。",
      step4Title: "开口说、被纠正",
      step4Body: "AI 口语陪练把输入变成输出，纠错帮你把语感磨准。",
      ctaTitle: "今天就从第一个高频词开始。",
      ctaSubtitle: "免费使用，无需下载，浏览器打开就能学。",
      ctaButton: "开始学习荷兰语",
      footerLeft: "Dutch Frequency Trainer — 基于 Frequency Dictionary 词频数据",
      footerRight: "荷兰语高频词学习"
    },
    statsWords: "词库",
    statsNotebook: "单词本",
    statsCurrent: "当前",
    searchPlaceholder: "搜索荷兰语、英文释义或词性，输入编号可跳转",
    jumpToRankPlaceholder: "跳转到第几个",
    jumpToRankButton: "跳转",
    viewLabel: "视图",
    modeBrowse: "词频",
    modeNotebook: "单词本",
    modeStudy: "练习",
    modeSpeaking: "口语",
    modeGrammar: "语法",
    modeReading: "每日阅读",
    modeMethod: "方法",
    readingTitle: "每日阅读",
    readingSubtitle: "AI 根据当天荷兰新闻话题原创的简短阅读材料，配中文翻译和语法讲解。",
    readingLoading: "正在加载阅读材料…",
    readingFailed: "加载阅读材料失败，请稍后重试。",
    readingEmpty: "暂时没有阅读材料，请稍后再来看看。",
    autoPlayGenres: "从此分类起自动朗读全部",
    stopAutoPlayGenres: "停止自动朗读",
    autoPlayingGenre: (label) => `正在朗读：${label}`,
    syncLabel: "同步",
    syncHint: "生成一个同步码，在其他设备上输入同一个码，就能同步单词本和复习进度。不需要注册账号。",
    syncGenerate: "生成同步码",
    syncDisable: "停止同步",
    syncCopy: "复制",
    syncCopied: "已复制",
    syncEnterCodePlaceholder: "输入其他设备的同步码",
    syncLink: "连接",
    syncLinkConfirm: "这会用云端数据覆盖当前设备上的单词本和复习进度，确定继续吗？",
    syncStatusSyncing: "同步中…",
    syncStatusSynced: "已同步",
    syncStatusError: "同步失败，请检查网络后重试",
    modePodcast: "播客",
    podcastTitle: "荷兰语播客",
    podcastSubtitle: "AI 根据当天新闻话题生成的原创荷兰语对话，两位虚拟主播用简单荷兰语聊天，配中文文字稿和语法讲解。",
    podcastLoading: "正在加载播客…",
    podcastFailed: "加载播客失败，请稍后重试。",
    podcastEmpty: "暂时没有播客内容，请稍后再来看看。",
    podcastPlay: "播放",
    podcastPause: "暂停",
    podcastPlaying: "播放中…",
    podcastShowTranscript: "显示文字稿",
    podcastHideTranscript: "隐藏文字稿",
    filtersLabel: "词频分类",
    playPronunciation: "播放读音",
    autoPlayNotebook: "自动播放中英荷",
    stopAutoPlayNotebook: "停止播放",
    autoPlayExampleGrammar: "读例句和英文语法",
    loopAutoPlay: "循环播放",
    includeInAutoPlay: "已加入自动播放，点击可跳过此词",
    excludeFromAutoPlay: "已跳过此词，点击可加入自动播放",
    resetAutoPlaySelection: "全部朗读",
    selectFictionTop20AutoPlay: "只选 Fiction 前20",
    addToNotebook: "加入单词本",
    removeFromNotebook: "从单词本移除",
    noTranslation: "暂无释义",
    docsLabel: "100 篇文档",
    resultCount: (count) => `${count} 个结果`,
    showingResults: (shown, total) => `显示 ${shown} / ${total}`,
    loadMore: "加载更多",
    clearNotebook: "清空单词本",
    addAllToNotebook: "全部加入单词本",
    emptyState: "没有匹配的单词。",
    previous: "上一个",
    next: "下一个",
    showAnswer: "显示答案",
    hideAnswer: "隐藏答案",
    random: "随机",
    studyQueue: "练习队列",
    reset: "重置",
    reviewAgain: "不认识",
    reviewHard: "模糊",
    reviewKnown: "认识",
    reviewDueNow: "现在复习",
    reviewDueLater: (value) => `${value} 后复习`,
    reviewLevel: (level) => `记忆等级 ${level}`,
    speakingTitle: "AI 电子人口语陪练",
    speakingSubtitle: "选择一个生活场景，先听老师提问，再用荷兰语回答。AI 会继续追问，并给出简短纠错。",
    speakingScenario: "练习场景",
    speakingStart: "开始说话",
    speakingStop: "停止",
    speakingSend: "发送",
    speakingPlaceholder: "也可以手动输入荷兰语回答",
    speakingListening: "正在听你说",
    speakingThinking: "老师在思考",
    speakingTeacher: "电子老师",
    speakingLearner: "我",
    speakingFeedback: "反馈",
    speakingEmpty: "点击开始说话，或先发送一句荷兰语回答。",
    speakingError: "AI 口语陪练暂时不可用，请检查 Gemini 配置",
    exampleSentence: "例句跟读",
    playSentence: "播放例句",
    speechUnsupported: "当前浏览器不支持语音识别",
    examplesReady: (count) => `已导入 ${count} 条书中例句`,
    examplesLoading: "正在从本地 EPUB 读取书中例句...",
    examplesImportFailed: "读取书中例句失败，请确认 EPUB 文件路径存在",
    examplesOffline: "离线例句模式",
    generateExample: "AI 添加例句",
    generatingExample: "生成中...",
    generatedExampleSaved: "AI 例句已保存",
    generationFailed: "AI 例句生成失败，请检查 LLM 配置",
    translateExample: "翻译例句",
    translatingExample: "翻译中...",
    translationFailed: "翻译失败，请检查 LLM 配置",
    exampleTranslation: "例句翻译",
    explainGrammar: "语法讲解",
    explainingGrammar: "讲解中...",
    grammarExplanation: "语法细节",
    grammarFailed: "语法讲解失败，请检查 Gemini 配置",
    askWord: "问 AI",
    askingWord: "回答中...",
    wordQuestionPlaceholder: "问这个词的语法、用法、搭配、区别...",
    wordAnswer: "AI 问答",
    wordAnswerFailed: "AI 问答失败，请检查 LLM 配置",
    list: {
      All: "全部",
      Core: "核心",
      Fiction: "小说",
      Newspapers: "新闻",
      Spoken: "口语",
      Web: "网络",
      General: "通用"
    },
    pos: {
      noun: "名词",
      verb: "动词",
      adj: "形容词",
      adv: "副词",
      prep: "介词",
      conj: "连词",
      art: "冠词",
      pron: "代词",
      num: "数词",
      interj: "感叹词"
    }
  },
  en: {
    appName: "Dutch Frequency Trainer",
    title: "Dutch Frequency Learning",
    subtitle: "Study Dutch with frequency data, moving from core words to genre and general vocabulary.",
    language: "Interface language",
    landing: {
      navFeatures: "Features",
      navMethod: "Method",
      navData: "Word data",
      navCta: "Get started",
      heroEyebrow: "AI-powered · Dutch frequency learning",
      heroTitle: "From 5,813 high-frequency words\nto real Dutch fluency.",
      heroSubtitle:
        "Core, Fiction, Newspapers, Spoken, Web, and General — six frequency-ranked categories, paired with AI example sentences, spaced repetition, AI speaking practice, and daily AI reading. One path from zero to reading and speaking.",
      heroCtaPrimary: "Start learning free",
      heroCtaSecondary: "See what's inside",
      heroScreenshotAlt: "Screenshot of word frequency cards",
      statsWords: "high-frequency words",
      statsCategories: "categories",
      statsFeatures: "learning features",
      featuresTitle: "Memorizing words is just the start",
      featuresSubtitle:
        "Every feature tackles the exact points where Dutch learners get stuck: forgetting words right after learning them, being afraid to speak, and not being able to follow real content.",
      featureExampleTitle: "AI-generated examples",
      featureExampleBody:
        "Generate a natural Dutch example sentence for any word in one click, with translation and grammar notes — never memorize a word in isolation.",
      featureSrsTitle: "Spaced repetition",
      featureSrsBody:
        "Review timing follows your forgetting curve — words you're about to forget resurface first, so your time goes where it matters.",
      featureSpeakingTitle: "AI speaking practice",
      featureSpeakingBody:
        "Pick a real-life scenario, answer an AI tutor's questions in Dutch, and get corrected on the spot. Speaking is the only way to really know a language.",
      featureReadingTitle: "Daily AI reading",
      featureReadingBody:
        "Short original passages generated daily (A2–B1 level), inspired by Dutch news, with translation and grammar notes.",
      featurePodcastTitle: "AI podcast dialogues",
      featurePodcastBody:
        "Two AI hosts discuss current events in simple Dutch, with transcripts and grammar notes — listening practice that feels like a podcast, not homework.",
      featureSyncTitle: "Cross-device sync",
      featureSyncBody: "One sync code keeps your saved words and progress in step across phone and computer.",
      methodTitle: "From core words to real conversations, in four steps.",
      methodSubtitle:
        "Learning by frequency means mastering the highest-coverage words first — the top 2,000 alone typically cover over 90% of everyday text.",
      step1Title: "Build your core vocabulary",
      step1Body: "Start with the most frequent core words — the foundation of everyday expression.",
      step2Title: "Expand by scenario",
      step2Body: "Add Fiction, Newspapers, Spoken, or Web vocabulary based on your interests and needs.",
      step3Title: "Reinforce in real context",
      step3Body: "Daily reading and podcast dialogues put new words in front of you again and again, in real content.",
      step4Title: "Speak, and get corrected",
      step4Body: "AI speaking practice turns input into output, and corrections sharpen your intuition.",
      ctaTitle: "Start with word #1, today.",
      ctaSubtitle: "Free to use, nothing to install — just open your browser and start.",
      ctaButton: "Start learning Dutch",
      footerLeft: "Dutch Frequency Trainer — built on Frequency Dictionary word-frequency data",
      footerRight: "Dutch high-frequency vocabulary"
    },
    statsWords: "Words",
    statsNotebook: "Notebook",
    statsCurrent: "Current",
    searchPlaceholder: "Search Dutch, English meaning, or part of speech — type a number to jump to that rank",
    jumpToRankPlaceholder: "Jump to #",
    jumpToRankButton: "Jump",
    viewLabel: "View",
    modeBrowse: "Frequency",
    modeNotebook: "Notebook",
    modeStudy: "Study",
    modeSpeaking: "Speaking",
    modeGrammar: "Grammar",
    modeReading: "Daily Reading",
    modeMethod: "Method",
    readingTitle: "Daily Reading",
    readingSubtitle: "Short original Dutch passages inspired by today's news, with translation and grammar notes.",
    readingLoading: "Loading reading passages...",
    readingFailed: "Failed to load reading passages. Please try again later.",
    readingEmpty: "No reading passages yet. Check back later.",
    autoPlayGenres: "Auto-play all, starting from this category",
    stopAutoPlayGenres: "Stop auto-play",
    autoPlayingGenre: (label) => `Now playing: ${label}`,
    syncLabel: "Sync",
    syncHint: "Generate a sync code and enter it on another device to sync your notebook and review progress. No account needed.",
    syncGenerate: "Generate sync code",
    syncDisable: "Stop syncing",
    syncCopy: "Copy",
    syncCopied: "Copied",
    syncEnterCodePlaceholder: "Enter sync code from another device",
    syncLink: "Link",
    syncLinkConfirm: "This will overwrite this device's notebook and review progress with the cloud data. Continue?",
    syncStatusSyncing: "Syncing...",
    syncStatusSynced: "Synced",
    syncStatusError: "Sync failed. Check your connection and try again.",
    modePodcast: "Podcast",
    podcastTitle: "Dutch Podcast",
    podcastSubtitle: "Original Dutch dialogues generated from today's news, performed by two virtual hosts in simple Dutch, with a Chinese transcript and grammar notes.",
    podcastLoading: "Loading podcast...",
    podcastFailed: "Failed to load podcast episodes. Please try again later.",
    podcastEmpty: "No podcast episodes yet. Check back later.",
    podcastPlay: "Play",
    podcastPause: "Pause",
    podcastPlaying: "Playing...",
    podcastShowTranscript: "Show transcript",
    podcastHideTranscript: "Hide transcript",
    filtersLabel: "Frequency lists",
    playPronunciation: "Play pronunciation",
    autoPlayNotebook: "Auto-play Chinese, English, Dutch",
    stopAutoPlayNotebook: "Stop playback",
    autoPlayExampleGrammar: "Read example and English grammar",
    loopAutoPlay: "Loop playback",
    includeInAutoPlay: "Included in auto-play. Click to skip this word",
    excludeFromAutoPlay: "Skipped in auto-play. Click to include this word",
    resetAutoPlaySelection: "Read all",
    selectFictionTop20AutoPlay: "Only Fiction top 20",
    addToNotebook: "Add to notebook",
    removeFromNotebook: "Remove from notebook",
    noTranslation: "No translation",
    docsLabel: "100 docs",
    resultCount: (count) => `${count} results`,
    showingResults: (shown, total) => `Showing ${shown} / ${total}`,
    loadMore: "Load more",
    clearNotebook: "Clear notebook",
    addAllToNotebook: "Add all to notebook",
    emptyState: "No matching words.",
    previous: "Previous",
    next: "Next",
    showAnswer: "Show answer",
    hideAnswer: "Hide answer",
    random: "Random",
    studyQueue: "Study queue",
    reset: "Reset",
    reviewAgain: "Again",
    reviewHard: "Hard",
    reviewKnown: "Known",
    reviewDueNow: "Review now",
    reviewDueLater: (value) => `Review in ${value}`,
    reviewLevel: (level) => `Memory level ${level}`,
    speakingTitle: "AI avatar speaking practice",
    speakingSubtitle: "Pick a real-life situation, listen to the tutor, answer in Dutch, and get a short correction.",
    speakingScenario: "Scenario",
    speakingStart: "Start speaking",
    speakingStop: "Stop",
    speakingSend: "Send",
    speakingPlaceholder: "You can also type a Dutch answer",
    speakingListening: "Listening",
    speakingThinking: "Thinking",
    speakingTeacher: "Tutor",
    speakingLearner: "Me",
    speakingFeedback: "Feedback",
    speakingEmpty: "Start speaking, or type a Dutch answer.",
    speakingError: "AI speaking practice is unavailable. Check Gemini config",
    exampleSentence: "Sentence shadowing",
    playSentence: "Play sentence",
    speechUnsupported: "Speech recognition is not supported in this browser",
    examplesReady: (count) => `${count} book examples imported`,
    examplesLoading: "Reading book examples from the local EPUB...",
    examplesImportFailed: "Could not read book examples. Check the EPUB path",
    examplesOffline: "Offline example mode",
    generateExample: "Add AI example",
    generatingExample: "Generating...",
    generatedExampleSaved: "AI example saved",
    generationFailed: "Could not generate an AI example. Check the LLM config",
    translateExample: "Translate example",
    translatingExample: "Translating...",
    translationFailed: "Could not translate. Check the LLM config",
    exampleTranslation: "Example translation",
    explainGrammar: "Explain grammar",
    explainingGrammar: "Explaining...",
    grammarExplanation: "Grammar details",
    grammarFailed: "Could not explain grammar. Check the LLM config",
    askWord: "Ask AI",
    askingWord: "Answering...",
    wordQuestionPlaceholder: "Ask grammar, usage, collocations, nuance...",
    wordAnswer: "AI answer",
    wordAnswerFailed: "Could not answer. Check the LLM config",
    list: {
      All: "All",
      Core: "Core",
      Fiction: "Fiction",
      Newspapers: "Newspapers",
      Spoken: "Spoken",
      Web: "Web",
      General: "General"
    },
    pos: {
      noun: "noun",
      verb: "verb",
      adj: "adjective",
      adv: "adverb",
      prep: "preposition",
      conj: "conjunction",
      art: "article",
      pron: "pronoun",
      num: "number",
      interj: "interjection"
    }
  },
  nl: {
    appName: "Nederlandse Frequentietrainer",
    title: "Nederlands leren met frequentiewoorden",
    subtitle: "Leer Nederlands met frequentiedata, van kernwoorden naar genres en algemene woordenschat.",
    language: "Interfacetaal",
    landing: {
      navFeatures: "Functies",
      navMethod: "Methode",
      navData: "Woordgegevens",
      navCta: "Beginnen",
      heroEyebrow: "AI-gestuurd · Nederlands leren op frequentie",
      heroTitle: "Van 5.813 hoogfrequente woorden\nnaar echte vaardigheid in het Nederlands.",
      heroSubtitle:
        "Kern, Fictie, Kranten, Gesproken, Web en Algemeen — zes categorieën gerangschikt op frequentie, gecombineerd met AI-voorbeeldzinnen, herhaling op basis van je vergeetcurve, AI-spreekoefeningen en dagelijks AI-leesmateriaal. Eén route van nul naar lezen en spreken.",
      heroCtaPrimary: "Gratis beginnen",
      heroCtaSecondary: "Bekijk de functies",
      heroScreenshotAlt: "Screenshot van woordfrequentiekaarten",
      statsWords: "hoogfrequente woorden",
      statsCategories: "categorieën",
      statsFeatures: "leerfuncties",
      featuresTitle: "Woorden stampen is nog maar het begin",
      featuresSubtitle:
        "Elke functie pakt precies de punten aan waar leerders van het Nederlands vastlopen: woorden meteen weer vergeten, niet durven spreken, en echte content niet kunnen volgen.",
      featureExampleTitle: "AI-voorbeeldzinnen",
      featureExampleBody:
        "Genereer met één klik een natuurlijke Nederlandse voorbeeldzin bij elk woord, met vertaling en grammatica-uitleg — nooit een woord los uit zijn verband leren.",
      featureSrsTitle: "Herhaling op maat",
      featureSrsBody:
        "De herhalingstiming volgt jouw vergeetcurve — woorden die je bijna vergeet komen als eerste terug, zodat je tijd gaat naar wat telt.",
      featureSpeakingTitle: "AI-spreekoefening",
      featureSpeakingBody:
        "Kies een alledaagse situatie, beantwoord de vragen van een AI-docent in het Nederlands en krijg direct feedback. Spreken is de enige manier om een taal echt te beheersen.",
      featureReadingTitle: "Dagelijks AI-leesmateriaal",
      featureReadingBody:
        "Elke dag een nieuwe, originele tekst (niveau A2–B1) geïnspireerd op Nederlands nieuws, met vertaling en grammatica-uitleg.",
      featurePodcastTitle: "AI-podcastgesprekken",
      featurePodcastBody:
        "Twee AI-presentatoren bespreken actualiteiten in eenvoudig Nederlands, met transcript en uitleg — luisteroefening die aanvoelt als een podcast, geen huiswerk.",
      featureSyncTitle: "Synchroniseren tussen apparaten",
      featureSyncBody:
        "Eén synchronisatiecode houdt je opgeslagen woorden en voortgang gelijk tussen telefoon en computer.",
      methodTitle: "In vier stappen van kernwoorden naar echte gesprekken.",
      methodSubtitle:
        "Leren op basis van frequentie betekent eerst de woorden met de hoogste dekking beheersen — de top 2.000 dekt vaak al meer dan 90% van alledaagse tekst.",
      step1Title: "Bouw je kernwoordenschat op",
      step1Body: "Begin met de meest voorkomende kernwoorden — de basis van alledaagse taal.",
      step2Title: "Breid uit per scenario",
      step2Body: "Voeg woordenschat toe uit Fictie, Kranten, Gesproken of Web, afhankelijk van je interesses en behoeften.",
      step3Title: "Verstevig in echte context",
      step3Body: "Dagelijks lezen en podcastgesprekken laten nieuwe woorden telkens opnieuw zien, in echte content.",
      step4Title: "Spreek, en krijg feedback",
      step4Body: "AI-spreekoefening maakt van input output, en correcties scherpen je taalgevoel aan.",
      ctaTitle: "Begin vandaag nog met woord nummer 1.",
      ctaSubtitle: "Gratis te gebruiken, niets te installeren — open gewoon je browser en begin.",
      ctaButton: "Begin met Nederlands leren",
      footerLeft: "Dutch Frequency Trainer — gebaseerd op frequentiedata van Frequency Dictionary",
      footerRight: "Hoogfrequente Nederlandse woordenschat"
    },
    statsWords: "Woorden",
    statsNotebook: "Woordenlijst",
    statsCurrent: "Huidig",
    searchPlaceholder: "Zoek Nederlands, Engelse betekenis of woordsoort — typ een nummer om te springen",
    jumpToRankPlaceholder: "Ga naar #",
    jumpToRankButton: "Ga",
    viewLabel: "Weergave",
    modeBrowse: "Frequentie",
    modeNotebook: "Woordenlijst",
    modeStudy: "Oefenen",
    modeSpeaking: "Spreken",
    modeGrammar: "Grammatica",
    modeReading: "Dagelijks lezen",
    modeMethod: "Methode",
    readingTitle: "Dagelijks lezen",
    readingSubtitle: "Korte originele Nederlandse teksten geïnspireerd op het nieuws van vandaag, met vertaling en grammatica-uitleg.",
    readingLoading: "Leesteksten laden...",
    readingFailed: "Laden van leesteksten mislukt. Probeer het later opnieuw.",
    readingEmpty: "Nog geen leesteksten. Kom later terug.",
    autoPlayGenres: "Alles automatisch afspelen vanaf deze categorie",
    stopAutoPlayGenres: "Automatisch afspelen stoppen",
    autoPlayingGenre: (label) => `Nu bezig: ${label}`,
    syncLabel: "Synchroniseren",
    syncHint: "Genereer een synchronisatiecode en voer die op een ander apparaat in om je woordenboek en herhaalvoortgang te synchroniseren. Geen account nodig.",
    syncGenerate: "Code genereren",
    syncDisable: "Synchronisatie stoppen",
    syncCopy: "Kopiëren",
    syncCopied: "Gekopieerd",
    syncEnterCodePlaceholder: "Voer code van ander apparaat in",
    syncLink: "Koppelen",
    syncLinkConfirm: "Dit overschrijft het woordenboek en de herhaalvoortgang op dit apparaat met de cloudgegevens. Doorgaan?",
    syncStatusSyncing: "Synchroniseren...",
    syncStatusSynced: "Gesynchroniseerd",
    syncStatusError: "Synchronisatie mislukt. Controleer je verbinding en probeer het opnieuw.",
    modePodcast: "Podcast",
    podcastTitle: "Nederlandse Podcast",
    podcastSubtitle: "Originele Nederlandse dialogen geïnspireerd op het nieuws van vandaag, gesproken door twee virtuele presentatoren in eenvoudig Nederlands, met Chinees transcript en grammatica-uitleg.",
    podcastLoading: "Podcast laden...",
    podcastFailed: "Laden van podcast mislukt. Probeer het later opnieuw.",
    podcastEmpty: "Nog geen podcastafleveringen. Kom later terug.",
    podcastPlay: "Afspelen",
    podcastPause: "Pauzeren",
    podcastPlaying: "Speelt af...",
    podcastShowTranscript: "Transcript tonen",
    podcastHideTranscript: "Transcript verbergen",
    filtersLabel: "Frequentielijsten",
    playPronunciation: "Uitspraak afspelen",
    autoPlayNotebook: "Chinees, Engels, Nederlands automatisch afspelen",
    stopAutoPlayNotebook: "Afspelen stoppen",
    autoPlayExampleGrammar: "Voorbeeld en Engelse grammatica lezen",
    loopAutoPlay: "Herhalen",
    includeInAutoPlay: "Wordt automatisch afgespeeld. Klik om dit woord over te slaan",
    excludeFromAutoPlay: "Wordt overgeslagen. Klik om dit woord toe te voegen",
    resetAutoPlaySelection: "Alles voorlezen",
    selectFictionTop20AutoPlay: "Alleen Fiction top 20",
    addToNotebook: "Toevoegen aan woordenlijst",
    removeFromNotebook: "Verwijderen uit woordenlijst",
    noTranslation: "Geen vertaling",
    docsLabel: "100 documenten",
    resultCount: (count) => `${count} resultaten`,
    showingResults: (shown, total) => `${shown} / ${total} getoond`,
    loadMore: "Meer laden",
    clearNotebook: "Woordenlijst wissen",
    addAllToNotebook: "Alles toevoegen aan woordenlijst",
    emptyState: "Geen passende woorden.",
    previous: "Vorige",
    next: "Volgende",
    showAnswer: "Antwoord tonen",
    hideAnswer: "Antwoord verbergen",
    random: "Willekeurig",
    studyQueue: "Oefenrij",
    reset: "Resetten",
    reviewAgain: "Opnieuw",
    reviewHard: "Moeilijk",
    reviewKnown: "Bekend",
    reviewDueNow: "Nu oefenen",
    reviewDueLater: (value) => `Over ${value} oefenen`,
    reviewLevel: (level) => `Geheugenniveau ${level}`,
    speakingTitle: "AI-spreekpartner",
    speakingSubtitle: "Kies een situatie, luister naar de docent, antwoord in het Nederlands en krijg korte feedback.",
    speakingScenario: "Situatie",
    speakingStart: "Begin spreken",
    speakingStop: "Stoppen",
    speakingSend: "Versturen",
    speakingPlaceholder: "Je kunt ook een Nederlands antwoord typen",
    speakingListening: "Luistert",
    speakingThinking: "Denkt na",
    speakingTeacher: "Docent",
    speakingLearner: "Ik",
    speakingFeedback: "Feedback",
    speakingEmpty: "Begin met spreken of typ een Nederlands antwoord.",
    speakingError: "AI-spreekpartner is niet beschikbaar. Controleer Gemini-configuratie",
    exampleSentence: "Zin nazeggen",
    playSentence: "Zin afspelen",
    speechUnsupported: "Spraakherkenning wordt niet ondersteund in deze browser",
    examplesReady: (count) => `${count} voorbeeldzinnen geïmporteerd`,
    examplesLoading: "Voorbeeldzinnen uit de lokale EPUB lezen...",
    examplesImportFailed: "Voorbeeldzinnen konden niet worden gelezen. Controleer het EPUB-pad",
    examplesOffline: "Offline voorbeeldmodus",
    generateExample: "AI-zin toevoegen",
    generatingExample: "Genereren...",
    generatedExampleSaved: "AI-zin opgeslagen",
    generationFailed: "AI-zin kon niet worden gegenereerd. Controleer de LLM-configuratie",
    translateExample: "Zin vertalen",
    translatingExample: "Vertalen...",
    translationFailed: "Vertaling mislukt. Controleer de LLM-configuratie",
    exampleTranslation: "Vertaling van de zin",
    explainGrammar: "Grammatica",
    explainingGrammar: "Uitleg...",
    grammarExplanation: "Grammatica",
    grammarFailed: "Grammatica-uitleg mislukt. Controleer Gemini",
    askWord: "Vraag AI",
    askingWord: "Antwoord...",
    wordQuestionPlaceholder: "Vraag naar grammatica, gebruik, combinaties...",
    wordAnswer: "AI-antwoord",
    wordAnswerFailed: "Antwoord mislukt. Controleer de LLM-configuratie",
    list: {
      All: "Alles",
      Core: "Kern",
      Fiction: "Fictie",
      Newspapers: "Kranten",
      Spoken: "Gesproken",
      Web: "Web",
      General: "Algemeen"
    },
    pos: {
      noun: "zelfstandig naamwoord",
      verb: "werkwoord",
      adj: "bijvoeglijk naamwoord",
      adv: "bijwoord",
      prep: "voorzetsel",
      conj: "voegwoord",
      art: "lidwoord",
      pron: "voornaamwoord",
      num: "telwoord",
      interj: "tussenwerpsel"
    }
  },
  es: {
    appName: "Entrenador de Frecuencia Neerlandesa",
    title: "Aprende neerlandés con palabras frecuentes",
    subtitle: "Estudia neerlandés con datos de frecuencia, desde palabras básicas hasta vocabulario general y por género.",
    language: "Idioma de la interfaz",
    landing: {
      navFeatures: "Funciones",
      navMethod: "Método",
      navData: "Datos léxicos",
      navCta: "Empezar",
      heroEyebrow: "Impulsado por IA · Neerlandés por frecuencia",
      heroTitle: "De 5813 palabras de alta frecuencia\na una fluidez real en neerlandés.",
      heroSubtitle:
        "Core, Ficción, Prensa, Oral, Web y General: seis categorías ordenadas por frecuencia, combinadas con frases de ejemplo generadas por IA, repetición espaciada, práctica oral con IA y lectura diaria generada por IA. Un solo camino de cero a leer y hablar.",
      heroCtaPrimary: "Empezar gratis",
      heroCtaSecondary: "Ver las funciones",
      heroScreenshotAlt: "Captura de las tarjetas de frecuencia de palabras",
      statsWords: "palabras de alta frecuencia",
      statsCategories: "categorías",
      statsFeatures: "funciones de aprendizaje",
      featuresTitle: "Memorizar palabras es solo el principio",
      featuresSubtitle:
        "Cada función resuelve justo los puntos donde se atascan quienes aprenden neerlandés: olvidar las palabras nada más aprenderlas, no atreverse a hablar y no poder seguir contenido real.",
      featureExampleTitle: "Ejemplos generados por IA",
      featureExampleBody:
        "Genera con un clic una frase de ejemplo natural en neerlandés para cualquier palabra, con traducción y notas de gramática — nunca memorices una palabra aislada.",
      featureSrsTitle: "Repetición espaciada",
      featureSrsBody:
        "El ritmo de repaso sigue tu curva de olvido: las palabras que estás a punto de olvidar reaparecen primero, así que tu tiempo se invierte donde importa.",
      featureSpeakingTitle: "Práctica oral con IA",
      featureSpeakingBody:
        "Elige una situación real, responde en neerlandés a las preguntas de un tutor de IA y recibe corrección al instante. Hablar es la única forma de dominar de verdad un idioma.",
      featureReadingTitle: "Lectura diaria con IA",
      featureReadingBody:
        "Textos originales breves generados cada día (nivel A2–B1), inspirados en noticias neerlandesas, con traducción y notas de gramática.",
      featurePodcastTitle: "Diálogos de podcast con IA",
      featurePodcastBody:
        "Dos presentadores de IA comentan la actualidad en neerlandés sencillo, con transcripción y explicaciones — práctica de escucha que se siente como un podcast, no como deberes.",
      featureSyncTitle: "Sincronización entre dispositivos",
      featureSyncBody:
        "Un código de sincronización mantiene tus palabras guardadas y tu progreso iguales entre el móvil y el ordenador.",
      methodTitle: "De las palabras básicas a conversaciones reales, en cuatro pasos.",
      methodSubtitle:
        "Aprender por frecuencia significa dominar primero las palabras de mayor cobertura: las 2000 más frecuentes suelen cubrir más del 90% del texto cotidiano.",
      step1Title: "Construye tu vocabulario básico",
      step1Body: "Empieza por las palabras más frecuentes: la base de la expresión cotidiana.",
      step2Title: "Amplía por escenario",
      step2Body: "Añade vocabulario de Ficción, Prensa, Oral o Web según tus intereses y necesidades.",
      step3Title: "Refuerza en contexto real",
      step3Body: "La lectura diaria y los diálogos de podcast ponen las palabras nuevas frente a ti una y otra vez, en contenido real.",
      step4Title: "Habla, y recibe corrección",
      step4Body: "La práctica oral con IA convierte la entrada en salida, y las correcciones afinan tu intuición.",
      ctaTitle: "Empieza hoy mismo por la palabra número 1.",
      ctaSubtitle: "Gratis, sin nada que instalar: abre el navegador y empieza.",
      ctaButton: "Empezar a aprender neerlandés",
      footerLeft: "Dutch Frequency Trainer — basado en datos de frecuencia de Frequency Dictionary",
      footerRight: "Vocabulario neerlandés de alta frecuencia"
    },
    statsWords: "Palabras",
    statsNotebook: "Cuaderno",
    statsCurrent: "Actual",
    searchPlaceholder: "Buscar neerlandés, significado en inglés o categoría; escribe un número para saltar",
    jumpToRankPlaceholder: "Ir al #",
    jumpToRankButton: "Ir",
    viewLabel: "Vista",
    modeBrowse: "Frecuencia",
    modeNotebook: "Cuaderno",
    modeStudy: "Practicar",
    modeSpeaking: "Hablar",
    modeGrammar: "Gramática",
    modeReading: "Lectura diaria",
    modeMethod: "Método",
    readingTitle: "Lectura diaria",
    readingSubtitle: "Textos breves originales en neerlandés inspirados en las noticias de hoy, con traducción y notas de gramática.",
    readingLoading: "Cargando textos de lectura...",
    readingFailed: "No se pudieron cargar los textos de lectura. Inténtalo de nuevo más tarde.",
    readingEmpty: "Todavía no hay textos de lectura. Vuelve más tarde.",
    autoPlayGenres: "Reproducir todo automáticamente desde esta categoría",
    stopAutoPlayGenres: "Detener reproducción automática",
    autoPlayingGenre: (label) => `Reproduciendo: ${label}`,
    syncLabel: "Sincronizar",
    syncHint: "Genera un código de sincronización e ingrésalo en otro dispositivo para sincronizar tu cuaderno y tu progreso de repaso. No necesitas una cuenta.",
    syncGenerate: "Generar código",
    syncDisable: "Detener sincronización",
    syncCopy: "Copiar",
    syncCopied: "Copiado",
    syncEnterCodePlaceholder: "Ingresa el código de otro dispositivo",
    syncLink: "Vincular",
    syncLinkConfirm: "Esto sobrescribirá el cuaderno y el progreso de repaso de este dispositivo con los datos de la nube. ¿Continuar?",
    syncStatusSyncing: "Sincronizando...",
    syncStatusSynced: "Sincronizado",
    syncStatusError: "Error de sincronización. Revisa tu conexión e inténtalo de nuevo.",
    modePodcast: "Podcast",
    podcastTitle: "Podcast en Neerlandés",
    podcastSubtitle: "Diálogos originales en neerlandés inspirados en las noticias de hoy, interpretados por dos presentadores virtuales en neerlandés sencillo, con transcripción en chino y notas de gramática.",
    podcastLoading: "Cargando podcast...",
    podcastFailed: "No se pudieron cargar los episodios. Inténtalo de nuevo más tarde.",
    podcastEmpty: "Todavía no hay episodios. Vuelve más tarde.",
    podcastPlay: "Reproducir",
    podcastPause: "Pausar",
    podcastPlaying: "Reproduciendo...",
    podcastShowTranscript: "Mostrar transcripción",
    podcastHideTranscript: "Ocultar transcripción",
    filtersLabel: "Listas de frecuencia",
    playPronunciation: "Reproducir pronunciación",
    autoPlayNotebook: "Reproducir chino, inglés y neerlandés",
    stopAutoPlayNotebook: "Detener reproducción",
    autoPlayExampleGrammar: "Leer ejemplo y gramática en inglés",
    loopAutoPlay: "Reproducir en bucle",
    includeInAutoPlay: "Incluido en la reproducción automática. Haz clic para omitir esta palabra",
    excludeFromAutoPlay: "Omitida en la reproducción automática. Haz clic para incluir esta palabra",
    resetAutoPlaySelection: "Leer todo",
    selectFictionTop20AutoPlay: "Solo Fiction top 20",
    addToNotebook: "Añadir al cuaderno",
    removeFromNotebook: "Quitar del cuaderno",
    noTranslation: "Sin traducción",
    docsLabel: "100 documentos",
    resultCount: (count) => `${count} resultados`,
    showingResults: (shown, total) => `Mostrando ${shown} / ${total}`,
    loadMore: "Cargar más",
    clearNotebook: "Vaciar cuaderno",
    addAllToNotebook: "Añadir todo al cuaderno",
    emptyState: "No hay palabras coincidentes.",
    previous: "Anterior",
    next: "Siguiente",
    showAnswer: "Mostrar respuesta",
    hideAnswer: "Ocultar respuesta",
    random: "Aleatorio",
    studyQueue: "Cola de práctica",
    reset: "Restablecer",
    reviewAgain: "No lo sé",
    reviewHard: "Difícil",
    reviewKnown: "Lo sé",
    reviewDueNow: "Repasar ahora",
    reviewDueLater: (value) => `Repasar en ${value}`,
    reviewLevel: (level) => `Nivel de memoria ${level}`,
    speakingTitle: "Práctica oral con avatar IA",
    speakingSubtitle: "Elige una situación, escucha al tutor, responde en neerlandés y recibe una corrección breve.",
    speakingScenario: "Escenario",
    speakingStart: "Empezar a hablar",
    speakingStop: "Detener",
    speakingSend: "Enviar",
    speakingPlaceholder: "También puedes escribir una respuesta en neerlandés",
    speakingListening: "Escuchando",
    speakingThinking: "Pensando",
    speakingTeacher: "Tutor",
    speakingLearner: "Yo",
    speakingFeedback: "Feedback",
    speakingEmpty: "Empieza a hablar o escribe una respuesta en neerlandés.",
    speakingError: "La práctica oral con IA no está disponible. Revisa Gemini",
    exampleSentence: "Repetir una frase",
    playSentence: "Reproducir frase",
    speechUnsupported: "Este navegador no admite reconocimiento de voz",
    examplesReady: (count) => `${count} ejemplos importados`,
    examplesLoading: "Leyendo ejemplos desde el EPUB local...",
    examplesImportFailed: "No se pudieron leer los ejemplos. Revisa la ruta del EPUB",
    examplesOffline: "Modo de ejemplos sin conexión",
    generateExample: "Añadir ejemplo con IA",
    generatingExample: "Generando...",
    generatedExampleSaved: "Ejemplo de IA guardado",
    generationFailed: "No se pudo generar el ejemplo. Revisa la configuración del LLM",
    translateExample: "Traducir ejemplo",
    translatingExample: "Traduciendo...",
    translationFailed: "No se pudo traducir. Revisa la configuración del LLM",
    exampleTranslation: "Traducción del ejemplo",
    explainGrammar: "Explicar gramática",
    explainingGrammar: "Explicando...",
    grammarExplanation: "Detalles gramaticales",
    grammarFailed: "No se pudo explicar la gramática. Revisa Gemini",
    askWord: "Preguntar IA",
    askingWord: "Respondiendo...",
    wordQuestionPlaceholder: "Pregunta gramática, uso, matices...",
    wordAnswer: "Respuesta IA",
    wordAnswerFailed: "No se pudo responder. Revisa el LLM",
    list: {
      All: "Todo",
      Core: "Básico",
      Fiction: "Ficción",
      Newspapers: "Periódicos",
      Spoken: "Hablado",
      Web: "Web",
      General: "General"
    },
    pos: {
      noun: "sustantivo",
      verb: "verbo",
      adj: "adjetivo",
      adv: "adverbio",
      prep: "preposición",
      conj: "conjunción",
      art: "artículo",
      pron: "pronombre",
      num: "número",
      interj: "interjección"
    }
  },
  de: {
    appName: "Niederländisch-Frequenztrainer",
    title: "Niederländisch mit häufigen Wörtern lernen",
    subtitle: "Lerne Niederländisch mit Frequenzdaten, von Grundwortschatz bis zu Genre- und Allgemeinwortschatz.",
    language: "Oberflächensprache",
    landing: {
      navFeatures: "Funktionen",
      navMethod: "Methode",
      navData: "Wortdaten",
      navCta: "Loslegen",
      heroEyebrow: "KI-gestützt · Niederländisch nach Häufigkeit lernen",
      heroTitle: "Von 5813 hochfrequenten Wörtern\nzu echter Sprachkompetenz im Niederländischen.",
      heroSubtitle:
        "Kern, Fiktion, Zeitungen, Gesprochen, Web und Allgemein — sechs nach Häufigkeit sortierte Kategorien, kombiniert mit KI-Beispielsätzen, Spaced Repetition, KI-Sprachtraining und täglichem KI-Lesematerial. Ein Weg von null zum Lesen und Sprechen.",
      heroCtaPrimary: "Kostenlos starten",
      heroCtaSecondary: "Funktionen ansehen",
      heroScreenshotAlt: "Screenshot der Wortfrequenz-Karten",
      statsWords: "hochfrequente Wörter",
      statsCategories: "Kategorien",
      statsFeatures: "Lernfunktionen",
      featuresTitle: "Vokabeln pauken ist erst der Anfang",
      featuresSubtitle:
        "Jede Funktion setzt genau dort an, wo Niederländisch-Lernende hängen bleiben: Wörter gleich wieder vergessen, sich nicht trauen zu sprechen und echte Inhalte nicht verstehen.",
      featureExampleTitle: "KI-generierte Beispiele",
      featureExampleBody:
        "Erzeuge mit einem Klick einen natürlichen niederländischen Beispielsatz zu jedem Wort, mit Übersetzung und Grammatikhinweisen — nie ein Wort isoliert lernen.",
      featureSrsTitle: "Spaced Repetition",
      featureSrsBody:
        "Der Wiederholungsrhythmus folgt deiner Vergessenskurve — Wörter, die du bald vergisst, tauchen zuerst wieder auf, damit deine Zeit dort ankommt, wo sie zählt.",
      featureSpeakingTitle: "KI-Sprachtraining",
      featureSpeakingBody:
        "Wähle eine Alltagssituation, beantworte die Fragen eines KI-Tutors auf Niederländisch und erhalte sofort Korrekturen. Sprechen ist der einzige Weg, eine Sprache wirklich zu beherrschen.",
      featureReadingTitle: "Tägliches KI-Lesematerial",
      featureReadingBody:
        "Täglich neue, originale Kurztexte (Niveau A2–B1), inspiriert von niederländischen Nachrichten, mit Übersetzung und Grammatikhinweisen.",
      featurePodcastTitle: "KI-Podcast-Dialoge",
      featurePodcastBody:
        "Zwei KI-Moderatoren besprechen aktuelle Themen in einfachem Niederländisch, mit Transkript und Erklärungen — Hörtraining, das sich wie ein Podcast anfühlt, nicht wie Hausaufgaben.",
      featureSyncTitle: "Geräteübergreifende Synchronisierung",
      featureSyncBody:
        "Ein Sync-Code hält deine gespeicherten Wörter und deinen Fortschritt zwischen Handy und Computer auf demselben Stand.",
      methodTitle: "In vier Schritten von Kernwörtern zu echten Gesprächen.",
      methodSubtitle:
        "Lernen nach Häufigkeit heißt, zuerst die Wörter mit der höchsten Abdeckung zu beherrschen — allein die Top 2000 decken meist über 90% alltäglicher Texte ab.",
      step1Title: "Kernwortschatz aufbauen",
      step1Body: "Beginne mit den häufigsten Kernwörtern — der Grundlage alltäglicher Ausdrucksweise.",
      step2Title: "Nach Szenario erweitern",
      step2Body: "Ergänze Wortschatz aus Fiktion, Zeitungen, Gesprochen oder Web, je nach Interesse und Bedarf.",
      step3Title: "Im echten Kontext festigen",
      step3Body: "Tägliches Lesen und Podcast-Dialoge bringen neue Wörter immer wieder vor Augen, in echten Inhalten.",
      step4Title: "Sprechen und korrigiert werden",
      step4Body: "KI-Sprachtraining macht aus Input Output, und Korrekturen schärfen dein Sprachgefühl.",
      ctaTitle: "Starte noch heute mit Wort Nummer eins.",
      ctaSubtitle: "Kostenlos nutzbar, nichts zu installieren — einfach den Browser öffnen und loslegen.",
      ctaButton: "Niederländisch lernen starten",
      footerLeft: "Dutch Frequency Trainer — basierend auf Frequenzdaten von Frequency Dictionary",
      footerRight: "Hochfrequenter niederländischer Wortschatz"
    },
    statsWords: "Wörter",
    statsNotebook: "Wortliste",
    statsCurrent: "Aktuell",
    searchPlaceholder: "Niederländisch, englische Bedeutung oder Wortart suchen – Zahl eingeben zum Springen",
    jumpToRankPlaceholder: "Springe zu #",
    jumpToRankButton: "Springen",
    viewLabel: "Ansicht",
    modeBrowse: "Frequenz",
    modeNotebook: "Wortliste",
    modeStudy: "Üben",
    modeSpeaking: "Sprechen",
    modeGrammar: "Grammatik",
    modeReading: "Tägliches Lesen",
    modeMethod: "Methode",
    readingTitle: "Tägliches Lesen",
    readingSubtitle: "Kurze originale niederländische Texte, inspiriert von aktuellen Nachrichten, mit Übersetzung und Grammatikerklärung.",
    readingLoading: "Lesetexte werden geladen...",
    readingFailed: "Lesetexte konnten nicht geladen werden. Bitte später erneut versuchen.",
    readingEmpty: "Noch keine Lesetexte. Schau später wieder vorbei.",
    autoPlayGenres: "Alles automatisch abspielen ab dieser Kategorie",
    stopAutoPlayGenres: "Automatische Wiedergabe stoppen",
    autoPlayingGenre: (label) => `Wird abgespielt: ${label}`,
    syncLabel: "Synchronisieren",
    syncHint: "Erstelle einen Sync-Code und gib ihn auf einem anderen Gerät ein, um dein Vokabelheft und deinen Wiederholungsfortschritt zu synchronisieren. Kein Konto nötig.",
    syncGenerate: "Code erstellen",
    syncDisable: "Synchronisierung stoppen",
    syncCopy: "Kopieren",
    syncCopied: "Kopiert",
    syncEnterCodePlaceholder: "Code eines anderen Geräts eingeben",
    syncLink: "Verbinden",
    syncLinkConfirm: "Dadurch werden das Vokabelheft und der Wiederholungsfortschritt auf diesem Gerät mit den Cloud-Daten überschrieben. Fortfahren?",
    syncStatusSyncing: "Synchronisiere...",
    syncStatusSynced: "Synchronisiert",
    syncStatusError: "Synchronisierung fehlgeschlagen. Verbindung prüfen und erneut versuchen.",
    modePodcast: "Podcast",
    podcastTitle: "Niederländischer Podcast",
    podcastSubtitle: "Originelle niederländische Dialoge, inspiriert von aktuellen Nachrichten, gesprochen von zwei virtuellen Moderatoren in einfachem Niederländisch, mit chinesischem Transkript und Grammatikerklärung.",
    podcastLoading: "Podcast wird geladen...",
    podcastFailed: "Laden der Podcast-Folgen fehlgeschlagen. Bitte später erneut versuchen.",
    podcastEmpty: "Noch keine Podcast-Folgen. Schau später wieder vorbei.",
    podcastPlay: "Abspielen",
    podcastPause: "Pausieren",
    podcastPlaying: "Wird abgespielt...",
    podcastShowTranscript: "Transkript anzeigen",
    podcastHideTranscript: "Transkript verbergen",
    filtersLabel: "Frequenzlisten",
    playPronunciation: "Aussprache abspielen",
    autoPlayNotebook: "Chinesisch, Englisch, Niederländisch abspielen",
    stopAutoPlayNotebook: "Wiedergabe stoppen",
    autoPlayExampleGrammar: "Beispiel und englische Grammatik vorlesen",
    loopAutoPlay: "Wiederholen",
    includeInAutoPlay: "Wird automatisch abgespielt. Klicken, um dieses Wort zu überspringen",
    excludeFromAutoPlay: "Wird übersprungen. Klicken, um dieses Wort einzuschließen",
    resetAutoPlaySelection: "Alles vorlesen",
    selectFictionTop20AutoPlay: "Nur Fiction Top 20",
    addToNotebook: "Zur Wortliste hinzufügen",
    removeFromNotebook: "Aus Wortliste entfernen",
    noTranslation: "Keine Übersetzung",
    docsLabel: "100 Dokumente",
    resultCount: (count) => `${count} Ergebnisse`,
    showingResults: (shown, total) => `${shown} / ${total} angezeigt`,
    loadMore: "Mehr laden",
    clearNotebook: "Wortliste leeren",
    addAllToNotebook: "Alles zur Wortliste hinzufügen",
    emptyState: "Keine passenden Wörter.",
    previous: "Zurück",
    next: "Weiter",
    showAnswer: "Antwort zeigen",
    hideAnswer: "Antwort verbergen",
    random: "Zufällig",
    studyQueue: "Übungsreihe",
    reset: "Zurücksetzen",
    reviewAgain: "Nochmal",
    reviewHard: "Schwer",
    reviewKnown: "Bekannt",
    reviewDueNow: "Jetzt üben",
    reviewDueLater: (value) => `In ${value} üben`,
    reviewLevel: (level) => `Gedächtnisstufe ${level}`,
    speakingTitle: "KI-Avatar Sprachtraining",
    speakingSubtitle: "Wähle eine Situation, höre den Tutor, antworte auf Niederländisch und erhalte kurzes Feedback.",
    speakingScenario: "Situation",
    speakingStart: "Sprechen starten",
    speakingStop: "Stoppen",
    speakingSend: "Senden",
    speakingPlaceholder: "Du kannst auch eine niederländische Antwort tippen",
    speakingListening: "Hört zu",
    speakingThinking: "Denkt nach",
    speakingTeacher: "Tutor",
    speakingLearner: "Ich",
    speakingFeedback: "Feedback",
    speakingEmpty: "Starte das Sprechen oder tippe eine niederländische Antwort.",
    speakingError: "KI-Sprachtraining ist nicht verfügbar. Prüfe Gemini",
    exampleSentence: "Satz nachsprechen",
    playSentence: "Satz abspielen",
    speechUnsupported: "Dieser Browser unterstützt keine Spracherkennung",
    examplesReady: (count) => `${count} Beispielsätze importiert`,
    examplesLoading: "Beispiele aus der lokalen EPUB werden gelesen...",
    examplesImportFailed: "Beispiele konnten nicht gelesen werden. Prüfe den EPUB-Pfad",
    examplesOffline: "Offline-Beispielmodus",
    generateExample: "KI-Beispiel hinzufügen",
    generatingExample: "Wird generiert...",
    generatedExampleSaved: "KI-Beispiel gespeichert",
    generationFailed: "KI-Beispiel konnte nicht erzeugt werden. Prüfe die LLM-Konfiguration",
    translateExample: "Beispiel übersetzen",
    translatingExample: "Wird übersetzt...",
    translationFailed: "Übersetzung fehlgeschlagen. Prüfe die LLM-Konfiguration",
    exampleTranslation: "Beispielübersetzung",
    explainGrammar: "Grammatik erklären",
    explainingGrammar: "Erklärt...",
    grammarExplanation: "Grammatikdetails",
    grammarFailed: "Grammatikerklärung fehlgeschlagen. Prüfe Gemini",
    askWord: "KI fragen",
    askingWord: "Antwortet...",
    wordQuestionPlaceholder: "Frage zu Grammatik, Gebrauch, Nuancen...",
    wordAnswer: "KI-Antwort",
    wordAnswerFailed: "Antwort fehlgeschlagen. Prüfe die LLM-Konfiguration",
    list: {
      All: "Alle",
      Core: "Kern",
      Fiction: "Fiktion",
      Newspapers: "Zeitungen",
      Spoken: "Gesprochen",
      Web: "Web",
      General: "Allgemein"
    },
    pos: {
      noun: "Substantiv",
      verb: "Verb",
      adj: "Adjektiv",
      adv: "Adverb",
      prep: "Präposition",
      conj: "Konjunktion",
      art: "Artikel",
      pron: "Pronomen",
      num: "Zahlwort",
      interj: "Interjektion"
    }
  }
};

const listTone: Record<string, string> = {
  Core: "tone-core",
  Fiction: "tone-fiction",
  Newspapers: "tone-news",
  Spoken: "tone-spoken",
  Web: "tone-web",
  General: "tone-general"
};

const methodContent: Record<
  UiLanguage,
  {
    eyebrow: string;
    title: string;
    lead: string;
    cards: Array<{ title: string; body: string }>;
    intervalTitle: string;
    intervals: string[];
    actionTitle: string;
    actions: Array<{ label: string; body: string }>;
    sourceTitle: string;
    sourceBody: string;
    sourceLink: string;
  }
> = {
  zh: {
    eyebrow: "为什么要间隔复习",
    title: "艾宾浩斯遗忘曲线：趁快忘掉之前，再主动回忆一次",
    lead:
      "艾宾浩斯的经典记忆实验发现：如果学完后不再回忆，遗忘会在最初一段时间下降得很快，之后才逐渐变慢。这个 app 的复习页不是让你反复刷熟悉感，而是要求你先想答案，再根据真实记忆状态安排下一次复习。",
    cards: [
      {
        title: "论文核心",
        body:
          "艾宾浩斯用无意义音节做记忆材料，比较不同时间后的再学习节省量，提出了遗忘随时间变化的曲线。现代复现实验也覆盖了 20 分钟到 31 天的间隔，并确认遗忘曲线可以被复现。"
      },
      {
        title: "学习含义",
        body:
          "最危险的不是完全忘记，而是刚学完时误以为自己会了。越早的阶段遗忘越快，所以第一次复习要短；如果能主动想起来，下一次间隔就可以拉长。"
      },
      {
        title: "本应用做法",
        body:
          "每次看见单词时，先尝试回忆意思，再显示答案。按 不认识、模糊、认识 记录结果；系统会把更容易忘的词提前，把稳定的词放到更远的日期。"
      }
    ],
    intervalTitle: "当前复习间隔",
    intervals: ["20 分钟", "1 天", "2 天", "4 天", "7 天", "15 天", "30 天", "60 天"],
    actionTitle: "三个按钮怎么按",
    actions: [
      { label: "不认识", body: "完全想不起来，或看答案才发现记错。回到 20 分钟后复习。" },
      { label: "模糊", body: "大概有印象，但不稳定。安排较短间隔，避免错过最佳巩固点。" },
      { label: "认识", body: "能先回忆出答案，再核对正确。进入下一档更长间隔。" }
    ],
    sourceTitle: "依据来源",
    sourceBody:
      "参考 Ebbinghaus 1885 年的记忆研究，以及 Murre 和 Dros 2015 年在 PLOS ONE 发表的复现实验。原始研究不是给所有学习者规定唯一时间表，所以这里采用的是基于曲线思想的可调度间隔复习。",
    sourceLink: "PLOS ONE 复现实验"
  },
  en: {
    eyebrow: "Why spacing works",
    title: "Ebbinghaus forgetting curve: recall before the memory fades",
    lead:
      "Ebbinghaus showed that memory drops quickly after learning when there is no reinforcement, then declines more slowly. This app turns that idea into active recall and expanding review intervals.",
    cards: [
      {
        title: "Core finding",
        body:
          "Ebbinghaus measured savings after relearning material at different delays. A modern replication covered intervals from 20 minutes to 31 days and found a similar forgetting pattern."
      },
      {
        title: "Learning meaning",
        body:
          "The first review should come soon because early forgetting is steep. If you can retrieve the word, the next interval can safely become longer."
      },
      {
        title: "How this app applies it",
        body:
          "Try to recall first, reveal the answer, then mark Again, Hard, or Known. Words that are shaky come back sooner; stable words move farther out."
      }
    ],
    intervalTitle: "Current review intervals",
    intervals: ["20 min", "1 day", "2 days", "4 days", "7 days", "15 days", "30 days", "60 days"],
    actionTitle: "How to choose",
    actions: [
      { label: "Again", body: "You could not recall it or recalled it incorrectly. Review again after 20 minutes." },
      { label: "Hard", body: "You recognized it but the memory felt weak. Keep the next interval short." },
      { label: "Known", body: "You recalled it before checking. Move to the next longer interval." }
    ],
    sourceTitle: "Evidence",
    sourceBody:
      "Based on Ebbinghaus's 1885 memory work and the 2015 PLOS ONE replication by Murre and Dros. The original work does not prescribe one universal schedule; this app uses the curve as a practical spacing model.",
    sourceLink: "PLOS ONE replication"
  },
  nl: {
    eyebrow: "Waarom gespreid herhalen werkt",
    title: "De vergeetcurve van Ebbinghaus: haal het woord op voordat het wegzakt",
    lead:
      "Ebbinghaus liet zien dat herinnering zonder herhaling eerst snel daalt en daarna langzamer afneemt. Deze app vertaalt dat naar actief ophalen en steeds langere intervallen.",
    cards: [
      {
        title: "Kern",
        body:
          "Ebbinghaus mat hoeveel tijd opnieuw leren bespaarde na verschillende wachttijden. Een moderne replicatie onderzocht intervallen van 20 minuten tot 31 dagen."
      },
      {
        title: "Voor leren",
        body:
          "De eerste herhaling moet snel komen, omdat vroeg vergeten steil is. Als je het woord kunt ophalen, mag het volgende interval langer worden."
      },
      {
        title: "In deze app",
        body:
          "Probeer eerst zelf de betekenis op te halen, toon daarna het antwoord en kies Opnieuw, Moeilijk of Bekend."
      }
    ],
    intervalTitle: "Huidige intervallen",
    intervals: ["20 min", "1 dag", "2 dagen", "4 dagen", "7 dagen", "15 dagen", "30 dagen", "60 dagen"],
    actionTitle: "Knoppen kiezen",
    actions: [
      { label: "Opnieuw", body: "Je wist het niet of had het fout. Over 20 minuten terug." },
      { label: "Moeilijk", body: "Je herkende het, maar zwak. Het interval blijft kort." },
      { label: "Bekend", body: "Je haalde het actief op. Het interval wordt langer." }
    ],
    sourceTitle: "Bron",
    sourceBody:
      "Gebaseerd op Ebbinghaus uit 1885 en de PLOS ONE-replicatie van Murre en Dros uit 2015. Het is een praktisch schema op basis van de curve, geen universele vaste wet.",
    sourceLink: "PLOS ONE-replicatie"
  },
  es: {
    eyebrow: "Por qué funciona el repaso espaciado",
    title: "Curva del olvido de Ebbinghaus: recuerda antes de olvidar",
    lead:
      "Ebbinghaus mostró que, sin refuerzo, la memoria cae rápido al principio y luego más lentamente. Esta app lo convierte en recuerdo activo e intervalos crecientes.",
    cards: [
      {
        title: "Idea central",
        body:
          "Ebbinghaus midió el ahorro al reaprender después de distintos intervalos. Una réplica moderna estudió de 20 minutos a 31 días."
      },
      {
        title: "Para estudiar",
        body:
          "El primer repaso debe llegar pronto. Si puedes recordar la palabra, el siguiente intervalo puede ser más largo."
      },
      {
        title: "En esta app",
        body:
          "Intenta recordar primero, muestra la respuesta y marca No lo sé, Difícil o Lo sé."
      }
    ],
    intervalTitle: "Intervalos actuales",
    intervals: ["20 min", "1 día", "2 días", "4 días", "7 días", "15 días", "30 días", "60 días"],
    actionTitle: "Cómo marcar",
    actions: [
      { label: "No lo sé", body: "No pudiste recordarlo o fue incorrecto. Vuelve en 20 minutos." },
      { label: "Difícil", body: "Lo reconoces, pero débilmente. Mantiene un intervalo corto." },
      { label: "Lo sé", body: "Lo recordaste antes de mirar. Pasa al siguiente intervalo." }
    ],
    sourceTitle: "Evidencia",
    sourceBody:
      "Basado en Ebbinghaus 1885 y la réplica de Murre y Dros en PLOS ONE, 2015. Es un modelo práctico, no un horario universal obligatorio.",
    sourceLink: "Réplica en PLOS ONE"
  },
  de: {
    eyebrow: "Warum verteiltes Wiederholen wirkt",
    title: "Ebbinghaus-Vergessenskurve: abrufen, bevor die Erinnerung verblasst",
    lead:
      "Ebbinghaus zeigte, dass Erinnerung ohne Wiederholung zuerst schnell und später langsamer abnimmt. Diese App macht daraus aktiven Abruf mit wachsenden Intervallen.",
    cards: [
      {
        title: "Kernbefund",
        body:
          "Ebbinghaus maß die Ersparnis beim Wiederlernen nach verschiedenen Zeitabständen. Eine moderne Replikation untersuchte 20 Minuten bis 31 Tage."
      },
      {
        title: "Lernbedeutung",
        body:
          "Die erste Wiederholung sollte früh kommen. Wenn du das Wort abrufen kannst, darf das nächste Intervall länger werden."
      },
      {
        title: "In dieser App",
        body:
          "Erst selbst erinnern, dann die Antwort anzeigen und Nochmal, Schwer oder Bekannt wählen."
      }
    ],
    intervalTitle: "Aktuelle Intervalle",
    intervals: ["20 Min.", "1 Tag", "2 Tage", "4 Tage", "7 Tage", "15 Tage", "30 Tage", "60 Tage"],
    actionTitle: "Tastenwahl",
    actions: [
      { label: "Nochmal", body: "Nicht erinnert oder falsch. Wiederholung nach 20 Minuten." },
      { label: "Schwer", body: "Erkannt, aber unsicher. Das Intervall bleibt kurz." },
      { label: "Bekannt", body: "Vor dem Prüfen erinnert. Das nächste Intervall wird länger." }
    ],
    sourceTitle: "Grundlage",
    sourceBody:
      "Basierend auf Ebbinghaus 1885 und der PLOS ONE-Replikation von Murre und Dros 2015. Das ist ein praktisches Modell, kein universeller Pflichtplan.",
    sourceLink: "PLOS ONE-Replikation"
  }
};

const speakingScenarios = [
  {
    id: "cafe",
    name: "Cafe",
    prompt: "You are a friendly Dutch cafe worker. Practice ordering coffee and small talk."
  },
  {
    id: "intro",
    name: "Introductie",
    prompt: "You are a patient Dutch tutor. Practice introductions, hobbies, work, and where the learner lives."
  },
  {
    id: "directions",
    name: "De weg vragen",
    prompt: "You are a helpful person in a Dutch city. Practice asking for and giving directions."
  },
  {
    id: "shop",
    name: "Supermarkt",
    prompt: "You are a supermarket employee. Practice finding products, prices, and checkout conversation."
  }
];

type SpeechRecognitionConstructor = new () => SpeechRecognition;
type StudyRating = "again" | "hard" | "known";
type SpeakingAvatarState = "idle" | "listening" | "thinking" | "speaking";

type SpeakingTurn = {
  role: "teacher" | "learner";
  text: string;
  feedback?: string;
};

type StudyProgress = {
  level: number;
  correctStreak: number;
  lapses: number;
  lastReviewedAt: number;
  dueAt: number;
};

const minute = 60 * 1000;
const day = 24 * 60 * minute;
const ebbinghausIntervals = [20 * minute, 1 * day, 2 * day, 4 * day, 7 * day, 15 * day, 30 * day, 60 * day];

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function cleanWord(value: string) {
  return value.split(",")[0].replace(/\(.+\)/, "").trim();
}

function makeExampleSentence(word: DutchWord) {
  const term = cleanWord(word.word);
  const templatesByPartOfSpeech: Record<string, Array<(value: string) => string>> = {
    noun: [
      (value) => `Ik zie de ${value} vandaag.`,
      (value) => `Waar is de ${value}?`,
      (value) => `De ${value} is belangrijk voor mij.`
    ],
    verb: [
      (value) => `Ik wil vandaag ${value}.`,
      (value) => `Kun jij ook ${value}?`,
      (value) => `Wij oefenen met ${value}.`
    ],
    adj: [
      (value) => `Dat is ${value}.`,
      (value) => `Ik vind het ${value}.`,
      (value) => `Het voelt vandaag ${value}.`
    ],
    adv: [
      (value) => `Ik doe dat ${value}.`,
      (value) => `Hij komt ${value}.`,
      (value) => `Dat gebeurt ${value}.`
    ]
  };
  const fallbackTemplates = [
    (value: string) => `Vandaag oefen ik met ${value}.`,
    (value: string) => `${value} is een nuttig Nederlands woord.`,
    (value: string) => `Ik gebruik ${value} in een korte zin.`,
    (value: string) => `Kun je ${value} herkennen?`
  ];
  const templates = templatesByPartOfSpeech[word.partOfSpeech] ?? fallbackTemplates;
  const index = Math.abs(word.sourceId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % templates.length;
  return templates[index](term);
}

function sentenceHash(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
}

function cardMeaningFor(word: DutchWord, language: CardMeaningLanguage) {
  return language === "zh" && word.translationZh ? word.translationZh : word.translation;
}

function apiUrl(path: string) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

function normalize(value: string) {
  return value.toLocaleLowerCase("nl-NL").trim();
}

function scoreDutchVoice(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLocaleLowerCase("nl-NL");
  const name = voice.name.toLocaleLowerCase("nl-NL");

  if (!lang.startsWith("nl")) {
    return -1;
  }

  let score = lang === "nl-nl" ? 100 : 40;

  if (name.includes("natural")) score += 40;
  if (name.includes("neural")) score += 35;
  if (name.includes("online")) score += 30;
  if (name.includes("premium")) score += 25;
  if (name.includes("microsoft")) score += 20;
  if (name.includes("google")) score += 15;
  if (name.includes("apple")) score += 10;
  if (name.includes("xander")) score += 8;
  if (name.includes("dutch")) score += 5;
  if (lang === "nl-be") score -= 20;

  return score;
}

function scoreVoice(voice: SpeechSynthesisVoice, language: SpeechLanguage) {
  const lang = voice.lang.toLocaleLowerCase("en-US");
  const name = voice.name.toLocaleLowerCase("en-US");
  const languageRoot = language.split("-")[0].toLocaleLowerCase("en-US");
  const requestedLang = language.toLocaleLowerCase("en-US");

  if (!lang.startsWith(languageRoot)) {
    return -1;
  }

  let score = lang === requestedLang ? 100 : 40;
  if (name.includes("natural")) score += 40;
  if (name.includes("neural")) score += 35;
  if (name.includes("online")) score += 30;
  if (name.includes("premium")) score += 25;
  if (name.includes("microsoft")) score += 20;
  if (name.includes("google")) score += 15;
  if (name.includes("apple")) score += 10;
  return score;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (!("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const available = window.speechSynthesis.getVoices();
  if (available.length > 0) {
    cachedVoices = available;
    return Promise.resolve(available);
  }

  if (voicesReadyPromise) {
    return voicesReadyPromise;
  }

  voicesReadyPromise = new Promise((resolve) => {
    const settle = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", settle);
      clearTimeout(timeoutId);
      cachedVoices = window.speechSynthesis.getVoices();
      voicesReadyPromise = null;
      resolve(cachedVoices);
    };
    const timeoutId = setTimeout(settle, 1000);
    window.speechSynthesis.addEventListener("voiceschanged", settle);
  });

  return voicesReadyPromise;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  ensureVoicesLoaded();
}

function getBestDutchVoice(voices: SpeechSynthesisVoice[]) {
  return voices
    .filter((voice) => voice.lang.toLocaleLowerCase("nl-NL").startsWith("nl"))
    .sort((first, second) => scoreDutchVoice(second) - scoreDutchVoice(first))[0];
}

function getBestVoice(voices: SpeechSynthesisVoice[], language: SpeechLanguage) {
  return voices
    .filter((voice) => scoreVoice(voice, language) >= 0)
    .sort((first, second) => scoreVoice(second, language) - scoreVoice(first, language))[0];
}

async function speakText(text: string) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const voices = await ensureVoicesLoaded();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBestDutchVoice(voices);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "nl-NL";
  }
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function speak(word: DutchWord) {
  await speakText(cleanWord(word.word));
}

async function createUtterance(text: string, language: SpeechLanguage) {
  const voices = await ensureVoicesLoaded();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBestVoice(voices, language);

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = language;
  }

  utterance.rate = language === "nl-NL" ? 0.9 : 0.95;
  utterance.pitch = 1;
  return utterance;
}

function notebookSpeechItems(wordsToPlay: DutchWord[]) {
  return wordsToPlay.flatMap((word) =>
    [
      { text: word.translationZh, language: "zh-CN" as const },
      { text: word.translation, language: "en-US" as const },
      { text: cleanWord(word.word), language: "nl-NL" as const }
    ].filter((item): item is SpeechItem => Boolean(item.text?.trim()))
  );
}

function grammarExplanationSpeechItems(explanation: string): SpeechItem[] {
  const items: SpeechItem[] = [];
  const markerPattern = /\[\[nl:([\s\S]*?)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markerPattern.exec(explanation))) {
    const englishText = explanation.slice(lastIndex, match.index).trim();
    const dutchText = match[1]?.trim();
    if (englishText) {
      items.push({ text: englishText, language: "en-US" });
    }
    if (dutchText) {
      items.push({ text: dutchText, language: "nl-NL" });
    }
    lastIndex = markerPattern.lastIndex;
  }

  const remainingText = explanation.slice(lastIndex).trim();
  if (remainingText) {
    items.push({ text: remainingText, language: "en-US" });
  }

  return items.length ? items : [{ text: explanation, language: "en-US" as const }];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dutchTermsForSpeech(word: DutchWord, sentence: string) {
  const terms = new Set<string>();
  for (const variant of word.word.split(",")) {
    const cleaned = cleanWord(variant);
    if (cleaned) {
      terms.add(cleaned);
    }
  }
  for (const token of tokenizeSentence(sentence)) {
    const cleaned = token.trim();
    if (/^\p{L}+(?:['’]\p{L}+)*$/u.test(cleaned)) {
      terms.add(cleaned);
    }
  }
  return [...terms].sort((first, second) => second.length - first.length);
}

function splitEnglishWithDutchTerms(text: string, dutchTerms: string[]) {
  if (!dutchTerms.length) {
    return text.trim() ? [{ text: text.trim(), language: "en-US" as const }] : [];
  }

  const pattern = new RegExp(`(^|[^\\p{L}])(${dutchTerms.map(escapeRegExp).join("|")})(?=$|[^\\p{L}])`, "giu");
  const items: SpeechItem[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const prefix = match[1] ?? "";
    const term = match[2] ?? "";
    const termStart = match.index + prefix.length;
    const englishText = text.slice(lastIndex, termStart).trim();
    if (englishText) {
      items.push({ text: englishText, language: "en-US" });
    }
    if (term.trim()) {
      items.push({ text: term.trim(), language: "nl-NL" });
    }
    lastIndex = termStart + term.length;
  }

  const remainingText = text.slice(lastIndex).trim();
  if (remainingText) {
    items.push({ text: remainingText, language: "en-US" });
  }

  return items;
}

function grammarExplanationSpeechItemsForWord(explanation: string, word: DutchWord, sentence: string): SpeechItem[] {
  const dutchTerms = dutchTermsForSpeech(word, sentence);
  const items: SpeechItem[] = [];
  const markerPattern = /\[\[nl:([\s\S]*?)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markerPattern.exec(explanation))) {
    items.push(...splitEnglishWithDutchTerms(explanation.slice(lastIndex, match.index), dutchTerms));
    const dutchText = match[1]?.trim();
    if (dutchText) {
      items.push({ text: dutchText, language: "nl-NL" });
    }
    lastIndex = markerPattern.lastIndex;
  }

  items.push(...splitEnglishWithDutchTerms(explanation.slice(lastIndex), dutchTerms));
  return items.length ? items : [{ text: explanation, language: "en-US" as const }];
}

function getSavedIds() {
  try {
    const value = JSON.parse(localStorage.getItem(notebookStorageKey) ?? "[]");
    const saved = new Set<string>(Array.isArray(value) ? value : []);

    if (localStorage.getItem(defaultNotebookMigrationKey) !== "done") {
      for (const word of words.slice(0, defaultNotebookWordCount)) {
        saved.add(word.sourceId);
      }
      localStorage.setItem(notebookStorageKey, JSON.stringify(Array.from(saved)));
      localStorage.setItem(defaultNotebookMigrationKey, "done");
    }

    return saved;
  } catch {
    const saved = new Set(words.slice(0, defaultNotebookWordCount).map((word) => word.sourceId));
    localStorage.setItem(notebookStorageKey, JSON.stringify(Array.from(saved)));
    localStorage.setItem(defaultNotebookMigrationKey, "done");
    return saved;
  }
}

function getSavedAutoPlayMutedIds() {
  const keepIds = new Set(
    words.filter((word) => word.list === "Fiction" && word.rank <= 20).map((word) => word.sourceId)
  );

  try {
    const value = JSON.parse(localStorage.getItem(autoPlayMutedStorageKey) ?? "[]");
    const muted = new Set<string>(Array.isArray(value) ? value : []);

    if (localStorage.getItem(defaultAutoPlaySelectionMigrationKey) !== "done") {
      for (const word of words) {
        if (!keepIds.has(word.sourceId)) {
          muted.add(word.sourceId);
        }
      }
      localStorage.setItem(autoPlayMutedStorageKey, JSON.stringify(Array.from(muted)));
      localStorage.setItem(defaultAutoPlaySelectionMigrationKey, "done");
    }

    return muted;
  } catch {
    const muted = new Set(words.filter((word) => !keepIds.has(word.sourceId)).map((word) => word.sourceId));
    localStorage.setItem(autoPlayMutedStorageKey, JSON.stringify(Array.from(muted)));
    localStorage.setItem(defaultAutoPlaySelectionMigrationKey, "done");
    return muted;
  }
}

function getSavedGeneratedExamples() {
  try {
    const value = JSON.parse(localStorage.getItem(generatedExamplesStorageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function getSavedExampleTranslations() {
  try {
    const value = JSON.parse(localStorage.getItem(exampleTranslationsStorageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function getSavedExampleGrammar() {
  try {
    const value = JSON.parse(localStorage.getItem(exampleGrammarStorageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function getSavedSpokenGrammar() {
  try {
    const value = JSON.parse(localStorage.getItem(spokenGrammarStorageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function getSavedWordAnswers() {
  try {
    const value = JSON.parse(localStorage.getItem(wordAnswersStorageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, WordAnswerTurn[]>) : {};
  } catch {
    return {};
  }
}

function getSavedStudyProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(studyProgressStorageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, StudyProgress>) : {};
  } catch {
    return {};
  }
}

function getSavedSyncCode() {
  return localStorage.getItem(syncCodeStorageKey) ?? "";
}

function getSavedSyncUpdatedAt() {
  return Number(localStorage.getItem(syncUpdatedAtStorageKey) ?? "0");
}

function generateSyncCode(length = 8) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex =
      typeof crypto !== "undefined" && crypto.getRandomValues
        ? crypto.getRandomValues(new Uint32Array(1))[0] % syncCodeCharset.length
        : Math.floor(Math.random() * syncCodeCharset.length);
    code += syncCodeCharset[randomIndex];
  }
  return code;
}

function formatSyncCode(code: string) {
  return code.replace(/(.{4})(?=.)/g, "$1-");
}

function normalizeSyncCode(rawCode: string) {
  return rawCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function getSavedLanguage(): UiLanguage {
  const value = localStorage.getItem(languageStorageKey);
  return value === "zh" || value === "en" || value === "nl" || value === "es" || value === "de"
    ? value
    : "zh";
}

function getRandomIndex(length: number, current: number) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  while (next === current) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

function formatDueDistance(timestamp: number, now: number) {
  const diff = Math.max(0, timestamp - now);
  if (diff < minute) return "1 min";
  if (diff < day) return `${Math.ceil(diff / (60 * minute))} h`;
  return `${Math.ceil(diff / day)} d`;
}

function getNextStudyProgress(current: StudyProgress | undefined, rating: StudyRating, now: number): StudyProgress {
  const level = current?.level ?? 0;
  const correctStreak = current?.correctStreak ?? 0;
  const lapses = current?.lapses ?? 0;

  if (rating === "again") {
    return {
      level: 0,
      correctStreak: 0,
      lapses: lapses + 1,
      lastReviewedAt: now,
      dueAt: now + ebbinghausIntervals[0]
    };
  }

  if (rating === "hard") {
    return {
      level: Math.max(0, level),
      correctStreak,
      lapses,
      lastReviewedAt: now,
      dueAt: now + Math.max(2 * minute, Math.floor((ebbinghausIntervals[Math.max(0, level)] ?? day) / 2))
    };
  }

  const nextLevel = Math.min(level + 1, ebbinghausIntervals.length - 1);
  return {
    level: nextLevel,
    correctStreak: correctStreak + 1,
    lapses,
    lastReviewedAt: now,
    dueAt: now + ebbinghausIntervals[nextLevel]
  };
}

function tokenizeSentence(sentence: string) {
  return sentence.match(/\p{L}+(?:['’]\p{L}+)*|[^\p{L}]+/gu) ?? [sentence];
}

function findWordInfo(token: string) {
  const base = normalize(token.replace(/^['’]+|['’]+$/g, ""));
  const candidates = [
    base,
    `${base}en`,
    `${base}n`,
    `${base}e`,
    base.endsWith("t") ? base.slice(0, -1) : "",
    base.endsWith("d") ? base.slice(0, -1) : ""
  ].filter(Boolean);

  for (const candidate of candidates) {
    const match = wordLookup.get(candidate);
    if (match) return match;
  }

  return undefined;
}

function RepeatPractice({
  sentenceKey,
  sentence,
  exampleTranslations: savedTranslations,
  grammarExplanation,
  translating,
  explainingGrammar,
  translationMessage,
  onTranslate,
  onExplainGrammar,
  t
}: {
  sentenceKey: string;
  sentence: string;
  exampleTranslations: Partial<Record<ExampleTranslationLanguage, string>>;
  grammarExplanation?: string;
  translating: ExampleTranslationLanguage | "";
  explainingGrammar: boolean;
  translationMessage?: string;
  onTranslate: (sentenceKey: string, sentence: string, targetLanguage: ExampleTranslationLanguage) => void;
  onExplainGrammar: (sentenceKey: string, sentence: string) => void;
  t: (typeof translations)[UiLanguage];
}) {
  const [targetLanguage, setTargetLanguage] = useState<ExampleTranslationLanguage>(defaultExampleTranslationLanguage);

  return (
    <div className="repeat-box">
      <div className="repeat-head">
        <span>{t.exampleSentence}</span>
        <button className="mini-button" type="button" onClick={() => speakText(sentence)}>
          <Volume2 size={15} />
          <span>{t.playSentence}</span>
        </button>
      </div>
      <InteractiveSentence sentence={sentence} t={t} />
      <div className="translation-tools">
        <select
          value={targetLanguage}
          onChange={(event) => setTargetLanguage(event.target.value as ExampleTranslationLanguage)}
        >
          {(Object.keys(exampleTranslationLanguages) as ExampleTranslationLanguage[]).map((key) => (
            <option key={key} value={key}>
              {exampleTranslationLanguages[key]}
            </option>
          ))}
        </select>
        <button
          className="mini-button"
          type="button"
          onClick={() => onTranslate(sentenceKey, sentence, targetLanguage)}
          disabled={translating === targetLanguage}
        >
          <Languages size={15} />
          <span>{translating === targetLanguage ? t.translatingExample : t.translateExample}</span>
        </button>
        <button
          className="mini-button"
          type="button"
          onClick={() => onExplainGrammar(sentenceKey, sentence)}
          disabled={explainingGrammar}
        >
          <BookOpen size={15} />
          <span>{explainingGrammar ? t.explainingGrammar : t.explainGrammar}</span>
        </button>
      </div>
      {savedTranslations.en || translating === defaultExampleTranslationLanguage ? (
        <p className="example-translation english-translation">
          <strong>English:</strong>{" "}
          {savedTranslations.en ?? (translating === defaultExampleTranslationLanguage ? t.translatingExample : "")}
        </p>
      ) : null}
      {targetLanguage !== defaultExampleTranslationLanguage && savedTranslations[targetLanguage] ? (
        <p className="example-translation">
          <strong>{t.exampleTranslation}:</strong> {savedTranslations[targetLanguage]}
        </p>
      ) : null}
      {grammarExplanation ? (
        <div className="grammar-explanation">
          <strong>{t.grammarExplanation}</strong>
          {grammarExplanation.split("\n").map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      ) : null}
      {translationMessage ? <p className="recognized muted">{translationMessage}</p> : null}
    </div>
  );
}

function InteractiveSentence({ sentence, t }: { sentence: string; t: (typeof translations)[UiLanguage] }) {
  return (
    <p className="example-sentence interactive-sentence">
      {tokenizeSentence(sentence).map((token, index) => {
        const word = findWordInfo(token);
        if (!word || !/\p{L}/u.test(token)) {
          return <span key={`${token}-${index}`}>{token}</span>;
        }

        return (
          <span className="sentence-word" key={`${token}-${index}`} tabIndex={0}>
            <span className="sentence-token">{token}</span>
            <span className="word-popover" role="tooltip">
              <span className="word-popover-head">
                <strong>{cleanWord(word.word)}</strong>
                <button type="button" onClick={() => speak(word)} title={t.playPronunciation}>
                  <Volume2 size={14} />
                </button>
              </span>
              <span className="word-popover-meta">
                #{word.rank} · {t.pos[word.partOfSpeech] ?? word.partOfSpeech}
              </span>
              <span className="word-popover-meaning">{word.translation || t.noTranslation}</span>
            </span>
          </span>
        );
      })}
    </p>
  );
}

function WordCard({
  item,
  saved,
  onToggle,
  autoPlayMuted,
  onToggleAutoPlayMuted,
  onGenerateExample,
  sentence,
  exampleTranslations,
  grammarExplanation,
  translatingExample,
  explainingGrammar,
  translationMessage,
  onTranslateExample,
  onExplainGrammar,
  wordAnswers,
  askingWord,
  wordAnswerMessage,
  onAskWord,
  generating,
  generationMessage,
  flipped,
  cardMeaningLanguage,
  onToggleFlip,
  highlighted,
  t
}: {
  item: DutchWord;
  saved: boolean;
  onToggle: (id: string) => void;
  autoPlayMuted: boolean;
  onToggleAutoPlayMuted: (id: string) => void;
  onGenerateExample: (word: DutchWord) => void;
  sentence: string;
  exampleTranslations: Partial<Record<ExampleTranslationLanguage, string>>;
  grammarExplanation?: string;
  translatingExample: ExampleTranslationLanguage | "";
  explainingGrammar: boolean;
  translationMessage?: string;
  onTranslateExample: (sentenceKey: string, sentence: string, targetLanguage: ExampleTranslationLanguage) => void;
  onExplainGrammar: (sentenceKey: string, sentence: string) => void;
  wordAnswers: WordAnswerTurn[];
  askingWord: boolean;
  wordAnswerMessage?: string;
  onAskWord: (word: DutchWord, sentence: string, question: string) => void;
  generating: boolean;
  generationMessage?: string;
  flipped: boolean;
  cardMeaningLanguage: CardMeaningLanguage;
  onToggleFlip: (id: string) => void;
  highlighted: boolean;
  t: (typeof translations)[UiLanguage];
}) {
  const meaning = cardMeaningFor(item, cardMeaningLanguage) || t.noTranslation;
  const primaryText = flipped ? meaning : item.word;
  const secondaryText = flipped ? item.word : meaning;
  const primaryLabel = flipped ? (cardMeaningLanguage === "zh" ? "中文" : "English") : "Nederlands";
  const secondaryLabel = flipped ? "Nederlands" : cardMeaningLanguage === "zh" ? "中文" : "English";
  const sentenceKey = `${item.sourceId}:${sentenceHash(sentence)}`;
  const [question, setQuestion] = useState("");

  function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed || askingWord) return;
    onAskWord(item, sentence, trimmed);
    setQuestion("");
  }

  return (
    <article id={`word-${item.sourceId}`} className={`word-card ${highlighted ? "jump-highlight" : ""}`}>
      <div className="word-card-top">
        <div className={`word-main ${flipped ? "is-flipped" : ""}`}>
          <div className="meta-row">
            <span className="rank">#{item.rank}</span>
            <span className={`pill ${listTone[item.list] ?? "tone-general"}`}>
              {t.list[item.list] ?? item.list}
            </span>
            <span className="pill neutral">{t.pos[item.partOfSpeech] ?? item.partOfSpeech}</span>
          </div>
          <span className="card-side-label">{primaryLabel}</span>
          <h2>{primaryText}</h2>
          {!flipped ? (
            <p>
              <strong>{secondaryLabel}:</strong> {secondaryText}
            </p>
          ) : null}
        </div>
        <div className="icon-actions">
          <button className="icon-button" type="button" onClick={() => onToggleFlip(item.sourceId)} title="反转这张卡片">
            <RotateCcw size={17} />
          </button>
          <button className="icon-button" type="button" onClick={() => speak(item)} title={t.playPronunciation}>
            <Volume2 size={18} />
          </button>
          <button
            className={`icon-button ${autoPlayMuted ? "" : "saved"}`}
            type="button"
            onClick={() => onToggleAutoPlayMuted(item.sourceId)}
            title={autoPlayMuted ? t.excludeFromAutoPlay : t.includeInAutoPlay}
          >
            {autoPlayMuted ? <Square size={18} /> : <CheckSquare size={18} />}
          </button>
          <button
            className={`icon-button ${saved ? "saved" : ""}`}
            type="button"
            onClick={() => onToggle(item.sourceId)}
            title={saved ? t.removeFromNotebook : t.addToNotebook}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
      </div>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${Math.min(item.frequency ?? 0, 100)}%` }} />
      </div>
      <div className="card-foot">
        <span>{item.sourceId}</span>
        <span>
          {(item.frequency ?? 0).toFixed(2)} / {t.docsLabel}
        </span>
      </div>
      {!flipped ? (
        <>
          <div className="ai-example-row">
            <button className="mini-button" type="button" onClick={() => onGenerateExample(item)} disabled={generating}>
              <Sparkles size={15} />
              <span>{generating ? t.generatingExample : t.generateExample}</span>
            </button>
            {generationMessage ? <span className="ai-status">{generationMessage}</span> : null}
          </div>
          <RepeatPractice
            sentenceKey={sentenceKey}
            sentence={sentence}
            exampleTranslations={exampleTranslations}
            grammarExplanation={grammarExplanation}
            translating={translatingExample}
            explainingGrammar={explainingGrammar}
            translationMessage={translationMessage}
            onTranslate={onTranslateExample}
            onExplainGrammar={onExplainGrammar}
            t={t}
          />
          <div className="word-qa">
            <div className="word-qa-head">
              <strong>{t.wordAnswer}</strong>
              <span>{cleanWord(item.word)}</span>
            </div>
            {wordAnswers.length ? (
              <div className="word-qa-turns">
                {wordAnswers.map((turn, index) => (
                  <div className={`word-qa-turn ${turn.role}`} key={`${item.sourceId}-${turn.role}-${index}`}>
                    <span>{turn.role === "user" ? "You" : "AI"}</span>
                    {turn.text.split("\n").map((line, lineIndex) => (
                      <p key={`${line}-${lineIndex}`}>{line}</p>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="word-qa-input">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitQuestion();
                }}
                placeholder={t.wordQuestionPlaceholder}
              />
              <button className="mini-button" type="button" onClick={submitQuestion} disabled={askingWord || !question.trim()}>
                <Sparkles size={15} />
                <span>{askingWord ? t.askingWord : t.askWord}</span>
              </button>
            </div>
            {wordAnswerMessage ? <p className="ai-status">{wordAnswerMessage}</p> : null}
          </div>
        </>
      ) : null}
    </article>
  );
}

function GrammarGuidePage() {
  const [selectedChapterId, setSelectedChapterId] = useState(grammarGuideChapters[0]?.id ?? "");
  const selectedChapter = grammarGuideChapters.find((chapter) => chapter.id === selectedChapterId) ?? grammarGuideChapters[0];

  return (
    <section className="grammar-page">
      <div className="grammar-hero">
        <div>
          <span className="method-eyebrow">中文语法教练</span>
          <h2>荷兰语语法思维导图</h2>
          <p>
            按《荷兰语语法自学教程》的结构整理成四大模块、十六个章节。点击导图节点进入章节页，先抓规则骨架，再回到词卡里问 AI 具体用法。
          </p>
        </div>
        <div className="grammar-source-note">
          <strong>学习设计</strong>
          <span>词法 → 句法 → 时态 → 拼写</span>
          <span>每章：目标 / 易错点 / 规则导图</span>
        </div>
      </div>

      <div className="grammar-layout">
        <div className="grammar-map" aria-label="Grammar mind map">
          <div className="grammar-root">荷兰语语法</div>
          <div className="grammar-part-grid">
            {grammarGuideParts.map((part) => (
              <article className="grammar-part" key={part.id}>
                <div className="grammar-part-head">
                  <h3>{part.title}</h3>
                  <span>{part.pageRange}</span>
                </div>
                <p>{part.theme}</p>
                <div className="grammar-chapter-list">
                  {part.chapters.map((chapter) => (
                    <button
                      className={chapter.id === selectedChapter.id ? "active" : ""}
                      key={chapter.id}
                      type="button"
                      onClick={() => setSelectedChapterId(chapter.id)}
                    >
                      <span>{chapter.title}</span>
                      <small>{chapter.pageRange}</small>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <GrammarChapterPanel chapter={selectedChapter} />
      </div>
    </section>
  );
}

function GrammarChapterPanel({ chapter }: { chapter: GrammarChapter }) {
  const [selectedNodeId, setSelectedNodeId] = useState(chapter.nodes[0]?.id ?? "");
  const nodeEntries = useMemo(() => collectGrammarNodes(chapter.nodes), [chapter]);
  const selectedNode = nodeEntries.find((entry) => entry.node.id === selectedNodeId) ?? nodeEntries[0];

  useEffect(() => {
    setSelectedNodeId(chapter.nodes[0]?.id ?? "");
  }, [chapter.id, chapter.nodes]);

  return (
    <article className="grammar-chapter-panel">
      <div className="grammar-chapter-title">
        <span>{chapter.pageRange}</span>
        <h2>{chapter.title}</h2>
        <p>{chapter.summary}</p>
        <small>{nodeEntries.length} 个可点击知识点</small>
      </div>

      <div className="grammar-summary-grid">
        <div>
          <h3>学习目标</h3>
          {chapter.goals.map((goal) => (
            <p key={goal}>{goal}</p>
          ))}
        </div>
        <div>
          <h3>中文学习者易错点</h3>
          {chapter.pitfalls.map((pitfall) => (
            <p key={pitfall}>{pitfall}</p>
          ))}
        </div>
      </div>

      <div className="grammar-node-panel">
        <h3>章节思维导图</h3>
        <div className="grammar-node-explorer">
          <div className="grammar-node-tree">
            {chapter.nodes.map((node) => (
              <GrammarNodeView
                node={node}
                key={node.id}
                selectedId={selectedNode?.node.id ?? ""}
                onSelect={setSelectedNodeId}
              />
            ))}
          </div>
          {selectedNode ? <GrammarNodeDetail entry={selectedNode} chapter={chapter} /> : null}
        </div>
      </div>
    </article>
  );
}

function GrammarNodeView({
  node,
  selectedId,
  onSelect
}: {
  node: GrammarNode;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grammar-node">
      <button
        className={`grammar-node-card ${node.id === selectedId ? "active" : ""}`}
        type="button"
        onClick={() => onSelect(node.id)}
      >
        <strong>{node.title}</strong>
        {node.detail ? <span>{node.detail}</span> : null}
      </button>
      {node.children?.length ? (
        <div className="grammar-node-children">
          {node.children.map((child) => (
            <GrammarNodeView node={child} selectedId={selectedId} onSelect={onSelect} key={child.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GrammarNodeDetail({
  entry,
  chapter
}: {
  entry: GrammarNodeEntry;
  chapter: GrammarChapter;
}) {
  const childNodes = entry.node.children ?? [];

  return (
    <aside className="grammar-node-detail">
      <span>{chapter.title}</span>
      <h3>{entry.node.title}</h3>
      <p className="grammar-node-path">{entry.path.join(" / ")}</p>
      <p>{entry.node.detail ?? "这个节点是章节结构中的概念入口，可以从它的子节点继续展开学习。"}</p>
      <div className="grammar-node-study">
        <strong>怎么学</strong>
        <p>先看规则作用，再看它在例句中的位置，最后回到词卡里问 AI：“这个词在这里为什么这样用？”</p>
      </div>
      {childNodes.length ? (
        <div className="grammar-node-related">
          <strong>子知识点</strong>
          {childNodes.map((child) => (
            <p key={child.id}>{child.title}</p>
          ))}
        </div>
      ) : (
        <div className="grammar-node-related">
          <strong>练习方向</strong>
          <p>找 3 个包含这个规则的单词或例句，分别问：形式是什么、为什么这样写、中文学习者容易错在哪里。</p>
        </div>
      )}
    </aside>
  );
}

function collectGrammarNodes(nodes: GrammarNode[], path: string[] = [], depth = 0): GrammarNodeEntry[] {
  return nodes.flatMap((node) => {
    const currentPath = [...path, node.title];
    return [
      { node, path: currentPath, depth },
      ...collectGrammarNodes(node.children ?? [], currentPath, depth + 1)
    ];
  });
}

function MethodPage({ language }: { language: UiLanguage }) {
  const content = methodContent[language];

  return (
    <section className="method-page">
      <div className="method-hero">
        <div>
          <span className="method-eyebrow">{content.eyebrow}</span>
          <h2>{content.title}</h2>
          <p>{content.lead}</p>
        </div>
        <div className="curve-panel" aria-hidden="true">
          <svg viewBox="0 0 320 180" role="img">
            <path className="curve-grid" d="M32 24V150H296M32 66H296M32 108H296" />
            <path className="forget-curve" d="M34 32C70 88 112 112 158 126C205 140 250 146 294 150" />
            <path className="review-curve" d="M34 32C58 62 78 74 96 82C116 58 137 51 158 48C179 75 201 88 224 96C246 77 270 69 294 66" />
            <circle cx="96" cy="82" r="5" />
            <circle cx="158" cy="48" r="5" />
            <circle cx="224" cy="96" r="5" />
          </svg>
        </div>
      </div>

      <div className="method-card-grid">
        {content.cards.map((card) => (
          <article className="method-card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        ))}
      </div>

      <div className="method-band">
        <div>
          <h3>{content.intervalTitle}</h3>
          <div className="interval-row">
            {content.intervals.map((interval, index) => (
              <span key={interval}>
                <strong>{index + 1}</strong>
                {interval}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="method-action-grid">
        <h3>{content.actionTitle}</h3>
        {content.actions.map((action) => (
          <article key={action.label}>
            <strong>{action.label}</strong>
            <p>{action.body}</p>
          </article>
        ))}
      </div>

      <aside className="source-note">
        <h3>{content.sourceTitle}</h3>
        <p>{content.sourceBody}</p>
        <a
          href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0120644"
          target="_blank"
          rel="noreferrer"
        >
          {content.sourceLink}
        </a>
      </aside>
    </section>
  );
}

function SpeakingPage({ t }: { t: (typeof translations)[UiLanguage] }) {
  const [scenarioId, setScenarioId] = useState(speakingScenarios[0].id);
  const [turns, setTurns] = useState<SpeakingTurn[]>([
    {
      role: "teacher",
      text: "Hoi! Welkom. Wat wil je vandaag oefenen?"
    }
  ]);
  const [draft, setDraft] = useState("");
  const [avatarState, setAvatarState] = useState<SpeakingAvatarState>("idle");
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scenario = speakingScenarios.find((item) => item.id === scenarioId) ?? speakingScenarios[0];

  function playTeacher(text: string) {
    setAvatarState("speaking");
    speakText(text);
    window.setTimeout(() => setAvatarState("idle"), Math.max(1200, Math.min(text.length * 80, 5200)));
  }

  async function sendAnswer(answer: string) {
    const text = answer.trim();
    if (!text || avatarState === "thinking") return;

    const nextTurns: SpeakingTurn[] = [...turns, { role: "learner", text }];
    setTurns(nextTurns);
    setDraft("");
    setMessage("");
    setAvatarState("thinking");

    try {
      const response = await fetch("/api/speaking-practice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scenario: scenario.prompt,
          turns: nextTurns.slice(-8)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get speaking reply");
      }

      const data = (await response.json()) as { reply?: string; feedback?: string };
      const reply = data.reply?.trim();
      if (!reply) {
        throw new Error("Empty speaking reply");
      }

      setTurns((current) => [
        ...current,
        {
          role: "teacher",
          text: reply,
          feedback: data.feedback?.trim()
        }
      ]);
      playTeacher(reply);
    } catch {
      setMessage(t.speakingError);
      setAvatarState("idle");
    }
  }

  function startListening() {
    if (avatarState === "listening") {
      recognitionRef.current?.stop();
      setAvatarState("idle");
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage(t.speechUnsupported);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "nl-NL";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult?.[0]?.transcript ?? "";
      setDraft(transcript);
      void sendAnswer(transcript);
    };
    recognition.onerror = () => {
      setAvatarState("idle");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setAvatarState((current) => (current === "listening" ? "idle" : current));
    };
    recognitionRef.current = recognition;
    setMessage("");
    setAvatarState("listening");
    recognition.start();
  }

  return (
    <section className="speaking-page">
      <div className="speaking-stage">
        <div className={`avatar-shell ${avatarState}`}>
          <div className="avatar-head">
            <span className="avatar-eye left" />
            <span className="avatar-eye right" />
            <span className="avatar-mouth" />
          </div>
          <div className="avatar-body" />
        </div>
        <div className="speaking-copy">
          <span className="method-eyebrow">{t.modeSpeaking}</span>
          <h2>{t.speakingTitle}</h2>
          <p>{t.speakingSubtitle}</p>
          <div className="avatar-status">
            {avatarState === "listening"
              ? t.speakingListening
              : avatarState === "thinking"
                ? t.speakingThinking
                : avatarState === "speaking"
                  ? t.speakingTeacher
                  : t.speakingEmpty}
          </div>
        </div>
      </div>

      <div className="speaking-controls">
        <label>
          <span>{t.speakingScenario}</span>
          <select
            value={scenarioId}
            onChange={(event) => {
              setScenarioId(event.target.value);
              setTurns([
                {
                  role: "teacher",
                  text: "Hoi! Laten we oefenen. Vertel maar."
                }
              ]);
            }}
          >
            {speakingScenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary" type="button" onClick={startListening} disabled={avatarState === "thinking"}>
          {avatarState === "listening" ? <Square size={17} /> : <Mic size={17} />}
          <span>{avatarState === "listening" ? t.speakingStop : t.speakingStart}</span>
        </button>
      </div>

      <div className="conversation-panel">
        {turns.map((turn, index) => (
          <article className={`conversation-turn ${turn.role}`} key={`${turn.role}-${index}`}>
            <strong>{turn.role === "teacher" ? t.speakingTeacher : t.speakingLearner}</strong>
            <p>{turn.text}</p>
            {turn.feedback ? (
              <div className="conversation-feedback">
                <span>{t.speakingFeedback}</span>
                <p>{turn.feedback}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <form
        className="speaking-input"
        onSubmit={(event) => {
          event.preventDefault();
          void sendAnswer(draft);
        }}
      >
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.speakingPlaceholder} />
        <button type="submit" disabled={!draft.trim() || avatarState === "thinking"}>
          <Sparkles size={17} />
          <span>{t.speakingSend}</span>
        </button>
      </form>
      {message ? <p className="speaking-message">{message}</p> : null}
    </section>
  );
}

type NewsReadingItem = {
  id: string;
  sourceName: string;
  sourceHeadline: string;
  sourceLink: string;
  level: string;
  dutchText: string;
  translation: string;
  explanation: string;
};

type ReadingGenre = "algemeen" | "cultuur" | "tech" | "sport" | "economie";

const readingGenres: { key: ReadingGenre; labels: Record<UiLanguage, string> }[] = [
  { key: "algemeen", labels: { zh: "综合", en: "General", nl: "Algemeen", es: "General", de: "Allgemein" } },
  { key: "cultuur", labels: { zh: "文化娱乐", en: "Culture", nl: "Cultuur", es: "Cultura", de: "Kultur" } },
  { key: "tech", labels: { zh: "科技", en: "Tech", nl: "Tech", es: "Tecnología", de: "Technik" } },
  { key: "sport", labels: { zh: "体育", en: "Sports", nl: "Sport", es: "Deporte", de: "Sport" } },
  { key: "economie", labels: { zh: "经济", en: "Economy", nl: "Economie", es: "Economía", de: "Wirtschaft" } }
];

async function fetchReadingGenreItems(genreKey: ReadingGenre): Promise<NewsReadingItem[]> {
  const response = await fetch(apiUrl(`/api/news-reading?genre=${genreKey}`));
  if (!response.ok) {
    throw new Error("Failed to read news reading passages");
  }
  const data = (await response.json()) as { items?: NewsReadingItem[] };
  return data.items ?? [];
}

function LandingPage({
  t,
  language,
  onLanguageChange,
  onStart
}: {
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  onLanguageChange: (language: UiLanguage) => void;
  onStart: () => void;
}) {
  const l = t.landing;
  const previewWords = words.slice(0, 3);
  const previewMeaningLanguage: CardMeaningLanguage = language === "zh" ? "zh" : "en";
  const categoryStats: { list: string; count: number }[] = [
    { list: "Core", count: 939 },
    { list: "Fiction", count: 1079 },
    { list: "Newspapers", count: 1124 },
    { list: "Spoken", count: 153 },
    { list: "Web", count: 521 },
    { list: "General", count: 1997 }
  ];

  const featureCards: { icon: JSX.Element; title: string; body: string; tint: string; iconColor: string }[] = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
        </svg>
      ),
      title: l.featureExampleTitle,
      body: l.featureExampleBody,
      tint: "#ffedd5",
      iconColor: "#c2410c"
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      ),
      title: l.featureSrsTitle,
      body: l.featureSrsBody,
      tint: "#e0f2fe",
      iconColor: "#075985"
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6" />
        </svg>
      ),
      title: l.featureSpeakingTitle,
      body: l.featureSpeakingBody,
      tint: "#ffe4e6",
      iconColor: "#9f1239"
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" />
          <path d="M7 8h9M7 12h9M7 16h5" />
        </svg>
      ),
      title: l.featureReadingTitle,
      body: l.featureReadingBody,
      tint: "#fef3c7",
      iconColor: "#92400e"
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2" />
        </svg>
      ),
      title: l.featurePodcastTitle,
      body: l.featurePodcastBody,
      tint: "#e0e7ff",
      iconColor: "#3730a3"
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 2.1l4 4-4 4" />
          <path d="M3 12.1v-2a4 4 0 0 1 4-4h14" />
          <path d="M7 21.9l-4-4 4-4" />
          <path d="M21 11.9v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
      title: l.featureSyncTitle,
      body: l.featureSyncBody,
      tint: "#f5f5f4",
      iconColor: "#44403c"
    }
  ];

  const steps = [
    { n: "1", title: l.step1Title, body: l.step1Body },
    { n: "2", title: l.step2Title, body: l.step2Body },
    { n: "3", title: l.step3Title, body: l.step3Body },
    { n: "4", title: l.step4Title, body: l.step4Body }
  ];

  return (
    <div className="landing-page">
      <div className="landing-nav">
        <div className="landing-wrap landing-nav-row">
          <div className="landing-brand">
            <BookOpen size={22} />
            <span>Dutch Frequency Trainer</span>
          </div>
          <div className="landing-nav-links">
            <a href="#landing-features">{l.navFeatures}</a>
            <a href="#landing-method">{l.navMethod}</a>
            <label className="landing-lang-select">
              <select value={language} onChange={(event) => onLanguageChange(event.target.value as UiLanguage)}>
                {(Object.keys(languageNames) as UiLanguage[]).map((key) => (
                  <option key={key} value={key}>
                    {languageNames[key]}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="landing-nav-cta" onClick={onStart}>
              {l.navCta}
            </button>
          </div>
        </div>
      </div>

      <div className="landing-wrap landing-hero">
        <div>
          <div className="landing-eyebrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
            </svg>
            {l.heroEyebrow}
          </div>
          <h1 className="landing-hero-title">{l.heroTitle}</h1>
          <p className="landing-hero-subtitle">{l.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <button type="button" className="landing-cta-button" onClick={onStart}>
              {l.heroCtaPrimary}
            </button>
            <a href="#landing-features" className="landing-secondary-link">
              {l.heroCtaSecondary}
              <ChevronRight size={15} />
            </a>
          </div>
          <div className="landing-hero-stats">
            <div>
              <strong>{words.length}</strong>
              <span>{l.statsWords}</span>
            </div>
            <div className="landing-hero-stats-divider" />
            <div>
              <strong>{categoryStats.length}</strong>
              <span>{l.statsCategories}</span>
            </div>
            <div className="landing-hero-stats-divider" />
            <div>
              <strong>{featureCards.length}</strong>
              <span>{l.statsFeatures}</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <div className="landing-hero-glow" />
          <div className="landing-hero-window">
            <div className="landing-hero-window-bar">
              <span className="landing-dot landing-dot-red" />
              <span className="landing-dot landing-dot-amber" />
              <span className="landing-dot landing-dot-green" />
              <span className="landing-hero-window-title">{l.heroScreenshotAlt}</span>
            </div>
            <div className="landing-hero-window-body">
              {previewWords.map((word) => (
                <div className="landing-preview-card" key={word.sourceId}>
                  <div className="meta-row">
                    <span className="rank">#{word.rank}</span>
                    <span className={`pill ${listTone[word.list] ?? "tone-general"}`}>
                      {t.list[word.list] ?? word.list}
                    </span>
                  </div>
                  <div className="landing-preview-word">{word.word}</div>
                  <div className="landing-preview-meaning">{cardMeaningFor(word, previewMeaningLanguage)}</div>
                  <div className="meter">
                    <span style={{ width: `${Math.min(word.frequency ?? 0, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="landing-proof">
        <div className="landing-wrap landing-proof-row">
          {categoryStats.map((item) => (
            <span key={item.list}>
              {t.list[item.list] ?? item.list} {item.count}
            </span>
          ))}
        </div>
      </div>

      <div id="landing-features" className="landing-wrap landing-features">
        <div className="landing-section-intro">
          <div className="landing-section-eyebrow">{l.navFeatures}</div>
          <h2>{l.featuresTitle}</h2>
          <p>{l.featuresSubtitle}</p>
        </div>
        <div className="landing-feature-grid">
          {featureCards.map((card) => (
            <div className="landing-feature-card" key={card.title}>
              <div className="landing-feature-icon" style={{ background: card.tint, color: card.iconColor }}>
                {card.icon}
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="landing-method" className="landing-wrap">
        <div className="landing-method">
          <div className="landing-method-intro">
            <div className="landing-section-eyebrow landing-method-eyebrow">{l.navMethod}</div>
            <h2>{l.methodTitle}</h2>
            <p>{l.methodSubtitle}</p>
          </div>
          <div className="landing-steps">
            {steps.map((step) => (
              <div className="landing-step" key={step.n}>
                <div className="landing-step-num">{step.n}</div>
                <div>
                  <div className="landing-step-title">{step.title}</div>
                  <div className="landing-step-body">{step.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="landing-wrap landing-final-cta">
        <h2>{l.ctaTitle}</h2>
        <p>{l.ctaSubtitle}</p>
        <button type="button" className="landing-cta-button landing-cta-button-large" onClick={onStart}>
          {l.ctaButton}
        </button>
      </div>

      <div className="landing-footer">
        <div className="landing-wrap landing-footer-row">
          <span>{l.footerLeft}</span>
          <span>{l.footerRight}</span>
        </div>
      </div>
    </div>
  );
}

function DailyReadingPage({ t, language }: { t: (typeof translations)[UiLanguage]; language: UiLanguage }) {
  const [genre, setGenre] = useState<ReadingGenre>("algemeen");
  const [items, setItems] = useState<NewsReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [translationVisible, setTranslationVisible] = useState<Record<string, boolean>>({});
  const [grammarVisible, setGrammarVisible] = useState<Record<string, boolean>>({});
  const [autoPlayingGenres, setAutoPlayingGenres] = useState(false);
  const [autoPlayingGenreKey, setAutoPlayingGenreKey] = useState<ReadingGenre | null>(null);
  const autoPlayTokenRef = useRef(0);
  const autoPlayingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadReading() {
      if (autoPlayingRef.current) {
        return;
      }
      if (!apiAvailable) {
        setLoading(false);
        setFailed(false);
        return;
      }

      setLoading(true);

      try {
        const list = await fetchReadingGenreItems(genre);
        if (active) {
          setItems(list);
          setFailed(false);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReading();
    return () => {
      active = false;
    };
  }, [genre]);

  useEffect(
    () => () => {
      autoPlayTokenRef.current += 1;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  function stopAutoPlayGenres() {
    autoPlayTokenRef.current += 1;
    autoPlayingRef.current = false;
    setAutoPlayingGenres(false);
    setAutoPlayingGenreKey(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  async function speakReadingItems(list: NewsReadingItem[], index: number, token: number, order: ReadingGenre[], orderIndex: number) {
    if (!("speechSynthesis" in window) || token !== autoPlayTokenRef.current) {
      return;
    }

    const item = list[index];
    if (!item) {
      void playGenreInOrder(order, orderIndex + 1, token);
      return;
    }

    const utterance = await createUtterance(item.dutchText, "nl-NL");
    if (token !== autoPlayTokenRef.current) return;

    utterance.onend = () => speakReadingItems(list, index + 1, token, order, orderIndex);
    utterance.onerror = () => speakReadingItems(list, index + 1, token, order, orderIndex);
    window.speechSynthesis.speak(utterance);
  }

  async function playGenreInOrder(order: ReadingGenre[], orderIndex: number, token: number) {
    if (token !== autoPlayTokenRef.current) return;

    const genreKey = order[orderIndex];
    if (!genreKey) {
      autoPlayingRef.current = false;
      setAutoPlayingGenres(false);
      setAutoPlayingGenreKey(null);
      return;
    }

    setGenre(genreKey);
    setAutoPlayingGenreKey(genreKey);
    setLoading(true);
    setFailed(false);

    try {
      const list = await fetchReadingGenreItems(genreKey);
      if (token !== autoPlayTokenRef.current) return;
      setItems(list);
      setLoading(false);
      void speakReadingItems(list, 0, token, order, orderIndex);
    } catch {
      if (token !== autoPlayTokenRef.current) return;
      setFailed(true);
      setLoading(false);
      void playGenreInOrder(order, orderIndex + 1, token);
    }
  }

  function startAutoPlayGenres() {
    autoPlayTokenRef.current += 1;
    const token = autoPlayTokenRef.current;
    const startIndex = Math.max(
      0,
      readingGenres.findIndex((item) => item.key === genre)
    );
    const order = [...readingGenres.slice(startIndex), ...readingGenres.slice(0, startIndex)].map((item) => item.key);

    autoPlayingRef.current = true;
    setAutoPlayingGenres(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    void playGenreInOrder(order, 0, token);
  }

  function toggleTranslation(id: string) {
    setTranslationVisible((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleGrammar(id: string) {
    setGrammarVisible((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <section className="reading-page">
      <div className="reading-intro">
        <span className="method-eyebrow">{t.modeReading}</span>
        <h2>{t.readingTitle}</h2>
        <p>{t.readingSubtitle}</p>
      </div>

      <div className="reading-genres" role="tablist" aria-label={t.readingTitle}>
        {readingGenres.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={genre === item.key}
            className={genre === item.key ? "active" : ""}
            onClick={() => {
              if (autoPlayingGenres) {
                stopAutoPlayGenres();
              }
              setGenre(item.key);
            }}
          >
            {item.labels[language]}
          </button>
        ))}
      </div>

      <div className="reading-autoplay-controls">
        <button
          type="button"
          className={`reading-autoplay-button ${autoPlayingGenres ? "playing" : ""}`}
          onClick={autoPlayingGenres ? stopAutoPlayGenres : startAutoPlayGenres}
        >
          {autoPlayingGenres ? <Square size={15} /> : <Volume2 size={15} />}
          <span>{autoPlayingGenres ? t.stopAutoPlayGenres : t.autoPlayGenres}</span>
        </button>
        {autoPlayingGenres && autoPlayingGenreKey ? (
          <span className="reading-autoplay-status">
            {t.autoPlayingGenre(readingGenres.find((item) => item.key === autoPlayingGenreKey)?.labels[language] ?? "")}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="recognized muted">{t.readingLoading}</p>
      ) : failed ? (
        <p className="recognized muted">{t.readingFailed}</p>
      ) : items.length === 0 ? (
        <p className="recognized muted">{t.readingEmpty}</p>
      ) : (
        <div className="reading-list">
          {items.map((item) => (
            <article className="reading-card" key={item.id}>
              <div className="reading-card-head">
                <span className="reading-source">{item.sourceName}</span>
                {item.sourceLink ? (
                  <a className="reading-source-link" href={item.sourceLink} target="_blank" rel="noreferrer">
                    {item.sourceHeadline}
                  </a>
                ) : (
                  <span className="reading-source-link">{item.sourceHeadline}</span>
                )}
              </div>
              <div className="repeat-box">
                <div className="repeat-head">
                  <span>{t.exampleSentence}</span>
                  <button className="mini-button" type="button" onClick={() => speakText(item.dutchText)}>
                    <Volume2 size={15} />
                    <span>{t.playSentence}</span>
                  </button>
                </div>
                <p className="reading-dutch-text">{item.dutchText}</p>
                <div className="reading-actions">
                  <button className="mini-button" type="button" onClick={() => toggleTranslation(item.id)}>
                    <Languages size={15} />
                    <span>{translationVisible[item.id] ? t.hideAnswer : t.translateExample}</span>
                  </button>
                  <button className="mini-button" type="button" onClick={() => toggleGrammar(item.id)}>
                    <BookOpen size={15} />
                    <span>{grammarVisible[item.id] ? t.hideAnswer : t.explainGrammar}</span>
                  </button>
                </div>
                {translationVisible[item.id] ? <p className="example-translation">{item.translation}</p> : null}
                {grammarVisible[item.id] ? (
                  <div className="grammar-explanation">
                    <strong>{t.grammarExplanation}</strong>
                    {item.explanation.split("\n").map((line, index) => (
                      <p key={`${item.id}-line-${index}`}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

type PodcastTurn = { speaker: "A" | "B"; text: string; translation: string };
type PodcastEpisode = {
  id: string;
  sourceName: string;
  sourceHeadline: string;
  sourceLink: string;
  level: string;
  turns: PodcastTurn[];
  explanation: string;
};

function getDutchVoicePair(voices: SpeechSynthesisVoice[]) {
  const dutchVoices = voices
    .filter((voice) => voice.lang.toLocaleLowerCase("nl-NL").startsWith("nl"))
    .sort((first, second) => scoreDutchVoice(second) - scoreDutchVoice(first));
  return [dutchVoices[0], dutchVoices[1] ?? dutchVoices[0]] as const;
}

async function createPodcastUtterance(text: string, speaker: "A" | "B") {
  const voices = await ensureVoicesLoaded();
  const [voiceA, voiceB] = getDutchVoicePair(voices);
  const voice = speaker === "B" ? voiceB : voiceA;
  const utterance = new SpeechSynthesisUtterance(text);

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "nl-NL";
  }

  utterance.rate = 0.92;
  utterance.pitch = speaker === "B" && voiceA === voiceB ? 1.25 : 1;
  return utterance;
}

async function fetchPodcastGenreEpisodes(genreKey: ReadingGenre): Promise<PodcastEpisode[]> {
  const response = await fetch(apiUrl(`/api/podcast?genre=${genreKey}`));
  if (!response.ok) {
    throw new Error("Failed to read podcast episodes");
  }
  const data = (await response.json()) as { episodes?: PodcastEpisode[] };
  return data.episodes ?? [];
}

function PodcastPage({ t, language }: { t: (typeof translations)[UiLanguage]; language: UiLanguage }) {
  const [genre, setGenre] = useState<ReadingGenre>("algemeen");
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState<Record<string, boolean>>({});
  const [playingId, setPlayingId] = useState("");
  const [playingTurnIndex, setPlayingTurnIndex] = useState(-1);
  const [autoPlayingGenres, setAutoPlayingGenres] = useState(false);
  const [autoPlayingGenreKey, setAutoPlayingGenreKey] = useState<ReadingGenre | null>(null);
  const playTokenRef = useRef(0);
  const autoPlayingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadPodcast() {
      if (autoPlayingRef.current) {
        return;
      }
      if (!apiAvailable) {
        setLoading(false);
        setFailed(false);
        return;
      }

      setLoading(true);

      try {
        const list = await fetchPodcastGenreEpisodes(genre);
        if (active) {
          setEpisodes(list);
          setFailed(false);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPodcast();
    return () => {
      active = false;
    };
  }, [genre]);

  useEffect(
    () => () => {
      playTokenRef.current += 1;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  function stopPlayback() {
    playTokenRef.current += 1;
    autoPlayingRef.current = false;
    setPlayingId("");
    setPlayingTurnIndex(-1);
    setAutoPlayingGenres(false);
    setAutoPlayingGenreKey(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  async function playTurn(episode: PodcastEpisode, index: number, token: number) {
    if (!("speechSynthesis" in window) || token !== playTokenRef.current) {
      return;
    }

    const turn = episode.turns[index];
    if (!turn) {
      setPlayingId("");
      setPlayingTurnIndex(-1);
      return;
    }

    setPlayingTurnIndex(index);
    const utterance = await createPodcastUtterance(turn.text, turn.speaker);
    if (token !== playTokenRef.current) return;

    utterance.onend = () => {
      void playTurn(episode, index + 1, token);
    };
    utterance.onerror = () => {
      void playTurn(episode, index + 1, token);
    };
    window.speechSynthesis.speak(utterance);
  }

  function togglePlayEpisode(episode: PodcastEpisode) {
    if (playingId === episode.id) {
      stopPlayback();
      return;
    }

    playTokenRef.current += 1;
    autoPlayingRef.current = false;
    setAutoPlayingGenres(false);
    setAutoPlayingGenreKey(null);
    const token = playTokenRef.current;
    setPlayingId(episode.id);
    void playTurn(episode, 0, token);
  }

  function toggleTranscript(id: string) {
    setTranscriptVisible((current) => ({ ...current, [id]: !current[id] }));
  }

  async function playTurnAuto(
    episode: PodcastEpisode,
    index: number,
    token: number,
    episodesToPlay: PodcastEpisode[],
    episodeIndex: number,
    order: ReadingGenre[],
    orderIndex: number
  ) {
    if (!("speechSynthesis" in window) || token !== playTokenRef.current) {
      return;
    }

    const turn = episode.turns[index];
    if (!turn) {
      void speakEpisodesInOrder(episodesToPlay, episodeIndex + 1, token, order, orderIndex);
      return;
    }

    setPlayingTurnIndex(index);
    const utterance = await createPodcastUtterance(turn.text, turn.speaker);
    if (token !== playTokenRef.current) return;

    utterance.onend = () => {
      void playTurnAuto(episode, index + 1, token, episodesToPlay, episodeIndex, order, orderIndex);
    };
    utterance.onerror = () => {
      void playTurnAuto(episode, index + 1, token, episodesToPlay, episodeIndex, order, orderIndex);
    };
    window.speechSynthesis.speak(utterance);
  }

  async function speakEpisodesInOrder(
    episodesToPlay: PodcastEpisode[],
    episodeIndex: number,
    token: number,
    order: ReadingGenre[],
    orderIndex: number
  ) {
    if (token !== playTokenRef.current) return;

    const episode = episodesToPlay[episodeIndex];
    if (!episode) {
      void playGenreInOrder(order, orderIndex + 1, token);
      return;
    }

    setPlayingId(episode.id);
    void playTurnAuto(episode, 0, token, episodesToPlay, episodeIndex, order, orderIndex);
  }

  async function playGenreInOrder(order: ReadingGenre[], orderIndex: number, token: number) {
    if (token !== playTokenRef.current) return;

    const genreKey = order[orderIndex];
    if (!genreKey) {
      autoPlayingRef.current = false;
      setAutoPlayingGenres(false);
      setAutoPlayingGenreKey(null);
      setPlayingId("");
      setPlayingTurnIndex(-1);
      return;
    }

    setGenre(genreKey);
    setAutoPlayingGenreKey(genreKey);
    setLoading(true);
    setFailed(false);

    try {
      const list = await fetchPodcastGenreEpisodes(genreKey);
      if (token !== playTokenRef.current) return;
      setEpisodes(list);
      setLoading(false);
      void speakEpisodesInOrder(list, 0, token, order, orderIndex);
    } catch {
      if (token !== playTokenRef.current) return;
      setFailed(true);
      setLoading(false);
      void playGenreInOrder(order, orderIndex + 1, token);
    }
  }

  function startAutoPlayGenres() {
    playTokenRef.current += 1;
    const token = playTokenRef.current;
    const startIndex = Math.max(
      0,
      readingGenres.findIndex((item) => item.key === genre)
    );
    const order = [...readingGenres.slice(startIndex), ...readingGenres.slice(0, startIndex)].map((item) => item.key);

    autoPlayingRef.current = true;
    setAutoPlayingGenres(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    void playGenreInOrder(order, 0, token);
  }

  return (
    <section className="reading-page">
      <div className="reading-intro">
        <span className="method-eyebrow">{t.modePodcast}</span>
        <h2>{t.podcastTitle}</h2>
        <p>{t.podcastSubtitle}</p>
      </div>

      <div className="reading-genres" role="tablist" aria-label={t.podcastTitle}>
        {readingGenres.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={genre === item.key}
            className={genre === item.key ? "active" : ""}
            onClick={() => {
              stopPlayback();
              setGenre(item.key);
            }}
          >
            {item.labels[language]}
          </button>
        ))}
      </div>

      <div className="reading-autoplay-controls">
        <button
          type="button"
          className={`reading-autoplay-button ${autoPlayingGenres ? "playing" : ""}`}
          onClick={autoPlayingGenres ? stopPlayback : startAutoPlayGenres}
        >
          {autoPlayingGenres ? <Square size={15} /> : <Volume2 size={15} />}
          <span>{autoPlayingGenres ? t.stopAutoPlayGenres : t.autoPlayGenres}</span>
        </button>
        {autoPlayingGenres && autoPlayingGenreKey ? (
          <span className="reading-autoplay-status">
            {t.autoPlayingGenre(readingGenres.find((item) => item.key === autoPlayingGenreKey)?.labels[language] ?? "")}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="recognized muted">{t.podcastLoading}</p>
      ) : failed ? (
        <p className="recognized muted">{t.podcastFailed}</p>
      ) : episodes.length === 0 ? (
        <p className="recognized muted">{t.podcastEmpty}</p>
      ) : (
        <div className="reading-list">
          {episodes.map((episode) => (
            <article className="reading-card podcast-card" key={episode.id}>
              <div className="reading-card-head">
                <span className="reading-source">{episode.sourceName}</span>
                {episode.sourceLink ? (
                  <a className="reading-source-link" href={episode.sourceLink} target="_blank" rel="noreferrer">
                    {episode.sourceHeadline}
                  </a>
                ) : (
                  <span className="reading-source-link">{episode.sourceHeadline}</span>
                )}
              </div>

              <div className="podcast-controls">
                <button type="button" className="mini-button" onClick={() => togglePlayEpisode(episode)}>
                  {playingId === episode.id ? <Pause size={15} /> : <Play size={15} />}
                  <span>{playingId === episode.id ? t.podcastPause : t.podcastPlay}</span>
                </button>
                {playingId === episode.id ? <span className="recognized">{t.podcastPlaying}</span> : null}
                <button type="button" className="mini-button" onClick={() => toggleTranscript(episode.id)}>
                  <BookOpen size={15} />
                  <span>{transcriptVisible[episode.id] ? t.podcastHideTranscript : t.podcastShowTranscript}</span>
                </button>
              </div>

              {transcriptVisible[episode.id] ? (
                <div className="podcast-transcript">
                  {episode.turns.map((turn, index) => (
                    <div
                      className={`podcast-turn ${turn.speaker === "B" ? "speaker-b" : "speaker-a"} ${
                        playingId === episode.id && playingTurnIndex === index ? "active" : ""
                      }`}
                      key={`${episode.id}-turn-${index}`}
                    >
                      <span className="podcast-speaker">{turn.speaker}</span>
                      <div>
                        <p className="podcast-turn-text">{turn.text}</p>
                        <p className="podcast-turn-translation">{turn.translation}</p>
                      </div>
                    </div>
                  ))}
                  <div className="grammar-explanation">
                    <strong>{t.grammarExplanation}</strong>
                    {episode.explanation.split("\n").map((line, index) => (
                      <p key={`${episode.id}-explain-${index}`}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [mode, setMode] = useState<ViewMode>("landing");
  const [language, setLanguage] = useState<UiLanguage>(getSavedLanguage);
  const [query, setQuery] = useState("");
  const [jumpValue, setJumpValue] = useState("");
  const [highlightedWordId, setHighlightedWordId] = useState<string | null>(null);
  const skipVisibleResetRef = useRef(false);
  const [selectedList, setSelectedList] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(getSavedIds);
  const [bookExamples, setBookExamples] = useState<Record<string, string>>({});
  const [generatedExamples, setGeneratedExamples] = useState<Record<string, string>>(getSavedGeneratedExamples);
  const [exampleTranslations, setExampleTranslations] =
    useState<Record<string, string>>(getSavedExampleTranslations);
  const [exampleGrammar, setExampleGrammar] = useState<Record<string, string>>(getSavedExampleGrammar);
  const [spokenGrammar, setSpokenGrammar] = useState<Record<string, string>>(getSavedSpokenGrammar);
  const [wordAnswers, setWordAnswers] = useState<Record<string, WordAnswerTurn[]>>(getSavedWordAnswers);
  const [studyProgress, setStudyProgress] = useState<Record<string, StudyProgress>>(getSavedStudyProgress);
  const [syncCode, setSyncCode] = useState<string>(getSavedSyncCode);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncCodeDraft, setSyncCodeDraft] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const syncReadyRef = useRef(false);
  const syncPushTimerRef = useRef<number | undefined>(undefined);
  const syncPayloadRef = useRef<SyncPayload>({
    notebook: [],
    autoPlayMuted: [],
    generatedExamples: {},
    exampleTranslations: {},
    exampleGrammar: {},
    spokenGrammar: {},
    wordAnswers: {},
    studyProgress: {}
  });
  const [generatingId, setGeneratingId] = useState("");
  const [translatingKey, setTranslatingKey] = useState("");
  const [explainingGrammarKey, setExplainingGrammarKey] = useState("");
  const [askingWordId, setAskingWordId] = useState("");
  const [generationMessages, setGenerationMessages] = useState<Record<string, string>>({});
  const [translationMessages, setTranslationMessages] = useState<Record<string, string>>({});
  const [wordAnswerMessages, setWordAnswerMessages] = useState<Record<string, string>>({});
  const [examplesLoading, setExamplesLoading] = useState(true);
  const [examplesFailed, setExamplesFailed] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(180);
  const [studyIndex, setStudyIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [cardsFlipped, setCardsFlipped] = useState(false);
  const [cardFlipOverrides, setCardFlipOverrides] = useState<Record<string, boolean>>({});
  const [cardMeaningLanguage, setCardMeaningLanguage] = useState<CardMeaningLanguage>("en");
  const [includeNotebookExampleGrammar, setIncludeNotebookExampleGrammar] = useState(false);
  const autoTranslationRequestsRef = useRef<Set<string>>(new Set());
  const autoPlayTokenRef = useRef(0);
  const [autoPlayingNotebook, setAutoPlayingNotebook] = useState(false);
  const [autoPlayMutedIds, setAutoPlayMutedIds] = useState<Set<string>>(getSavedAutoPlayMutedIds);
  const [loopNotebookAutoPlay, setLoopNotebookAutoPlay] = useState(false);
  const loopNotebookAutoPlayRef = useRef(false);
  const t = translations[language];

  useEffect(() => {
    loopNotebookAutoPlayRef.current = loopNotebookAutoPlay;
  }, [loopNotebookAutoPlay]);

  useEffect(() => {
    localStorage.setItem(notebookStorageKey, JSON.stringify(Array.from(savedIds)));
  }, [savedIds]);

  useEffect(() => {
    localStorage.setItem(autoPlayMutedStorageKey, JSON.stringify(Array.from(autoPlayMutedIds)));
  }, [autoPlayMutedIds]);

  useEffect(() => {
    localStorage.setItem(generatedExamplesStorageKey, JSON.stringify(generatedExamples));
  }, [generatedExamples]);

  useEffect(() => {
    localStorage.setItem(exampleTranslationsStorageKey, JSON.stringify(exampleTranslations));
  }, [exampleTranslations]);

  useEffect(() => {
    localStorage.setItem(exampleGrammarStorageKey, JSON.stringify(exampleGrammar));
  }, [exampleGrammar]);

  useEffect(() => {
    localStorage.setItem(spokenGrammarStorageKey, JSON.stringify(spokenGrammar));
  }, [spokenGrammar]);

  useEffect(() => {
    localStorage.setItem(wordAnswersStorageKey, JSON.stringify(wordAnswers));
  }, [wordAnswers]);

  useEffect(() => {
    localStorage.setItem(studyProgressStorageKey, JSON.stringify(studyProgress));
  }, [studyProgress]);

  useEffect(() => {
    if (syncCode) {
      localStorage.setItem(syncCodeStorageKey, syncCode);
    } else {
      localStorage.removeItem(syncCodeStorageKey);
    }
  }, [syncCode]);

  function applySyncPayload(payload: SyncPayload) {
    setSavedIds(new Set(payload.notebook ?? []));
    setAutoPlayMutedIds(new Set(payload.autoPlayMuted ?? []));
    setGeneratedExamples(payload.generatedExamples ?? {});
    setExampleTranslations(payload.exampleTranslations ?? {});
    setExampleGrammar(payload.exampleGrammar ?? {});
    setSpokenGrammar(payload.spokenGrammar ?? {});
    setWordAnswers(payload.wordAnswers ?? {});
    setStudyProgress(payload.studyProgress ?? {});
  }

  useEffect(() => {
    syncPayloadRef.current = {
      notebook: Array.from(savedIds),
      autoPlayMuted: Array.from(autoPlayMutedIds),
      generatedExamples,
      exampleTranslations,
      exampleGrammar,
      spokenGrammar,
      wordAnswers,
      studyProgress
    };
  }, [
    savedIds,
    autoPlayMutedIds,
    generatedExamples,
    exampleTranslations,
    exampleGrammar,
    spokenGrammar,
    wordAnswers,
    studyProgress
  ]);

  async function pullSync(code: string) {
    const response = await fetch(apiUrl(`/api/sync-pull?code=${encodeURIComponent(code)}`));
    if (!response.ok) {
      throw new Error("Sync pull failed");
    }
    return (await response.json()) as { updatedAt?: number; payload?: SyncPayload | null };
  }

  async function pushSync(code: string) {
    const updatedAt = Date.now();
    const response = await fetch(apiUrl("/api/sync-push"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, updatedAt, payload: syncPayloadRef.current })
    });
    if (!response.ok) {
      throw new Error("Sync push failed");
    }
    localStorage.setItem(syncUpdatedAtStorageKey, String(updatedAt));
  }

  useEffect(() => {
    const initialCode = getSavedSyncCode();

    if (!initialCode || !apiAvailable) {
      syncReadyRef.current = true;
      return;
    }

    let active = true;
    setSyncStatus("syncing");

    (async () => {
      try {
        const localUpdatedAt = getSavedSyncUpdatedAt();
        const remote = await pullSync(initialCode);
        if (!active) return;
        if (remote.payload && (remote.updatedAt ?? 0) > localUpdatedAt) {
          applySyncPayload(remote.payload);
          localStorage.setItem(syncUpdatedAtStorageKey, String(remote.updatedAt ?? 0));
        }
        if (active) setSyncStatus("synced");
      } catch {
        if (active) setSyncStatus("error");
      } finally {
        if (active) syncReadyRef.current = true;
      }
    })();

    return () => {
      active = false;
    };
    // Runs once on mount to reconcile against whatever sync code was already saved locally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fast path: push soon after a meaningful, user-driven change (notebook edit or a
  // review answer). These change rarely enough that the debounce actually settles.
  useEffect(() => {
    if (!syncCode || !apiAvailable || !syncReadyRef.current) return;

    if (syncPushTimerRef.current) {
      window.clearTimeout(syncPushTimerRef.current);
    }

    syncPushTimerRef.current = window.setTimeout(() => {
      setSyncStatus("syncing");
      pushSync(syncCode)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 2000);

    return () => {
      if (syncPushTimerRef.current) {
        window.clearTimeout(syncPushTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncCode, savedIds, autoPlayMutedIds, studyProgress]);

  // Slow path: the AI-generated caches (translations, grammar, generated examples,
  // word answers) can update continuously in the background, which would keep
  // resetting a change-triggered debounce forever. A periodic sweep guarantees they
  // still reach the cloud eventually without fighting that churn.
  useEffect(() => {
    if (!syncCode || !apiAvailable) return;

    const interval = window.setInterval(() => {
      if (!syncReadyRef.current) return;
      setSyncStatus("syncing");
      pushSync(syncCode)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 30000);

    return () => window.clearInterval(interval);
  }, [syncCode]);

  function handleGenerateSyncCode() {
    syncReadyRef.current = true;
    localStorage.setItem(syncUpdatedAtStorageKey, "0");
    setSyncMessage("");
    setSyncStatus("syncing");
    setSyncCode(generateSyncCode());
  }

  function handleDisableSync() {
    setSyncCode("");
    localStorage.removeItem(syncUpdatedAtStorageKey);
    setSyncStatus("idle");
    setSyncMessage("");
  }

  async function handleLinkSyncCode() {
    const normalized = normalizeSyncCode(syncCodeDraft);
    if (!normalized) return;

    setSyncMessage("");
    setSyncStatus("syncing");

    try {
      const remote = await pullSync(normalized);
      if (remote.payload) {
        if (!window.confirm(t.syncLinkConfirm)) {
          setSyncStatus(syncCode ? "synced" : "idle");
          return;
        }
        applySyncPayload(remote.payload);
        localStorage.setItem(syncUpdatedAtStorageKey, String(remote.updatedAt ?? 0));
      } else {
        localStorage.setItem(syncUpdatedAtStorageKey, "0");
      }

      syncReadyRef.current = true;
      setSyncCode(normalized);
      setSyncCodeDraft("");
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  }

  async function handleCopySyncCode() {
    try {
      await navigator.clipboard.writeText(syncCode);
      setSyncMessage(t.syncCopied);
    } catch {
      setSyncMessage(formatSyncCode(syncCode));
    }
  }

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);

  useEffect(() => {
    if (mode !== "notebook" && autoPlayingNotebook) {
      stopNotebookAutoPlay();
    }
  }, [autoPlayingNotebook, mode]);

  useEffect(() => {
    return () => {
      autoPlayTokenRef.current += 1;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadExamples() {
      if (!apiAvailable) {
        setExamplesLoading(false);
        setExamplesFailed(false);
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/book-examples"));
        if (!response.ok) {
          throw new Error("Failed to read book examples");
        }
        const examples = (await response.json()) as Record<string, string>;
        if (active) {
          setBookExamples(examples);
          setExamplesFailed(false);
        }
      } catch {
        if (active) {
          setExamplesFailed(true);
        }
      } finally {
        if (active) {
          setExamplesLoading(false);
        }
      }
    }

    loadExamples();
    return () => {
      active = false;
    };
  }, []);

  const savedWords = useMemo(
    () => words.filter((word) => savedIds.has(word.sourceId)),
    [savedIds]
  );

  useEffect(() => {
    if (skipVisibleResetRef.current) {
      skipVisibleResetRef.current = false;
      return;
    }
    setVisibleLimit(180);
  }, [mode, query, selectedList]);

  useEffect(() => {
    if (!highlightedWordId) return;
    const el = document.getElementById(`word-${highlightedWordId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(() => setHighlightedWordId(null), 2000);
    return () => clearTimeout(timeout);
  }, [highlightedWordId]);

  function jumpToRank() {
    const rankNumber = Number(jumpValue.trim());
    if (!Number.isFinite(rankNumber) || rankNumber <= 0) return;

    const source = mode === "notebook" ? savedWords : words;
    const filtered = source.filter((word) => selectedList === "All" || word.list === selectedList);
    const targetIndex = filtered.findIndex((word) => word.rank === rankNumber);
    if (targetIndex === -1) return;

    if (query !== "") {
      skipVisibleResetRef.current = true;
      setQuery("");
    }
    setVisibleLimit((current) => Math.max(current, targetIndex + 20));
    setHighlightedWordId(filtered[targetIndex].sourceId);
  }

  const matchingWords = useMemo(() => {
    const source = mode === "notebook" ? savedWords : words;
    const needle = normalize(query);
    const trimmedQuery = query.trim();
    const rankQuery = /^\d+$/.test(trimmedQuery) ? Number(trimmedQuery) : null;
    return source
      .filter((word) => selectedList === "All" || word.list === selectedList)
      .filter((word) => {
        if (!needle) return true;
        if (rankQuery !== null && word.rank === rankQuery) return true;
        return (
          normalize(word.word).includes(needle) ||
          normalize(word.translation).includes(needle) ||
          normalize(word.partOfSpeech).includes(needle)
        );
      });
  }, [mode, query, savedWords, selectedList]);

  const visibleWords = useMemo(
    () => matchingWords.slice(0, visibleLimit),
    [matchingWords, visibleLimit]
  );

  const studyWords = useMemo(() => {
    const source = savedWords.length > 0 ? savedWords : words.slice(0, 100);
    return [...source].sort((a, b) => {
      const aProgress = studyProgress[a.sourceId];
      const bProgress = studyProgress[b.sourceId];
      const aDue = aProgress?.dueAt ?? 0;
      const bDue = bProgress?.dueAt ?? 0;
      if (aDue !== bDue) return aDue - bDue;
      return a.rank - b.rank;
    });
  }, [savedWords, studyProgress]);
  const studyWord = studyWords[studyIndex] ?? studyWords[0];
  const studyWordProgress = studyWord ? studyProgress[studyWord.sourceId] : undefined;
  const now = Date.now();

  useEffect(() => {
    if (studyIndex >= studyWords.length) {
      setStudyIndex(0);
    }
  }, [studyIndex, studyWords.length]);

  function toggleSaved(id: string) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addAllWordsToNotebook() {
    setSavedIds(new Set(words.map((word) => word.sourceId)));
  }

  function toggleAutoPlayMuted(id: string) {
    setAutoPlayMutedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectOnlyFictionTop20ForAutoPlay() {
    const keepIds = new Set(
      words.filter((word) => word.list === "Fiction" && word.rank <= 20).map((word) => word.sourceId)
    );
    setAutoPlayMutedIds(new Set(words.filter((word) => !keepIds.has(word.sourceId)).map((word) => word.sourceId)));
  }

  function toggleAllCards() {
    setCardsFlipped((value) => !value);
    setCardFlipOverrides({});
  }

  function isCardFlipped(id: string) {
    return cardFlipOverrides[id] ?? cardsFlipped;
  }

  function toggleCardFlip(id: string) {
    setCardFlipOverrides((current) => ({
      ...current,
      [id]: !(current[id] ?? cardsFlipped)
    }));
  }

  function stopNotebookAutoPlay() {
    autoPlayTokenRef.current += 1;
    setAutoPlayingNotebook(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  async function playSpeechItems(items: SpeechItem[], index: number, token: number, onComplete: () => void) {
    if (!("speechSynthesis" in window) || token !== autoPlayTokenRef.current) {
      setAutoPlayingNotebook(false);
      return;
    }

    const item = items[index];
    if (!item) {
      onComplete();
      return;
    }

    const utterance = await createUtterance(item.text, item.language);
    if (token !== autoPlayTokenRef.current) {
      setAutoPlayingNotebook(false);
      return;
    }
    utterance.onend = () => playSpeechItems(items, index + 1, token, onComplete);
    utterance.onerror = () => playSpeechItems(items, index + 1, token, onComplete);
    window.speechSynthesis.speak(utterance);
  }

  async function getSpokenGrammarExplanation(sentenceKey: string, sentence: string) {
    const cached = spokenGrammar[sentenceKey];
    if (cached) return cached;
    if (!apiAvailable) return "";

    try {
      const response = await fetch(apiUrl("/api/explain-example"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sentence,
          targetLanguage: "en"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to explain example");
      }

      const data = (await response.json()) as { explanation?: string };
      const explanation = data.explanation?.trim();
      if (!explanation) return "";

      setSpokenGrammar((current) => ({ ...current, [sentenceKey]: explanation }));
      return explanation;
    } catch {
      return "";
    }
  }

  async function playNotebookWords(wordsToPlay: DutchWord[], index: number, token: number, includeExampleGrammar: boolean) {
    if (token !== autoPlayTokenRef.current) {
      setAutoPlayingNotebook(false);
      return;
    }

    const word = wordsToPlay[index];
    if (!word) {
      if (loopNotebookAutoPlayRef.current && wordsToPlay.length > 0) {
        void playNotebookWords(wordsToPlay, 0, token, includeExampleGrammar);
        return;
      }
      setAutoPlayingNotebook(false);
      return;
    }

    const items = notebookSpeechItems([word]);

    if (includeExampleGrammar) {
      const sentence = sentenceFor(word);
      const sentenceKey = sentenceKeyFor(word);
      if (sentence) {
        items.push({ text: sentence, language: "nl-NL" });
        const explanation = await getSpokenGrammarExplanation(sentenceKey, sentence);
        if (token !== autoPlayTokenRef.current) return;
        if (explanation) {
          items.push(...grammarExplanationSpeechItemsForWord(explanation, word, sentence));
        }
      }
    }

    playSpeechItems(items, 0, token, () => {
      void playNotebookWords(wordsToPlay, index + 1, token, includeExampleGrammar);
    });
  }

  function startNotebookAutoPlay() {
    const wordsToPlay = matchingWords.filter((word) => !autoPlayMutedIds.has(word.sourceId));
    if (!wordsToPlay.length) return;

    autoPlayTokenRef.current += 1;
    const token = autoPlayTokenRef.current;
    setAutoPlayingNotebook(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    void playNotebookWords(wordsToPlay, 0, token, includeNotebookExampleGrammar);
  }

  function moveStudy(step: number) {
    setRevealed(false);
    setStudyIndex((current) => (current + step + studyWords.length) % studyWords.length);
  }

  function randomStudy() {
    setRevealed(false);
    setStudyIndex((current) => getRandomIndex(studyWords.length, current));
  }

  function rateStudyWord(rating: StudyRating) {
    if (!studyWord) return;
    const reviewedAt = Date.now();
    setStudyProgress((current) => ({
      ...current,
      [studyWord.sourceId]: getNextStudyProgress(current[studyWord.sourceId], rating, reviewedAt)
    }));
    setRevealed(false);
    setStudyIndex(0);
  }

  function sentenceFor(word: DutchWord) {
    return bookExamples[word.sourceId] ?? generatedExamples[word.sourceId] ?? makeExampleSentence(word);
  }

  function sentenceKeyFor(word: DutchWord) {
    return `${word.sourceId}:${sentenceHash(sentenceFor(word))}`;
  }

  function translationsFor(sentenceKey: string) {
    return {
      zh: exampleTranslations[`${sentenceKey}:zh`],
      en: exampleTranslations[`${sentenceKey}:en`],
      de: exampleTranslations[`${sentenceKey}:de`]
    };
  }

  function translatingLanguageFor(sentenceKey: string): ExampleTranslationLanguage | "" {
    const languageCode = translatingKey.slice(sentenceKey.length + 1);
    return translatingKey.startsWith(`${sentenceKey}:`) &&
      (languageCode === "zh" || languageCode === "en" || languageCode === "de")
      ? languageCode
      : "";
  }

  useEffect(() => {
    if (!apiAvailable || translatingKey) return;

    const candidates = mode === "study" && studyWord ? [studyWord] : visibleWords;
    const nextWord = candidates.find((word) => {
      const sentence = sentenceFor(word);
      const sentenceKey = sentenceKeyFor(word);
      const cacheKey = `${sentenceKey}:${defaultExampleTranslationLanguage}`;
      const requestKey = `${cacheKey}:${sentence}`;
      return sentence && !exampleTranslations[cacheKey] && !autoTranslationRequestsRef.current.has(requestKey);
    });

    if (!nextWord) return;

    const sentence = sentenceFor(nextWord);
    const sentenceKey = sentenceKeyFor(nextWord);
    const cacheKey = `${sentenceKey}:${defaultExampleTranslationLanguage}`;
    autoTranslationRequestsRef.current.add(`${cacheKey}:${sentence}`);
    void handleTranslateExample(sentenceKey, sentence, defaultExampleTranslationLanguage);
  }, [bookExamples, exampleTranslations, generatedExamples, mode, studyWord, translatingKey, visibleWords]);

  async function handleGenerateExample(word: DutchWord) {
    if (!apiAvailable) {
      setGenerationMessages((current) => ({ ...current, [word.sourceId]: t.generationFailed }));
      return;
    }

    setGeneratingId(word.sourceId);
    setGenerationMessages((current) => ({ ...current, [word.sourceId]: "" }));

    try {
      const response = await fetch(apiUrl("/api/generate-example"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          word: word.word,
          translation: word.translation,
          partOfSpeech: word.partOfSpeech
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate example");
      }

      const data = (await response.json()) as { example?: string };
      const example = data.example?.trim();
      if (!example) {
        throw new Error("Empty example");
      }

      setGeneratedExamples((current) => ({ ...current, [word.sourceId]: example }));
      setExampleTranslations((current) => {
        const next = { ...current };
        for (const key of Object.keys(next)) {
          if (key === word.sourceId || key.startsWith(`${word.sourceId}:`)) {
            delete next[key];
          }
        }
        return next;
      });
      setExampleGrammar((current) => {
        const next = { ...current };
        for (const key of Object.keys(next)) {
          if (key === word.sourceId || key.startsWith(`${word.sourceId}:`)) {
            delete next[key];
          }
        }
        return next;
      });
      setGenerationMessages((current) => ({ ...current, [word.sourceId]: t.generatedExampleSaved }));
    } catch {
      setGenerationMessages((current) => ({ ...current, [word.sourceId]: t.generationFailed }));
    } finally {
      setGeneratingId("");
    }
  }

  async function handleTranslateExample(
    sentenceKey: string,
    sentence: string,
    targetLanguage: ExampleTranslationLanguage
  ) {
    if (!apiAvailable) {
      setTranslationMessages((current) => ({ ...current, [sentenceKey]: t.translationFailed }));
      return;
    }

    const cacheKey = `${sentenceKey}:${targetLanguage}`;
    setTranslatingKey(cacheKey);
    setTranslationMessages((current) => ({ ...current, [sentenceKey]: "" }));

    try {
      const response = await fetch(apiUrl("/api/translate-example"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sentence,
          targetLanguage
        })
      });

      if (!response.ok) {
        throw new Error("Failed to translate example");
      }

      const data = (await response.json()) as { translation?: string };
      const translation = data.translation?.trim();
      if (!translation) {
        throw new Error("Empty translation");
      }

      setExampleTranslations((current) => ({ ...current, [cacheKey]: translation }));
    } catch {
      setTranslationMessages((current) => ({ ...current, [sentenceKey]: t.translationFailed }));
    } finally {
      setTranslatingKey("");
    }
  }

  async function handleExplainGrammar(sentenceKey: string, sentence: string) {
    if (exampleGrammar[sentenceKey]) return;
    if (!apiAvailable) {
      setTranslationMessages((current) => ({ ...current, [sentenceKey]: t.grammarFailed }));
      return;
    }

    setExplainingGrammarKey(sentenceKey);
    setTranslationMessages((current) => ({ ...current, [sentenceKey]: "" }));

    try {
      const response = await fetch(apiUrl("/api/explain-example"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sentence
        })
      });

      if (!response.ok) {
        throw new Error("Failed to explain grammar");
      }

      const data = (await response.json()) as { explanation?: string };
      const explanation = data.explanation?.trim();
      if (!explanation) {
        throw new Error("Empty explanation");
      }

      setExampleGrammar((current) => ({ ...current, [sentenceKey]: explanation }));
    } catch {
      setTranslationMessages((current) => ({ ...current, [sentenceKey]: t.grammarFailed }));
    } finally {
      setExplainingGrammarKey("");
    }
  }

  async function handleAskWord(word: DutchWord, sentence: string, question: string) {
    if (!apiAvailable) {
      setWordAnswerMessages((current) => ({ ...current, [word.sourceId]: t.wordAnswerFailed }));
      return;
    }

    const previousTurns = wordAnswers[word.sourceId] ?? [];
    const userTurn: WordAnswerTurn = { role: "user", text: question };
    setAskingWordId(word.sourceId);
    setWordAnswerMessages((current) => ({ ...current, [word.sourceId]: "" }));
    setWordAnswers((current) => ({
      ...current,
      [word.sourceId]: [...(current[word.sourceId] ?? []), userTurn]
    }));

    try {
      const response = await fetch(apiUrl("/api/ask-word"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          word: word.word,
          translation: word.translation,
          partOfSpeech: word.partOfSpeech,
          sentence,
          question,
          turns: previousTurns
        })
      });

      if (!response.ok) {
        throw new Error("Failed to answer word question");
      }

      const data = (await response.json()) as { answer?: string };
      const answer = data.answer?.trim();
      if (!answer) {
        throw new Error("Empty answer");
      }

      const assistantTurn: WordAnswerTurn = { role: "assistant", text: answer };
      setWordAnswers((current) => ({
        ...current,
        [word.sourceId]: [...(current[word.sourceId] ?? []), assistantTurn]
      }));
    } catch {
      setWordAnswerMessages((current) => ({ ...current, [word.sourceId]: t.wordAnswerFailed }));
      setWordAnswers((current) => ({
        ...current,
        [word.sourceId]: (current[word.sourceId] ?? []).filter((turn) => turn !== userTurn)
      }));
    } finally {
      setAskingWordId("");
    }
  }

  const studyCardFlipped = studyWord ? isCardFlipped(studyWord.sourceId) : cardsFlipped;
  const studySentenceKey = studyWord ? sentenceKeyFor(studyWord) : "";

  if (mode === "landing") {
    return (
      <LandingPage
        t={t}
        language={language}
        onLanguageChange={setLanguage}
        onStart={() => setMode("browse")}
      />
    );
  }

  return (
    <main>
      <header className="app-header">
        <div className="header-grid">
          <div>
            <div className="eyebrow">
              <BookOpen size={18} />
              <span>{t.appName}</span>
            </div>
            <h1>{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
          <div className="header-controls">
            <label className="language-select">
              <Languages size={17} />
              <span>{t.language}</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value as UiLanguage)}>
                {(Object.keys(languageNames) as UiLanguage[]).map((key) => (
                  <option key={key} value={key}>
                    {languageNames[key]}
                  </option>
                ))}
              </select>
            </label>
            <details className="sync-panel">
              <summary>
                <RefreshCw size={16} />
                <span>{t.syncLabel}</span>
                {syncCode ? (
                  <span className={`sync-dot ${syncStatus}`} aria-hidden="true" />
                ) : null}
              </summary>
              <div className="sync-panel-body">
                <p className="sync-hint">{t.syncHint}</p>
                {syncCode ? (
                  <>
                    <div className="sync-code-row">
                      <code>{formatSyncCode(syncCode)}</code>
                      <button type="button" className="mini-button" onClick={handleCopySyncCode}>
                        {t.syncCopy}
                      </button>
                    </div>
                    <p className="recognized muted">
                      {syncStatus === "error"
                        ? t.syncStatusError
                        : syncStatus === "synced"
                          ? t.syncStatusSynced
                          : t.syncStatusSyncing}
                    </p>
                    <button type="button" className="mini-button" onClick={handleDisableSync}>
                      {t.syncDisable}
                    </button>
                  </>
                ) : (
                  <button type="button" className="mini-button" onClick={handleGenerateSyncCode}>
                    {t.syncGenerate}
                  </button>
                )}
                <form
                  className="sync-link-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleLinkSyncCode();
                  }}
                >
                  <input
                    value={syncCodeDraft}
                    onChange={(event) => setSyncCodeDraft(event.target.value)}
                    placeholder={t.syncEnterCodePlaceholder}
                  />
                  <button type="submit" className="mini-button" disabled={!syncCodeDraft.trim()}>
                    {t.syncLink}
                  </button>
                </form>
                {syncMessage ? <p className="recognized muted">{syncMessage}</p> : null}
              </div>
            </details>
            <div className="example-import">
              <span className="example-status">
                {!apiAvailable
                  ? t.examplesOffline
                  : examplesLoading
                    ? t.examplesLoading
                    : examplesFailed
                      ? t.examplesImportFailed
                      : t.examplesReady(Object.keys(bookExamples).length)}
              </span>
            </div>
            <div className="stats">
              <div>
                <span>{t.statsWords}</span>
                <strong>{words.length}</strong>
              </div>
              <div>
                <span>{t.statsNotebook}</span>
                <strong>{savedIds.size}</strong>
              </div>
              <div>
                <span>{t.statsCurrent}</span>
                <strong>{t.list[selectedList] ?? selectedList}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="toolbar-primary">
          <div className="mode-switch" aria-label={t.viewLabel}>
            <button className={mode === "browse" ? "active" : ""} onClick={() => setMode("browse")}>
              <Layers3 size={17} />
              <span>{t.modeBrowse}</span>
            </button>
            <button className={mode === "notebook" ? "active" : ""} onClick={() => setMode("notebook")}>
              <BookmarkCheck size={17} />
              <span>{t.modeNotebook}</span>
            </button>
            <button className={mode === "study" ? "active" : ""} onClick={() => setMode("study")}>
              <Shuffle size={17} />
              <span>{t.modeStudy}</span>
            </button>
            <button className={mode === "speaking" ? "active" : ""} onClick={() => setMode("speaking")}>
              <Mic size={17} />
              <span>{t.modeSpeaking}</span>
            </button>
            <button className={mode === "grammar" ? "active" : ""} onClick={() => setMode("grammar")}>
              <BookOpen size={17} />
              <span>{t.modeGrammar}</span>
            </button>
            <button className={mode === "reading" ? "active" : ""} onClick={() => setMode("reading")}>
              <Languages size={17} />
              <span>{t.modeReading}</span>
            </button>
            <button className={mode === "podcast" ? "active" : ""} onClick={() => setMode("podcast")}>
              <Podcast size={17} />
              <span>{t.modePodcast}</span>
            </button>
            <button className={mode === "method" ? "active" : ""} onClick={() => setMode("method")}>
              <BookOpen size={17} />
              <span>{t.modeMethod}</span>
            </button>
          </div>
        </div>

        <div className="toolbar-secondary">
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>

          <form
            className="jump-box"
            onSubmit={(event) => {
              event.preventDefault();
              jumpToRank();
            }}
          >
            <input
              type="number"
              min={1}
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
              placeholder={t.jumpToRankPlaceholder}
            />
            <button type="submit" disabled={!jumpValue.trim()}>
              <ChevronRight size={16} />
              <span>{t.jumpToRankButton}</span>
            </button>
          </form>

          {mode !== "method" && mode !== "speaking" && mode !== "grammar" && mode !== "reading" && mode !== "podcast" ? (
            <div className="card-controls" aria-label="Card side controls">
              <button
                className={cardsFlipped ? "active" : ""}
                type="button"
                onClick={toggleAllCards}
                title="Flip all visible word cards"
              >
                <RotateCcw size={16} />
                <span>{cardsFlipped ? "Definition → Dutch" : "Dutch → Definition"}</span>
              </button>
              <label>
                <span>Back</span>
                <select
                  value={cardMeaningLanguage}
                  onChange={(event) => setCardMeaningLanguage(event.target.value as CardMeaningLanguage)}
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>

        {mode !== "method" && mode !== "speaking" && mode !== "grammar" && mode !== "reading" && mode !== "podcast" ? (
          <div className="filters" aria-label={t.filtersLabel}>
            <Filter size={17} />
            {listNames.map((name) => (
              <button
                key={name}
                className={selectedList === name ? "active" : ""}
                onClick={() => setSelectedList(name)}
              >
                {t.list[name] ?? name}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {mode === "method" ? (
        <MethodPage language={language} />
      ) : mode === "grammar" ? (
        <GrammarGuidePage />
      ) : mode === "reading" ? (
        <DailyReadingPage t={t} language={language} />
      ) : mode === "podcast" ? (
        <PodcastPage t={t} language={language} />
      ) : mode === "speaking" ? (
        <SpeakingPage t={t} />
      ) : mode === "study" && studyWord ? (
        <section className="study-layout">
          <article className="study-card">
            <div className="study-meta">
              <span className={`pill ${listTone[studyWord.list] ?? "tone-general"}`}>
                {t.list[studyWord.list]} #{studyWord.rank}
              </span>
              <div className="icon-actions">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => toggleCardFlip(studyWord.sourceId)}
                  title="反转这张卡片"
                >
                  <RotateCcw size={17} />
                </button>
                <button className="icon-button" type="button" onClick={() => speak(studyWord)} title={t.playPronunciation}>
                  <Volume2 size={18} />
                </button>
                <button
                  className={`icon-button ${savedIds.has(studyWord.sourceId) ? "saved" : ""}`}
                  type="button"
                  onClick={() => toggleSaved(studyWord.sourceId)}
                  title={savedIds.has(studyWord.sourceId) ? t.removeFromNotebook : t.addToNotebook}
                >
                  {savedIds.has(studyWord.sourceId) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
              </div>
            </div>

            <div className="prompt">
              <span className="card-side-label">
                {studyCardFlipped ? (cardMeaningLanguage === "zh" ? "中文" : "English") : "Nederlands"}
              </span>
              <h2>{studyCardFlipped ? cardMeaningFor(studyWord, cardMeaningLanguage) || t.noTranslation : studyWord.word}</h2>
              {!studyCardFlipped ? <span>{t.pos[studyWord.partOfSpeech] ?? studyWord.partOfSpeech}</span> : null}
              <div className="review-state">
                <strong>
                  {studyWordProgress && studyWordProgress.dueAt > now
                    ? t.reviewDueLater(formatDueDistance(studyWordProgress.dueAt, now))
                    : t.reviewDueNow}
                </strong>
                <small>{t.reviewLevel(studyWordProgress?.level ?? 0)}</small>
              </div>
              {!studyCardFlipped ? (
                <p className={revealed ? "answer visible" : "answer"}>
                  {cardMeaningFor(studyWord, cardMeaningLanguage) || t.noTranslation}
                </p>
              ) : null}
            </div>

            {!studyCardFlipped ? (
              <>
                <RepeatPractice
                  sentenceKey={studySentenceKey}
                  sentence={sentenceFor(studyWord)}
                  exampleTranslations={translationsFor(studySentenceKey)}
                  grammarExplanation={exampleGrammar[studySentenceKey]}
                  translating={translatingLanguageFor(studySentenceKey)}
                  explainingGrammar={explainingGrammarKey === studySentenceKey}
                  translationMessage={translationMessages[studySentenceKey]}
                  onTranslate={handleTranslateExample}
                  onExplainGrammar={handleExplainGrammar}
                  t={t}
                />

                <div className="ai-example-row study-ai-row">
                  <button
                    className="mini-button"
                    type="button"
                    onClick={() => handleGenerateExample(studyWord)}
                    disabled={generatingId === studyWord.sourceId}
                  >
                    <Sparkles size={15} />
                    <span>{generatingId === studyWord.sourceId ? t.generatingExample : t.generateExample}</span>
                  </button>
                  {generationMessages[studyWord.sourceId] ? (
                    <span className="ai-status">{generationMessages[studyWord.sourceId]}</span>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="study-actions">
              <button type="button" onClick={() => moveStudy(-1)}>
                <ChevronLeft size={17} />
                <span>{t.previous}</span>
              </button>
              <button className="primary" type="button" onClick={() => setRevealed((value) => !value)}>
                <Check size={17} />
                <span>{revealed ? t.hideAnswer : t.showAnswer}</span>
              </button>
              <button className="accent" type="button" onClick={randomStudy}>
                <Shuffle size={17} />
                <span>{t.random}</span>
              </button>
              <button type="button" onClick={() => moveStudy(1)}>
                <span>{t.next}</span>
                <ChevronRight size={17} />
              </button>
            </div>
            <div className="review-actions">
              <button className="again" type="button" onClick={() => rateStudyWord("again")}>
                {t.reviewAgain}
              </button>
              <button className="hard" type="button" onClick={() => rateStudyWord("hard")}>
                {t.reviewHard}
              </button>
              <button className="known" type="button" onClick={() => rateStudyWord("known")}>
                {t.reviewKnown}
              </button>
            </div>
          </article>

          <aside className="queue">
            <div className="queue-head">
              <h2>{t.studyQueue}</h2>
              <button
                className="icon-button"
                type="button"
                onClick={() => {
                  setStudyIndex(0);
                  setRevealed(false);
                }}
                title={t.reset}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="queue-list">
              {studyWords.slice(0, 12).map((word, index) => (
                <button
                  key={word.sourceId}
                  className={studyWord.sourceId === word.sourceId ? "active" : ""}
                  onClick={() => {
                    setStudyIndex(index);
                    setRevealed(false);
                  }}
                >
                  <span>{word.word}</span>
                  <small>
                    {studyProgress[word.sourceId]?.dueAt
                      ? formatDueDistance(studyProgress[word.sourceId].dueAt, now)
                      : word.sourceId}
                  </small>
                </button>
              ))}
            </div>
          </aside>
        </section>
      ) : (
        <section className="content">
          <div className="result-head">
            <span>
              {t.resultCount(matchingWords.length)} / {t.showingResults(visibleWords.length, matchingWords.length)}
            </span>
            {mode === "notebook" && matchingWords.length > 0 ? (
              <div className="notebook-playback-controls">
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={includeNotebookExampleGrammar}
                    onChange={(event) => setIncludeNotebookExampleGrammar(event.target.checked)}
                    disabled={autoPlayingNotebook}
                  />
                  <span>{t.autoPlayExampleGrammar}</span>
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={loopNotebookAutoPlay}
                    onChange={(event) => setLoopNotebookAutoPlay(event.target.checked)}
                  />
                  <span>{t.loopAutoPlay}</span>
                </label>
                <button
                  type="button"
                  onClick={autoPlayingNotebook ? stopNotebookAutoPlay : startNotebookAutoPlay}
                  title={autoPlayingNotebook ? t.stopAutoPlayNotebook : t.autoPlayNotebook}
                >
                  {autoPlayingNotebook ? <Square size={16} /> : <Volume2 size={16} />}
                  <span>{autoPlayingNotebook ? t.stopAutoPlayNotebook : t.autoPlayNotebook}</span>
                </button>
                {autoPlayMutedIds.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAutoPlayMutedIds(new Set())}
                    disabled={autoPlayingNotebook}
                    title={t.resetAutoPlaySelection}
                  >
                    <RotateCcw size={16} />
                    <span>{t.resetAutoPlaySelection}</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={selectOnlyFictionTop20ForAutoPlay}
                  disabled={autoPlayingNotebook}
                  title={t.selectFictionTop20AutoPlay}
                >
                  <CheckSquare size={16} />
                  <span>{t.selectFictionTop20AutoPlay}</span>
                </button>
              </div>
            ) : null}
            {mode === "notebook" && savedIds.size > 0 ? (
              <button
                type="button"
                onClick={() => {
                  stopNotebookAutoPlay();
                  setSavedIds(new Set());
                }}
              >
                <RotateCcw size={16} />
                <span>{t.clearNotebook}</span>
              </button>
            ) : null}
            {mode === "browse" && savedIds.size < words.length ? (
              <button type="button" onClick={addAllWordsToNotebook}>
                <BookmarkCheck size={16} />
                <span>{t.addAllToNotebook}</span>
              </button>
            ) : null}
          </div>

          {visibleWords.length > 0 ? (
            <>
              <div className="word-grid">
                {visibleWords.map((word) => {
                  const sentence = sentenceFor(word);
                  const sentenceKey = sentenceKeyFor(word);
                  return (
                    <WordCard
                      key={word.sourceId}
                      item={word}
                      saved={savedIds.has(word.sourceId)}
                      onToggle={toggleSaved}
                      autoPlayMuted={autoPlayMutedIds.has(word.sourceId)}
                      onToggleAutoPlayMuted={toggleAutoPlayMuted}
                      onGenerateExample={handleGenerateExample}
                      sentence={sentence}
                      exampleTranslations={translationsFor(sentenceKey)}
                      grammarExplanation={exampleGrammar[sentenceKey]}
                      translatingExample={translatingLanguageFor(sentenceKey)}
                      explainingGrammar={explainingGrammarKey === sentenceKey}
                      translationMessage={translationMessages[sentenceKey]}
                      onTranslateExample={handleTranslateExample}
                      onExplainGrammar={handleExplainGrammar}
                      wordAnswers={wordAnswers[word.sourceId] ?? []}
                      askingWord={askingWordId === word.sourceId}
                      wordAnswerMessage={wordAnswerMessages[word.sourceId]}
                      onAskWord={handleAskWord}
                      generating={generatingId === word.sourceId}
                      generationMessage={generationMessages[word.sourceId]}
                      flipped={isCardFlipped(word.sourceId)}
                      cardMeaningLanguage={cardMeaningLanguage}
                      onToggleFlip={toggleCardFlip}
                      highlighted={highlightedWordId === word.sourceId}
                      t={t}
                    />
                  );
                })}
              </div>
              {visibleWords.length < matchingWords.length ? (
                <div className="load-more-row">
                  <button type="button" onClick={() => setVisibleLimit((limit) => limit + 180)}>
                    {t.loadMore}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <BookOpen size={34} />
              <p>{t.emptyState}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
