import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Crown,
  Filter,
  Languages,
  Layers3,
  Mic,
  Pause,
  Play,
  Podcast,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Square,
  User,
  Volume2
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  grammarGuideChapters,
  grammarGuideParts,
  type GrammarChapter,
  type GrammarNode,
  type GrammarPart
} from "./data/grammarGuide";
import frequencyWords from "./data/frequencyWords.json";
import wordIpaData from "./data/wordIpa.json";
import { supabase, type Session } from "./lib/supabaseClient";

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

type ViewMode =
  | "landing"
  | "browse"
  | "notebook"
  | "study"
  | "speaking"
  | "grammar"
  | "reading"
  | "podcast"
  | "method"
  | "pricing"
  | "profile";
type UiLanguage = "zh" | "en" | "nl" | "es" | "de";
type ExampleTranslationLanguage = UiLanguage;
type CardMeaningLanguage = "en" | "zh" | "es" | "de";
type SpeechLanguage = "zh-CN" | "en-US" | "nl-NL" | "es-ES" | "de-DE";
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
type GrammarNodeEntry = {
  node: GrammarNode;
  path: GrammarNode[];
  depth: number;
};

function loc<T>(record: Record<UiLanguage, T>, language: UiLanguage): T {
  return record[language] ?? record.zh;
}
type PremiumGate = {
  isPremium: boolean;
  authHeaders: () => Record<string, string>;
  requestPremium: () => void;
};
type ProfileRow = {
  is_premium?: boolean;
  subscription_status?: string | null;
  current_period_end?: string | null;
  trial_end?: string | null;
};

const words = frequencyWords as DutchWord[];
const wordIpa = wordIpaData as Record<string, string>;
function ipaFor(word: DutchWord) {
  return wordIpa[word.sourceId];
}
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
const listsByWordText = new Map<string, string[]>();
for (const word of words) {
  const existing = listsByWordText.get(word.word);
  if (existing) {
    if (!existing.includes(word.list)) existing.push(word.list);
  } else {
    listsByWordText.set(word.word, [word.list]);
  }
}
function listsFor(word: DutchWord): string[] {
  const all = listsByWordText.get(word.word);
  if (!all || all.length <= 1) return [word.list];
  return [word.list, ...all.filter((list) => list !== word.list)];
}
const totalUniqueWords = listsByWordText.size;
const notebookStorageKey = "dutch-frequency-app-notebook";
const defaultNotebookMigrationKey = "dutch-frequency-app-default-notebook-3000";
const languageStorageKey = "dutch-frequency-app-ui-language";
const generatedExamplesStorageKey = "dutch-frequency-app-generated-examples";
const exampleTranslationsStorageKey = "dutch-frequency-app-example-translations";
const wordMeaningTranslationsStorageKey = "dutch-frequency-app-word-meaning-translations";
const cardMeaningLanguageStorageKey = "dutch-frequency-app-card-meaning-language";
const exampleGrammarStorageKey = "dutch-frequency-app-example-grammar";
const spokenGrammarStorageKey = "dutch-frequency-app-spoken-grammar-v2";
const wordAnswersStorageKey = "dutch-frequency-app-word-answers";
const autoPlayMutedStorageKey = "dutch-frequency-app-autoplay-muted";
const defaultAutoPlaySelectionMigrationKey = "dutch-frequency-app-default-autoplay-selection-fiction20";
const studyProgressStorageKey = "dutch-frequency-app-study-progress";
const syncUpdatedAtStorageKey = "dutch-frequency-app-sync-updated-at";
const listNames = ["All", "Core", "Fiction", "Newspapers", "Spoken", "Web", "General"];
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const apiAvailable = import.meta.env.DEV || import.meta.env.PROD || Boolean(apiBaseUrl);

const defaultExampleTranslationLanguage: ExampleTranslationLanguage = "en";

const languageNames: Record<UiLanguage, string> = {
  zh: "中文",
  en: "English",
  nl: "Nederlands",
  es: "Español",
  de: "Deutsch"
};
const exampleTranslationLanguages: Record<ExampleTranslationLanguage, string> = languageNames;

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
    statsUniqueWords: string;
    statsNotebook: string;
    statsCurrent: string;
    hideDuplicatesLabel: string;
    searchPlaceholder: string;
    jumpToRankPlaceholder: string;
    jumpToRankButton: string;
    viewLabel: string;
    collapseSidebar: string;
    expandSidebar: string;
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
    readingLongButton: string;
    readingLongHide: string;
    readingLongLoading: string;
    readingLongFailed: string;
    readingLongPlay: string;
    readingLongStop: string;
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
    podcastSpeed: string;
    podcastQuizTitle: string;
    podcastQuizUnavailable: string;
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
    studyJumpPlaceholder: string;
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
    pronunciationRecord: string;
    pronunciationStop: string;
    pronunciationAssessing: string;
    pronunciationOverallScore: string;
    pronunciationAccuracy: string;
    pronunciationFluency: string;
    pronunciationCompleteness: string;
    pronunciationAssessFailed: string;
    examplesReady: (count: number) => string;
    examplesLoading: string;
    examplesImportFailed: string;
    examplesOffline: string;
    translateExample: string;
    translatingExample: string;
    translationFailed: string;
    exampleTranslation: string;
    explainGrammar: string;
    explainingGrammar: string;
    grammarExplanation: string;
    grammarFailed: string;
    grammarNodeExplainButton: string;
    grammarNodeExplaining: string;
    grammarNodeExplainFailed: string;
    grammarNodeDetailedTitle: string;
    grammarViewMindmap: string;
    grammarViewWalk: string;
    grammarWalkAutoRead: string;
    grammarWalkPrev: string;
    grammarWalkNext: string;
    grammarWalkReadAloud: string;
    grammarWalkStopReading: string;
    grammarWalkChapterLabel: string;
    grammarPageEyebrow: string;
    grammarPageTitle: string;
    grammarPageLead: (count: number) => string;
    grammarClickableNodes: (count: number) => string;
    grammarGoalsTitle: string;
    grammarPitfallsTitle: string;
    grammarChapterMapTitle: string;
    grammarRelatedNodesTitle: string;
    grammarPracticeTitle: string;
    grammarPracticeText: string;
    grammarNodeDetailFallback: string;
    askWord: string;
    askingWord: string;
    wordQuestionPlaceholder: string;
    wordAnswer: string;
    wordAnswerFailed: string;
    authSignInTitle: string;
    authSignInGoogle: string;
    authSignInEmailLabel: string;
    authEmailPlaceholder: string;
    authSendLink: string;
    authSending: string;
    authEmailSent: string;
    authEmailError: string;
    authSignOut: string;
    authSignedInAs: (email: string) => string;
    authPremiumBadge: string;
    authRequiredNotebookTitle: string;
    authRequiredStudyTitle: string;
    authRequiredHint: string;
    authPremiumRequiredTitle: string;
    authPremiumRequiredHint: string;
    authModalClose: string;
    authLinkExpired: string;
    authTabMagicLink: string;
    authTabPassword: string;
    authFlowLogin: string;
    authFlowRegister: string;
    authPasswordPlaceholder: string;
    authPasswordSignIn: string;
    authPasswordSignInSending: string;
    authPasswordSignUp: string;
    authPasswordSignUpSending: string;
    authPasswordSignUpSuccess: string;
    authPasswordError: string;
    authSwitchToRegister: string;
    authSwitchToLogin: string;
    cardControlsLabel: string;
    flipAllCardsTitle: string;
    cardShowMeaning: string;
    cardShowDutch: string;
    cardBackLabel: string;
    grammarMindMapLabel: string;
    grammarRootLabel: string;
    accountLabel: string;
    modePricing: string;
    pricingHeroTitle: string;
    pricingHeroSubtitle: string;
    pricingFreeName: string;
    pricingFreeDesc: string;
    pricingFreeFeatures: string[];
    pricingPremiumName: string;
    pricingPremiumDesc: string;
    pricingPremiumFeatures: string[];
    pricingPriceFree: string;
    pricingPerMonth: (price: string) => string;
    pricingSubscribeCta: string;
    pricingSubscribing: string;
    pricingCurrentBadge: string;
    pricingManageCta: string;
    pricingManaging: string;
    pricingSignInCta: string;
    pricingCheckoutError: string;
    pricingCheckoutSuccess: string;
    pricingCheckoutCancelled: string;
    pricingTrialNote: string;
    premiumGateTitle: string;
    modeProfile: string;
    profileEmailLabel: string;
    profileMembershipLabel: string;
    profileStatusFree: string;
    profileStatusActive: string;
    profileStatusTrialing: string;
    profileStatusPastDue: string;
    profileStatusCanceled: string;
    profileTrialEnds: (date: string) => string;
    profileRenews: (date: string) => string;
    list: Record<string, string>;
    pos: Record<string, string>;
  }
> = {
  zh: {
    appName: "Dutch Flow",
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
      footerLeft: "Dutch Flow — 基于 Frequency Dictionary 词频数据",
      footerRight: "荷兰语高频词学习"
    },
    statsWords: "词库",
    statsUniqueWords: "去重后",
    statsNotebook: "单词本",
    statsCurrent: "当前",
    searchPlaceholder: "搜索荷兰语、英文释义或词性，输入编号可跳转",
    jumpToRankPlaceholder: "跳转到第几个",
    jumpToRankButton: "跳转",
    viewLabel: "视图",
    collapseSidebar: "收起导航栏",
    expandSidebar: "展开导航栏",
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
    readingLongButton: "生成长阅读全文",
    readingLongHide: "收起长阅读",
    readingLongLoading: "长阅读生成中…",
    readingLongFailed: "生成失败，请检查 Gemini 配置后重试",
    readingLongPlay: "朗读全文",
    readingLongStop: "停止朗读",
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
    podcastSpeed: "语速",
    podcastQuizTitle: "听力理解小测",
    podcastQuizUnavailable: "理解小测暂时只支持中文",
    podcastLoading: "正在加载播客…",
    podcastFailed: "加载播客失败，请稍后重试。",
    podcastEmpty: "暂时没有播客内容，请稍后再来看看。",
    podcastPlay: "播放",
    podcastPause: "暂停",
    podcastPlaying: "播放中…",
    podcastShowTranscript: "显示文字稿",
    podcastHideTranscript: "隐藏文字稿",
    filtersLabel: "词频分类",
    hideDuplicatesLabel: "隐藏重复词",
    playPronunciation: "播放读音",
    autoPlayNotebook: "自动播放中英荷",
    stopAutoPlayNotebook: "停止播放",
    autoPlayExampleGrammar: "读例句和英文语法",
    loopAutoPlay: "循环播放",
    includeInAutoPlay: "已加入自动播放，点击可跳过此词",
    excludeFromAutoPlay: "已跳过此词，点击可加入自动播放",
    resetAutoPlaySelection: "全部朗读",
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
    studyJumpPlaceholder: "输入序号或单词跳转",
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
    pronunciationRecord: "跟读打分",
    pronunciationStop: "停止录音",
    pronunciationAssessing: "评分中...",
    pronunciationOverallScore: "总分",
    pronunciationAccuracy: "准确度",
    pronunciationFluency: "流利度",
    pronunciationCompleteness: "完整度",
    pronunciationAssessFailed: "发音评分失败，请检查麦克风权限或稍后重试",
    speechUnsupported: "当前浏览器不支持语音识别",
    examplesReady: (count) => `已导入 ${count} 条书中例句`,
    examplesLoading: "正在从本地 EPUB 读取书中例句...",
    examplesImportFailed: "读取书中例句失败，请确认 EPUB 文件路径存在",
    examplesOffline: "离线例句模式",
    translateExample: "翻译例句",
    translatingExample: "翻译中...",
    translationFailed: "翻译失败，请检查 LLM 配置",
    exampleTranslation: "例句翻译",
    explainGrammar: "语法讲解",
    explainingGrammar: "讲解中...",
    grammarExplanation: "语法细节",
    grammarFailed: "语法讲解失败，请检查 Gemini 配置",
    grammarNodeExplainButton: "生成详细讲解",
    grammarNodeExplaining: "详细讲解生成中…",
    grammarNodeExplainFailed: "生成失败，请检查 Gemini 配置后重试",
    grammarNodeDetailedTitle: "详细讲解",
    grammarViewMindmap: "思维导图",
    grammarViewWalk: "逐条精读",
    grammarWalkAutoRead: "翻页自动朗读",
    grammarWalkPrev: "上一条",
    grammarWalkNext: "下一条",
    grammarWalkReadAloud: "朗读",
    grammarWalkStopReading: "停止朗读",
    grammarWalkChapterLabel: "跳转到章节",
    grammarPageEyebrow: "中文语法教练",
    grammarPageTitle: "荷兰语语法思维导图",
    grammarPageLead: (count) =>
      `整理成四大模块、十六个章节、${count} 个知识点。点击导图节点先抓规则骨架，或切换到逐条精读模式一条一条看 AI 详细讲解并配语音朗读。`,
    grammarClickableNodes: (count) => `${count} 个可点击知识点`,
    grammarGoalsTitle: "学习目标",
    grammarPitfallsTitle: "中文学习者易错点",
    grammarChapterMapTitle: "章节思维导图",
    grammarRelatedNodesTitle: "子知识点",
    grammarPracticeTitle: "练习方向",
    grammarPracticeText: "找 3 个包含这个规则的单词或例句，分别问：形式是什么、为什么这样写、中文学习者容易错在哪里。",
    grammarNodeDetailFallback: "这个节点是章节结构中的概念入口，可以从它的子节点继续展开学习。",
    askWord: "问 AI",
    askingWord: "回答中...",
    wordQuestionPlaceholder: "问这个词的语法、用法、搭配、区别...",
    wordAnswer: "AI 问答",
    wordAnswerFailed: "AI 问答失败，请检查 LLM 配置",
    authSignInTitle: "登录账号",
    authSignInGoogle: "使用 Google 登录",
    authSignInEmailLabel: "或用邮箱获取登录链接",
    authEmailPlaceholder: "you@example.com",
    authSendLink: "发送登录链接",
    authSending: "发送中…",
    authEmailSent: "登录链接已发送，请查收邮箱",
    authEmailError: "发送失败，请重试",
    authSignOut: "退出登录",
    authSignedInAs: (email: string) => `已登录：${email}`,
    authPremiumBadge: "会员",
    authRequiredNotebookTitle: "登录后才能使用单词本",
    authRequiredStudyTitle: "登录后才能使用学习模式",
    authRequiredHint: "登录后，单词本和学习进度会自动跨设备同步。",
    authPremiumRequiredTitle: "这是会员专属功能",
    authPremiumRequiredHint: "AI 生成的例句、语法讲解、长阅读、口语练习和播客都需要会员权限。",
    authModalClose: "关闭",
    authLinkExpired: "登录链接已过期，请重新获取一个",
    authTabMagicLink: "邮件链接",
    authTabPassword: "邮箱密码",
    authFlowLogin: "登录",
    authFlowRegister: "注册",
    authPasswordPlaceholder: "密码（至少 6 位）",
    authPasswordSignIn: "登录",
    authPasswordSignInSending: "登录中…",
    authPasswordSignUp: "注册",
    authPasswordSignUpSending: "注册中…",
    authPasswordSignUpSuccess: "注册成功，请查收邮箱完成验证后再登录",
    authPasswordError: "邮箱或密码不正确",
    authSwitchToRegister: "还没有账号？去注册",
    authSwitchToLogin: "已有账号？去登录",
    cardControlsLabel: "卡片翻转设置",
    flipAllCardsTitle: "翻转所有可见的单词卡片",
    cardShowMeaning: "释义 → 荷兰语",
    cardShowDutch: "荷兰语 → 释义",
    cardBackLabel: "背面语言",
    grammarMindMapLabel: "语法脑图",
    grammarRootLabel: "荷兰语语法",
    accountLabel: "账户",
    modePricing: "会员",
    pricingHeroTitle: "解锁全部 AI 功能",
    pricingHeroSubtitle: "免费版已经包含完整词频表和单词本；会员版额外解锁所有 AI 生成内容。",
    pricingFreeName: "免费版",
    pricingFreeDesc: "适合日常查词和背单词",
    pricingFreeFeatures: ["完整词频表浏览与搜索", "单词本收藏，跨设备自动同步", "学习模式（间隔重复）", "语法脑图（精简讲解）"],
    pricingPremiumName: "会员版",
    pricingPremiumDesc: "解锁所有 AI 生成内容",
    pricingPremiumFeatures: [
      "免费版全部功能",
      "AI 生成例句与翻译",
      "AI 语法节点深入讲解",
      "新闻长阅读展开",
      "AI 口语陪练"
    ],
    pricingPriceFree: "免费",
    pricingPerMonth: (price: string) => `${price} / 月`,
    pricingSubscribeCta: "订阅会员",
    pricingSubscribing: "跳转到支付页面…",
    pricingCurrentBadge: "当前方案",
    pricingManageCta: "管理订阅",
    pricingManaging: "跳转中…",
    pricingSignInCta: "登录后订阅",
    pricingCheckoutError: "无法打开支付页面，请稍后重试",
    pricingCheckoutSuccess: "订阅成功，欢迎成为会员！",
    pricingCheckoutCancelled: "已取消订阅流程",
    pricingTrialNote: "首次订阅可享 7 天免费试用",
    premiumGateTitle: "这是会员专属内容",
    modeProfile: "个人资料",
    profileEmailLabel: "邮箱",
    profileMembershipLabel: "会员状态",
    profileStatusFree: "免费版",
    profileStatusActive: "会员（有效）",
    profileStatusTrialing: "会员（试用中）",
    profileStatusPastDue: "会员（付款失败）",
    profileStatusCanceled: "已取消",
    profileTrialEnds: (date: string) => `试用期至 ${date}`,
    profileRenews: (date: string) => `下次续订日期 ${date}`,
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
    appName: "Dutch Flow",
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
      footerLeft: "Dutch Flow — built on Frequency Dictionary word-frequency data",
      footerRight: "Dutch high-frequency vocabulary"
    },
    statsWords: "Words",
    statsUniqueWords: "Unique",
    statsNotebook: "Notebook",
    statsCurrent: "Current",
    searchPlaceholder: "Search Dutch, English meaning, or part of speech — type a number to jump to that rank",
    jumpToRankPlaceholder: "Jump to #",
    jumpToRankButton: "Jump",
    viewLabel: "View",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
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
    readingLongButton: "Generate a full long read",
    readingLongHide: "Hide long read",
    readingLongLoading: "Generating the long read...",
    readingLongFailed: "Failed to generate. Check the LLM config and try again",
    readingLongPlay: "Read the full text aloud",
    readingLongStop: "Stop reading",
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
    podcastSpeed: "Speed",
    podcastQuizTitle: "Comprehension quiz",
    podcastQuizUnavailable: "The comprehension quiz is only available in Chinese for now",
    podcastLoading: "Loading podcast...",
    podcastFailed: "Failed to load podcast episodes. Please try again later.",
    podcastEmpty: "No podcast episodes yet. Check back later.",
    podcastPlay: "Play",
    podcastPause: "Pause",
    podcastPlaying: "Playing...",
    podcastShowTranscript: "Show transcript",
    podcastHideTranscript: "Hide transcript",
    filtersLabel: "Frequency lists",
    hideDuplicatesLabel: "Hide duplicate words",
    playPronunciation: "Play pronunciation",
    autoPlayNotebook: "Auto-play Chinese, English, Dutch",
    stopAutoPlayNotebook: "Stop playback",
    autoPlayExampleGrammar: "Read example and English grammar",
    loopAutoPlay: "Loop playback",
    includeInAutoPlay: "Included in auto-play. Click to skip this word",
    excludeFromAutoPlay: "Skipped in auto-play. Click to include this word",
    resetAutoPlaySelection: "Read all",
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
    studyJumpPlaceholder: "Rank number or word",
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
    pronunciationRecord: "Record & score",
    pronunciationStop: "Stop recording",
    pronunciationAssessing: "Scoring...",
    pronunciationOverallScore: "Overall",
    pronunciationAccuracy: "Accuracy",
    pronunciationFluency: "Fluency",
    pronunciationCompleteness: "Completeness",
    pronunciationAssessFailed: "Pronunciation scoring failed - check mic permission or try again",
    speechUnsupported: "Speech recognition is not supported in this browser",
    examplesReady: (count) => `${count} book examples imported`,
    examplesLoading: "Reading book examples from the local EPUB...",
    examplesImportFailed: "Could not read book examples. Check the EPUB path",
    examplesOffline: "Offline example mode",
    translateExample: "Translate example",
    translatingExample: "Translating...",
    translationFailed: "Could not translate. Check the LLM config",
    exampleTranslation: "Example translation",
    explainGrammar: "Explain grammar",
    explainingGrammar: "Explaining...",
    grammarExplanation: "Grammar details",
    grammarFailed: "Could not explain grammar. Check the LLM config",
    grammarNodeExplainButton: "Get a detailed explanation",
    grammarNodeExplaining: "Generating a detailed explanation…",
    grammarNodeExplainFailed: "Failed to generate. Check the LLM config and try again",
    grammarNodeDetailedTitle: "Detailed explanation",
    grammarViewMindmap: "Mind map",
    grammarViewWalk: "Read through",
    grammarWalkAutoRead: "Auto-read on page turn",
    grammarWalkPrev: "Previous",
    grammarWalkNext: "Next",
    grammarWalkReadAloud: "Read aloud",
    grammarWalkStopReading: "Stop reading",
    grammarWalkChapterLabel: "Jump to chapter",
    grammarPageEyebrow: "Dutch grammar coach",
    grammarPageTitle: "Dutch grammar mind map",
    grammarPageLead: (count) =>
      `Organized into 4 parts, 16 chapters, and ${count} topics. Click a node on the map to grasp the rule skeleton first, or switch to Read through mode to go through each topic one by one with an AI explanation and read-aloud.`,
    grammarClickableNodes: (count) => `${count} clickable topics`,
    grammarGoalsTitle: "Learning goals",
    grammarPitfallsTitle: "Common mistakes for Chinese-speaking learners",
    grammarChapterMapTitle: "Chapter mind map",
    grammarRelatedNodesTitle: "Related topics",
    grammarPracticeTitle: "Practice direction",
    grammarPracticeText:
      "Find 3 words or example sentences that contain this rule, and ask: what is the form, why is it written this way, and where do Chinese-speaking learners tend to make mistakes.",
    grammarNodeDetailFallback: "This node is an entry point into the chapter's concept structure — explore its child nodes to keep learning.",
    askWord: "Ask AI",
    askingWord: "Answering...",
    wordQuestionPlaceholder: "Ask grammar, usage, collocations, nuance...",
    wordAnswer: "AI answer",
    wordAnswerFailed: "Could not answer. Check the LLM config",
    authSignInTitle: "Sign in",
    authSignInGoogle: "Continue with Google",
    authSignInEmailLabel: "Or get a sign-in link by email",
    authEmailPlaceholder: "you@example.com",
    authSendLink: "Send sign-in link",
    authSending: "Sending…",
    authEmailSent: "Check your email for a sign-in link",
    authEmailError: "Could not send the link. Please try again",
    authSignOut: "Sign out",
    authSignedInAs: (email: string) => `Signed in as ${email}`,
    authPremiumBadge: "Premium",
    authRequiredNotebookTitle: "Sign in to use the notebook",
    authRequiredStudyTitle: "Sign in to use Study mode",
    authRequiredHint: "Once signed in, your notebook and study progress sync automatically across devices.",
    authPremiumRequiredTitle: "This is a premium feature",
    authPremiumRequiredHint:
      "AI-generated examples, grammar explanations, long reading, speaking practice, and the podcast all require premium membership.",
    authModalClose: "Close",
    authLinkExpired: "That sign-in link expired — please request a new one",
    authTabMagicLink: "Email link",
    authTabPassword: "Email & password",
    authFlowLogin: "Log in",
    authFlowRegister: "Register",
    authPasswordPlaceholder: "Password (6+ characters)",
    authPasswordSignIn: "Log in",
    authPasswordSignInSending: "Logging in…",
    authPasswordSignUp: "Register",
    authPasswordSignUpSending: "Registering…",
    authPasswordSignUpSuccess: "Registered! Check your email to confirm before logging in.",
    authPasswordError: "Incorrect email or password",
    authSwitchToRegister: "No account yet? Register",
    authSwitchToLogin: "Already have an account? Log in",
    cardControlsLabel: "Card side controls",
    flipAllCardsTitle: "Flip all visible word cards",
    cardShowMeaning: "Definition → Dutch",
    cardShowDutch: "Dutch → Definition",
    cardBackLabel: "Back",
    grammarMindMapLabel: "Grammar mind map",
    grammarRootLabel: "Dutch Grammar",
    accountLabel: "Account",
    modePricing: "Premium",
    pricingHeroTitle: "Unlock every AI feature",
    pricingHeroSubtitle: "The free plan already includes the full frequency list and notebook; Premium unlocks all AI-generated content.",
    pricingFreeName: "Free",
    pricingFreeDesc: "Great for everyday lookup and review",
    pricingFreeFeatures: [
      "Browse and search the full frequency list",
      "Notebook, synced automatically across devices",
      "Study mode (spaced repetition)",
      "Grammar mind map (short explanations)"
    ],
    pricingPremiumName: "Premium",
    pricingPremiumDesc: "Unlocks all AI-generated content",
    pricingPremiumFeatures: [
      "Everything in Free",
      "AI-generated examples and translations",
      "In-depth AI grammar explanations",
      "Expanded long-form news reading",
      "AI speaking practice"
    ],
    pricingPriceFree: "Free",
    pricingPerMonth: (price: string) => `${price} / month`,
    pricingSubscribeCta: "Subscribe",
    pricingSubscribing: "Redirecting to checkout…",
    pricingCurrentBadge: "Current plan",
    pricingManageCta: "Manage subscription",
    pricingManaging: "Redirecting…",
    pricingSignInCta: "Sign in to subscribe",
    pricingCheckoutError: "Could not open checkout. Please try again",
    pricingCheckoutSuccess: "Subscribed! Welcome to Premium.",
    pricingCheckoutCancelled: "Checkout was cancelled",
    pricingTrialNote: "First subscription includes a 7-day free trial",
    premiumGateTitle: "This is premium content",
    modeProfile: "Profile",
    profileEmailLabel: "Email",
    profileMembershipLabel: "Membership",
    profileStatusFree: "Free",
    profileStatusActive: "Premium (active)",
    profileStatusTrialing: "Premium (trial)",
    profileStatusPastDue: "Premium (payment failed)",
    profileStatusCanceled: "Cancelled",
    profileTrialEnds: (date: string) => `Trial ends ${date}`,
    profileRenews: (date: string) => `Renews on ${date}`,
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
    appName: "Dutch Flow",
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
      footerLeft: "Dutch Flow — gebaseerd op frequentiedata van Frequency Dictionary",
      footerRight: "Hoogfrequente Nederlandse woordenschat"
    },
    statsWords: "Woorden",
    statsUniqueWords: "Uniek",
    statsNotebook: "Woordenlijst",
    statsCurrent: "Huidig",
    searchPlaceholder: "Zoek Nederlands, Engelse betekenis of woordsoort — typ een nummer om te springen",
    jumpToRankPlaceholder: "Ga naar #",
    jumpToRankButton: "Ga",
    viewLabel: "Weergave",
    collapseSidebar: "Zijbalk inklappen",
    expandSidebar: "Zijbalk uitklappen",
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
    readingLongButton: "Genereer een volledige lange tekst",
    readingLongHide: "Lange tekst verbergen",
    readingLongLoading: "Lange tekst wordt gegenereerd...",
    readingLongFailed: "Genereren mislukt. Controleer Gemini en probeer opnieuw",
    readingLongPlay: "Hele tekst voorlezen",
    readingLongStop: "Stop met voorlezen",
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
    podcastSpeed: "Snelheid",
    podcastQuizTitle: "Luistertoets",
    podcastQuizUnavailable: "De luistertoets is voorlopig alleen in het Chinees beschikbaar",
    podcastLoading: "Podcast laden...",
    podcastFailed: "Laden van podcast mislukt. Probeer het later opnieuw.",
    podcastEmpty: "Nog geen podcastafleveringen. Kom later terug.",
    podcastPlay: "Afspelen",
    podcastPause: "Pauzeren",
    podcastPlaying: "Speelt af...",
    podcastShowTranscript: "Transcript tonen",
    podcastHideTranscript: "Transcript verbergen",
    filtersLabel: "Frequentielijsten",
    hideDuplicatesLabel: "Dubbele woorden verbergen",
    playPronunciation: "Uitspraak afspelen",
    autoPlayNotebook: "Chinees, Engels, Nederlands automatisch afspelen",
    stopAutoPlayNotebook: "Afspelen stoppen",
    autoPlayExampleGrammar: "Voorbeeld en Engelse grammatica lezen",
    loopAutoPlay: "Herhalen",
    includeInAutoPlay: "Wordt automatisch afgespeeld. Klik om dit woord over te slaan",
    excludeFromAutoPlay: "Wordt overgeslagen. Klik om dit woord toe te voegen",
    resetAutoPlaySelection: "Alles voorlezen",
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
    studyJumpPlaceholder: "Rangnummer of woord",
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
    pronunciationRecord: "Opnemen & scoren",
    pronunciationStop: "Stop opname",
    pronunciationAssessing: "Beoordelen...",
    pronunciationOverallScore: "Totaal",
    pronunciationAccuracy: "Nauwkeurigheid",
    pronunciationFluency: "Vloeiendheid",
    pronunciationCompleteness: "Volledigheid",
    pronunciationAssessFailed: "Uitspraakbeoordeling mislukt - controleer microfoonrechten of probeer opnieuw",
    speechUnsupported: "Spraakherkenning wordt niet ondersteund in deze browser",
    examplesReady: (count) => `${count} voorbeeldzinnen geïmporteerd`,
    examplesLoading: "Voorbeeldzinnen uit de lokale EPUB lezen...",
    examplesImportFailed: "Voorbeeldzinnen konden niet worden gelezen. Controleer het EPUB-pad",
    examplesOffline: "Offline voorbeeldmodus",
    translateExample: "Zin vertalen",
    translatingExample: "Vertalen...",
    translationFailed: "Vertaling mislukt. Controleer de LLM-configuratie",
    exampleTranslation: "Vertaling van de zin",
    explainGrammar: "Grammatica",
    explainingGrammar: "Uitleg...",
    grammarExplanation: "Grammatica",
    grammarFailed: "Grammatica-uitleg mislukt. Controleer Gemini",
    grammarNodeExplainButton: "Genereer een gedetailleerde uitleg",
    grammarNodeExplaining: "Gedetailleerde uitleg wordt gegenereerd…",
    grammarNodeExplainFailed: "Genereren mislukt. Controleer Gemini en probeer opnieuw",
    grammarNodeDetailedTitle: "Gedetailleerde uitleg",
    grammarViewMindmap: "Mindmap",
    grammarViewWalk: "Doorlezen",
    grammarWalkAutoRead: "Automatisch voorlezen bij pagineren",
    grammarWalkPrev: "Vorige",
    grammarWalkNext: "Volgende",
    grammarWalkReadAloud: "Voorlezen",
    grammarWalkStopReading: "Stop met voorlezen",
    grammarWalkChapterLabel: "Ga naar hoofdstuk",
    grammarPageEyebrow: "Nederlandse grammaticacoach",
    grammarPageTitle: "Mindmap Nederlandse grammatica",
    grammarPageLead: (count) =>
      `Ingedeeld in 4 delen, 16 hoofdstukken en ${count} onderwerpen. Klik op een knooppunt in de kaart om eerst de basisregel te begrijpen, of schakel over naar de leesmodus om elk onderwerp een voor een te doorlopen met een AI-uitleg en voorleesfunctie.`,
    grammarClickableNodes: (count) => `${count} aanklikbare onderwerpen`,
    grammarGoalsTitle: "Leerdoelen",
    grammarPitfallsTitle: "Veelvoorkomende fouten voor Chinese leerders",
    grammarChapterMapTitle: "Mindmap van het hoofdstuk",
    grammarRelatedNodesTitle: "Gerelateerde onderwerpen",
    grammarPracticeTitle: "Oefenrichting",
    grammarPracticeText:
      "Zoek 3 woorden of voorbeeldzinnen met deze regel en vraag je af: wat is de vorm, waarom wordt het zo geschreven, en waar maken Chinese leerders vaak fouten.",
    grammarNodeDetailFallback: "Dit knooppunt is een ingang tot het begrippenkader van het hoofdstuk — verken de subonderwerpen om verder te leren.",
    askWord: "Vraag AI",
    askingWord: "Antwoord...",
    wordQuestionPlaceholder: "Vraag naar grammatica, gebruik, combinaties...",
    wordAnswer: "AI-antwoord",
    wordAnswerFailed: "Antwoord mislukt. Controleer de LLM-configuratie",
    authSignInTitle: "Inloggen",
    authSignInGoogle: "Doorgaan met Google",
    authSignInEmailLabel: "Of ontvang een inloglink per e-mail",
    authEmailPlaceholder: "jij@voorbeeld.com",
    authSendLink: "Inloglink versturen",
    authSending: "Versturen…",
    authEmailSent: "Controleer je e-mail voor een inloglink",
    authEmailError: "Versturen mislukt. Probeer het opnieuw",
    authSignOut: "Uitloggen",
    authSignedInAs: (email: string) => `Ingelogd als ${email}`,
    authPremiumBadge: "Premium",
    authRequiredNotebookTitle: "Log in om het woordenboekje te gebruiken",
    authRequiredStudyTitle: "Log in om Studiemodus te gebruiken",
    authRequiredHint: "Na het inloggen synchroniseren je woordenboekje en studievoortgang automatisch tussen apparaten.",
    authPremiumRequiredTitle: "Dit is een premiumfunctie",
    authPremiumRequiredHint:
      "AI-gegenereerde voorbeeldzinnen, grammatica-uitleg, lange leesteksten, spreekoefeningen en de podcast vereisen allemaal een premium-account.",
    authModalClose: "Sluiten",
    authLinkExpired: "Die inloglink is verlopen — vraag een nieuwe aan",
    authTabMagicLink: "E-maillink",
    authTabPassword: "E-mail & wachtwoord",
    authFlowLogin: "Inloggen",
    authFlowRegister: "Registreren",
    authPasswordPlaceholder: "Wachtwoord (6+ tekens)",
    authPasswordSignIn: "Inloggen",
    authPasswordSignInSending: "Bezig met inloggen…",
    authPasswordSignUp: "Registreren",
    authPasswordSignUpSending: "Bezig met registreren…",
    authPasswordSignUpSuccess: "Geregistreerd! Bevestig via je e-mail voordat je inlogt.",
    authPasswordError: "Onjuiste e-mail of wachtwoord",
    authSwitchToRegister: "Nog geen account? Registreer",
    authSwitchToLogin: "Al een account? Inloggen",
    cardControlsLabel: "Kaartzijde-instellingen",
    flipAllCardsTitle: "Draai alle zichtbare woordkaarten om",
    cardShowMeaning: "Betekenis → Nederlands",
    cardShowDutch: "Nederlands → Betekenis",
    cardBackLabel: "Achterkant",
    grammarMindMapLabel: "Grammatica-mindmap",
    grammarRootLabel: "Nederlandse grammatica",
    accountLabel: "Account",
    modePricing: "Premium",
    pricingHeroTitle: "Ontgrendel alle AI-functies",
    pricingHeroSubtitle: "Het gratis plan bevat al de volledige frequentielijst en het woordenboekje; Premium ontgrendelt alle AI-gegenereerde content.",
    pricingFreeName: "Gratis",
    pricingFreeDesc: "Prima voor dagelijks opzoeken en herhalen",
    pricingFreeFeatures: [
      "Blader en zoek in de volledige frequentielijst",
      "Woordenboekje, automatisch gesynchroniseerd tussen apparaten",
      "Studiemodus (spaced repetition)",
      "Grammatica-mindmap (korte uitleg)"
    ],
    pricingPremiumName: "Premium",
    pricingPremiumDesc: "Ontgrendelt alle AI-gegenereerde content",
    pricingPremiumFeatures: [
      "Alles uit Gratis",
      "AI-gegenereerde voorbeeldzinnen en vertalingen",
      "Diepgaande AI-grammatica-uitleg",
      "Uitgebreide lange leesteksten",
      "AI-spreekoefening"
    ],
    pricingPriceFree: "Gratis",
    pricingPerMonth: (price: string) => `${price} / maand`,
    pricingSubscribeCta: "Abonneren",
    pricingSubscribing: "Doorsturen naar afrekenen…",
    pricingCurrentBadge: "Huidig plan",
    pricingManageCta: "Abonnement beheren",
    pricingManaging: "Doorsturen…",
    pricingSignInCta: "Log in om te abonneren",
    pricingCheckoutError: "Kon niet naar de afrekenpagina. Probeer het opnieuw",
    pricingCheckoutSuccess: "Geabonneerd! Welkom bij Premium.",
    pricingCheckoutCancelled: "Afrekenen geannuleerd",
    pricingTrialNote: "Eerste abonnement inclusief 7 dagen gratis proefperiode",
    premiumGateTitle: "Dit is premium-content",
    modeProfile: "Profiel",
    profileEmailLabel: "E-mail",
    profileMembershipLabel: "Lidmaatschap",
    profileStatusFree: "Gratis",
    profileStatusActive: "Premium (actief)",
    profileStatusTrialing: "Premium (proefperiode)",
    profileStatusPastDue: "Premium (betaling mislukt)",
    profileStatusCanceled: "Opgezegd",
    profileTrialEnds: (date: string) => `Proefperiode eindigt op ${date}`,
    profileRenews: (date: string) => `Verlengt op ${date}`,
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
    appName: "Dutch Flow",
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
      footerLeft: "Dutch Flow — basado en datos de frecuencia de Frequency Dictionary",
      footerRight: "Vocabulario neerlandés de alta frecuencia"
    },
    statsWords: "Palabras",
    statsUniqueWords: "Únicas",
    statsNotebook: "Cuaderno",
    statsCurrent: "Actual",
    searchPlaceholder: "Buscar neerlandés, significado en inglés o categoría; escribe un número para saltar",
    jumpToRankPlaceholder: "Ir al #",
    jumpToRankButton: "Ir",
    viewLabel: "Vista",
    collapseSidebar: "Contraer barra lateral",
    expandSidebar: "Expandir barra lateral",
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
    readingLongButton: "Generar una lectura larga completa",
    readingLongHide: "Ocultar lectura larga",
    readingLongLoading: "Generando la lectura larga...",
    readingLongFailed: "No se pudo generar. Revisa Gemini e inténtalo de nuevo",
    readingLongPlay: "Leer el texto completo en voz alta",
    readingLongStop: "Detener lectura",
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
    podcastSpeed: "Velocidad",
    podcastQuizTitle: "Cuestionario de comprensión",
    podcastQuizUnavailable: "El cuestionario solo está disponible en chino por ahora",
    podcastLoading: "Cargando podcast...",
    podcastFailed: "No se pudieron cargar los episodios. Inténtalo de nuevo más tarde.",
    podcastEmpty: "Todavía no hay episodios. Vuelve más tarde.",
    podcastPlay: "Reproducir",
    podcastPause: "Pausar",
    podcastPlaying: "Reproduciendo...",
    podcastShowTranscript: "Mostrar transcripción",
    podcastHideTranscript: "Ocultar transcripción",
    filtersLabel: "Listas de frecuencia",
    hideDuplicatesLabel: "Ocultar palabras duplicadas",
    playPronunciation: "Reproducir pronunciación",
    autoPlayNotebook: "Reproducir chino, inglés y neerlandés",
    stopAutoPlayNotebook: "Detener reproducción",
    autoPlayExampleGrammar: "Leer ejemplo y gramática en inglés",
    loopAutoPlay: "Reproducir en bucle",
    includeInAutoPlay: "Incluido en la reproducción automática. Haz clic para omitir esta palabra",
    excludeFromAutoPlay: "Omitida en la reproducción automática. Haz clic para incluir esta palabra",
    resetAutoPlaySelection: "Leer todo",
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
    studyJumpPlaceholder: "Número o palabra",
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
    pronunciationRecord: "Grabar y puntuar",
    pronunciationStop: "Detener grabación",
    pronunciationAssessing: "Evaluando...",
    pronunciationOverallScore: "Total",
    pronunciationAccuracy: "Precisión",
    pronunciationFluency: "Fluidez",
    pronunciationCompleteness: "Integridad",
    pronunciationAssessFailed: "Error al evaluar la pronunciación - revisa el permiso del micrófono o inténtalo de nuevo",
    speechUnsupported: "Este navegador no admite reconocimiento de voz",
    examplesReady: (count) => `${count} ejemplos importados`,
    examplesLoading: "Leyendo ejemplos desde el EPUB local...",
    examplesImportFailed: "No se pudieron leer los ejemplos. Revisa la ruta del EPUB",
    examplesOffline: "Modo de ejemplos sin conexión",
    translateExample: "Traducir ejemplo",
    translatingExample: "Traduciendo...",
    translationFailed: "No se pudo traducir. Revisa la configuración del LLM",
    exampleTranslation: "Traducción del ejemplo",
    explainGrammar: "Explicar gramática",
    explainingGrammar: "Explicando...",
    grammarExplanation: "Detalles gramaticales",
    grammarFailed: "No se pudo explicar la gramática. Revisa Gemini",
    grammarNodeExplainButton: "Generar una explicación detallada",
    grammarNodeExplaining: "Generando una explicación detallada…",
    grammarNodeExplainFailed: "No se pudo generar. Revisa Gemini e inténtalo de nuevo",
    grammarNodeDetailedTitle: "Explicación detallada",
    grammarViewMindmap: "Mapa mental",
    grammarViewWalk: "Lectura completa",
    grammarWalkAutoRead: "Leer en voz alta al pasar de página",
    grammarWalkPrev: "Anterior",
    grammarWalkNext: "Siguiente",
    grammarWalkReadAloud: "Leer en voz alta",
    grammarWalkStopReading: "Detener lectura",
    grammarWalkChapterLabel: "Ir al capítulo",
    grammarPageEyebrow: "Entrenador de gramática neerlandesa",
    grammarPageTitle: "Mapa mental de gramática neerlandesa",
    grammarPageLead: (count) =>
      `Organizado en 4 partes, 16 capítulos y ${count} temas. Haz clic en un nodo del mapa para captar primero la estructura de la regla, o cambia al modo de lectura completa para repasar cada tema uno por uno con una explicación de la IA y lectura en voz alta.`,
    grammarClickableNodes: (count) => `${count} temas en los que se puede hacer clic`,
    grammarGoalsTitle: "Objetivos de aprendizaje",
    grammarPitfallsTitle: "Errores comunes para hablantes de chino",
    grammarChapterMapTitle: "Mapa mental del capítulo",
    grammarRelatedNodesTitle: "Temas relacionados",
    grammarPracticeTitle: "Dirección de práctica",
    grammarPracticeText:
      "Busca 3 palabras u oraciones de ejemplo que contengan esta regla y pregúntate: cuál es la forma, por qué se escribe así y dónde suelen equivocarse los hablantes de chino.",
    grammarNodeDetailFallback: "Este nodo es un punto de entrada a la estructura conceptual del capítulo: explora sus subtemas para seguir aprendiendo.",
    askWord: "Preguntar IA",
    askingWord: "Respondiendo...",
    wordQuestionPlaceholder: "Pregunta gramática, uso, matices...",
    wordAnswer: "Respuesta IA",
    wordAnswerFailed: "No se pudo responder. Revisa el LLM",
    authSignInTitle: "Iniciar sesión",
    authSignInGoogle: "Continuar con Google",
    authSignInEmailLabel: "O recibe un enlace de acceso por correo",
    authEmailPlaceholder: "tu@ejemplo.com",
    authSendLink: "Enviar enlace de acceso",
    authSending: "Enviando…",
    authEmailSent: "Revisa tu correo para el enlace de acceso",
    authEmailError: "No se pudo enviar. Inténtalo de nuevo",
    authSignOut: "Cerrar sesión",
    authSignedInAs: (email: string) => `Sesión iniciada como ${email}`,
    authPremiumBadge: "Premium",
    authRequiredNotebookTitle: "Inicia sesión para usar el cuaderno",
    authRequiredStudyTitle: "Inicia sesión para usar el modo de estudio",
    authRequiredHint: "Al iniciar sesión, tu cuaderno y tu progreso se sincronizan automáticamente entre dispositivos.",
    authPremiumRequiredTitle: "Esta es una función premium",
    authPremiumRequiredHint:
      "Los ejemplos generados por IA, las explicaciones de gramática, la lectura larga, la práctica oral y el podcast requieren membresía premium.",
    authModalClose: "Cerrar",
    authLinkExpired: "Ese enlace de acceso caducó — solicita uno nuevo",
    authTabMagicLink: "Enlace por correo",
    authTabPassword: "Correo y contraseña",
    authFlowLogin: "Iniciar sesión",
    authFlowRegister: "Registrarse",
    authPasswordPlaceholder: "Contraseña (6+ caracteres)",
    authPasswordSignIn: "Iniciar sesión",
    authPasswordSignInSending: "Iniciando sesión…",
    authPasswordSignUp: "Registrarse",
    authPasswordSignUpSending: "Registrando…",
    authPasswordSignUpSuccess: "¡Registrado! Confirma tu correo antes de iniciar sesión.",
    authPasswordError: "Correo o contraseña incorrectos",
    authSwitchToRegister: "¿Aún no tienes cuenta? Regístrate",
    authSwitchToLogin: "¿Ya tienes cuenta? Inicia sesión",
    cardControlsLabel: "Ajustes del reverso de la tarjeta",
    flipAllCardsTitle: "Voltear todas las tarjetas visibles",
    cardShowMeaning: "Significado → Neerlandés",
    cardShowDutch: "Neerlandés → Significado",
    cardBackLabel: "Reverso",
    grammarMindMapLabel: "Mapa mental de gramática",
    grammarRootLabel: "Gramática neerlandesa",
    accountLabel: "Cuenta",
    modePricing: "Premium",
    pricingHeroTitle: "Desbloquea todas las funciones de IA",
    pricingHeroSubtitle: "El plan gratuito ya incluye la lista de frecuencia completa y el cuaderno; Premium desbloquea todo el contenido generado por IA.",
    pricingFreeName: "Gratis",
    pricingFreeDesc: "Ideal para consultar y repasar a diario",
    pricingFreeFeatures: [
      "Explora y busca en la lista de frecuencia completa",
      "Cuaderno, sincronizado automáticamente entre dispositivos",
      "Modo de estudio (repetición espaciada)",
      "Mapa mental de gramática (explicaciones breves)"
    ],
    pricingPremiumName: "Premium",
    pricingPremiumDesc: "Desbloquea todo el contenido generado por IA",
    pricingPremiumFeatures: [
      "Todo lo de Gratis",
      "Ejemplos y traducciones generados por IA",
      "Explicaciones gramaticales de IA en profundidad",
      "Lectura larga de noticias ampliada",
      "Práctica oral con IA"
    ],
    pricingPriceFree: "Gratis",
    pricingPerMonth: (price: string) => `${price} / mes`,
    pricingSubscribeCta: "Suscribirse",
    pricingSubscribing: "Redirigiendo al pago…",
    pricingCurrentBadge: "Plan actual",
    pricingManageCta: "Gestionar suscripción",
    pricingManaging: "Redirigiendo…",
    pricingSignInCta: "Inicia sesión para suscribirte",
    pricingCheckoutError: "No se pudo abrir el pago. Inténtalo de nuevo",
    pricingCheckoutSuccess: "¡Suscrito! Bienvenido a Premium.",
    pricingCheckoutCancelled: "Pago cancelado",
    pricingTrialNote: "La primera suscripción incluye una prueba gratuita de 7 días",
    premiumGateTitle: "Esto es contenido premium",
    modeProfile: "Perfil",
    profileEmailLabel: "Correo",
    profileMembershipLabel: "Membresía",
    profileStatusFree: "Gratis",
    profileStatusActive: "Premium (activa)",
    profileStatusTrialing: "Premium (en prueba)",
    profileStatusPastDue: "Premium (pago fallido)",
    profileStatusCanceled: "Cancelada",
    profileTrialEnds: (date: string) => `La prueba termina el ${date}`,
    profileRenews: (date: string) => `Se renueva el ${date}`,
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
    appName: "Dutch Flow",
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
      footerLeft: "Dutch Flow — basierend auf Frequenzdaten von Frequency Dictionary",
      footerRight: "Hochfrequenter niederländischer Wortschatz"
    },
    statsWords: "Wörter",
    statsUniqueWords: "Eindeutig",
    statsNotebook: "Wortliste",
    statsCurrent: "Aktuell",
    searchPlaceholder: "Niederländisch, englische Bedeutung oder Wortart suchen – Zahl eingeben zum Springen",
    jumpToRankPlaceholder: "Springe zu #",
    jumpToRankButton: "Springen",
    viewLabel: "Ansicht",
    collapseSidebar: "Seitenleiste einklappen",
    expandSidebar: "Seitenleiste ausklappen",
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
    readingLongButton: "Vollständigen Langtext erstellen",
    readingLongHide: "Langtext ausblenden",
    readingLongLoading: "Langtext wird erstellt...",
    readingLongFailed: "Erstellung fehlgeschlagen. Prüfe Gemini und versuche es erneut",
    readingLongPlay: "Ganzen Text vorlesen",
    readingLongStop: "Vorlesen stoppen",
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
    podcastSpeed: "Geschwindigkeit",
    podcastQuizTitle: "Verständnisquiz",
    podcastQuizUnavailable: "Das Quiz ist vorerst nur auf Chinesisch verfügbar",
    podcastLoading: "Podcast wird geladen...",
    podcastFailed: "Laden der Podcast-Folgen fehlgeschlagen. Bitte später erneut versuchen.",
    podcastEmpty: "Noch keine Podcast-Folgen. Schau später wieder vorbei.",
    podcastPlay: "Abspielen",
    podcastPause: "Pausieren",
    podcastPlaying: "Wird abgespielt...",
    podcastShowTranscript: "Transkript anzeigen",
    podcastHideTranscript: "Transkript verbergen",
    filtersLabel: "Frequenzlisten",
    hideDuplicatesLabel: "Doppelte Wörter ausblenden",
    playPronunciation: "Aussprache abspielen",
    autoPlayNotebook: "Chinesisch, Englisch, Niederländisch abspielen",
    stopAutoPlayNotebook: "Wiedergabe stoppen",
    autoPlayExampleGrammar: "Beispiel und englische Grammatik vorlesen",
    loopAutoPlay: "Wiederholen",
    includeInAutoPlay: "Wird automatisch abgespielt. Klicken, um dieses Wort zu überspringen",
    excludeFromAutoPlay: "Wird übersprungen. Klicken, um dieses Wort einzuschließen",
    resetAutoPlaySelection: "Alles vorlesen",
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
    studyJumpPlaceholder: "Rangnummer oder Wort",
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
    pronunciationRecord: "Aufnehmen & bewerten",
    pronunciationStop: "Aufnahme stoppen",
    pronunciationAssessing: "Wird bewertet...",
    pronunciationOverallScore: "Gesamt",
    pronunciationAccuracy: "Genauigkeit",
    pronunciationFluency: "Flüssigkeit",
    pronunciationCompleteness: "Vollständigkeit",
    pronunciationAssessFailed: "Aussprachebewertung fehlgeschlagen - Mikrofonzugriff prüfen oder erneut versuchen",
    speechUnsupported: "Dieser Browser unterstützt keine Spracherkennung",
    examplesReady: (count) => `${count} Beispielsätze importiert`,
    examplesLoading: "Beispiele aus der lokalen EPUB werden gelesen...",
    examplesImportFailed: "Beispiele konnten nicht gelesen werden. Prüfe den EPUB-Pfad",
    examplesOffline: "Offline-Beispielmodus",
    translateExample: "Beispiel übersetzen",
    translatingExample: "Wird übersetzt...",
    translationFailed: "Übersetzung fehlgeschlagen. Prüfe die LLM-Konfiguration",
    exampleTranslation: "Beispielübersetzung",
    explainGrammar: "Grammatik erklären",
    explainingGrammar: "Erklärt...",
    grammarExplanation: "Grammatikdetails",
    grammarFailed: "Grammatikerklärung fehlgeschlagen. Prüfe Gemini",
    grammarNodeExplainButton: "Ausführliche Erklärung erstellen",
    grammarNodeExplaining: "Ausführliche Erklärung wird erstellt…",
    grammarNodeExplainFailed: "Erstellung fehlgeschlagen. Prüfe Gemini und versuche es erneut",
    grammarNodeDetailedTitle: "Ausführliche Erklärung",
    grammarViewMindmap: "Mindmap",
    grammarViewWalk: "Durchlesen",
    grammarWalkAutoRead: "Beim Blättern automatisch vorlesen",
    grammarWalkPrev: "Zurück",
    grammarWalkNext: "Weiter",
    grammarWalkReadAloud: "Vorlesen",
    grammarWalkStopReading: "Vorlesen stoppen",
    grammarWalkChapterLabel: "Zu Kapitel springen",
    grammarPageEyebrow: "Niederländisch-Grammatik-Coach",
    grammarPageTitle: "Mindmap der niederländischen Grammatik",
    grammarPageLead: (count) =>
      `Gegliedert in 4 Teile, 16 Kapitel und ${count} Themen. Klicke auf einen Knoten in der Karte, um zunächst das Grundgerüst der Regel zu erfassen, oder wechsle in den Lesemodus, um jedes Thema einzeln mit einer KI-Erklärung und Vorlesefunktion durchzugehen.`,
    grammarClickableNodes: (count) => `${count} anklickbare Themen`,
    grammarGoalsTitle: "Lernziele",
    grammarPitfallsTitle: "Häufige Fehler chinesischsprachiger Lernender",
    grammarChapterMapTitle: "Mindmap des Kapitels",
    grammarRelatedNodesTitle: "Verwandte Themen",
    grammarPracticeTitle: "Übungsrichtung",
    grammarPracticeText:
      "Suche 3 Wörter oder Beispielsätze mit dieser Regel und frage: Wie ist die Form, warum wird es so geschrieben, und wo machen chinesischsprachige Lernende häufig Fehler.",
    grammarNodeDetailFallback: "Dieser Knoten ist ein Einstiegspunkt in die Begriffsstruktur des Kapitels — erkunde seine Unterthemen, um weiterzulernen.",
    askWord: "KI fragen",
    askingWord: "Antwortet...",
    wordQuestionPlaceholder: "Frage zu Grammatik, Gebrauch, Nuancen...",
    wordAnswer: "KI-Antwort",
    wordAnswerFailed: "Antwort fehlgeschlagen. Prüfe die LLM-Konfiguration",
    authSignInTitle: "Anmelden",
    authSignInGoogle: "Weiter mit Google",
    authSignInEmailLabel: "Oder erhalte einen Anmeldelink per E-Mail",
    authEmailPlaceholder: "du@beispiel.com",
    authSendLink: "Anmeldelink senden",
    authSending: "Wird gesendet…",
    authEmailSent: "Prüfe deine E-Mails auf den Anmeldelink",
    authEmailError: "Senden fehlgeschlagen. Bitte erneut versuchen",
    authSignOut: "Abmelden",
    authSignedInAs: (email: string) => `Angemeldet als ${email}`,
    authPremiumBadge: "Premium",
    authRequiredNotebookTitle: "Melde dich an, um das Vokabelheft zu nutzen",
    authRequiredStudyTitle: "Melde dich an, um den Lernmodus zu nutzen",
    authRequiredHint: "Nach der Anmeldung werden dein Vokabelheft und dein Lernfortschritt automatisch geräteübergreifend synchronisiert.",
    authPremiumRequiredTitle: "Dies ist eine Premium-Funktion",
    authPremiumRequiredHint:
      "KI-generierte Beispiele, Grammatikerklärungen, Langlesetexte, Sprechübungen und der Podcast erfordern alle eine Premium-Mitgliedschaft.",
    authModalClose: "Schließen",
    authLinkExpired: "Der Anmeldelink ist abgelaufen — bitte fordere einen neuen an",
    authTabMagicLink: "E-Mail-Link",
    authTabPassword: "E-Mail & Passwort",
    authFlowLogin: "Anmelden",
    authFlowRegister: "Registrieren",
    authPasswordPlaceholder: "Passwort (mind. 6 Zeichen)",
    authPasswordSignIn: "Anmelden",
    authPasswordSignInSending: "Anmeldung läuft…",
    authPasswordSignUp: "Registrieren",
    authPasswordSignUpSending: "Registrierung läuft…",
    authPasswordSignUpSuccess: "Registriert! Bestätige deine E-Mail, bevor du dich anmeldest.",
    authPasswordError: "E-Mail oder Passwort falsch",
    authSwitchToRegister: "Noch kein Konto? Registrieren",
    authSwitchToLogin: "Schon ein Konto? Anmelden",
    cardControlsLabel: "Kartenrückseiten-Einstellungen",
    flipAllCardsTitle: "Alle sichtbaren Wortkarten umdrehen",
    cardShowMeaning: "Bedeutung → Niederländisch",
    cardShowDutch: "Niederländisch → Bedeutung",
    cardBackLabel: "Rückseite",
    grammarMindMapLabel: "Grammatik-Mindmap",
    grammarRootLabel: "Niederländische Grammatik",
    accountLabel: "Konto",
    modePricing: "Premium",
    pricingHeroTitle: "Alle KI-Funktionen freischalten",
    pricingHeroSubtitle: "Der kostenlose Plan enthält bereits die vollständige Frequenzliste und das Vokabelheft; Premium schaltet alle KI-generierten Inhalte frei.",
    pricingFreeName: "Kostenlos",
    pricingFreeDesc: "Ideal zum täglichen Nachschlagen und Wiederholen",
    pricingFreeFeatures: [
      "Vollständige Frequenzliste durchsuchen",
      "Vokabelheft, automatisch geräteübergreifend synchronisiert",
      "Lernmodus (Spaced Repetition)",
      "Grammatik-Mindmap (kurze Erklärungen)"
    ],
    pricingPremiumName: "Premium",
    pricingPremiumDesc: "Schaltet alle KI-generierten Inhalte frei",
    pricingPremiumFeatures: [
      "Alles aus Kostenlos",
      "KI-generierte Beispielsätze und Übersetzungen",
      "Ausführliche KI-Grammatikerklärungen",
      "Erweiterte Langlesetexte",
      "KI-Sprechübung"
    ],
    pricingPriceFree: "Kostenlos",
    pricingPerMonth: (price: string) => `${price} / Monat`,
    pricingSubscribeCta: "Abonnieren",
    pricingSubscribing: "Weiterleitung zur Kasse…",
    pricingCurrentBadge: "Aktueller Plan",
    pricingManageCta: "Abo verwalten",
    pricingManaging: "Weiterleitung…",
    pricingSignInCta: "Zum Abonnieren anmelden",
    pricingCheckoutError: "Kasse konnte nicht geöffnet werden. Bitte erneut versuchen",
    pricingCheckoutSuccess: "Abonniert! Willkommen bei Premium.",
    pricingCheckoutCancelled: "Kasse abgebrochen",
    pricingTrialNote: "Das erste Abo enthält 7 Tage kostenlose Testphase",
    premiumGateTitle: "Das ist Premium-Inhalt",
    modeProfile: "Profil",
    profileEmailLabel: "E-Mail",
    profileMembershipLabel: "Mitgliedschaft",
    profileStatusFree: "Kostenlos",
    profileStatusActive: "Premium (aktiv)",
    profileStatusTrialing: "Premium (Testphase)",
    profileStatusPastDue: "Premium (Zahlung fehlgeschlagen)",
    profileStatusCanceled: "Gekündigt",
    profileTrialEnds: (date: string) => `Testphase endet am ${date}`,
    profileRenews: (date: string) => `Verlängert sich am ${date}`,
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
    frequencyEyebrow: string;
    frequencyTitle: string;
    frequencyLead: string;
    frequencyLists: Array<{ name: string; body: string }>;
    frequencyRuleTitle: string;
    frequencyRuleBody: string;
    entryTitle: string;
    entryLead: string;
    entryNotes: string[];
    frequencySourceBody: string;
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
    sourceLink: "PLOS ONE 复现实验",
    frequencyEyebrow: "词表是怎么来的",
    frequencyTitle: "六个频率列表：核心、小说、新闻、口语、网络、通用",
    frequencyLead:
      "这个 app 的 5000 个高频词并非随意挑选，而是来自一部基于 2.9 亿词荷兰语语料库编制的频率词典。语料库涵盖小说、新闻、口语、网络四种体裁，每个词的“频率”按它出现在多少比例的 2000 词样本片段中计算，而不是简单计数——避免个别文本反复出现某个词造成的偏差。",
    frequencyLists: [
      { name: "核心", body: "在小说、新闻、口语、网络四种体裁中都高频出现的词，共 943 个；核心词一旦入选就不再出现在其它列表里。" },
      { name: "小说", body: "以小说体裁内部频率排序的高频词，来自约 900 本荷兰语/佛兰芒语小说（1970-2009 年出版）。" },
      { name: "新闻", body: "来自 SoNaR 语料库中 1993-2005 年荷兰、比利时报纸文本的高频词，是四个体裁语料中占比最大的一部分。" },
      { name: "口语", body: "来自 CGN 荷兰语口语语料库，约 900 小时、900 万词的真实对话、访谈、讲座等口语材料。" },
      { name: "网络", body: "同样来自 SoNaR 语料库，涵盖博客、论坛、电子杂志、新闻通讯和维基百科条目。" },
      { name: "通用", body: "不属于核心，也不只属于某一个或两个体裁列表，但在至少三种体裁中都高频出现的词，共 2004 个。" }
    ],
    frequencyRuleTitle: "一个词同时在多个列表里怎么办",
    frequencyRuleBody:
      "如果某个词在某一体裁中的频率至少是次高体裁的两倍，只归入那一个体裁列表；如果最高的两个体裁频率都明显高于另外两个（同样是两倍关系），就同时归入这两个列表；除此之外，归入通用列表。列表内部按频率排序：体裁列表按该体裁内部频率排序，核心和通用列表按四个体裁的总体频率排序。",
    entryTitle: "词条是怎么写的",
    entryLead:
      "每个词条包含：排名、荷兰语词形、词性、英文释义、一个例句，以及该词的总体频率（每 100 篇文档中的占比）。例句先由语料库工具自动挑出候选句，再人工选出最自然、最适合学习者的一句，必要时做简化。",
    entryNotes: [
      "动词只收录原形（不定式），各种变位、过去式、过去分词都归并到同一词条下。",
      "名词会标出词性：de（通性）或 het（中性）；能进一步区分阳性/阴性时标为 de(m)/de(f)。",
      "形容词按原形收录（比如 mooie、mooier、mooist 都归入 mooi），一些形容词也能直接当副词用。",
      "如果一个词形有两个都很常见的意思，会配两个例句分别说明——频率统计的是词形本身，不是具体某个意思。"
    ],
    frequencySourceBody: "参考来源：《A Frequency Dictionary of Dutch》。"
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
    sourceLink: "PLOS ONE replication",
    frequencyEyebrow: "Where the word lists come from",
    frequencyTitle: "Six frequency lists: Core, Fiction, Newspapers, Spoken, Web, General",
    frequencyLead:
      "The app's 5,000 high-frequency words aren't picked at random - they come from a published frequency dictionary built on a 290-million-word Dutch corpus spanning four genres: fiction, newspapers, spoken language, and the web. Each word's 'frequency' is measured as the percentage of 2,000-word samples it appears in, not a raw count - this avoids one word getting an inflated score just because it happens to occur a lot in one particular text.",
    frequencyLists: [
      { name: "Core", body: "Words that occur with high frequency across all four genres - 943 words in total. Once a word qualifies as Core, it isn't listed anywhere else." },
      { name: "Fiction", body: "High-frequency words ranked within the fiction genre, drawn from roughly 900 Dutch and Flemish novels published between 1970 and 2009." },
      { name: "Newspapers", body: "High-frequency words from the SoNaR corpus's Dutch and Belgian newspaper text (1993-2005) - the largest single source in the underlying corpus." },
      { name: "Spoken", body: "From the Spoken Dutch Corpus (CGN): about 900 hours and 9 million words of real conversations, interviews, and lectures." },
      { name: "Web", body: "Also from SoNaR: blogs, discussion forums, e-magazines, newsletters, and Wikipedia entries." },
      { name: "General", body: "Words that aren't Core and don't clearly belong to just one or two genres, but still occur with high frequency in at least three of the four genres - 2,004 words." }
    ],
    frequencyRuleTitle: "How overlapping words are assigned",
    frequencyRuleBody:
      "If a word's frequency in one genre is at least double its next-highest genre, it goes in that genre list alone. If its top two genre frequencies are both more than double the other two, it goes in both of those genre lists. Otherwise it falls into General. Within each list, genre lists are ordered by frequency inside that genre, while Core and General are ordered by overall frequency across all four genres.",
    entryTitle: "How each entry was written",
    entryLead:
      "Each entry gives the rank, the Dutch headword, its part of speech, an English meaning, one example sentence, and its overall frequency (occurrences per 100 documents). Example sentences were first shortlisted automatically from the corpus, then picked and simplified by hand for learners.",
    entryNotes: [
      "Verbs are listed only in their infinitive form - all conjugated, past-tense, and participle forms are merged into that one entry.",
      "Nouns are marked de (common gender) or het (neuter); where the historical masculine/feminine distinction still holds, it's shown as de(m) or de(f).",
      "Adjectives are listed in their base form (mooie, mooier, and mooist all fall under mooi), and some adjectives can also function as adverbs.",
      "If one word form has two genuinely common meanings, it gets two example sentences - frequency is counted by word form, not by meaning."
    ],
    frequencySourceBody: "Source: A Frequency Dictionary of Dutch."
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
    sourceLink: "PLOS ONE-replicatie",
    frequencyEyebrow: "Waar de woordenlijsten vandaan komen",
    frequencyTitle: "Zes frequentielijsten: Kern, Fictie, Kranten, Gesproken, Web, Algemeen",
    frequencyLead:
      "De 5000 hoogfrequente woorden in deze app zijn niet willekeurig gekozen - ze komen uit een gepubliceerd frequentiewoordenboek, gebaseerd op een corpus van 290 miljoen woorden Nederlands, verdeeld over vier genres: fictie, kranten, gesproken taal en het web. De 'frequentie' van elk woord wordt gemeten als het percentage tekstfragmenten van 2000 woorden waarin het voorkomt, niet als een simpel aantal - zo wordt voorkomen dat één woord een te hoge score krijgt omdat het toevallig vaak in één tekst voorkomt.",
    frequencyLists: [
      { name: "Kern", body: "Woorden die in alle vier de genres met hoge frequentie voorkomen - in totaal 943 woorden. Eenmaal ingedeeld bij Kern, komt een woord nergens anders meer voor." },
      { name: "Fictie", body: "Hoogfrequente woorden gerangschikt binnen het genre fictie, afkomstig uit ongeveer 900 Nederlandse en Vlaamse romans, gepubliceerd tussen 1970 en 2009." },
      { name: "Kranten", body: "Hoogfrequente woorden uit Nederlandse en Belgische krantenteksten (1993-2005) uit het SoNaR-corpus - de grootste bron binnen het onderliggende corpus." },
      { name: "Gesproken", body: "Uit het Corpus Gesproken Nederlands (CGN): ongeveer 900 uur en 9 miljoen woorden aan echte gesprekken, interviews en lezingen." },
      { name: "Web", body: "Ook uit SoNaR: blogs, discussieforums, e-magazines, nieuwsbrieven en Wikipedia-artikelen." },
      { name: "Algemeen", body: "Woorden die niet bij Kern horen en niet duidelijk bij één of twee genres, maar wel in minstens drie van de vier genres met hoge frequentie voorkomen - 2004 woorden." }
    ],
    frequencyRuleTitle: "Wat er gebeurt als een woord in meerdere lijsten past",
    frequencyRuleBody:
      "Als de frequentie van een woord in één genre minstens twee keer zo hoog is als in het op één na hoogste genre, komt het alleen in die genrelijst. Zijn de twee hoogste genrefrequenties beide meer dan twee keer zo hoog als de andere twee, dan komt het woord in beide genrelijsten. In alle andere gevallen komt het in Algemeen terecht. Binnen elke lijst worden genrelijsten gerangschikt op frequentie binnen dat genre, terwijl Kern en Algemeen gerangschikt worden op de totale frequentie over alle vier de genres.",
    entryTitle: "Hoe elk lemma is opgebouwd",
    entryLead:
      "Elk lemma bevat: de rangorde, het Nederlandse woord, de woordsoort, een Engelse betekenis, een voorbeeldzin en de totale frequentie (voorkomens per 100 documenten). Voorbeeldzinnen werden eerst automatisch uit het corpus voorgeselecteerd en daarna met de hand gekozen en zo nodig vereenvoudigd voor taalleerders.",
    entryNotes: [
      "Werkwoorden staan alleen in de infinitief; alle vervoegde vormen, verleden tijden en deelwoorden vallen onder dat ene lemma.",
      "Zelfstandige naamwoorden krijgen de (gewoon geslacht) of het (onzijdig); waar het historische onderscheid mannelijk/vrouwelijk nog bestaat, staat dit als de(m) of de(f).",
      "Bijvoeglijke naamwoorden staan in hun grondvorm (mooie, mooier en mooist vallen allemaal onder mooi); sommige kunnen ook als bijwoord gebruikt worden.",
      "Heeft een woordvorm twee even gangbare betekenissen, dan krijgt het twee voorbeeldzinnen - de frequentie wordt geteld per woordvorm, niet per betekenis."
    ],
    frequencySourceBody: "Bron: A Frequency Dictionary of Dutch."
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
    sourceLink: "Réplica en PLOS ONE",
    frequencyEyebrow: "De dónde vienen las listas de palabras",
    frequencyTitle: "Seis listas de frecuencia: Básico, Ficción, Periódicos, Hablado, Web, General",
    frequencyLead:
      "Las 5000 palabras de alta frecuencia de esta app no se eligieron al azar: provienen de un diccionario de frecuencia publicado, basado en un corpus de 290 millones de palabras en neerlandés repartido en cuatro géneros: ficción, periódicos, lengua hablada y web. La 'frecuencia' de cada palabra se mide como el porcentaje de fragmentos de 2000 palabras en los que aparece, no como un simple recuento, para evitar que una palabra reciba una puntuación inflada solo por aparecer mucho en un único texto.",
    frequencyLists: [
      { name: "Básico", body: "Palabras que aparecen con alta frecuencia en los cuatro géneros a la vez: 943 palabras en total. Una vez clasificada como Básica, una palabra no aparece en ninguna otra lista." },
      { name: "Ficción", body: "Palabras de alta frecuencia ordenadas dentro del género ficción, procedentes de unas 900 novelas neerlandesas y flamencas publicadas entre 1970 y 2009." },
      { name: "Periódicos", body: "Palabras de alta frecuencia de textos periodísticos neerlandeses y belgas (1993-2005) del corpus SoNaR, la fuente más grande del corpus general." },
      { name: "Hablado", body: "Del Corpus de Neerlandés Hablado (CGN): unas 900 horas y 9 millones de palabras de conversaciones reales, entrevistas y conferencias." },
      { name: "Web", body: "También del corpus SoNaR: blogs, foros de discusión, revistas electrónicas, boletines y artículos de Wikipedia." },
      { name: "General", body: "Palabras que no son Básicas ni pertenecen claramente a uno o dos géneros, pero que aún así aparecen con alta frecuencia en al menos tres de los cuatro géneros: 2004 palabras." }
    ],
    frequencyRuleTitle: "Qué pasa cuando una palabra encaja en varias listas",
    frequencyRuleBody:
      "Si la frecuencia de una palabra en un género es al menos el doble que en el siguiente género más frecuente, se incluye solo en la lista de ese género. Si las dos frecuencias de género más altas son ambas más del doble que las otras dos, la palabra se incluye en ambas listas de género. En cualquier otro caso, va a la lista General. Dentro de cada lista, las listas de género se ordenan por frecuencia dentro de ese género, mientras que Básico y General se ordenan por la frecuencia global en los cuatro géneros.",
    entryTitle: "Cómo se redactó cada entrada",
    entryLead:
      "Cada entrada incluye: el puesto en el ranking, la palabra en neerlandés, su categoría gramatical, un significado en inglés, una oración de ejemplo y su frecuencia global (apariciones por cada 100 documentos). Las oraciones de ejemplo se preseleccionaron automáticamente del corpus y luego se eligieron y simplificaron a mano para los estudiantes.",
    entryNotes: [
      "Los verbos solo aparecen en infinitivo; todas las formas conjugadas, los pasados y los participios se agrupan bajo esa misma entrada.",
      "Los sustantivos se marcan con de (género común) o het (neutro); cuando aún se distingue el género histórico masculino/femenino, se indica como de(m) o de(f).",
      "Los adjetivos aparecen en su forma base (mooie, mooier y mooist se agrupan bajo mooi), y algunos también pueden usarse como adverbios.",
      "Si una misma forma de palabra tiene dos significados igual de comunes, se incluyen dos oraciones de ejemplo: la frecuencia se cuenta por forma, no por significado."
    ],
    frequencySourceBody: "Fuente: A Frequency Dictionary of Dutch."
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
    sourceLink: "PLOS ONE-Replikation",
    frequencyEyebrow: "Woher die Wortlisten kommen",
    frequencyTitle: "Sechs Häufigkeitslisten: Kern, Fiktion, Zeitungen, Gesprochen, Web, Allgemein",
    frequencyLead:
      "Die 5000 hochfrequenten Wörter dieser App wurden nicht willkürlich ausgewählt - sie stammen aus einem veröffentlichten Häufigkeitswörterbuch, das auf einem Korpus von 290 Millionen niederländischen Wörtern aus vier Genres basiert: Fiktion, Zeitungen, gesprochene Sprache und Web. Die 'Häufigkeit' jedes Wortes wird als Prozentsatz der 2000-Wörter-Textproben gemessen, in denen es vorkommt, nicht als reine Zählung - so wird verhindert, dass ein Wort nur deshalb einen zu hohen Wert bekommt, weil es zufällig in einem einzigen Text sehr oft vorkommt.",
    frequencyLists: [
      { name: "Kern", body: "Wörter, die in allen vier Genres mit hoher Häufigkeit vorkommen - insgesamt 943 Wörter. Sobald ein Wort als Kern eingestuft ist, taucht es in keiner anderen Liste mehr auf." },
      { name: "Fiktion", body: "Hochfrequente Wörter, sortiert nach ihrer Häufigkeit innerhalb des Genres Fiktion, aus rund 900 niederländischen und flämischen Romanen, veröffentlicht zwischen 1970 und 2009." },
      { name: "Zeitungen", body: "Hochfrequente Wörter aus niederländischen und belgischen Zeitungstexten (1993-2005) im SoNaR-Korpus - die größte einzelne Quelle im Gesamtkorpus." },
      { name: "Gesprochen", body: "Aus dem Corpus Gesproken Nederlands (CGN): etwa 900 Stunden und 9 Millionen Wörter echter Gespräche, Interviews und Vorträge." },
      { name: "Web", body: "Ebenfalls aus SoNaR: Blogs, Diskussionsforen, E-Magazine, Newsletter und Wikipedia-Einträge." },
      { name: "Allgemein", body: "Wörter, die nicht zum Kern gehören und nicht eindeutig einem oder zwei Genres zuzuordnen sind, aber dennoch in mindestens drei der vier Genres mit hoher Häufigkeit vorkommen - 2004 Wörter." }
    ],
    frequencyRuleTitle: "Was passiert, wenn ein Wort in mehrere Listen passt",
    frequencyRuleBody:
      "Ist die Häufigkeit eines Wortes in einem Genre mindestens doppelt so hoch wie im nächsthäufigsten Genre, wird es nur in diese eine Genreliste aufgenommen. Sind die beiden höchsten Genre-Häufigkeiten jeweils mehr als doppelt so hoch wie die anderen beiden, kommt das Wort in beide Genrelisten. Andernfalls landet es in Allgemein. Innerhalb jeder Liste werden Genrelisten nach der Häufigkeit innerhalb dieses Genres sortiert, während Kern und Allgemein nach der Gesamthäufigkeit über alle vier Genres sortiert werden.",
    entryTitle: "Wie jeder Eintrag aufgebaut ist",
    entryLead:
      "Jeder Eintrag enthält: den Rangplatz, das niederländische Wort, die Wortart, eine englische Bedeutung, einen Beispielsatz und die Gesamthäufigkeit (Vorkommen pro 100 Dokumente). Beispielsätze wurden zunächst automatisch aus dem Korpus vorausgewählt und dann von Hand ausgesucht und bei Bedarf für Lernende vereinfacht.",
    entryNotes: [
      "Verben werden nur im Infinitiv aufgeführt; alle konjugierten Formen, Präteritum- und Partizipformen werden unter diesem einen Eintrag zusammengefasst.",
      "Nomen werden mit de (Genus commune) oder het (sächlich) markiert; wo die historische Unterscheidung männlich/weiblich noch besteht, steht de(m) oder de(f).",
      "Adjektive stehen in ihrer Grundform (mooie, mooier und mooist fallen alle unter mooi), manche können auch als Adverb verwendet werden.",
      "Hat eine Wortform zwei ähnlich gebräuchliche Bedeutungen, gibt es zwei Beispielsätze - die Häufigkeit wird nach Wortform gezählt, nicht nach Bedeutung."
    ],
    frequencySourceBody: "Quelle: A Frequency Dictionary of Dutch."
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
  // Chrome/Edge (Windows SAPI voices especially) can silently cut an
  // utterance short if speak() fires in the same tick as cancel() - the
  // previous utterance's teardown hasn't finished. A short delay lets it
  // settle before the new one starts.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
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

function notebookSpeechItems(wordsToPlay: DutchWord[]): SpeechItem[] {
  return wordsToPlay.flatMap((word) => {
    const raw: { text: string | undefined; language: SpeechLanguage }[] = [
      { text: word.translationZh, language: "zh-CN" },
      { text: word.translation, language: "en-US" },
      { text: cleanWord(word.word), language: "nl-NL" }
    ];
    return raw
      .filter((item): item is { text: string; language: SpeechLanguage } => Boolean(item.text?.trim()))
      .map((item) => ({ text: item.text, language: item.language }));
  });
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

function speechLanguageForUiLanguage(language: UiLanguage): SpeechLanguage {
  switch (language) {
    case "zh":
      return "zh-CN";
    case "nl":
      return "nl-NL";
    case "es":
      return "es-ES";
    case "de":
      return "de-DE";
    default:
      return "en-US";
  }
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

function getSavedWordMeaningTranslations() {
  try {
    const value = JSON.parse(localStorage.getItem(wordMeaningTranslationsStorageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function getSavedCardMeaningLanguage(): CardMeaningLanguage {
  const value = localStorage.getItem(cardMeaningLanguageStorageKey);
  return value === "en" || value === "zh" || value === "es" || value === "de" ? value : "en";
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

function getSavedSyncUpdatedAt() {
  return Number(localStorage.getItem(syncUpdatedAtStorageKey) ?? "0");
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

type PronunciationAssessment = {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronScore: number;
  words: { word: string; accuracyScore: number; errorType: string }[];
};

type RecordingController = { stop: () => void; result: Promise<Blob> };

function startWavRecording(stream: MediaStream, maxMs = 10000): RecordingController {
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const result = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
  });
  recorder.start();
  const timeout = window.setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, maxMs);
  return {
    stop: () => {
      window.clearTimeout(timeout);
      if (recorder.state !== "inactive") recorder.stop();
    },
    result
  };
}

function pcmToWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, text: string) {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function encodeTo16kMonoWav(recordedBlob: Blob): Promise<Blob> {
  const arrayBuffer = await recordedBlob.arrayBuffer();
  const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const decoded = await audioContext.decodeAudioData(arrayBuffer);

  const targetSampleRate = 16000;
  const offlineContext = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetSampleRate), targetSampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineContext.destination);
  source.start();
  const rendered = await offlineContext.startRendering();

  return pcmToWavBlob(rendered.getChannelData(0), targetSampleRate);
}

function pronunciationScoreTone(score: number) {
  if (score >= 80) return "good";
  if (score >= 60) return "fair";
  return "poor";
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
  onAssessPronunciation,
  assessing,
  assessment,
  assessmentMessage,
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
  onAssessPronunciation: (sentenceKey: string, sentence: string, wavBlob: Blob) => void;
  assessing: boolean;
  assessment?: PronunciationAssessment;
  assessmentMessage?: string;
  t: (typeof translations)[UiLanguage];
}) {
  const [targetLanguage, setTargetLanguage] = useState<ExampleTranslationLanguage>(defaultExampleTranslationLanguage);
  const [recording, setRecording] = useState(false);
  const recordingControllerRef = useRef<RecordingController | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function toggleRecording() {
    if (recording) {
      recordingControllerRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      onAssessPronunciation(sentenceKey, sentence, new Blob());
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!stream) return;

    streamRef.current = stream;
    const controller = startWavRecording(stream);
    recordingControllerRef.current = controller;
    setRecording(true);

    const recordedBlob = await controller.result;
    stream.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recordingControllerRef.current = null;
    setRecording(false);

    if (recordedBlob.size > 0) {
      const wavBlob = await encodeTo16kMonoWav(recordedBlob);
      onAssessPronunciation(sentenceKey, sentence, wavBlob);
    }
  }

  return (
    <div className="repeat-box">
      <div className="repeat-head">
        <span>{t.exampleSentence}</span>
        <button className="mini-button" type="button" onClick={() => speakText(sentence)}>
          <Volume2 size={15} />
          <span>{t.playSentence}</span>
        </button>
        <button className={`mini-button ${recording ? "recording" : ""}`} type="button" onClick={() => void toggleRecording()}>
          <Mic size={15} />
          <span>{recording ? t.pronunciationStop : t.pronunciationRecord}</span>
        </button>
      </div>
      <InteractiveSentence sentence={sentence} t={t} />
      {assessing ? <p className="recognized muted">{t.pronunciationAssessing}</p> : null}
      {assessment ? (
        <div className="pronunciation-score">
          <strong>
            {t.pronunciationOverallScore}: {Math.round(assessment.pronScore)}
          </strong>
          <span className="pronunciation-subscores">
            {t.pronunciationAccuracy} {Math.round(assessment.accuracyScore)} · {t.pronunciationFluency}{" "}
            {Math.round(assessment.fluencyScore)} · {t.pronunciationCompleteness} {Math.round(assessment.completenessScore)}
          </span>
          <div className="pronunciation-words">
            {assessment.words.map((word, index) => (
              <span key={`${word.word}-${index}`} className={`pronunciation-word ${pronunciationScoreTone(word.accuracyScore)}`}>
                {word.word}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {assessmentMessage ? <p className="recognized muted">{assessmentMessage}</p> : null}
      <div className="translation-tools">
        <select
          value={targetLanguage}
          onChange={(event) => {
            const nextLanguage = event.target.value as ExampleTranslationLanguage;
            setTargetLanguage(nextLanguage);
            if (!savedTranslations[nextLanguage]) {
              onTranslate(sentenceKey, sentence, nextLanguage);
            }
          }}
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
          onClick={() => onExplainGrammar(sentenceKey, sentence)}
          disabled={explainingGrammar}
        >
          <BookOpen size={15} />
          <span>{explainingGrammar ? t.explainingGrammar : t.explainGrammar}</span>
        </button>
      </div>
      {savedTranslations[targetLanguage] || translating === targetLanguage ? (
        <p className="example-translation english-translation">
          <strong>{t.exampleTranslation}:</strong>{" "}
          {savedTranslations[targetLanguage] ?? (translating === targetLanguage ? t.translatingExample : "")}
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

function InteractiveSentence({
  sentence,
  t,
  className
}: {
  sentence: string;
  t: (typeof translations)[UiLanguage];
  className?: string;
}) {
  return (
    <p className={`example-sentence interactive-sentence ${className ?? ""}`.trim()}>
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
  sentence,
  exampleTranslations,
  grammarExplanation,
  translatingExample,
  explainingGrammar,
  translationMessage,
  onTranslateExample,
  onExplainGrammar,
  onAssessPronunciation,
  assessingPronunciation,
  pronunciationAssessment,
  assessmentMessage,
  wordAnswers,
  askingWord,
  wordAnswerMessage,
  onAskWord,
  flipped,
  cardMeaningLanguage,
  meaning,
  onToggleFlip,
  highlighted,
  t
}: {
  item: DutchWord;
  saved: boolean;
  onToggle: (id: string) => void;
  autoPlayMuted: boolean;
  onToggleAutoPlayMuted: (id: string) => void;
  sentence: string;
  exampleTranslations: Partial<Record<ExampleTranslationLanguage, string>>;
  grammarExplanation?: string;
  translatingExample: ExampleTranslationLanguage | "";
  explainingGrammar: boolean;
  translationMessage?: string;
  onTranslateExample: (sentenceKey: string, sentence: string, targetLanguage: ExampleTranslationLanguage) => void;
  onExplainGrammar: (sentenceKey: string, sentence: string) => void;
  onAssessPronunciation: (sentenceKey: string, sentence: string, wavBlob: Blob) => void;
  assessingPronunciation: boolean;
  pronunciationAssessment?: PronunciationAssessment;
  assessmentMessage?: string;
  wordAnswers: WordAnswerTurn[];
  askingWord: boolean;
  wordAnswerMessage?: string;
  onAskWord: (word: DutchWord, sentence: string, question: string) => void;
  flipped: boolean;
  cardMeaningLanguage: CardMeaningLanguage;
  meaning: string;
  onToggleFlip: (id: string) => void;
  highlighted: boolean;
  t: (typeof translations)[UiLanguage];
}) {
  const primaryText = flipped ? meaning : item.word;
  const secondaryText = flipped ? item.word : meaning;
  const primaryLabel = flipped ? languageNames[cardMeaningLanguage] : "Nederlands";
  const secondaryLabel = flipped ? "Nederlands" : languageNames[cardMeaningLanguage];
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
            {listsFor(item).map((listName) => (
              <span key={listName} className={`pill ${listTone[listName] ?? "tone-general"}`}>
                {t.list[listName] ?? listName}
              </span>
            ))}
            <span className="pill neutral">{t.pos[item.partOfSpeech] ?? item.partOfSpeech}</span>
          </div>
          <span className="card-side-label">{primaryLabel}</span>
          <h2>{primaryText}</h2>
          {!flipped && ipaFor(item) ? <span className="ipa-transcription">{ipaFor(item)}</span> : null}
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
            onAssessPronunciation={onAssessPronunciation}
            assessing={assessingPronunciation}
            assessment={pronunciationAssessment}
            assessmentMessage={assessmentMessage}
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

function GrammarGuidePage({
  t,
  language,
  premiumGate
}: {
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  premiumGate: PremiumGate;
}) {
  const [view, setView] = useState<"mindmap" | "walk">("mindmap");
  const [selectedChapterId, setSelectedChapterId] = useState(grammarGuideChapters[0]?.id ?? "");
  const selectedChapter = grammarGuideChapters.find((chapter) => chapter.id === selectedChapterId) ?? grammarGuideChapters[0];

  const [nodeExplanations, setNodeExplanations] = useState<Record<string, string>>({});
  const [explainingNodeKey, setExplainingNodeKey] = useState("");
  const [nodeExplainErrors, setNodeExplainErrors] = useState<Record<string, string>>({});

  async function handleExplainGrammarNode(entry: GrammarNodeEntry) {
    const key = `${entry.node.id}:${language}`;
    if (nodeExplanations[key] || explainingNodeKey === key) return;
    if (!apiAvailable) {
      setNodeExplainErrors((current) => ({ ...current, [key]: t.grammarNodeExplainFailed }));
      return;
    }
    if (!premiumGate.isPremium) {
      premiumGate.requestPremium();
      return;
    }

    setExplainingNodeKey(key);
    setNodeExplainErrors((current) => ({ ...current, [key]: "" }));

    try {
      const response = await fetch(apiUrl("/api/explain-grammar-node"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...premiumGate.authHeaders()
        },
        body: JSON.stringify({
          nodeTitle: loc(entry.node.title, language),
          path: entry.path.map((n) => loc(n.title, language)).join(" / "),
          hint: entry.node.detail ? loc(entry.node.detail, language) : "",
          targetLanguage: language
        })
      });

      if (!response.ok) {
        throw new Error("Failed to explain grammar node");
      }

      const data = (await response.json()) as { explanation?: string };
      const explanation = data.explanation?.trim();
      if (!explanation) {
        throw new Error("Empty explanation");
      }

      const formatted = explanation.replace(/\s*(\d\.\s)/g, "\n$1").trim();
      setNodeExplanations((current) => ({ ...current, [key]: formatted }));
    } catch {
      setNodeExplainErrors((current) => ({ ...current, [key]: t.grammarNodeExplainFailed }));
    } finally {
      setExplainingNodeKey("");
    }
  }

  return (
    <section className="grammar-page">
      <div className="grammar-hero">
        <div>
          <span className="method-eyebrow">{t.grammarPageEyebrow}</span>
          <h2>{t.grammarPageTitle}</h2>
          <p>{t.grammarPageLead(grammarWalkPages.length)}</p>
        </div>
        <div className="grammar-view-toggle" role="tablist" aria-label={t.viewLabel}>
          <button type="button" className={view === "mindmap" ? "active" : ""} onClick={() => setView("mindmap")}>
            {t.grammarViewMindmap}
          </button>
          <button type="button" className={view === "walk" ? "active" : ""} onClick={() => setView("walk")}>
            {t.grammarViewWalk}
          </button>
        </div>
      </div>

      {view === "mindmap" ? (
        <div className="grammar-layout">
          <div className="grammar-map" aria-label={t.grammarMindMapLabel}>
            <div className="grammar-root">{t.grammarRootLabel}</div>
            <div className="grammar-part-grid">
              {grammarGuideParts.map((part) => (
                <article className="grammar-part" key={part.id}>
                  <div className="grammar-part-head">
                    <h3>{loc(part.title, language)}</h3>
                    <span>{part.pageRange}</span>
                  </div>
                  <p>{loc(part.theme, language)}</p>
                  <div className="grammar-chapter-list">
                    {part.chapters.map((chapter) => (
                      <button
                        className={chapter.id === selectedChapter.id ? "active" : ""}
                        key={chapter.id}
                        type="button"
                        onClick={() => setSelectedChapterId(chapter.id)}
                      >
                        <span>{loc(chapter.title, language)}</span>
                        <small>{chapter.pageRange}</small>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <GrammarChapterPanel
            chapter={selectedChapter}
            t={t}
            nodeExplanations={nodeExplanations}
            explainingNodeKey={explainingNodeKey}
            nodeExplainErrors={nodeExplainErrors}
            language={language}
            onExplainNode={handleExplainGrammarNode}
          />
        </div>
      ) : (
        <GrammarWalkReader
          t={t}
          language={language}
          nodeExplanations={nodeExplanations}
          explainingNodeKey={explainingNodeKey}
          nodeExplainErrors={nodeExplainErrors}
          onExplainNode={handleExplainGrammarNode}
        />
      )}
    </section>
  );
}

function GrammarExplanationBlocks({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="grammar-explanation-blocks">
      {lines.map((line, index) => {
        const match = line.match(/^(\d{1,2})[.、]\s*(.+)$/);
        if (match) {
          return (
            <div className="grammar-explanation-step" key={index}>
              <span className="grammar-explanation-step-num">{match[1]}</span>
              <p>{match[2]}</p>
            </div>
          );
        }
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

function GrammarWalkReader({
  t,
  language,
  nodeExplanations,
  explainingNodeKey,
  nodeExplainErrors,
  onExplainNode
}: {
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  nodeExplanations: Record<string, string>;
  explainingNodeKey: string;
  nodeExplainErrors: Record<string, string>;
  onExplainNode: (entry: GrammarNodeEntry) => void;
}) {
  const [pageIndex, setPageIndex] = useState(() => {
    try {
      const saved = Number(localStorage.getItem("grammarWalkPageIndex"));
      return Number.isFinite(saved) && saved >= 0 && saved < grammarWalkPages.length ? saved : 0;
    } catch {
      return 0;
    }
  });
  const [autoRead, setAutoRead] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTokenRef = useRef(0);
  const autoReadRef = useRef(autoRead);
  autoReadRef.current = autoRead;

  const page = grammarWalkPages[pageIndex];
  const key = page ? `${page.entry.node.id}:${language}` : "";
  const explanation = page ? nodeExplanations[key] : undefined;
  const explaining = explainingNodeKey === key;
  const explainError = page ? nodeExplainErrors[key] : undefined;

  useEffect(() => {
    try {
      localStorage.setItem("grammarWalkPageIndex", String(pageIndex));
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
  }, [pageIndex]);

  useEffect(() => {
    if (page && !explanation && !explaining) {
      onExplainNode(page.entry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.entry.node.id, language]);

  function stopSpeaking() {
    speechTokenRef.current += 1;
    setIsSpeaking(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  async function speakParagraphs(paragraphs: string[], index: number, token: number) {
    if (!("speechSynthesis" in window) || token !== speechTokenRef.current) {
      setIsSpeaking(false);
      return;
    }
    const text = paragraphs[index];
    if (!text) {
      setIsSpeaking(false);
      return;
    }
    const utterance = await createUtterance(text, speechLanguageForUiLanguage(language));
    if (token !== speechTokenRef.current) {
      setIsSpeaking(false);
      return;
    }
    utterance.onend = () => void speakParagraphs(paragraphs, index + 1, token);
    utterance.onerror = () => void speakParagraphs(paragraphs, index + 1, token);
    window.speechSynthesis.speak(utterance);
  }

  function playExplanation(text: string) {
    speechTokenRef.current += 1;
    const token = speechTokenRef.current;
    setIsSpeaking(true);
    void speakParagraphs(
      text.split("\n").map((line) => line.trim()).filter(Boolean),
      0,
      token
    );
  }

  useEffect(() => {
    if (autoReadRef.current && explanation) {
      playExplanation(explanation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, explanation]);

  useEffect(() => () => stopSpeaking(), []);

  function goTo(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= grammarWalkPages.length) return;
    stopSpeaking();
    setPageIndex(nextIndex);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") goTo(pageIndex - 1);
      if (event.key === "ArrowRight") goTo(pageIndex + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  if (!page) return null;

  const progress = ((pageIndex + 1) / grammarWalkPages.length) * 100;
  const childNodes = page.entry.node.children ?? [];
  const crumbPath = page.entry.path.slice(0, -1);

  return (
    <div className="grammar-walk">
      <div className="grammar-walk-toolbar">
        <label className="grammar-walk-jump">
          <span>{t.grammarWalkChapterLabel}</span>
          <select
            value={page.chapter.id}
            onChange={(event) => {
              const index = grammarWalkPages.findIndex((walkPage) => walkPage.chapter.id === event.target.value);
              if (index >= 0) goTo(index);
            }}
          >
            {grammarGuideParts.map((part) => (
              <optgroup label={loc(part.title, language)} key={part.id}>
                {part.chapters.map((chapter) => (
                  <option value={chapter.id} key={chapter.id}>
                    {loc(chapter.title, language)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="grammar-walk-autoread">
          <input type="checkbox" checked={autoRead} onChange={(event) => setAutoRead(event.target.checked)} />
          <span>{t.grammarWalkAutoRead}</span>
        </label>
      </div>

      <div className="grammar-walk-progress">
        <div className="grammar-walk-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <article className="grammar-walk-card" key={page.entry.node.id}>
        <div className="grammar-walk-breadcrumb">
          <span>{loc(page.part.title, language)}</span>
          <span aria-hidden="true">/</span>
          <span>{loc(page.chapter.title, language)}</span>
          {crumbPath.length ? (
            <>
              <span aria-hidden="true">/</span>
              <span>{crumbPath.map((n) => loc(n.title, language)).join(" / ")}</span>
            </>
          ) : null}
        </div>
        <h2>{loc(page.entry.node.title, language)}</h2>
        {page.entry.node.detail ? <p className="grammar-walk-hint">{loc(page.entry.node.detail, language)}</p> : null}

        <div className="grammar-walk-explanation">
          <div className="grammar-walk-explanation-head">
            <strong>{t.grammarNodeDetailedTitle}</strong>
            <button
              type="button"
              className="icon-button"
              onClick={() => (isSpeaking ? stopSpeaking() : explanation ? playExplanation(explanation) : undefined)}
              disabled={!explanation}
              title={isSpeaking ? t.grammarWalkStopReading : t.grammarWalkReadAloud}
            >
              {isSpeaking ? <Square size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          {explanation ? (
            <GrammarExplanationBlocks text={explanation} />
          ) : explaining ? (
            <p className="grammar-walk-loading">{t.grammarNodeExplaining}</p>
          ) : explainError ? (
            <p className="recognized muted">{explainError}</p>
          ) : null}
        </div>

        {childNodes.length ? (
          <div className="grammar-node-related">
            <strong>{t.grammarRelatedNodesTitle}</strong>
            <div className="grammar-node-related-list">
              {childNodes.map((child) => {
                const childIndex = grammarWalkPages.findIndex((walkPage) => walkPage.entry.node.id === child.id);
                return (
                  <button type="button" key={child.id} onClick={() => (childIndex >= 0 ? goTo(childIndex) : undefined)}>
                    {loc(child.title, language)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </article>

      <div className="grammar-walk-nav">
        <button type="button" onClick={() => goTo(pageIndex - 1)} disabled={pageIndex === 0}>
          <ChevronLeft size={16} />
          <span>{t.grammarWalkPrev}</span>
        </button>
        <span className="grammar-walk-page-count">
          {pageIndex + 1} / {grammarWalkPages.length}
        </span>
        <button type="button" onClick={() => goTo(pageIndex + 1)} disabled={pageIndex === grammarWalkPages.length - 1}>
          <span>{t.grammarWalkNext}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function GrammarChapterPanel({
  chapter,
  t,
  language,
  nodeExplanations,
  explainingNodeKey,
  nodeExplainErrors,
  onExplainNode
}: {
  chapter: GrammarChapter;
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  nodeExplanations: Record<string, string>;
  explainingNodeKey: string;
  nodeExplainErrors: Record<string, string>;
  onExplainNode: (entry: GrammarNodeEntry) => void;
}) {
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
        <h2>{loc(chapter.title, language)}</h2>
        <p>{loc(chapter.summary, language)}</p>
        <small>{t.grammarClickableNodes(nodeEntries.length)}</small>
      </div>

      <div className="grammar-summary-grid">
        <div>
          <h3>{t.grammarGoalsTitle}</h3>
          {loc(chapter.goals, language).map((goal) => (
            <p key={goal}>{goal}</p>
          ))}
        </div>
        <div>
          <h3>{t.grammarPitfallsTitle}</h3>
          {loc(chapter.pitfalls, language).map((pitfall) => (
            <p key={pitfall}>{pitfall}</p>
          ))}
        </div>
      </div>

      <div className="grammar-node-panel">
        <h3>{t.grammarChapterMapTitle}</h3>
        <div className="grammar-node-explorer">
          <div className="grammar-node-tree">
            {chapter.nodes.map((node) => (
              <GrammarNodeView
                node={node}
                key={node.id}
                language={language}
                selectedId={selectedNode?.node.id ?? ""}
                onSelect={setSelectedNodeId}
              />
            ))}
          </div>
          {selectedNode ? (
            <GrammarNodeDetail
              entry={selectedNode}
              chapter={chapter}
              t={t}
              language={language}
              explanation={nodeExplanations[`${selectedNode.node.id}:${language}`]}
              explaining={explainingNodeKey === `${selectedNode.node.id}:${language}`}
              explainError={nodeExplainErrors[`${selectedNode.node.id}:${language}`]}
              onExplain={() => onExplainNode(selectedNode)}
              onSelectNode={setSelectedNodeId}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function GrammarNodeView({
  node,
  language,
  selectedId,
  onSelect
}: {
  node: GrammarNode;
  language: UiLanguage;
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
        <strong>{loc(node.title, language)}</strong>
        {node.detail ? <span>{loc(node.detail, language)}</span> : null}
      </button>
      {node.children?.length ? (
        <div className="grammar-node-children">
          {node.children.map((child) => (
            <GrammarNodeView node={child} language={language} selectedId={selectedId} onSelect={onSelect} key={child.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GrammarNodeDetail({
  entry,
  chapter,
  t,
  language,
  explanation,
  explaining,
  explainError,
  onExplain,
  onSelectNode
}: {
  entry: GrammarNodeEntry;
  chapter: GrammarChapter;
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  explanation?: string;
  explaining: boolean;
  explainError?: string;
  onExplain: () => void;
  onSelectNode: (id: string) => void;
}) {
  const childNodes = entry.node.children ?? [];

  return (
    <aside className="grammar-node-detail">
      <span>{loc(chapter.title, language)}</span>
      <h3>{loc(entry.node.title, language)}</h3>
      <p className="grammar-node-path">{entry.path.map((n) => loc(n.title, language)).join(" / ")}</p>
      <p>{entry.node.detail ? loc(entry.node.detail, language) : t.grammarNodeDetailFallback}</p>

      <div className="grammar-node-study">
        <strong>{t.grammarNodeDetailedTitle}</strong>
        {explanation ? (
          <GrammarExplanationBlocks text={explanation} />
        ) : (
          <>
            <button type="button" className="mini-button" onClick={onExplain} disabled={explaining}>
              <Sparkles size={15} />
              <span>{explaining ? t.grammarNodeExplaining : t.grammarNodeExplainButton}</span>
            </button>
            {explainError ? <p className="recognized muted">{explainError}</p> : null}
          </>
        )}
      </div>

      {childNodes.length ? (
        <div className="grammar-node-related">
          <strong>{t.grammarRelatedNodesTitle}</strong>
          <div className="grammar-node-related-list">
            {childNodes.map((child) => (
              <button type="button" key={child.id} onClick={() => onSelectNode(child.id)}>
                {loc(child.title, language)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grammar-node-related">
          <strong>{t.grammarPracticeTitle}</strong>
          <p>{t.grammarPracticeText}</p>
        </div>
      )}
    </aside>
  );
}

function collectGrammarNodes(nodes: GrammarNode[], path: GrammarNode[] = [], depth = 0): GrammarNodeEntry[] {
  return nodes.flatMap((node) => {
    const currentPath = [...path, node];
    return [
      { node, path: currentPath, depth },
      ...collectGrammarNodes(node.children ?? [], currentPath, depth + 1)
    ];
  });
}

type GrammarWalkPage = {
  part: GrammarPart;
  chapter: GrammarChapter;
  entry: GrammarNodeEntry;
};

const grammarWalkPages: GrammarWalkPage[] = grammarGuideParts.flatMap((part) =>
  part.chapters.flatMap((chapter) => collectGrammarNodes(chapter.nodes).map((entry) => ({ part, chapter, entry })))
);

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

      <div className="method-hero">
        <div>
          <span className="method-eyebrow">{content.frequencyEyebrow}</span>
          <h2>{content.frequencyTitle}</h2>
          <p>{content.frequencyLead}</p>
        </div>
      </div>

      <div className="method-card-grid">
        {content.frequencyLists.map((list) => (
          <article className="method-card" key={list.name}>
            <h3>{list.name}</h3>
            <p>{list.body}</p>
          </article>
        ))}
      </div>

      <div className="method-card-grid">
        <article className="method-card">
          <h3>{content.frequencyRuleTitle}</h3>
          <p>{content.frequencyRuleBody}</p>
        </article>
      </div>

      <div className="method-action-grid">
        <h3>{content.entryTitle}</h3>
        <article>
          <p>{content.entryLead}</p>
        </article>
        {content.entryNotes.map((note, index) => (
          <article key={index}>
            <p>{note}</p>
          </article>
        ))}
      </div>

      <aside className="source-note">
        <p>{content.frequencySourceBody}</p>
      </aside>
    </section>
  );
}

function formatProfileDate(iso: string | null | undefined, locale: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

const profileDateLocales: Record<UiLanguage, string> = {
  zh: "zh-CN",
  en: "en-US",
  nl: "nl-NL",
  es: "es-ES",
  de: "de-DE"
};

function ProfilePage({
  t,
  language,
  user,
  isPremium,
  subscriptionInfo,
  authHeaders,
  onRequireLogin,
  onSignOut
}: {
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  user: { id: string; email?: string } | null;
  isPremium: boolean;
  subscriptionInfo: ProfileRow | null;
  authHeaders: () => Record<string, string>;
  onRequireLogin: () => void;
  onSignOut: () => void;
}) {
  const [subscribing, setSubscribing] = useState(false);
  const [managing, setManaging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function startBilling(action: "checkout" | "portal") {
    if (!user) {
      onRequireLogin();
      return;
    }

    setErrorMessage("");
    if (action === "checkout") setSubscribing(true);
    else setManaging(true);

    try {
      const response = await fetch(apiUrl("/api/billing"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error("Billing request failed");
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("No checkout URL");
      window.location.href = data.url;
    } catch {
      setErrorMessage(t.pricingCheckoutError);
      setSubscribing(false);
      setManaging(false);
    }
  }

  if (!user) {
    return <AuthGateSection t={t} title={t.authSignInTitle} onSignIn={onRequireLogin} />;
  }

  const status = subscriptionInfo?.subscription_status ?? "";
  const statusLabel =
    status === "trialing"
      ? t.profileStatusTrialing
      : status === "past_due"
        ? t.profileStatusPastDue
        : status === "canceled" || status === "unpaid"
          ? t.profileStatusCanceled
          : isPremium
            ? t.profileStatusActive
            : t.profileStatusFree;
  const locale = profileDateLocales[language];

  return (
    <section className="pricing-page">
      <div className="pricing-hero">
        <h2>{t.modeProfile}</h2>
      </div>

      <div className="profile-card">
        <div className="profile-row">
          <span className="profile-label">{t.profileEmailLabel}</span>
          <span>{user.email}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">{t.profileMembershipLabel}</span>
          <span className={isPremium ? "auth-premium-badge" : "pricing-current-badge"}>{statusLabel}</span>
        </div>
        {status === "trialing" && subscriptionInfo?.trial_end ? (
          <p className="profile-detail">{t.profileTrialEnds(formatProfileDate(subscriptionInfo.trial_end, locale))}</p>
        ) : isPremium && subscriptionInfo?.current_period_end ? (
          <p className="profile-detail">
            {t.profileRenews(formatProfileDate(subscriptionInfo.current_period_end, locale))}
          </p>
        ) : null}

        <div className="profile-actions">
          {isPremium ? (
            <button className="mini-button" type="button" onClick={() => startBilling("portal")} disabled={managing}>
              {managing ? t.pricingManaging : t.pricingManageCta}
            </button>
          ) : (
            <button
              className="primary pricing-cta"
              type="button"
              onClick={() => startBilling("checkout")}
              disabled={subscribing}
            >
              <Crown size={16} />
              <span>{subscribing ? t.pricingSubscribing : t.pricingSubscribeCta}</span>
            </button>
          )}
          <button className="mini-button" type="button" onClick={onSignOut}>
            {t.authSignOut}
          </button>
        </div>
        {errorMessage ? <p className="ai-status">{errorMessage}</p> : null}
      </div>
    </section>
  );
}

function PricingPage({
  t,
  user,
  isPremium,
  authHeaders,
  onRequireLogin,
  checkoutMessage
}: {
  t: (typeof translations)[UiLanguage];
  user: { id: string; email?: string } | null;
  isPremium: boolean;
  authHeaders: () => Record<string, string>;
  onRequireLogin: () => void;
  checkoutMessage: string;
}) {
  const [subscribing, setSubscribing] = useState(false);
  const [managing, setManaging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function startBilling(action: "checkout" | "portal") {
    if (!user) {
      onRequireLogin();
      return;
    }

    setErrorMessage("");
    if (action === "checkout") setSubscribing(true);
    else setManaging(true);

    try {
      const response = await fetch(apiUrl("/api/billing"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error("Billing request failed");
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("No checkout URL");
      window.location.href = data.url;
    } catch {
      setErrorMessage(t.pricingCheckoutError);
      setSubscribing(false);
      setManaging(false);
    }
  }

  return (
    <section className="pricing-page">
      <div className="pricing-hero">
        <h2>{t.pricingHeroTitle}</h2>
        <p>{t.pricingHeroSubtitle}</p>
      </div>

      {checkoutMessage ? <p className="pricing-checkout-message">{checkoutMessage}</p> : null}

      <div className="pricing-grid">
        <article className="pricing-card">
          <h3>{t.pricingFreeName}</h3>
          <p className="pricing-card-desc">{t.pricingFreeDesc}</p>
          <div className="pricing-price">{t.pricingPriceFree}</div>
          <ul className="pricing-feature-list">
            {t.pricingFreeFeatures.map((feature) => (
              <li key={feature}>
                <Check size={15} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {!isPremium ? <span className="pricing-current-badge">{t.pricingCurrentBadge}</span> : null}
        </article>

        <article className="pricing-card pricing-card-premium">
          <h3>
            <Crown size={18} />
            <span>{t.pricingPremiumName}</span>
          </h3>
          <p className="pricing-card-desc">{t.pricingPremiumDesc}</p>
          <div className="pricing-price">{t.pricingPerMonth("€5")}</div>
          <p className="pricing-trial-note">{t.pricingTrialNote}</p>
          <ul className="pricing-feature-list">
            {t.pricingPremiumFeatures.map((feature) => (
              <li key={feature}>
                <Check size={15} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {isPremium ? (
            <>
              <span className="pricing-current-badge">{t.pricingCurrentBadge}</span>
              <button
                className="primary pricing-cta"
                type="button"
                onClick={() => startBilling("portal")}
                disabled={managing}
              >
                {managing ? t.pricingManaging : t.pricingManageCta}
              </button>
            </>
          ) : (
            <button
              className="primary pricing-cta"
              type="button"
              onClick={() => startBilling("checkout")}
              disabled={subscribing}
            >
              <Crown size={16} />
              <span>{subscribing ? t.pricingSubscribing : user ? t.pricingSubscribeCta : t.pricingSignInCta}</span>
            </button>
          )}
        </article>
      </div>

      {errorMessage ? <p className="ai-status">{errorMessage}</p> : null}
    </section>
  );
}

function SpeakingPage({ t, premiumGate }: { t: (typeof translations)[UiLanguage]; premiumGate: PremiumGate }) {
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
    if (!premiumGate.isPremium) {
      premiumGate.requestPremium();
      return;
    }

    const nextTurns: SpeakingTurn[] = [...turns, { role: "learner", text }];
    setTurns(nextTurns);
    setDraft("");
    setMessage("");
    setAvatarState("thinking");

    try {
      const response = await fetch("/api/speaking-practice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...premiumGate.authHeaders()
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
            <span>Dutch Flow</span>
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

function DailyReadingPage({
  t,
  language,
  premiumGate
}: {
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  premiumGate: PremiumGate;
}) {
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

  const [localizedByItem, setLocalizedByItem] = useState<Record<string, { translation: string; explanation: string }>>({});
  const [localizingKey, setLocalizingKey] = useState("");

  const [longReadingByItem, setLongReadingByItem] = useState<Record<string, { longText: string; translation: string }>>({});
  const [longReadingLoadingId, setLongReadingLoadingId] = useState("");
  const [longReadingErrors, setLongReadingErrors] = useState<Record<string, string>>({});
  const [longReadingVisible, setLongReadingVisible] = useState<Record<string, boolean>>({});
  const [longReadingTranslationVisible, setLongReadingTranslationVisible] = useState<Record<string, boolean>>({});
  const [speakingLongReadingId, setSpeakingLongReadingId] = useState("");
  const longReadingSpeechTokenRef = useRef(0);

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

  // The pre-generated translation/explanation are baked in Chinese; when the UI
  // language is anything else, translate the Dutch source into that language
  // on demand (once per item) instead of always showing the Chinese version.
  useEffect(() => {
    if (language === "zh") return;

    const target = items.find(
      (item) =>
        (translationVisible[item.id] || grammarVisible[item.id]) && !localizedByItem[`${item.id}:${language}`]
    );
    if (!target) return;

    const key = `${target.id}:${language}`;
    if (localizingKey === key) return;
    setLocalizingKey(key);

    async function attemptTranslate(item: NewsReadingItem) {
      const response = await fetch(apiUrl("/api/translate-example"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: item.dutchText, targetLanguage: language })
      });
      if (!response.ok) throw new Error("Translation request failed");
      const data = (await response.json()) as { translation?: string };
      const translation = data.translation?.trim();
      if (!translation) throw new Error("Translation response malformed");
      return translation;
    }

    async function attemptExplain(item: NewsReadingItem) {
      const response = await fetch(apiUrl("/api/explain-example"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: item.dutchText, targetLanguage: language })
      });
      if (!response.ok) throw new Error("Explanation request failed");
      const data = (await response.json()) as { explanation?: string };
      const explanation = data.explanation?.trim();
      if (!explanation) throw new Error("Explanation response malformed");
      return explanation;
    }

    async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
      try {
        return await fn();
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return await fn();
      }
    }

    (async () => {
      // Translation (DeepL-backed) and explanation (Gemini-backed) are
      // independent calls with independent failure modes - a Gemini hiccup
      // shouldn't blank out a perfectly good translation, and vice versa.
      const [translationResult, explanationResult] = await Promise.allSettled([
        withRetry(() => attemptTranslate(target)),
        withRetry(() => attemptExplain(target))
      ]);

      const translation = translationResult.status === "fulfilled" ? translationResult.value : t.translationFailed;
      const explanation = explanationResult.status === "fulfilled" ? explanationResult.value : t.grammarFailed;

      setLocalizedByItem((current) => ({ ...current, [key]: { translation, explanation } }));
      setLocalizingKey("");
    })();
  }, [items, language, translationVisible, grammarVisible, localizedByItem, localizingKey, t.grammarFailed, t.translationFailed]);

  useEffect(
    () => () => {
      autoPlayTokenRef.current += 1;
      longReadingSpeechTokenRef.current += 1;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  async function handleExpandReading(item: NewsReadingItem) {
    if (longReadingByItem[item.id] || longReadingLoadingId === item.id) {
      setLongReadingVisible((current) => ({ ...current, [item.id]: true }));
      return;
    }
    if (!apiAvailable) {
      setLongReadingErrors((current) => ({ ...current, [item.id]: t.readingLongFailed }));
      return;
    }
    if (!premiumGate.isPremium) {
      premiumGate.requestPremium();
      return;
    }

    setLongReadingLoadingId(item.id);
    setLongReadingErrors((current) => ({ ...current, [item.id]: "" }));
    setLongReadingVisible((current) => ({ ...current, [item.id]: true }));

    try {
      const response = await fetch(apiUrl("/api/expand-news-reading"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...premiumGate.authHeaders()
        },
        body: JSON.stringify({
          headline: item.sourceHeadline,
          sourceName: item.sourceName,
          level: item.level,
          targetLanguage: language
        })
      });

      if (!response.ok) {
        throw new Error("Failed to expand news reading");
      }

      const data = (await response.json()) as { longText?: string; translation?: string };
      const longText = data.longText?.trim();
      if (!longText) {
        throw new Error("Empty long text");
      }

      setLongReadingByItem((current) => ({
        ...current,
        [item.id]: { longText, translation: data.translation?.trim() ?? "" }
      }));
    } catch {
      setLongReadingErrors((current) => ({ ...current, [item.id]: t.readingLongFailed }));
    } finally {
      setLongReadingLoadingId("");
    }
  }

  function toggleLongReadingTranslation(id: string) {
    setLongReadingTranslationVisible((current) => ({ ...current, [id]: !current[id] }));
  }

  function stopLongReadingSpeech() {
    longReadingSpeechTokenRef.current += 1;
    setSpeakingLongReadingId("");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  async function speakLongReadingParagraphs(paragraphs: string[], index: number, token: number) {
    if (!("speechSynthesis" in window) || token !== longReadingSpeechTokenRef.current) {
      setSpeakingLongReadingId("");
      return;
    }
    const text = paragraphs[index];
    if (!text) {
      setSpeakingLongReadingId("");
      return;
    }
    const utterance = await createUtterance(text, "nl-NL");
    if (token !== longReadingSpeechTokenRef.current) {
      setSpeakingLongReadingId("");
      return;
    }
    utterance.onend = () => void speakLongReadingParagraphs(paragraphs, index + 1, token);
    utterance.onerror = () => void speakLongReadingParagraphs(paragraphs, index + 1, token);
    window.speechSynthesis.speak(utterance);
  }

  function playLongReading(id: string, longText: string) {
    longReadingSpeechTokenRef.current += 1;
    const token = longReadingSpeechTokenRef.current;
    setSpeakingLongReadingId(id);
    const paragraphs = longText
      .split(/\|\|\|/)
      .map((line) => line.trim())
      .filter(Boolean);
    void speakLongReadingParagraphs(paragraphs, 0, token);
  }

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
                  <button className="mini-button" type="button" onClick={() => handleExpandReading(item)} disabled={longReadingLoadingId === item.id}>
                    <BookOpen size={15} />
                    <span>{longReadingVisible[item.id] ? t.readingLongHide : t.readingLongButton}</span>
                  </button>
                </div>
                {translationVisible[item.id] ? (
                  <p className="example-translation">
                    {language === "zh"
                      ? item.translation
                      : (localizedByItem[`${item.id}:${language}`]?.translation ?? t.translatingExample)}
                  </p>
                ) : null}
                {grammarVisible[item.id] ? (
                  <div className="grammar-explanation">
                    <strong>{t.grammarExplanation}</strong>
                    {(language === "zh"
                      ? item.explanation
                      : (localizedByItem[`${item.id}:${language}`]?.explanation ?? t.explainingGrammar)
                    )
                      .split("\n")
                      .map((line, index) => (
                        <p key={`${item.id}-line-${index}`}>{line}</p>
                      ))}
                  </div>
                ) : null}
                {longReadingVisible[item.id] ? (
                  <div className="reading-long">
                    {longReadingByItem[item.id] ? (
                      <ReadingLongText
                        entry={longReadingByItem[item.id]}
                        t={t}
                        speaking={speakingLongReadingId === item.id}
                        translationVisible={Boolean(longReadingTranslationVisible[item.id])}
                        onToggleTranslation={() => toggleLongReadingTranslation(item.id)}
                        onPlay={() => playLongReading(item.id, longReadingByItem[item.id].longText)}
                        onStop={stopLongReadingSpeech}
                      />
                    ) : longReadingLoadingId === item.id ? (
                      <p className="recognized muted">{t.readingLongLoading}</p>
                    ) : longReadingErrors[item.id] ? (
                      <p className="recognized muted">{longReadingErrors[item.id]}</p>
                    ) : null}
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

function ReadingLongText({
  entry,
  t,
  speaking,
  translationVisible,
  onToggleTranslation,
  onPlay,
  onStop
}: {
  entry: { longText: string; translation: string };
  t: (typeof translations)[UiLanguage];
  speaking: boolean;
  translationVisible: boolean;
  onToggleTranslation: () => void;
  onPlay: () => void;
  onStop: () => void;
}) {
  const dutchBlocks = entry.longText
    .split(/\|\|\|/)
    .map((block) => block.trim())
    .filter(Boolean);
  const dutchTitle = dutchBlocks.length > 1 ? dutchBlocks[0] : "";
  const dutchParagraphs = dutchBlocks.length > 1 ? dutchBlocks.slice(1) : dutchBlocks;

  const translationBlocks = entry.translation
    .split(/\|\|\|/)
    .map((block) => block.trim())
    .filter(Boolean);
  const translationTitle = translationBlocks.length > 1 ? translationBlocks[0] : "";
  const translationParagraphs = translationBlocks.length > 1 ? translationBlocks.slice(1) : translationBlocks;

  return (
    <div className="reading-long-body">
      <div className="reading-long-toolbar">
        <button type="button" className="mini-button" onClick={speaking ? onStop : onPlay}>
          {speaking ? <Square size={15} /> : <Volume2 size={15} />}
          <span>{speaking ? t.readingLongStop : t.readingLongPlay}</span>
        </button>
        <button type="button" className="mini-button" onClick={onToggleTranslation}>
          <Languages size={15} />
          <span>{translationVisible ? t.hideAnswer : t.translateExample}</span>
        </button>
      </div>
      <article className="reading-long-article">
        {dutchTitle ? <h3>{dutchTitle}</h3> : null}
        {dutchParagraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      {translationVisible ? (
        <article className="reading-long-article reading-long-translation">
          {translationTitle ? <h3>{translationTitle}</h3> : null}
          {translationParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>
      ) : null}
    </div>
  );
}

type PodcastTurn = { speaker: "A" | "B"; text: string; translation: string };
type PodcastQuizQuestion = { question: string; options: string[]; correctIndex: number };
type PodcastEpisode = {
  id: string;
  sourceName: string;
  sourceHeadline: string;
  sourceLink: string;
  level: string;
  turns: PodcastTurn[];
  explanation: string;
  quiz?: PodcastQuizQuestion[];
};

function getDutchVoicePair(voices: SpeechSynthesisVoice[]) {
  const dutchVoices = voices
    .filter((voice) => voice.lang.toLocaleLowerCase("nl-NL").startsWith("nl"))
    .sort((first, second) => scoreDutchVoice(second) - scoreDutchVoice(first));
  return [dutchVoices[0], dutchVoices[1] ?? dutchVoices[0]] as const;
}

const podcastPlaybackRates = [0.75, 0.9, 1, 1.25] as const;

async function createPodcastUtterance(text: string, speaker: "A" | "B", rate: number) {
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

  utterance.rate = rate;
  utterance.pitch = speaker === "B" && voiceA === voiceB ? 1.25 : 1;
  return utterance;
}

async function fetchPodcastGenreEpisodes(
  genreKey: ReadingGenre,
  authHeaders: () => Record<string, string>
): Promise<PodcastEpisode[]> {
  const response = await fetch(apiUrl(`/api/podcast?genre=${genreKey}`), { headers: authHeaders() });
  if (!response.ok) {
    throw new Error("Failed to read podcast episodes");
  }
  const data = (await response.json()) as { episodes?: PodcastEpisode[] };
  return data.episodes ?? [];
}

function PodcastPage({
  t,
  language,
  premiumGate
}: {
  t: (typeof translations)[UiLanguage];
  language: UiLanguage;
  premiumGate: PremiumGate;
}) {
  const [genre, setGenre] = useState<ReadingGenre>("algemeen");
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState<Record<string, boolean>>({});
  const [localizedEpisodes, setLocalizedEpisodes] = useState<Record<string, { turns: string[]; explanation: string }>>(
    {}
  );
  const [localizingEpisodeKey, setLocalizingEpisodeKey] = useState("");
  const [playingId, setPlayingId] = useState("");
  const [playingTurnIndex, setPlayingTurnIndex] = useState(-1);
  const [autoPlayingGenres, setAutoPlayingGenres] = useState(false);
  const [autoPlayingGenreKey, setAutoPlayingGenreKey] = useState<ReadingGenre | null>(null);
  const [rate, setRate] = useState<(typeof podcastPlaybackRates)[number]>(0.9);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const rateRef = useRef(rate);
  rateRef.current = rate;
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
        const list = await fetchPodcastGenreEpisodes(genre, premiumGate.authHeaders);
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
  }, [genre, premiumGate]);

  // The pre-generated turn translations and explanation are baked in Chinese;
  // for any other UI language, translate the Dutch dialogue on demand instead
  // of always showing the Chinese version.
  useEffect(() => {
    if (language === "zh") return;

    const target = episodes.find(
      (episode) => transcriptVisible[episode.id] && !localizedEpisodes[`${episode.id}:${language}`]
    );
    if (!target) return;

    const key = `${target.id}:${language}`;
    if (localizingEpisodeKey === key) return;
    setLocalizingEpisodeKey(key);

    async function attemptTranslate(episode: PodcastEpisode) {
      const joinedTurns = episode.turns.map((turn) => turn.text).join("|||");
      const response = await fetch(apiUrl("/api/translate-example"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: joinedTurns, targetLanguage: language })
      });
      if (!response.ok) throw new Error("Translation request failed");
      const data = (await response.json()) as { translation?: string };
      const splitTurns = (data.translation ?? "").split("|||").map((part) => part.trim());
      if (splitTurns.length !== episode.turns.length || !splitTurns.every(Boolean)) {
        throw new Error("Translation response malformed");
      }
      return splitTurns;
    }

    async function attemptExplain(episode: PodcastEpisode) {
      const response = await fetch(apiUrl("/api/explain-example"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: episode.turns.map((turn) => turn.text).join(" "), targetLanguage: language })
      });
      if (!response.ok) throw new Error("Explanation request failed");
      const data = (await response.json()) as { explanation?: string };
      const explanation = data.explanation?.trim();
      if (!explanation) throw new Error("Explanation response malformed");
      return explanation;
    }

    async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
      try {
        return await fn();
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return await fn();
      }
    }

    (async () => {
      // Translation (DeepL-backed) and explanation (Gemini-backed) are
      // independent calls with independent failure modes - a Gemini hiccup
      // shouldn't blank out a perfectly good translation, and vice versa.
      const [translationResult, explanationResult] = await Promise.allSettled([
        withRetry(() => attemptTranslate(target)),
        withRetry(() => attemptExplain(target))
      ]);

      const turns =
        translationResult.status === "fulfilled" ? translationResult.value : target.turns.map(() => t.translationFailed);
      const explanation = explanationResult.status === "fulfilled" ? explanationResult.value : t.grammarFailed;

      setLocalizedEpisodes((current) => ({ ...current, [key]: { turns, explanation } }));
      setLocalizingEpisodeKey("");
    })();
  }, [episodes, language, transcriptVisible, localizedEpisodes, localizingEpisodeKey, t.grammarFailed, t.translationFailed]);

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
    const utterance = await createPodcastUtterance(turn.text, turn.speaker, rateRef.current);
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
    const utterance = await createPodcastUtterance(turn.text, turn.speaker, rateRef.current);
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
      const list = await fetchPodcastGenreEpisodes(genreKey, premiumGate.authHeaders);
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
        <label className="podcast-rate-control">
          <span>{t.podcastSpeed}</span>
          <select
            value={rate}
            onChange={(event) => setRate(Number(event.target.value) as (typeof podcastPlaybackRates)[number])}
          >
            {podcastPlaybackRates.map((rateOption) => (
              <option key={rateOption} value={rateOption}>
                {rateOption}x
              </option>
            ))}
          </select>
        </label>
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
                        <InteractiveSentence sentence={turn.text} t={t} className="podcast-turn-text" />
                        <p className="podcast-turn-translation">
                          {language === "zh"
                            ? turn.translation
                            : (localizedEpisodes[`${episode.id}:${language}`]?.turns[index] ?? t.translatingExample)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="grammar-explanation">
                    <strong>{t.grammarExplanation}</strong>
                    {(language === "zh"
                      ? episode.explanation
                      : (localizedEpisodes[`${episode.id}:${language}`]?.explanation ?? t.explainingGrammar)
                    )
                      .split("\n")
                      .map((line, index) => (
                        <p key={`${episode.id}-explain-${index}`}>{line}</p>
                      ))}
                  </div>
                  {episode.quiz && episode.quiz.length > 0 ? (
                    language === "zh" ? (
                      <div className="podcast-quiz">
                        <strong>{t.podcastQuizTitle}</strong>
                        {episode.quiz.map((question, qIndex) => {
                          const answerKey = `${episode.id}:${qIndex}`;
                          const selected = quizAnswers[answerKey];
                          return (
                            <div className="podcast-quiz-question" key={answerKey}>
                              <p>{question.question}</p>
                              <div className="podcast-quiz-options">
                                {question.options.map((option, optionIndex) => {
                                  const isSelected = selected === optionIndex;
                                  const isCorrect = optionIndex === question.correctIndex;
                                  const state =
                                    selected === undefined
                                      ? ""
                                      : isCorrect
                                        ? "correct"
                                        : isSelected
                                          ? "incorrect"
                                          : "";
                                  return (
                                    <button
                                      key={optionIndex}
                                      type="button"
                                      className={`podcast-quiz-option ${state}`}
                                      disabled={selected !== undefined}
                                      onClick={() =>
                                        setQuizAnswers((current) => ({ ...current, [answerKey]: optionIndex }))
                                      }
                                    >
                                      {option}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="recognized muted">{t.podcastQuizUnavailable}</p>
                    )
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AuthGateSection({
  t,
  title,
  onSignIn
}: {
  t: (typeof translations)[UiLanguage];
  title: string;
  onSignIn: () => void;
}) {
  return (
    <section className="auth-gate">
      <div className="auth-gate-card">
        <h2>{title}</h2>
        <p>{t.authRequiredHint}</p>
        <button className="primary" type="button" onClick={onSignIn}>
          {t.authSignInTitle}
        </button>
      </div>
    </section>
  );
}

function PremiumGateSection({ t, onSubscribe }: { t: (typeof translations)[UiLanguage]; onSubscribe: () => void }) {
  return (
    <section className="auth-gate">
      <div className="auth-gate-card">
        <h2>{t.premiumGateTitle}</h2>
        <p>{t.authPremiumRequiredHint}</p>
        <button className="primary pricing-cta" type="button" onClick={onSubscribe}>
          <Crown size={16} />
          <span>{t.pricingSubscribeCta}</span>
        </button>
      </div>
    </section>
  );
}

function AuthModal({
  t,
  reason,
  email,
  onEmailChange,
  onGoogle,
  onSendEmailLink,
  sending,
  statusMessage,
  onClose,
  onGoToPricing,
  authTab,
  onAuthTabChange,
  authFlow,
  onAuthFlowChange,
  password,
  onPasswordChange,
  onPasswordSignIn,
  onPasswordSignUp
}: {
  t: (typeof translations)[UiLanguage];
  reason: "login" | "premium";
  email: string;
  onEmailChange: (value: string) => void;
  onGoogle: () => void;
  onSendEmailLink: () => void;
  sending: boolean;
  statusMessage: string;
  onClose: () => void;
  onGoToPricing: () => void;
  authTab: "magiclink" | "password";
  onAuthTabChange: (tab: "magiclink" | "password") => void;
  authFlow: "login" | "register";
  onAuthFlowChange: (flow: "login" | "register") => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onPasswordSignIn: () => void;
  onPasswordSignUp: () => void;
}) {
  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button auth-modal-close" type="button" onClick={onClose} aria-label={t.authModalClose}>
          ×
        </button>
        {reason === "premium" ? (
          <>
            <h2>{t.authPremiumRequiredTitle}</h2>
            <p className="auth-modal-hint">{t.authPremiumRequiredHint}</p>
            <button className="primary pricing-cta" type="button" onClick={onGoToPricing}>
              <Crown size={16} />
              <span>{t.pricingSubscribeCta}</span>
            </button>
          </>
        ) : (
          <>
            <h2>{t.authSignInTitle}</h2>
            <button className="auth-google-button" type="button" onClick={onGoogle}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
                />
              </svg>
              <span>{t.authSignInGoogle}</span>
            </button>
            <div className="auth-modal-divider">
              <span>{t.authSignInEmailLabel}</span>
            </div>
            <div className="auth-tab-toggle">
              <button
                type="button"
                className={authTab === "magiclink" ? "active" : ""}
                onClick={() => onAuthTabChange("magiclink")}
              >
                {t.authTabMagicLink}
              </button>
              <button
                type="button"
                className={authTab === "password" ? "active" : ""}
                onClick={() => onAuthTabChange("password")}
              >
                {t.authTabPassword}
              </button>
            </div>
            {authTab === "magiclink" ? (
              <form
                className="auth-email-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSendEmailLink();
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder={t.authEmailPlaceholder}
                  required
                />
                <button className="mini-button" type="submit" disabled={sending || !email.trim()}>
                  {sending ? t.authSending : t.authSendLink}
                </button>
              </form>
            ) : (
              <form
                className="auth-password-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (authFlow === "register") onPasswordSignUp();
                  else onPasswordSignIn();
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder={t.authEmailPlaceholder}
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder={t.authPasswordPlaceholder}
                  minLength={6}
                  required
                />
                <button
                  className="primary auth-password-submit"
                  type="submit"
                  disabled={sending || !email.trim() || password.length < 6}
                >
                  {authFlow === "register"
                    ? sending
                      ? t.authPasswordSignUpSending
                      : t.authPasswordSignUp
                    : sending
                      ? t.authPasswordSignInSending
                      : t.authPasswordSignIn}
                </button>
                <button
                  type="button"
                  className="auth-flow-switch"
                  onClick={() => onAuthFlowChange(authFlow === "register" ? "login" : "register")}
                >
                  {authFlow === "register" ? t.authSwitchToLogin : t.authSwitchToRegister}
                </button>
              </form>
            )}
          </>
        )}
        {statusMessage ? <p className="ai-status">{statusMessage}</p> : null}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<ProfileRow | null>(null);
  const [authPrompt, setAuthPrompt] = useState<"login" | "premium" | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authStatusMessage, setAuthStatusMessage] = useState("");
  const [authSending, setAuthSending] = useState(false);
  const [authTab, setAuthTab] = useState<"magiclink" | "password">("magiclink");
  const [authFlow, setAuthFlow] = useState<"login" | "register">("login");
  const [authPassword, setAuthPassword] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [premiumRefreshTick, setPremiumRefreshTick] = useState(0);
  const user = session?.user ?? null;
  const [mode, setMode] = useState<ViewMode>("landing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [language, setLanguage] = useState<UiLanguage>(getSavedLanguage);
  const [query, setQuery] = useState("");
  const [jumpValue, setJumpValue] = useState("");
  const [highlightedWordId, setHighlightedWordId] = useState<string | null>(null);
  const skipVisibleResetRef = useRef(false);
  const [selectedList, setSelectedList] = useState("All");
  const [hideDuplicateWords, setHideDuplicateWords] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(getSavedIds);
  const [bookExamples, setBookExamples] = useState<Record<string, string>>({});
  const [generatedExamples, setGeneratedExamples] = useState<Record<string, string>>(getSavedGeneratedExamples);
  const [exampleTranslations, setExampleTranslations] =
    useState<Record<string, string>>(getSavedExampleTranslations);
  const [exampleGrammar, setExampleGrammar] = useState<Record<string, string>>(getSavedExampleGrammar);
  const [spokenGrammar, setSpokenGrammar] = useState<Record<string, string>>(getSavedSpokenGrammar);
  const [wordAnswers, setWordAnswers] = useState<Record<string, WordAnswerTurn[]>>(getSavedWordAnswers);
  const [studyProgress, setStudyProgress] = useState<Record<string, StudyProgress>>(getSavedStudyProgress);
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
  const [translatingKey, setTranslatingKey] = useState("");
  const [explainingGrammarKey, setExplainingGrammarKey] = useState("");
  const [askingWordId, setAskingWordId] = useState("");
  const [translationMessages, setTranslationMessages] = useState<Record<string, string>>({});
  const [wordAnswerMessages, setWordAnswerMessages] = useState<Record<string, string>>({});
  const [assessingKey, setAssessingKey] = useState("");
  const [assessmentMessages, setAssessmentMessages] = useState<Record<string, string>>({});
  const [pronunciationAssessments, setPronunciationAssessments] = useState<Record<string, PronunciationAssessment>>({});
  const [examplesLoading, setExamplesLoading] = useState(true);
  const [examplesFailed, setExamplesFailed] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(180);
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyJumpValue, setStudyJumpValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [cardsFlipped, setCardsFlipped] = useState(false);
  const [cardFlipOverrides, setCardFlipOverrides] = useState<Record<string, boolean>>({});
  const [cardMeaningLanguage, setCardMeaningLanguage] = useState<CardMeaningLanguage>(getSavedCardMeaningLanguage);
  const [wordMeaningTranslations, setWordMeaningTranslations] =
    useState<Record<string, string>>(getSavedWordMeaningTranslations);
  const [translatingMeaningBatch, setTranslatingMeaningBatch] = useState(false);
  const meaningTranslationRequestsRef = useRef<Set<string>>(new Set());
  const [includeNotebookExampleGrammar, setIncludeNotebookExampleGrammar] = useState(false);
  const autoTranslationRequestsRef = useRef<Set<string>>(new Set());
  const autoPlayTokenRef = useRef(0);
  const [autoPlayingNotebook, setAutoPlayingNotebook] = useState(false);
  const [autoPlayMutedIds, setAutoPlayMutedIds] = useState<Set<string>>(getSavedAutoPlayMutedIds);
  const [loopNotebookAutoPlay, setLoopNotebookAutoPlay] = useState(false);
  const loopNotebookAutoPlayRef = useRef(false);
  const t = translations[language];

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // A backgrounded tab can sit long enough for the access token to expire
  // before supabase-js's own auto-refresh timer gets a chance to run (browsers
  // throttle timers in inactive tabs) - re-check the session whenever the tab
  // regains focus so a stale token doesn't cause the next request to fail.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    function refreshSessionIfStale() {
      if (document.visibilityState !== "visible") return;
      client.auth.getSession().then(({ data }) => setSession(data.session));
    }

    document.addEventListener("visibilitychange", refreshSessionIfStale);
    window.addEventListener("focus", refreshSessionIfStale);

    return () => {
      document.removeEventListener("visibilitychange", refreshSessionIfStale);
      window.removeEventListener("focus", refreshSessionIfStale);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || !hash.includes("error=")) return;

    const params = new URLSearchParams(hash.slice(1));
    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");
    const message =
      errorCode === "otp_expired"
        ? t.authLinkExpired
        : errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : t.authEmailError;

    setAuthStatusMessage(message);
    setAuthPrompt("login");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    // Runs once on mount to surface any auth error Supabase redirected back with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setIsPremium(false);
      setSubscriptionInfo(null);
      return;
    }

    let active = true;
    supabase
      .from("profiles")
      .select("is_premium, subscription_status, current_period_end, trial_end")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: ProfileRow | null }) => {
        if (!active) return;
        setIsPremium(Boolean(data?.is_premium));
        setSubscriptionInfo(data ?? null);
      });

    return () => {
      active = false;
    };
  }, [user?.id, premiumRefreshTick]);

  // A Stripe webhook can flip is_premium moments after checkout completes, or an
  // admin can flip it manually - subscribe so an open tab picks that up instantly.
  useEffect(() => {
    if (!supabase || !user) return;
    const client = supabase;

    const channel = client
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload: { new: ProfileRow }) => {
          setIsPremium(Boolean(payload.new?.is_premium));
          setSubscriptionInfo(payload.new ?? null);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user?.id]);

  // Handle the redirect back from Stripe Checkout: surface a message on the
  // pricing page and re-check premium status (the webhook may take a moment).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;

    if (checkout === "success") {
      setCheckoutMessage(t.pricingCheckoutSuccess);
      setPremiumRefreshTick((tick) => tick + 1);
    } else if (checkout === "cancelled") {
      setCheckoutMessage(t.pricingCheckoutCancelled);
    }
    setMode("pricing");
    window.history.replaceState(null, "", window.location.pathname);
    // Runs once on mount to detect a Stripe Checkout return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) setAuthPrompt(null);
  }, [user]);

  const previousUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const previousId = previousUserIdRef.current;
    const currentId = user?.id ?? null;

    if (previousId && previousId !== currentId) {
      applySyncPayload({
        notebook: [],
        autoPlayMuted: [],
        generatedExamples: {},
        exampleTranslations: {},
        exampleGrammar: {},
        spokenGrammar: {},
        wordAnswers: {},
        studyProgress: {}
      });
      localStorage.removeItem(syncUpdatedAtStorageKey);
    }

    previousUserIdRef.current = currentId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [session]);

  function ensurePremiumAccess(): boolean {
    if (!user) {
      setAuthPrompt("login");
      return false;
    }
    if (!isPremium) {
      setAuthPrompt("premium");
      return false;
    }
    return true;
  }

  async function handleSignInWithGoogle() {
    if (!supabase) return;
    setAuthStatusMessage("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  }

  async function handleSendEmailLink() {
    if (!supabase || !authEmail.trim()) return;
    setAuthSending(true);
    setAuthStatusMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: { emailRedirectTo: window.location.origin }
      });
      setAuthStatusMessage(error ? t.authEmailError : t.authEmailSent);
    } catch {
      setAuthStatusMessage(t.authEmailError);
    } finally {
      setAuthSending(false);
    }
  }

  async function handlePasswordSignIn() {
    if (!supabase || !authEmail.trim() || !authPassword) return;
    setAuthSending(true);
    setAuthStatusMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword
      });
      setAuthStatusMessage(error ? t.authPasswordError : "");
    } catch {
      setAuthStatusMessage(t.authPasswordError);
    } finally {
      setAuthSending(false);
    }
  }

  async function handlePasswordSignUp() {
    if (!supabase || !authEmail.trim() || !authPassword) return;
    setAuthSending(true);
    setAuthStatusMessage("");
    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: { emailRedirectTo: window.location.origin }
      });
      setAuthStatusMessage(error ? error.message : t.authPasswordSignUpSuccess);
    } catch {
      setAuthStatusMessage(t.authPasswordError);
    } finally {
      setAuthSending(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const requestPremium = useCallback(() => {
    setAuthPrompt(user ? "premium" : "login");
  }, [user]);

  const premiumGate: PremiumGate = useMemo(
    () => ({ isPremium, authHeaders, requestPremium }),
    [isPremium, authHeaders, requestPremium]
  );

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
    localStorage.setItem(wordMeaningTranslationsStorageKey, JSON.stringify(wordMeaningTranslations));
  }, [wordMeaningTranslations]);

  useEffect(() => {
    localStorage.setItem(cardMeaningLanguageStorageKey, cardMeaningLanguage);
  }, [cardMeaningLanguage]);

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

  async function pullSync() {
    if (!supabase || !user) return { updatedAt: 0, payload: null };
    const { data, error } = await supabase
      .from("sync_data")
      .select("payload, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return {
      updatedAt: data ? new Date(data.updated_at as string).getTime() : 0,
      payload: (data?.payload as SyncPayload | undefined) ?? null
    };
  }

  async function pushSync() {
    if (!supabase || !user) return;
    const updatedAt = Date.now();
    const { error } = await supabase.from("sync_data").upsert({
      user_id: user.id,
      payload: syncPayloadRef.current,
      updated_at: new Date(updatedAt).toISOString()
    });
    if (error) throw error;
    localStorage.setItem(syncUpdatedAtStorageKey, String(updatedAt));
  }

  async function runPull() {
    try {
      const localUpdatedAt = getSavedSyncUpdatedAt();
      const remote = await pullSync();
      if (remote.payload && (remote.updatedAt ?? 0) > localUpdatedAt) {
        applySyncPayload(remote.payload);
        localStorage.setItem(syncUpdatedAtStorageKey, String(remote.updatedAt ?? 0));
      }
    } catch {
      // Sync is best-effort; a failed pull just means we try again on the
      // next focus/interval/realtime trigger.
    }
  }

  // Whenever the user signs in, pull whatever the account already has (if it is
  // newer than what is on this device) before starting to push local changes up.
  useEffect(() => {
    if (!user || !apiAvailable) {
      syncReadyRef.current = !user ? true : syncReadyRef.current;
      return;
    }

    let active = true;
    syncReadyRef.current = false;

    (async () => {
      await runPull();
      if (active) syncReadyRef.current = true;
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // A tab left open never learns about changes made on another device or tab on
  // its own, since it only pulled once at sign-in - so re-pull whenever this tab
  // regains focus, and periodically while it stays in the background.
  useEffect(() => {
    if (!user || !apiAvailable) return;

    function pullIfReady() {
      if (!syncReadyRef.current) return;
      void runPull();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") pullIfReady();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", pullIfReady);
    const interval = window.setInterval(pullIfReady, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", pullIfReady);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Instant path: subscribe to Supabase Realtime so a change pushed from another
  // device/tab re-pulls here immediately, instead of waiting for a refocus or the
  // periodic fallback above.
  useEffect(() => {
    if (!supabase || !user) return;
    const client = supabase;

    const channel = client
      .channel(`sync-data-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sync_data", filter: `user_id=eq.${user.id}` },
        () => {
          if (!syncReadyRef.current) return;
          void runPull();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fast path: push soon after a meaningful, user-driven change (notebook edit or a
  // review answer). These change rarely enough that the debounce actually settles.
  useEffect(() => {
    if (!user || !apiAvailable || !syncReadyRef.current) return;

    if (syncPushTimerRef.current) {
      window.clearTimeout(syncPushTimerRef.current);
    }

    syncPushTimerRef.current = window.setTimeout(() => {
      pushSync().catch(() => {
        // Best-effort; the periodic sweep below retries.
      });
    }, 2000);

    return () => {
      if (syncPushTimerRef.current) {
        window.clearTimeout(syncPushTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, savedIds, autoPlayMutedIds, studyProgress]);

  // Slow path: the AI-generated caches (translations, grammar, generated examples,
  // word answers) can update continuously in the background, which would keep
  // resetting a change-triggered debounce forever. A periodic sweep guarantees they
  // still reach the cloud eventually without fighting that churn.
  useEffect(() => {
    if (!user || !apiAvailable) return;

    const interval = window.setInterval(() => {
      if (!syncReadyRef.current) return;
      pushSync().catch(() => {
        // Best-effort; the next sweep retries.
      });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [user?.id]);

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
    const filtered = source
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

    if (!hideDuplicateWords) return filtered;

    const seenWords = new Set<string>();
    return filtered.filter((word) => {
      if (seenWords.has(word.word)) return false;
      seenWords.add(word.word);
      return true;
    });
  }, [hideDuplicateWords, mode, query, savedWords, selectedList]);

  const visibleWords = useMemo(
    () => matchingWords.slice(0, visibleLimit),
    [matchingWords, visibleLimit]
  );

  const studyWords = useMemo(() => {
    const source = selectedList === "All" ? words : words.filter((word) => word.list === selectedList);
    return [...source].sort((a, b) => {
      const aProgress = studyProgress[a.sourceId];
      const bProgress = studyProgress[b.sourceId];
      const aDue = aProgress?.dueAt ?? 0;
      const bDue = bProgress?.dueAt ?? 0;
      if (aDue !== bDue) return aDue - bDue;
      return a.rank - b.rank;
    });
  }, [selectedList, studyProgress]);
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
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          sentence,
          targetLanguage: "en",
          forSpeech: true
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

  function jumpToStudyWord() {
    const trimmed = studyJumpValue.trim();
    if (!trimmed) return;

    const rankNumber = /^\d+$/.test(trimmed) ? Number(trimmed) : null;
    const needle = normalize(trimmed);
    const targetIndex = studyWords.findIndex((word) =>
      rankNumber !== null ? word.rank === rankNumber : normalize(word.word) === needle
    );
    if (targetIndex === -1) return;

    setStudyIndex(targetIndex);
    setRevealed(false);
    setStudyJumpValue("");
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
      nl: exampleTranslations[`${sentenceKey}:nl`],
      es: exampleTranslations[`${sentenceKey}:es`],
      de: exampleTranslations[`${sentenceKey}:de`]
    };
  }

  function translatingLanguageFor(sentenceKey: string): ExampleTranslationLanguage | "" {
    const languageCode = translatingKey.slice(sentenceKey.length + 1);
    return translatingKey.startsWith(`${sentenceKey}:`) &&
      Object.prototype.hasOwnProperty.call(languageNames, languageCode)
      ? (languageCode as ExampleTranslationLanguage)
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
  }, [bookExamples, exampleTranslations, generatedExamples, isPremium, mode, studyWord, translatingKey, visibleWords]);

  function resolveCardMeaning(word: DutchWord, targetLanguage: CardMeaningLanguage): string {
    if (targetLanguage === "en") return word.translation;
    const key = `${word.sourceId}:${targetLanguage}`;
    return wordMeaningTranslations[key] ?? (translatingMeaningBatch ? t.translatingExample : t.noTranslation);
  }

  async function handleTranslateWordMeaningBatch(batchWords: DutchWord[], targetLanguage: CardMeaningLanguage) {
    if (targetLanguage === "en" || !apiAvailable || !batchWords.length) return;

    setTranslatingMeaningBatch(true);

    try {
      const response = await fetch(apiUrl("/api/translate-example"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          sentences: batchWords.map((word) => word.translation),
          targetLanguage,
          sourceLanguage: "en"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to translate word meanings");
      }

      const data = (await response.json()) as { translations?: string[] };
      const translations = data.translations;
      if (!Array.isArray(translations)) {
        throw new Error("Malformed batch translation response");
      }

      setWordMeaningTranslations((current) => {
        const next = { ...current };
        batchWords.forEach((word, index) => {
          const translation = translations[index]?.trim();
          if (translation) {
            next[`${word.sourceId}:${targetLanguage}`] = translation;
          }
        });
        return next;
      });
    } catch {
      // Leave this batch untranslated; already-marked keys won't be retried this session.
    } finally {
      setTranslatingMeaningBatch(false);
    }
  }

  useEffect(() => {
    if (!apiAvailable || cardMeaningLanguage === "en" || translatingMeaningBatch) return;

    const candidates = mode === "study" && studyWord ? [studyWord] : visibleWords;
    const pending = candidates
      .filter((word) => {
        const key = `${word.sourceId}:${cardMeaningLanguage}`;
        return !wordMeaningTranslations[key] && !meaningTranslationRequestsRef.current.has(key);
      })
      .slice(0, 500);

    if (!pending.length) return;

    for (const word of pending) {
      meaningTranslationRequestsRef.current.add(`${word.sourceId}:${cardMeaningLanguage}`);
    }
    void handleTranslateWordMeaningBatch(pending, cardMeaningLanguage);
  }, [cardMeaningLanguage, mode, studyWord, translatingMeaningBatch, visibleWords, wordMeaningTranslations]);

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
          "Content-Type": "application/json",
          ...authHeaders()
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
    const grammarKey = `${sentenceKey}:${language}`;
    if (exampleGrammar[grammarKey]) return;
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
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          sentence,
          targetLanguage: language
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

      setExampleGrammar((current) => ({ ...current, [grammarKey]: explanation }));
    } catch {
      setTranslationMessages((current) => ({ ...current, [sentenceKey]: t.grammarFailed }));
    } finally {
      setExplainingGrammarKey("");
    }
  }

  async function handleAssessPronunciation(sentenceKey: string, sentence: string, wavBlob: Blob) {
    if (!ensurePremiumAccess()) return;
    if (!apiAvailable || wavBlob.size === 0) {
      setAssessmentMessages((current) => ({ ...current, [sentenceKey]: t.pronunciationAssessFailed }));
      return;
    }

    setAssessingKey(sentenceKey);
    setAssessmentMessages((current) => ({ ...current, [sentenceKey]: "" }));

    try {
      const response = await fetch(apiUrl("/api/pronunciation-assess"), {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav",
          "X-Reference-Text": encodeURIComponent(sentence),
          ...authHeaders()
        },
        body: wavBlob
      });

      if (!response.ok) {
        throw new Error("Failed to assess pronunciation");
      }

      const data = (await response.json()) as PronunciationAssessment;
      setPronunciationAssessments((current) => ({ ...current, [sentenceKey]: data }));
    } catch {
      setAssessmentMessages((current) => ({ ...current, [sentenceKey]: t.pronunciationAssessFailed }));
    } finally {
      setAssessingKey("");
    }
  }

  async function handleAskWord(word: DutchWord, sentence: string, question: string) {
    if (!apiAvailable) {
      setWordAnswerMessages((current) => ({ ...current, [word.sourceId]: t.wordAnswerFailed }));
      return;
    }
    if (!ensurePremiumAccess()) return;

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
          "Content-Type": "application/json",
          ...authHeaders()
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
    <>
    <main>
      <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <aside className="sidebar">
          <button type="button" className="sidebar-brand" onClick={() => setMode("landing")} title={t.appName}>
            <BookOpen size={20} />
            <span className="sidebar-brand-label">{t.appName}</span>
          </button>

          <nav className="sidebar-nav" aria-label={t.viewLabel}>
            <button className={mode === "browse" ? "active" : ""} onClick={() => setMode("browse")} title={t.modeBrowse}>
              <Layers3 size={18} />
              <span>{t.modeBrowse}</span>
            </button>
            <button className={mode === "notebook" ? "active" : ""} onClick={() => setMode("notebook")} title={t.modeNotebook}>
              <BookmarkCheck size={18} />
              <span>{t.modeNotebook}</span>
            </button>
            <button className={mode === "study" ? "active" : ""} onClick={() => setMode("study")} title={t.modeStudy}>
              <Shuffle size={18} />
              <span>{t.modeStudy}</span>
            </button>
            <button className={mode === "speaking" ? "active" : ""} onClick={() => setMode("speaking")} title={t.modeSpeaking}>
              <Mic size={18} />
              <span>{t.modeSpeaking}</span>
            </button>
            <button className={mode === "grammar" ? "active" : ""} onClick={() => setMode("grammar")} title={t.modeGrammar}>
              <BookOpen size={18} />
              <span>{t.modeGrammar}</span>
            </button>
            <button className={mode === "reading" ? "active" : ""} onClick={() => setMode("reading")} title={t.modeReading}>
              <Languages size={18} />
              <span>{t.modeReading}</span>
            </button>
            <button className={mode === "podcast" ? "active" : ""} onClick={() => setMode("podcast")} title={t.modePodcast}>
              <Podcast size={18} />
              <span>{t.modePodcast}</span>
            </button>
            <button className={mode === "method" ? "active" : ""} onClick={() => setMode("method")} title={t.modeMethod}>
              <BookOpen size={18} />
              <span>{t.modeMethod}</span>
            </button>
            <button className={mode === "pricing" ? "active" : ""} onClick={() => setMode("pricing")} title={t.modePricing}>
              <Crown size={18} />
              <span>{t.modePricing}</span>
            </button>
            <button className={mode === "profile" ? "active" : ""} onClick={() => setMode("profile")} title={t.modeProfile}>
              <User size={18} />
              <span>{user ? t.accountLabel : t.authSignInTitle}</span>
              {user ? <span className={`account-nav-dot ${isPremium ? "premium" : ""}`} aria-hidden="true" /> : null}
            </button>
          </nav>

          <div className="sidebar-utilities">
            <label className="sidebar-language">
              <Languages size={16} />
              <select value={language} onChange={(event) => setLanguage(event.target.value as UiLanguage)}>
                {(Object.keys(languageNames) as UiLanguage[]).map((key) => (
                  <option key={key} value={key}>
                    {languageNames[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            title={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span>{t.collapseSidebar}</span>
          </button>
        </aside>

        <div className="content-area">
          {mode === "browse" || mode === "notebook" ? (
          <header className="content-topbar">
            <div className="content-topbar-row">
              <div className="stats">
                <div>
                  <span>{t.statsWords}</span>
                  <strong>{words.length}</strong>
                </div>
                <div>
                  <span>{t.statsUniqueWords}</span>
                  <strong>{totalUniqueWords}</strong>
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

              <div className="card-controls" aria-label={t.cardControlsLabel}>
                <button
                  className={cardsFlipped ? "active" : ""}
                  type="button"
                  onClick={toggleAllCards}
                  title={t.flipAllCardsTitle}
                >
                  <RotateCcw size={16} />
                  <span>{cardsFlipped ? t.cardShowMeaning : t.cardShowDutch}</span>
                </button>
                <label>
                  <span>{t.cardBackLabel}</span>
                  <select
                    value={cardMeaningLanguage}
                    onChange={(event) => setCardMeaningLanguage(event.target.value as CardMeaningLanguage)}
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </label>
              </div>
            </div>

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
              <label className="hide-duplicates-toggle">
                <input
                  type="checkbox"
                  checked={hideDuplicateWords}
                  onChange={(event) => setHideDuplicateWords(event.target.checked)}
                />
                <span>{t.hideDuplicatesLabel}</span>
              </label>
            </div>
          </header>
          ) : null}

      {(mode === "notebook" || mode === "study") && !user ? (
        <AuthGateSection
          t={t}
          title={mode === "notebook" ? t.authRequiredNotebookTitle : t.authRequiredStudyTitle}
          onSignIn={() => setAuthPrompt("login")}
        />
      ) : mode === "method" ? (
        <MethodPage language={language} />
      ) : mode === "pricing" ? (
        <PricingPage
          t={t}
          user={user}
          isPremium={isPremium}
          authHeaders={authHeaders}
          onRequireLogin={() => setAuthPrompt("login")}
          checkoutMessage={checkoutMessage}
        />
      ) : mode === "profile" ? (
        <ProfilePage
          t={t}
          language={language}
          user={user}
          isPremium={isPremium}
          subscriptionInfo={subscriptionInfo}
          authHeaders={authHeaders}
          onRequireLogin={() => setAuthPrompt("login")}
          onSignOut={handleSignOut}
        />
      ) : mode === "grammar" ? (
        <GrammarGuidePage t={t} language={language} premiumGate={premiumGate} />
      ) : mode === "reading" ? (
        <DailyReadingPage t={t} language={language} premiumGate={premiumGate} />
      ) : mode === "podcast" && !isPremium ? (
        <PremiumGateSection t={t} onSubscribe={() => premiumGate.requestPremium()} />
      ) : mode === "podcast" ? (
        <PodcastPage t={t} language={language} premiumGate={premiumGate} />
      ) : mode === "speaking" ? (
        <SpeakingPage t={t} premiumGate={premiumGate} />
      ) : mode === "study" && studyWord ? (
        <section className="study-layout">
          <article className="study-card">
            <div className="study-meta">
              <span className={`pill ${listTone[studyWord.list] ?? "tone-general"}`}>
                {t.list[studyWord.list]} #{studyWord.rank}
              </span>
              {listsFor(studyWord)
                .filter((listName) => listName !== studyWord.list)
                .map((listName) => (
                  <span key={listName} className={`pill ${listTone[listName] ?? "tone-general"}`}>
                    {t.list[listName] ?? listName}
                  </span>
                ))}
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
                {studyCardFlipped ? languageNames[cardMeaningLanguage] : "Nederlands"}
              </span>
              <h2>{studyCardFlipped ? resolveCardMeaning(studyWord, cardMeaningLanguage) : studyWord.word}</h2>
              {!studyCardFlipped && ipaFor(studyWord) ? (
                <span className="ipa-transcription">{ipaFor(studyWord)}</span>
              ) : null}
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
                  {resolveCardMeaning(studyWord, cardMeaningLanguage)}
                </p>
              ) : null}
            </div>

            {!studyCardFlipped ? (
              <>
                <RepeatPractice
                  sentenceKey={studySentenceKey}
                  sentence={sentenceFor(studyWord)}
                  exampleTranslations={translationsFor(studySentenceKey)}
                  grammarExplanation={exampleGrammar[`${studySentenceKey}:${language}`]}
                  translating={translatingLanguageFor(studySentenceKey)}
                  explainingGrammar={explainingGrammarKey === studySentenceKey}
                  translationMessage={translationMessages[studySentenceKey]}
                  onTranslate={handleTranslateExample}
                  onExplainGrammar={handleExplainGrammar}
                  onAssessPronunciation={handleAssessPronunciation}
                  assessing={assessingKey === studySentenceKey}
                  assessment={pronunciationAssessments[studySentenceKey]}
                  assessmentMessage={assessmentMessages[studySentenceKey]}
                  t={t}
                />
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
            <form
              className="jump-box"
              onSubmit={(event) => {
                event.preventDefault();
                jumpToStudyWord();
              }}
            >
              <input
                type="text"
                value={studyJumpValue}
                onChange={(event) => setStudyJumpValue(event.target.value)}
                placeholder={t.studyJumpPlaceholder}
              />
              <button type="submit" disabled={!studyJumpValue.trim()}>
                <ChevronRight size={16} />
                <span>{t.jumpToRankButton}</span>
              </button>
            </form>
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
                      sentence={sentence}
                      exampleTranslations={translationsFor(sentenceKey)}
                      grammarExplanation={exampleGrammar[`${sentenceKey}:${language}`]}
                      translatingExample={translatingLanguageFor(sentenceKey)}
                      explainingGrammar={explainingGrammarKey === sentenceKey}
                      translationMessage={translationMessages[sentenceKey]}
                      onTranslateExample={handleTranslateExample}
                      onExplainGrammar={handleExplainGrammar}
                      onAssessPronunciation={handleAssessPronunciation}
                      assessingPronunciation={assessingKey === sentenceKey}
                      pronunciationAssessment={pronunciationAssessments[sentenceKey]}
                      assessmentMessage={assessmentMessages[sentenceKey]}
                      wordAnswers={wordAnswers[word.sourceId] ?? []}
                      askingWord={askingWordId === word.sourceId}
                      wordAnswerMessage={wordAnswerMessages[word.sourceId]}
                      onAskWord={handleAskWord}
                      flipped={isCardFlipped(word.sourceId)}
                      cardMeaningLanguage={cardMeaningLanguage}
                      meaning={resolveCardMeaning(word, cardMeaningLanguage)}
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
        </div>
      </div>
    </main>
    {authPrompt ? (
      <AuthModal
        t={t}
        reason={authPrompt}
        email={authEmail}
        onEmailChange={setAuthEmail}
        onGoogle={handleSignInWithGoogle}
        onSendEmailLink={handleSendEmailLink}
        sending={authSending}
        statusMessage={authStatusMessage}
        onClose={() => setAuthPrompt(null)}
        onGoToPricing={() => {
          setAuthPrompt(null);
          setMode("pricing");
        }}
        authTab={authTab}
        onAuthTabChange={setAuthTab}
        authFlow={authFlow}
        onAuthFlowChange={setAuthFlow}
        password={authPassword}
        onPasswordChange={setAuthPassword}
        onPasswordSignIn={handlePasswordSignIn}
        onPasswordSignUp={handlePasswordSignUp}
      />
    ) : null}
    </>
  );
}
