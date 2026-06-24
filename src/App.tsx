import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Languages,
  Layers3,
  Mic,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Square,
  Volume2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

type ViewMode = "browse" | "notebook" | "study" | "speaking" | "method";
type UiLanguage = "zh" | "en" | "nl" | "es" | "de";
type ExampleTranslationLanguage = "zh" | "en" | "de";
type CardMeaningLanguage = "en" | "zh";
type WordAnswerTurn = {
  role: "user" | "assistant";
  text: string;
};

const words = frequencyWords as DutchWord[];
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
const languageStorageKey = "dutch-frequency-app-ui-language";
const generatedExamplesStorageKey = "dutch-frequency-app-generated-examples";
const exampleTranslationsStorageKey = "dutch-frequency-app-example-translations";
const exampleGrammarStorageKey = "dutch-frequency-app-example-grammar";
const wordAnswersStorageKey = "dutch-frequency-app-word-answers";
const studyProgressStorageKey = "dutch-frequency-app-study-progress";
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

const translations: Record<
  UiLanguage,
  {
    appName: string;
    title: string;
    subtitle: string;
    language: string;
    statsWords: string;
    statsNotebook: string;
    statsCurrent: string;
    searchPlaceholder: string;
    viewLabel: string;
    modeBrowse: string;
    modeNotebook: string;
    modeStudy: string;
    modeSpeaking: string;
    modeMethod: string;
    filtersLabel: string;
    playPronunciation: string;
    addToNotebook: string;
    removeFromNotebook: string;
    noTranslation: string;
    docsLabel: string;
    resultCount: (count: number) => string;
    showingResults: (shown: number, total: number) => string;
    loadMore: string;
    clearNotebook: string;
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
    startRepeat: string;
    stopRepeat: string;
    youSaid: string;
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
    statsWords: "词库",
    statsNotebook: "单词本",
    statsCurrent: "当前",
    searchPlaceholder: "搜索荷兰语、英文释义或词性",
    viewLabel: "视图",
    modeBrowse: "词频",
    modeNotebook: "单词本",
    modeStudy: "练习",
    modeSpeaking: "口语",
    modeMethod: "方法",
    filtersLabel: "词频分类",
    playPronunciation: "播放读音",
    addToNotebook: "加入单词本",
    removeFromNotebook: "从单词本移除",
    noTranslation: "暂无释义",
    docsLabel: "100 篇文档",
    resultCount: (count) => `${count} 个结果`,
    showingResults: (shown, total) => `显示 ${shown} / ${total}`,
    loadMore: "加载更多",
    clearNotebook: "清空单词本",
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
    startRepeat: "开始跟读",
    stopRepeat: "停止",
    youSaid: "你读的是",
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
    statsWords: "Words",
    statsNotebook: "Notebook",
    statsCurrent: "Current",
    searchPlaceholder: "Search Dutch, English meaning, or part of speech",
    viewLabel: "View",
    modeBrowse: "Frequency",
    modeNotebook: "Notebook",
    modeStudy: "Study",
    modeSpeaking: "Speaking",
    modeMethod: "Method",
    filtersLabel: "Frequency lists",
    playPronunciation: "Play pronunciation",
    addToNotebook: "Add to notebook",
    removeFromNotebook: "Remove from notebook",
    noTranslation: "No translation",
    docsLabel: "100 docs",
    resultCount: (count) => `${count} results`,
    showingResults: (shown, total) => `Showing ${shown} / ${total}`,
    loadMore: "Load more",
    clearNotebook: "Clear notebook",
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
    startRepeat: "Start repeat",
    stopRepeat: "Stop",
    youSaid: "You said",
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
    statsWords: "Woorden",
    statsNotebook: "Woordenlijst",
    statsCurrent: "Huidig",
    searchPlaceholder: "Zoek Nederlands, Engelse betekenis of woordsoort",
    viewLabel: "Weergave",
    modeBrowse: "Frequentie",
    modeNotebook: "Woordenlijst",
    modeStudy: "Oefenen",
    modeSpeaking: "Spreken",
    modeMethod: "Methode",
    filtersLabel: "Frequentielijsten",
    playPronunciation: "Uitspraak afspelen",
    addToNotebook: "Toevoegen aan woordenlijst",
    removeFromNotebook: "Verwijderen uit woordenlijst",
    noTranslation: "Geen vertaling",
    docsLabel: "100 documenten",
    resultCount: (count) => `${count} resultaten`,
    showingResults: (shown, total) => `${shown} / ${total} getoond`,
    loadMore: "Meer laden",
    clearNotebook: "Woordenlijst wissen",
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
    startRepeat: "Nazeggen starten",
    stopRepeat: "Stoppen",
    youSaid: "Je zei",
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
    statsWords: "Palabras",
    statsNotebook: "Cuaderno",
    statsCurrent: "Actual",
    searchPlaceholder: "Buscar neerlandés, significado en inglés o categoría",
    viewLabel: "Vista",
    modeBrowse: "Frecuencia",
    modeNotebook: "Cuaderno",
    modeStudy: "Practicar",
    modeSpeaking: "Hablar",
    modeMethod: "Método",
    filtersLabel: "Listas de frecuencia",
    playPronunciation: "Reproducir pronunciación",
    addToNotebook: "Añadir al cuaderno",
    removeFromNotebook: "Quitar del cuaderno",
    noTranslation: "Sin traducción",
    docsLabel: "100 documentos",
    resultCount: (count) => `${count} resultados`,
    showingResults: (shown, total) => `Mostrando ${shown} / ${total}`,
    loadMore: "Cargar más",
    clearNotebook: "Vaciar cuaderno",
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
    startRepeat: "Empezar a repetir",
    stopRepeat: "Detener",
    youSaid: "Has dicho",
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
    statsWords: "Wörter",
    statsNotebook: "Wortliste",
    statsCurrent: "Aktuell",
    searchPlaceholder: "Niederländisch, englische Bedeutung oder Wortart suchen",
    viewLabel: "Ansicht",
    modeBrowse: "Frequenz",
    modeNotebook: "Wortliste",
    modeStudy: "Üben",
    modeSpeaking: "Sprechen",
    modeMethod: "Methode",
    filtersLabel: "Frequenzlisten",
    playPronunciation: "Aussprache abspielen",
    addToNotebook: "Zur Wortliste hinzufügen",
    removeFromNotebook: "Aus Wortliste entfernen",
    noTranslation: "Keine Übersetzung",
    docsLabel: "100 Dokumente",
    resultCount: (count) => `${count} Ergebnisse`,
    showingResults: (shown, total) => `${shown} / ${total} angezeigt`,
    loadMore: "Mehr laden",
    clearNotebook: "Wortliste leeren",
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
    startRepeat: "Nachsprechen starten",
    stopRepeat: "Stoppen",
    youSaid: "Du hast gesagt",
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

function getBestDutchVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices
    .filter((voice) => voice.lang.toLocaleLowerCase("nl-NL").startsWith("nl"))
    .sort((first, second) => scoreDutchVoice(second) - scoreDutchVoice(first))[0];
}

function speakText(text: string) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBestDutchVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "nl-NL";
    window.speechSynthesis.getVoices();
  }
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function speak(word: DutchWord) {
  speakText(cleanWord(word.word));
}

function getSavedIds() {
  try {
    const value = JSON.parse(localStorage.getItem(notebookStorageKey) ?? "[]");
    return new Set<string>(Array.isArray(value) ? value : []);
  } catch {
    return new Set<string>();
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
  const [listening, setListening] = useState(false);
  const [recognized, setRecognized] = useState("");
  const [message, setMessage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<ExampleTranslationLanguage>(defaultExampleTranslationLanguage);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function startRepeat() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
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
      setRecognized(lastResult?.[0]?.transcript ?? "");
      setMessage("");
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

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
      <div className="repeat-actions">
        <button className="mini-button" type="button" onClick={startRepeat}>
          {listening ? <Square size={14} /> : <Mic size={15} />}
          <span>{listening ? t.stopRepeat : t.startRepeat}</span>
        </button>
      </div>
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
      {recognized ? (
        <p className="recognized">
          <strong>{t.youSaid}:</strong> {recognized}
        </p>
      ) : null}
      {message ? <p className="recognized muted">{message}</p> : null}
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
  t
}: {
  item: DutchWord;
  saved: boolean;
  onToggle: (id: string) => void;
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
  t: (typeof translations)[UiLanguage];
}) {
  const meaning = cardMeaningFor(item, cardMeaningLanguage) || t.noTranslation;
  const primaryText = flipped ? meaning : item.word;
  const secondaryText = flipped ? item.word : meaning;
  const primaryLabel = flipped ? (cardMeaningLanguage === "zh" ? "中文" : "English") : "Nederlands";
  const secondaryLabel = flipped ? "Nederlands" : cardMeaningLanguage === "zh" ? "中文" : "English";
  const [question, setQuestion] = useState("");

  function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed || askingWord) return;
    onAskWord(item, sentence, trimmed);
    setQuestion("");
  }

  return (
    <article className="word-card">
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
            sentenceKey={item.sourceId}
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

export default function App() {
  const [mode, setMode] = useState<ViewMode>("browse");
  const [language, setLanguage] = useState<UiLanguage>(getSavedLanguage);
  const [query, setQuery] = useState("");
  const [selectedList, setSelectedList] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(getSavedIds);
  const [bookExamples, setBookExamples] = useState<Record<string, string>>({});
  const [generatedExamples, setGeneratedExamples] = useState<Record<string, string>>(getSavedGeneratedExamples);
  const [exampleTranslations, setExampleTranslations] =
    useState<Record<string, string>>(getSavedExampleTranslations);
  const [exampleGrammar, setExampleGrammar] = useState<Record<string, string>>(getSavedExampleGrammar);
  const [wordAnswers, setWordAnswers] = useState<Record<string, WordAnswerTurn[]>>(getSavedWordAnswers);
  const [studyProgress, setStudyProgress] = useState<Record<string, StudyProgress>>(getSavedStudyProgress);
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
  const autoTranslationRequestsRef = useRef<Set<string>>(new Set());
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem(notebookStorageKey, JSON.stringify(Array.from(savedIds)));
  }, [savedIds]);

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
    localStorage.setItem(wordAnswersStorageKey, JSON.stringify(wordAnswers));
  }, [wordAnswers]);

  useEffect(() => {
    localStorage.setItem(studyProgressStorageKey, JSON.stringify(studyProgress));
  }, [studyProgress]);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);

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
    setVisibleLimit(180);
  }, [mode, query, selectedList]);

  const matchingWords = useMemo(() => {
    const source = mode === "notebook" ? savedWords : words;
    const needle = normalize(query);
    return source
      .filter((word) => selectedList === "All" || word.list === selectedList)
      .filter((word) => {
        if (!needle) return true;
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
    return generatedExamples[word.sourceId] ?? bookExamples[word.sourceId] ?? makeExampleSentence(word);
  }

  function translationsFor(sourceId: string) {
    return {
      zh: exampleTranslations[`${sourceId}:zh`],
      en: exampleTranslations[`${sourceId}:en`],
      de: exampleTranslations[`${sourceId}:de`]
    };
  }

  useEffect(() => {
    if (!apiAvailable || translatingKey) return;

    const candidates = mode === "study" && studyWord ? [studyWord] : visibleWords;
    const nextWord = candidates.find((word) => {
      const sentence = sentenceFor(word);
      const cacheKey = `${word.sourceId}:${defaultExampleTranslationLanguage}`;
      const requestKey = `${cacheKey}:${sentence}`;
      return sentence && !exampleTranslations[cacheKey] && !autoTranslationRequestsRef.current.has(requestKey);
    });

    if (!nextWord) return;

    const sentence = sentenceFor(nextWord);
    const cacheKey = `${nextWord.sourceId}:${defaultExampleTranslationLanguage}`;
    autoTranslationRequestsRef.current.add(`${cacheKey}:${sentence}`);
    void handleTranslateExample(nextWord.sourceId, sentence, defaultExampleTranslationLanguage);
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
        delete next[`${word.sourceId}:zh`];
        delete next[`${word.sourceId}:en`];
        delete next[`${word.sourceId}:de`];
        return next;
      });
      setExampleGrammar((current) => {
        const next = { ...current };
        delete next[word.sourceId];
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

        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>

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
            <button className={mode === "method" ? "active" : ""} onClick={() => setMode("method")}>
              <BookOpen size={17} />
              <span>{t.modeMethod}</span>
            </button>
          </div>

          {mode !== "method" && mode !== "speaking" ? (
            <div className="card-controls" aria-label="Card side controls">
              <button
                className={cardsFlipped ? "active" : ""}
                type="button"
                onClick={toggleAllCards}
                title="Flip all visible word cards"
              >
                <RotateCcw size={16} />
                <span>{cardsFlipped ? "释义 → 荷兰文" : "荷兰文 → 释义"}</span>
              </button>
              <label>
                <span>背面</span>
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

        {mode !== "method" && mode !== "speaking" ? (
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
                  sentenceKey={studyWord.sourceId}
                  sentence={sentenceFor(studyWord)}
                  exampleTranslations={translationsFor(studyWord.sourceId)}
                  grammarExplanation={exampleGrammar[studyWord.sourceId]}
                  translating={
                    translatingKey.startsWith(`${studyWord.sourceId}:`)
                      ? (translatingKey.split(":")[1] as ExampleTranslationLanguage)
                      : ""
                  }
                  explainingGrammar={explainingGrammarKey === studyWord.sourceId}
                  translationMessage={translationMessages[studyWord.sourceId]}
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
            {mode === "notebook" && savedIds.size > 0 ? (
              <button type="button" onClick={() => setSavedIds(new Set())}>
                <RotateCcw size={16} />
                <span>{t.clearNotebook}</span>
              </button>
            ) : null}
          </div>

          {visibleWords.length > 0 ? (
            <>
              <div className="word-grid">
                {visibleWords.map((word) => (
                  <WordCard
                    key={word.sourceId}
                    item={word}
                  saved={savedIds.has(word.sourceId)}
                  onToggle={toggleSaved}
                  onGenerateExample={handleGenerateExample}
                  sentence={sentenceFor(word)}
                  exampleTranslations={translationsFor(word.sourceId)}
                  grammarExplanation={exampleGrammar[word.sourceId]}
                  translatingExample={
                    translatingKey.startsWith(`${word.sourceId}:`)
                      ? (translatingKey.split(":")[1] as ExampleTranslationLanguage)
                      : ""
                  }
                  explainingGrammar={explainingGrammarKey === word.sourceId}
                  translationMessage={translationMessages[word.sourceId]}
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
                  t={t}
                />
                ))}
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
