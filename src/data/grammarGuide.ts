export type GrammarLang = "zh" | "en" | "nl" | "es" | "de";

export type LocalizedText = Record<GrammarLang, string>;
export type LocalizedList = Record<GrammarLang, string[]>;

function L(zh: string, en: string, nl: string, es: string, de: string): LocalizedText {
  return { zh, en, nl, es, de };
}

function LA(zh: string[], en: string[], nl: string[], es: string[], de: string[]): LocalizedList {
  return { zh, en, nl, es, de };
}

export type GrammarNode = {
  id: string;
  title: LocalizedText;
  detail?: LocalizedText;
  children?: GrammarNode[];
};

export type GrammarChapter = {
  id: string;
  partId: string;
  title: LocalizedText;
  pageRange: string;
  summary: LocalizedText;
  goals: LocalizedList;
  pitfalls: LocalizedList;
  nodes: GrammarNode[];
};

export type GrammarPart = {
  id: string;
  title: LocalizedText;
  pageRange: string;
  theme: LocalizedText;
  chapters: GrammarChapter[];
};

export const grammarGuideParts: GrammarPart[] = [
  {
    id: "morphology",
    title: L("第一部分 词法", "Part 1: Morphology", "Deel 1: Morfologie", "Parte 1: Morfología", "Teil 1: Morphologie"),
    pageRange: "1-84",
    theme: L(
      "从单词本身出发：词性、变形、搭配和形式变化。",
      "Starting from the word itself: word class, inflection, collocation, and form changes.",
      "Vanuit het woord zelf: woordsoort, verbuiging, combinaties en vormveranderingen.",
      "Partiendo de la propia palabra: categoría gramatical, flexión, combinaciones y cambios de forma.",
      "Ausgehend vom Wort selbst: Wortart, Flexion, Kollokationen und Formveränderungen."
    ),
    chapters: [
      {
        id: "nouns",
        partId: "morphology",
        title: L("名词", "Nouns", "Zelfstandige naamwoorden", "Sustantivos", "Nomen (Substantive)"),
        pageRange: "1-8",
        summary: L(
          "学习名词时，把词性、de/het、可数性、复数和变小词作为一个整体记忆。",
          "When learning nouns, memorize gender, de/het, countability, plural forms, and diminutives together as one whole.",
          "Leer bij zelfstandige naamwoorden geslacht, de/het, telbaarheid, meervoud en verkleinwoorden als één geheel.",
          "Al aprender sustantivos, memoriza el género, de/het, la contabilidad, el plural y los diminutivos como un conjunto.",
          "Beim Lernen von Nomen sollte man Genus, de/het, Zählbarkeit, Plural und Diminutiv als Einheit lernen."
        ),
        goals: LA(
          ["能判断名词学习时要记录哪些信息", "能识别复数和变小词的基本形式", "理解中文没有名词词性的迁移难点"],
          [
            "Know which information to record when learning a noun",
            "Recognize basic plural and diminutive forms",
            "Understand the transfer difficulty since Chinese has no grammatical gender"
          ],
          [
            "Weten welke informatie je bij een zelfstandig naamwoord moet noteren",
            "De basisvormen van meervoud en verkleinwoord herkennen",
            "Begrijpen waarom grammaticaal geslacht moeilijk is voor Chinese leerders (het Chinees heeft dit niet)"
          ],
          [
            "Saber qué información anotar al aprender un sustantivo",
            "Reconocer las formas básicas del plural y el diminutivo",
            "Entender la dificultad de transferencia, ya que el chino no tiene género gramatical"
          ],
          [
            "Wissen, welche Informationen man sich bei einem Nomen merken sollte",
            "Die Grundformen von Plural und Diminutiv erkennen",
            "Die Transferschwierigkeit verstehen, da das Chinesische kein grammatisches Genus kennt"
          ]
        ),
        pitfalls: LA(
          ["只背中文意思，不背 de/het", "把不可数名词按中文习惯随意加复数", "看到 -je 只理解为“小”，忽略亲切或具体化语气"],
          [
            "Only memorizing the Chinese meaning, not de/het",
            "Pluralizing uncountable nouns out of Chinese habit",
            "Reading -je only as 'small', ignoring its affectionate or concretizing tone"
          ],
          [
            "Alleen de betekenis onthouden, niet de/het",
            "Ontelbare zelfstandige naamwoorden toch meervoud geven uit gewoonte",
            "-je alleen als 'klein' opvatten, de liefkozende of concretiserende toon negeren"
          ],
          [
            "Memorizar solo el significado y no de/het",
            "Pluralizar sustantivos incontables por costumbre del chino",
            "Interpretar -je solo como 'pequeño', ignorando su matiz cariñoso o concretizador"
          ],
          [
            "Nur die Bedeutung lernen, nicht de/het",
            "Unzählbare Nomen aus chinesischer Gewohnheit trotzdem in den Plural setzen",
            "-je nur als 'klein' verstehen und den liebevollen oder konkretisierenden Ton übersehen"
          ]
        ),
        nodes: [
          {
            id: "noun-gender",
            title: L("名词词性", "Noun gender", "Geslacht van zelfstandige naamwoorden", "Género del sustantivo", "Genus des Nomens"),
            detail: L(
              "荷兰语名词有阴、阳、中性；实际学习中最重要的是和 de/het 一起记。",
              "Dutch nouns are feminine, masculine, or neuter; in practice, the most important thing is to learn them together with de/het.",
              "Nederlandse zelfstandige naamwoorden zijn vrouwelijk, mannelijk of onzijdig; in de praktijk is het belangrijkst om ze samen met de/het te leren.",
              "Los sustantivos neerlandeses son femeninos, masculinos o neutros; en la práctica, lo más importante es aprenderlos junto con de/het.",
              "Niederländische Nomen sind weiblich, männlich oder sächlich; in der Praxis ist es am wichtigsten, sie zusammen mit de/het zu lernen."
            ),
            children: [
              {
                id: "noun-gender-patterns",
                title: L("可观察规律", "Observable patterns", "Herkenbare patronen", "Patrones observables", "Erkennbare Muster"),
                detail: L(
                  "-heid、-ing 常见为 de-词；-ment、-isme 常见为 het-词。",
                  "Nouns ending in -heid, -ing are usually de-words; -ment, -isme are usually het-words.",
                  "-heid, -ing zijn meestal de-woorden; -ment, -isme zijn meestal het-woorden.",
                  "Las terminaciones -heid, -ing suelen ser palabras de; -ment, -isme suelen ser palabras het.",
                  "-heid, -ing sind meist de-Wörter; -ment, -isme sind meist het-Wörter."
                )
              },
              {
                id: "noun-gender-plural",
                title: L("复数词性", "Gender of plurals", "Geslacht in het meervoud", "Género en plural", "Genus im Plural"),
                detail: L(
                  "复数名词通常用 de。",
                  "Plural nouns usually take de.",
                  "Meervoudsvormen krijgen meestal de.",
                  "Los sustantivos en plural suelen usar de.",
                  "Pluralformen erhalten meist de."
                )
              }
            ]
          },
          {
            id: "noun-countability",
            title: L("可数与不可数", "Countable vs. uncountable", "Telbaar en ontelbaar", "Contable e incontable", "Zählbar und unzählbar"),
            detail: L(
              "决定能否用 een、能否自然变复数。",
              "Determines whether een can be used and whether the noun naturally pluralizes.",
              "Bepaalt of je een kunt gebruiken en of het woord van nature een meervoud heeft.",
              "Determina si se puede usar een y si el sustantivo se pluraliza de forma natural.",
              "Bestimmt, ob een verwendet werden kann und ob das Nomen natürlich einen Plural bildet."
            ),
            children: [
              {
                id: "countable",
                title: L("可数名词", "Countable nouns", "Telbare zelfstandige naamwoorden", "Sustantivos contables", "Zählbare Nomen"),
                detail: L(
                  "可与 een 连用，通常有复数形式。",
                  "Can combine with een and usually have a plural form.",
                  "Kunnen met een gecombineerd worden en hebben meestal een meervoud.",
                  "Pueden combinarse con een y suelen tener forma plural.",
                  "Können mit een kombiniert werden und haben meist eine Pluralform."
                )
              },
              {
                id: "uncountable",
                title: L("不可数名词", "Uncountable nouns", "Ontelbare zelfstandige naamwoorden", "Sustantivos incontables", "Unzählbare Nomen"),
                detail: L(
                  "表示物质、抽象概念时常不可数。",
                  "Often uncountable when denoting substances or abstract concepts.",
                  "Vaak ontelbaar bij stoffen of abstracte begrippen.",
                  "Suelen ser incontables cuando denotan sustancias o conceptos abstractos.",
                  "Oft unzählbar, wenn sie Stoffe oder abstrakte Begriffe bezeichnen."
                )
              }
            ]
          },
          {
            id: "noun-plural",
            title: L("复数形式", "Plural forms", "Meervoudsvormen", "Formas del plural", "Pluralformen"),
            detail: L(
              "重点关注 -en、-s 以及拼写变化。",
              "Focus on -en, -s, and spelling changes.",
              "Let vooral op -en, -s en spellingveranderingen.",
              "Presta atención a -en, -s y a los cambios ortográficos.",
              "Achte besonders auf -en, -s und Rechtschreibänderungen."
            ),
            children: [
              {
                id: "plural-en",
                title: L("-en", "-en", "-en", "-en", "-en"),
                detail: L(
                  "常见复数后缀，可能触发元音/辅音拼写调整。",
                  "The most common plural suffix; may trigger vowel/consonant spelling adjustments.",
                  "De meest voorkomende meervoudsuitgang; kan klinker-/medeklinkerwijzigingen veroorzaken.",
                  "El sufijo de plural más común; puede provocar ajustes ortográficos de vocales o consonantes.",
                  "Die häufigste Pluralendung; kann Anpassungen bei Vokalen/Konsonanten auslösen."
                )
              },
              {
                id: "plural-s",
                title: L("-s", "-s", "-s", "-s", "-s"),
                detail: L(
                  "常见于部分外来词、元音结尾词等。",
                  "Common with some loanwords, words ending in a vowel, and similar cases.",
                  "Komt voor bij sommige leenwoorden, woorden die op een klinker eindigen, enzovoort.",
                  "Frecuente en algunos préstamos, palabras terminadas en vocal, etc.",
                  "Häufig bei manchen Lehnwörtern, auf Vokal endenden Wörtern usw."
                )
              }
            ]
          },
          {
            id: "noun-diminutive",
            title: L("变小词", "Diminutives", "Verkleinwoorden", "Diminutivos", "Diminutive (Verkleinerungsformen)"),
            detail: L(
              "常见 -je/-tje/-pje/-etje；表达小、亲切、具体化。",
              "Common forms: -je/-tje/-pje/-etje; express smallness, affection, or concreteness.",
              "Veelvoorkomende vormen: -je/-tje/-pje/-etje; drukken klein, lief of concreet uit.",
              "Formas comunes: -je/-tje/-pje/-etje; expresan pequeñez, cariño o concreción.",
              "Häufige Formen: -je/-tje/-pje/-etje; drücken Kleinheit, Zuneigung oder Konkretheit aus."
            )
          },
          {
            id: "gerund",
            title: L("动名词", "Gerunds", "Gerundium", "Gerundios (sustantivación verbal)", "Gerundium (substantivierte Verben)"),
            detail: L(
              "动词名词化后可像名词一样在句中使用。",
              "Nominalized verbs that can be used like nouns in a sentence.",
              "Genominaliseerde werkwoorden die als zelfstandig naamwoord in een zin gebruikt kunnen worden.",
              "Verbos sustantivados que pueden usarse como sustantivos en la oración.",
              "Substantivierte Verben, die im Satz wie Nomen verwendet werden können."
            )
          }
        ]
      },
      {
        id: "articles",
        partId: "morphology",
        title: L("冠词", "Articles", "Lidwoorden", "Artículos", "Artikel"),
        pageRange: "11-14",
        summary: L(
          "冠词是中文学习者的核心难点：要区分定冠词 de/het、不定冠词 een，以及不用冠词的场景。",
          "Articles are a core difficulty for Chinese learners: you must distinguish the definite articles de/het, the indefinite article een, and situations with no article.",
          "Lidwoorden zijn een kernprobleem voor Chinese leerders: je moet het bepaald lidwoord de/het, het onbepaald lidwoord een en situaties zonder lidwoord onderscheiden.",
          "Los artículos son una dificultad central para los hablantes de chino: hay que distinguir los artículos definidos de/het, el artículo indefinido een y los casos sin artículo.",
          "Artikel sind eine zentrale Schwierigkeit für chinesische Lernende: man muss die bestimmten Artikel de/het, den unbestimmten Artikel een und Fälle ohne Artikel unterscheiden."
        ),
        goals: LA(
          ["理解定冠词和不定冠词的语义差别", "能把冠词和名词一起记", "能初步判断什么时候不用冠词"],
          [
            "Understand the semantic difference between definite and indefinite articles",
            "Learn articles together with their nouns",
            "Make a basic judgment on when no article is used"
          ],
          [
            "Het semantische verschil tussen bepaald en onbepaald lidwoord begrijpen",
            "Lidwoorden samen met het zelfstandig naamwoord leren",
            "Een eerste inschatting kunnen maken wanneer geen lidwoord wordt gebruikt"
          ],
          [
            "Comprender la diferencia semántica entre artículos definidos e indefinidos",
            "Aprender los artículos junto con su sustantivo",
            "Poder determinar de forma básica cuándo no se usa artículo"
          ],
          [
            "Den semantischen Unterschied zwischen bestimmtem und unbestimmtem Artikel verstehen",
            "Artikel zusammen mit dem Nomen lernen",
            "Grundsätzlich einschätzen können, wann kein Artikel verwendet wird"
          ]
        ),
        pitfalls: LA(
          ["按中文习惯漏掉冠词", "把 de/het 当成可随意互换", "复数名词前误用 een"],
          [
            "Omitting articles out of Chinese habit",
            "Treating de/het as freely interchangeable",
            "Mistakenly using een before plural nouns"
          ],
          [
            "Lidwoorden weglaten uit Chinese gewoonte",
            "de/het als willekeurig verwisselbaar behandelen",
            "een ten onrechte voor een meervoud gebruiken"
          ],
          [
            "Omitir artículos por costumbre del chino",
            "Tratar de/het como intercambiables libremente",
            "Usar erróneamente een antes de un sustantivo en plural"
          ],
          [
            "Artikel aus chinesischer Gewohnheit weglassen",
            "de/het als beliebig austauschbar behandeln",
            "een fälschlich vor einem Pluralnomen verwenden"
          ]
        ),
        nodes: [
          {
            id: "definite-articles",
            title: L("定冠词", "Definite articles", "Bepaald lidwoord", "Artículos definidos", "Bestimmter Artikel"),
            detail: L(
              "de/het 用于特指、已知、类别或固定表达。",
              "de/het are used for specific reference, known items, categories, or fixed expressions.",
              "de/het worden gebruikt voor iets specifieks, bekend, een categorie of vaste uitdrukkingen.",
              "de/het se usan para referencia específica, algo conocido, una categoría o expresiones fijas.",
              "de/het werden für Bestimmtes, Bekanntes, Kategorien oder feste Ausdrücke verwendet."
            ),
            children: [
              {
                id: "de-words",
                title: L("de-词", "de-words", "de-woorden", "Palabras de", "de-Wörter"),
                detail: L(
                  "通性名词和复数名词常用 de。",
                  "Common-gender and plural nouns usually take de.",
                  "Woorden van het gewone geslacht en meervoudsvormen krijgen meestal de.",
                  "Los sustantivos de género común y en plural suelen usar de.",
                  "Nomen mit Genus commune und Pluralformen erhalten meist de."
                )
              },
              {
                id: "het-words",
                title: L("het-词", "het-words", "het-woorden", "Palabras het", "het-Wörter"),
                detail: L(
                  "中性单数名词用 het。",
                  "Neuter singular nouns take het.",
                  "Onzijdige zelfstandige naamwoorden in het enkelvoud krijgen het.",
                  "Los sustantivos neutros en singular usan het.",
                  "Sächliche Nomen im Singular erhalten het."
                )
              }
            ]
          },
          {
            id: "indefinite-article",
            title: L("不定冠词 een", "Indefinite article een", "Onbepaald lidwoord een", "Artículo indefinido een", "Unbestimmter Artikel een"),
            detail: L(
              "用于单数可数名词，表示一个、某个、非特指。",
              "Used with singular countable nouns to mean 'a/an', 'some', or a non-specific reference.",
              "Gebruikt bij enkelvoudige telbare zelfstandige naamwoorden om 'een', 'zeker' of iets niet-specifieks aan te duiden.",
              "Se usa con sustantivos contables en singular para expresar 'un/una', 'cierto' o algo no específico.",
              "Wird bei zählbaren Nomen im Singular verwendet und bedeutet 'ein/eine', 'ein gewisser' oder etwas Unbestimmtes."
            )
          },
          {
            id: "zero-article",
            title: L("不用冠词", "No article", "Geen lidwoord", "Sin artículo", "Kein Artikel"),
            detail: L(
              "复数泛指、不可数、部分固定搭配中可能不用冠词。",
              "No article may be used for generic plurals, uncountable nouns, or certain fixed expressions.",
              "Bij algemene meervouden, ontelbare zelfstandige naamwoorden of bepaalde vaste uitdrukkingen wordt soms geen lidwoord gebruikt.",
              "Puede no usarse artículo con plurales genéricos, sustantivos incontables o ciertas expresiones fijas.",
              "Bei generischen Pluralformen, unzählbaren Nomen oder bestimmten festen Ausdrücken kann der Artikel fehlen."
            )
          }
        ]
      },
      {
        id: "adjectives",
        partId: "morphology",
        title: L("形容词", "Adjectives", "Bijvoeglijke naamwoorden", "Adjetivos", "Adjektive"),
        pageRange: "15-21",
        summary: L(
          "形容词重点是定语加 -e、比较级、最高级，以及形容词名词化。",
          "The focus for adjectives is the attributive -e ending, comparatives, superlatives, and nominalized adjectives.",
          "Bij bijvoeglijke naamwoorden ligt de focus op de attributieve -e, de vergrotende en overtreffende trap, en de nominalisering van bijvoeglijke naamwoorden.",
          "El enfoque en los adjetivos está en la terminación atributiva -e, el comparativo, el superlativo y la sustantivación del adjetivo.",
          "Der Schwerpunkt bei Adjektiven liegt auf der attributiven -e-Endung, dem Komparativ, dem Superlativ und der Substantivierung von Adjektiven."
        ),
        goals: LA(
          ["区分定语和表语位置", "掌握 -e 变形的判断路径", "能形成比较级/最高级"],
          [
            "Distinguish attributive from predicative position",
            "Master how to judge the -e ending",
            "Be able to form comparatives/superlatives"
          ],
          [
            "Attributieve en predicatieve positie onderscheiden",
            "De regels voor de -e-uitgang beheersen",
            "De vergrotende/overtreffende trap kunnen vormen"
          ],
          [
            "Distinguir la posición atributiva de la predicativa",
            "Dominar el criterio para la terminación -e",
            "Poder formar el comparativo/superlativo"
          ],
          [
            "Attributive und prädikative Stellung unterscheiden",
            "Die Regeln für die -e-Endung beherrschen",
            "Komparativ/Superlativ bilden können"
          ]
        ),
        pitfalls: LA(
          ["把表语形容词也加 -e", "忽略 het + 单数 + 不定语境时的特殊情况", "只记 groter，不理解拼写变化"],
          [
            "Adding -e to predicative adjectives too",
            "Ignoring the special case of het + singular + indefinite context",
            "Only memorizing groter without understanding the spelling change"
          ],
          [
            "Ook bij predicatief gebruik -e toevoegen",
            "De speciale situatie bij het + enkelvoud + onbepaalde context negeren",
            "Alleen groter onthouden zonder de spellingverandering te begrijpen"
          ],
          [
            "Añadir -e también a los adjetivos predicativos",
            "Ignorar el caso especial de het + singular + contexto indefinido",
            "Memorizar solo groter sin entender el cambio ortográfico"
          ],
          [
            "Auch bei prädikativer Stellung -e anhängen",
            "Den Sonderfall het + Singular + unbestimmter Kontext übersehen",
            "Nur groter merken, ohne die Rechtschreibänderung zu verstehen"
          ]
        ),
        nodes: [
          {
            id: "adj-attributive",
            title: L(
              "作定语时的变形",
              "Attributive inflection",
              "Verbuiging bij attributief gebruik",
              "Flexión en posición atributiva",
              "Flexion in attributiver Stellung"
            ),
            detail: L(
              "名词前的形容词常加 -e，但受冠词、词性、单复数影响。",
              "Adjectives before a noun usually add -e, but this depends on the article, gender, and number.",
              "Bijvoeglijke naamwoorden voor een zelfstandig naamwoord krijgen meestal -e, afhankelijk van lidwoord, geslacht en enkel-/meervoud.",
              "Los adjetivos antes de un sustantivo suelen añadir -e, según el artículo, el género y el número.",
              "Adjektive vor einem Nomen erhalten meist -e, abhängig von Artikel, Genus und Numerus."
            ),
            children: [
              {
                id: "adj-before-noun",
                title: L("名词前", "Before the noun", "Voor het zelfstandig naamwoord", "Antes del sustantivo", "Vor dem Nomen"),
                detail: L(
                  "een groot huis / het grote huis / de grote tafel。",
                  "een groot huis / het grote huis / de grote tafel.",
                  "een groot huis / het grote huis / de grote tafel.",
                  "een groot huis / het grote huis / de grote tafel.",
                  "een groot huis / het grote huis / de grote tafel."
                )
              },
              {
                id: "adj-predicate",
                title: L("作表语", "As a predicate", "Predicatief gebruik", "Como predicado", "Als Prädikat"),
                detail: L(
                  "在 zijn/worden 等后通常不加 -e：het huis is groot。",
                  "After verbs like zijn/worden, -e is usually not added: het huis is groot.",
                  "Na werkwoorden als zijn/worden wordt meestal geen -e toegevoegd: het huis is groot.",
                  "Después de verbos como zijn/worden, normalmente no se añade -e: het huis is groot.",
                  "Nach Verben wie zijn/worden wird meist kein -e angehängt: het huis is groot."
                )
              }
            ]
          },
          {
            id: "adj-comparative",
            title: L("比较级", "Comparative", "Vergrotende trap", "Comparativo", "Komparativ"),
            detail: L(
              "常用 -er，也可用 meer + 原级。",
              "Usually formed with -er, or with meer + base form.",
              "Meestal met -er, of met meer + stam.",
              "Normalmente con -er, o con meer + forma base.",
              "Meist mit -er, oder mit meer + Grundform."
            )
          },
          {
            id: "adj-superlative",
            title: L("最高级", "Superlative", "Overtreffende trap", "Superlativo", "Superlativ"),
            detail: L(
              "常用 -st，也可用 meest + 原级。",
              "Usually formed with -st, or with meest + base form.",
              "Meestal met -st, of met meest + stam.",
              "Normalmente con -st, o con meest + forma base.",
              "Meist mit -st, oder mit meest + Grundform."
            )
          },
          {
            id: "adj-as-noun",
            title: L(
              "形容词名词化",
              "Nominalized adjectives",
              "Genominaliseerde bijvoeglijke naamwoorden",
              "Adjetivos sustantivados",
              "Substantivierte Adjektive"
            ),
            detail: L(
              "形容词可转为指人/事物的名词性表达。",
              "Adjectives can be converted into noun-like expressions referring to people or things.",
              "Bijvoeglijke naamwoorden kunnen worden omgezet in naamwoordelijke uitdrukkingen die naar personen of dingen verwijzen.",
              "Los adjetivos pueden convertirse en expresiones nominales que designan personas o cosas.",
              "Adjektive können in nominale Ausdrücke umgewandelt werden, die sich auf Personen oder Dinge beziehen."
            )
          }
        ]
      },
      {
        id: "adverbs",
        partId: "morphology",
        title: L("副词", "Adverbs", "Bijwoorden", "Adverbios", "Adverbien"),
        pageRange: "25-27",
        summary: L(
          "副词说明时间、地点、方式、程度；er 是中文学习者最需要单独攻克的特殊副词。",
          "Adverbs express time, place, manner, and degree; er is the special adverb that Chinese learners most need to tackle separately.",
          "Bijwoorden geven tijd, plaats, wijze en graad aan; er is het speciale bijwoord dat Chinese leerders apart moeten aanpakken.",
          "Los adverbios expresan tiempo, lugar, modo y grado; er es el adverbio especial que los hablantes de chino más necesitan abordar por separado.",
          "Adverbien drücken Zeit, Ort, Art und Grad aus; er ist das besondere Adverb, das chinesische Lernende gesondert bewältigen müssen."
        ),
        goals: LA(
          ["识别副词在句中修饰什么", "理解 er 的存在、地点、数量和代词性用法", "知道副词位置会影响句子自然度"],
          [
            "Identify what the adverb modifies in the sentence",
            "Understand er's existential, locative, quantitative, and pronominal uses",
            "Know that adverb position affects how natural the sentence sounds"
          ],
          [
            "Herkennen wat het bijwoord in de zin wijzigt",
            "Het existentiële, locatieve, kwantitatieve en voornaamwoordelijke gebruik van er begrijpen",
            "Weten dat de plaats van het bijwoord invloed heeft op hoe natuurlijk de zin klinkt"
          ],
          [
            "Identificar qué modifica el adverbio en la oración",
            "Comprender los usos existencial, locativo, cuantitativo y pronominal de er",
            "Saber que la posición del adverbio afecta a la naturalidad de la oración"
          ],
          [
            "Erkennen, was das Adverb im Satz modifiziert",
            "Den existenziellen, lokalen, quantitativen und pronominalen Gebrauch von er verstehen",
            "Wissen, dass die Stellung des Adverbs beeinflusst, wie natürlich der Satz klingt"
          ]
        ),
        pitfalls: LA(
          ["把 er 逐字翻译成中文", "忽略 er 和介词结合的代词功能", "把方式副词放错位置"],
          [
            "Translating er word-for-word into Chinese",
            "Ignoring er's pronominal function when combined with a preposition",
            "Placing manner adverbs in the wrong position"
          ],
          [
            "Er woord voor woord naar het Chinees vertalen",
            "De voornaamwoordelijke functie van er in combinatie met een voorzetsel negeren",
            "Bijwoorden van wijze op de verkeerde plaats zetten"
          ],
          [
            "Traducir er palabra por palabra al chino",
            "Ignorar la función pronominal de er combinado con una preposición",
            "Colocar los adverbios de modo en la posición incorrecta"
          ],
          [
            "er wortwörtlich ins Chinesische übersetzen",
            "Die pronominale Funktion von er in Verbindung mit einer Präposition übersehen",
            "Adverbien der Art und Weise falsch platzieren"
          ]
        ),
        nodes: [
          {
            id: "adverb-concept",
            title: L("副词概念", "Adverb concept", "Begrip bijwoord", "Concepto de adverbio", "Begriff Adverb"),
            detail: L(
              "修饰动词、形容词、整个句子或其他副词。",
              "Modifies a verb, an adjective, an entire sentence, or another adverb.",
              "Wijzigt een werkwoord, een bijvoeglijk naamwoord, een hele zin of een ander bijwoord.",
              "Modifica un verbo, un adjetivo, toda la oración u otro adverbio.",
              "Modifiziert ein Verb, ein Adjektiv, einen ganzen Satz oder ein anderes Adverb."
            )
          },
          {
            id: "er",
            title: L("特殊副词 er", "The special adverb er", "Het speciale bijwoord er", "El adverbio especial er", "Das besondere Adverb er"),
            detail: L(
              "可表示存在、地点、数量，也能和介词结合构成 erop/eraan 等。",
              "Can express existence, place, or quantity, and can combine with prepositions to form erop/eraan, etc.",
              "Kan bestaan, plaats of hoeveelheid uitdrukken en kan met voorzetsels gecombineerd worden tot erop/eraan, enzovoort.",
              "Puede expresar existencia, lugar o cantidad, y puede combinarse con preposiciones para formar erop/eraan, etc.",
              "Kann Existenz, Ort oder Menge ausdrücken und sich mit Präpositionen zu erop/eraan usw. verbinden."
            ),
            children: [
              {
                id: "er-existential",
                title: L("存在 er", "Existential er", "Existentieel er", "Er existencial", "Existenzielles er"),
                detail: L(
                  "Er is... / Er zijn... 表示有、存在。",
                  "Er is... / Er zijn... express 'there is/are'.",
                  "Er is... / Er zijn... drukken 'er is/zijn' uit.",
                  "Er is... / Er zijn... expresan 'hay'.",
                  "Er is... / Er zijn... bedeuten 'es gibt'."
                )
              },
              {
                id: "er-preposition",
                title: L("er + 介词", "er + preposition", "er + voorzetsel", "er + preposición", "er + Präposition"),
                detail: L(
                  "把事物宾语和介词结合：eraan, ervoor, ermee。",
                  "Combines a thing-object with a preposition: eraan, ervoor, ermee.",
                  "Combineert een zaaksobject met een voorzetsel: eraan, ervoor, ermee.",
                  "Combina un objeto de cosa con una preposición: eraan, ervoor, ermee.",
                  "Verbindet ein Sachobjekt mit einer Präposition: eraan, ervoor, ermee."
                )
              }
            ]
          }
        ]
      },
      {
        id: "verbs",
        partId: "morphology",
        title: L("动词", "Verbs", "Werkwoorden", "Verbos", "Verben"),
        pageRange: "29-46",
        summary: L(
          "动词是荷兰语句子的发动机：原形、变位、分词、过去式、助动词、情态动词和 zijn 都要分层掌握。",
          "Verbs are the engine of a Dutch sentence: infinitives, conjugation, participles, past tense, auxiliary verbs, modal verbs, and zijn all need to be mastered in layers.",
          "Werkwoorden zijn de motor van de Nederlandse zin: infinitief, vervoeging, deelwoorden, verleden tijd, hulpwerkwoorden, modale werkwoorden en zijn moeten laag voor laag beheerst worden.",
          "Los verbos son el motor de la oración neerlandesa: el infinitivo, la conjugación, los participios, el pasado, los verbos auxiliares, los verbos modales y zijn deben dominarse por capas.",
          "Verben sind der Motor des niederländischen Satzes: Infinitiv, Konjugation, Partizipien, Vergangenheit, Hilfsverben, Modalverben und zijn müssen schrittweise beherrscht werden."
        ),
        goals: LA(
          ["能找出句子的主要动词形", "掌握现在时人称变化", "理解助动词、情态动词和不及物动词搭配"],
          [
            "Be able to identify the finite verb form in a sentence",
            "Master present-tense person conjugation",
            "Understand auxiliary verbs, modal verbs, and intransitive-verb collocations"
          ],
          [
            "De vervoegde werkwoordsvorm in een zin kunnen herkennen",
            "De persoonsvervoeging in de tegenwoordige tijd beheersen",
            "Hulpwerkwoorden, modale werkwoorden en vaste voorzetsels bij werkwoorden begrijpen"
          ],
          [
            "Poder identificar la forma verbal conjugada de la oración",
            "Dominar la conjugación personal en presente",
            "Comprender los verbos auxiliares, los modales y las colocaciones de verbos intransitivos"
          ],
          [
            "Die finite Verbform im Satz erkennen können",
            "Die Personenkonjugation im Präsens beherrschen",
            "Hilfsverben, Modalverben und feste Präpositionen bei intransitiven Verben verstehen"
          ]
        ),
        pitfalls: LA(
          ["中文动词不变形导致漏 -t", "混淆 gaan/zullen/hebben/zijn 的功能", "可分动词只记主体不记前缀"],
          [
            "Omitting -t because Chinese verbs don't inflect",
            "Confusing the functions of gaan/zullen/hebben/zijn",
            "Memorizing only the stem of separable verbs and forgetting the prefix"
          ],
          [
            "-t vergeten omdat werkwoorden in het Chinees niet vervoegen",
            "De functies van gaan/zullen/hebben/zijn verwarren",
            "Bij scheidbare werkwoorden alleen de stam onthouden en het voorzetsel vergeten"
          ],
          [
            "Omitir la -t porque los verbos chinos no se conjugan",
            "Confundir las funciones de gaan/zullen/hebben/zijn",
            "Memorizar solo la raíz de los verbos separables y olvidar el prefijo"
          ],
          [
            "-t vergessen, weil chinesische Verben nicht flektieren",
            "Die Funktionen von gaan/zullen/hebben/zijn verwechseln",
            "Bei trennbaren Verben nur den Stamm merken und das Präfix vergessen"
          ]
        ),
        nodes: [
          {
            id: "verb-forms",
            title: L("动词形态", "Verb forms", "Werkwoordsvormen", "Formas verbales", "Verbformen"),
            detail: L(
              "原形、主要动词形、现在分词、过去式、过去分词。",
              "Infinitive, finite form, present participle, past tense, past participle.",
              "Infinitief, persoonsvorm, tegenwoordig deelwoord, verleden tijd, voltooid deelwoord.",
              "Infinitivo, forma finita, participio presente, pasado, participio pasado.",
              "Infinitiv, finite Form, Partizip Präsens, Präteritum, Partizip Perfekt."
            ),
            children: [
              {
                id: "infinitive",
                title: L("动词原形", "Infinitive", "Infinitief", "Infinitivo", "Infinitiv"),
                detail: L(
                  "常以 -en 结尾，也用于情态动词后。",
                  "Usually ends in -en; also used after modal verbs.",
                  "Eindigt meestal op -en; wordt ook na modale werkwoorden gebruikt.",
                  "Suele terminar en -en; se usa también después de verbos modales.",
                  "Endet meist auf -en; wird auch nach Modalverben verwendet."
                )
              },
              {
                id: "finite-verb",
                title: L("主要动词形", "Finite verb form", "Persoonsvorm", "Forma verbal finita", "Finite Verbform"),
                detail: L(
                  "随人称、时态、语序变化，是句法核心。",
                  "Changes with person, tense, and word order; it is the core of syntax.",
                  "Verandert met persoon, tijd en woordvolgorde; is de kern van de syntax.",
                  "Cambia según la persona, el tiempo y el orden de las palabras; es el núcleo de la sintaxis.",
                  "Ändert sich je nach Person, Zeitform und Wortstellung; ist der Kern der Syntax."
                )
              },
              {
                id: "present-participle",
                title: L("现在分词", "Present participle", "Tegenwoordig deelwoord", "Participio presente", "Partizip Präsens"),
                detail: L(
                  "可表达进行、伴随或形容词化意义。",
                  "Can express ongoing action, accompaniment, or an adjectival meaning.",
                  "Kan een voortdurende handeling, begeleiding of een bijvoeglijke betekenis uitdrukken.",
                  "Puede expresar acción continua, acompañamiento o un significado adjetival.",
                  "Kann eine andauernde Handlung, Begleitung oder eine adjektivische Bedeutung ausdrücken."
                )
              },
              {
                id: "past-tense-form",
                title: L("过去式", "Past tense form", "Verleden tijd", "Forma de pasado", "Präteritumform"),
                detail: L(
                  "用于一般过去时，弱变化和强变化并存。",
                  "Used in the simple past; both weak and strong conjugations exist.",
                  "Gebruikt in de onvoltooid verleden tijd; zowel zwakke als sterke werkwoorden komen voor.",
                  "Se usa en el pasado simple; coexisten conjugaciones débiles y fuertes.",
                  "Wird im Präteritum verwendet; schwache und starke Konjugation existieren nebeneinander."
                )
              },
              {
                id: "past-participle",
                title: L("过去分词", "Past participle", "Voltooid deelwoord", "Participio pasado", "Partizip Perfekt"),
                detail: L(
                  "用于完成时、被动句和形容词化表达。",
                  "Used in perfect tenses, passive sentences, and adjectival expressions.",
                  "Gebruikt in voltooide tijden, lijdende zinnen en bijvoeglijke uitdrukkingen.",
                  "Se usa en los tiempos perfectos, en oraciones pasivas y en expresiones adjetivales.",
                  "Wird in den Perfektzeiten, in Passivsätzen und in adjektivischen Ausdrücken verwendet."
                )
              },
              {
                id: "infinitive-use",
                title: L("不定式", "Infinitive constructions", "Infinitiefconstructies", "Construcciones de infinitivo", "Infinitivkonstruktionen"),
                detail: L(
                  "常与 te、情态动词、助动词或固定结构连用。",
                  "Often used with te, modal verbs, auxiliary verbs, or fixed structures.",
                  "Vaak gebruikt met te, modale werkwoorden, hulpwerkwoorden of vaste constructies.",
                  "Se usan a menudo con te, verbos modales, auxiliares o estructuras fijas.",
                  "Werden oft mit te, Modalverben, Hilfsverben oder festen Strukturen verwendet."
                )
              }
            ]
          },
          {
            id: "separable-verbs",
            title: L("可分动词", "Separable verbs", "Scheidbare werkwoorden", "Verbos separables", "Trennbare Verben"),
            detail: L(
              "前缀在主句中常后置，完成时 ge 常夹在前缀和动词之间。",
              "The prefix is usually placed at the end in a main clause; in the perfect tense, ge- is usually inserted between the prefix and the verb.",
              "Het voorzetsel komt in de hoofdzin meestal aan het einde; in de voltooide tijd zit ge- meestal tussen het voorzetsel en het werkwoord.",
              "El prefijo suele colocarse al final en la oración principal; en el perfecto, ge- suele insertarse entre el prefijo y el verbo.",
              "Das Präfix steht im Hauptsatz meist am Ende; im Perfekt steht ge- meist zwischen Präfix und Verb."
            )
          },
          {
            id: "reflexive-verbs",
            title: L("反身动词", "Reflexive verbs", "Wederkerende werkwoorden", "Verbos reflexivos", "Reflexive Verben"),
            detail: L(
              "与反身代词 zich/me/je 等搭配，动作回到主语自身。",
              "Combine with reflexive pronouns like zich/me/je; the action refers back to the subject.",
              "Combineren met wederkerende voornaamwoorden zoals zich/me/je; de handeling keert terug naar het onderwerp zelf.",
              "Se combinan con pronombres reflexivos como zich/me/je; la acción recae sobre el propio sujeto.",
              "Verbinden sich mit Reflexivpronomen wie zich/me/je; die Handlung bezieht sich auf das Subjekt selbst zurück."
            )
          },
          {
            id: "modal-verbs",
            title: L("情态动词", "Modal verbs", "Modale werkwoorden", "Verbos modales", "Modalverben"),
            detail: L(
              "kunnen/moeten/mogen/willen/zullen 后接动词原形。",
              "kunnen/moeten/mogen/willen/zullen are followed by the infinitive.",
              "kunnen/moeten/mogen/willen/zullen worden gevolgd door de infinitief.",
              "kunnen/moeten/mogen/willen/zullen van seguidos del infinitivo.",
              "Auf kunnen/moeten/mogen/willen/zullen folgt der Infinitiv."
            )
          },
          {
            id: "zijn",
            title: L("动词 zijn", "The verb zijn", "Het werkwoord zijn", "El verbo zijn", "Das Verb zijn"),
            detail: L(
              "高频不规则动词，也是系动词和完成时助动词。",
              "A high-frequency irregular verb that also serves as a linking verb and as the perfect-tense auxiliary.",
              "Een frequent onregelmatig werkwoord dat ook als koppelwerkwoord en als hulpwerkwoord in de voltooide tijd dient.",
              "Un verbo irregular de alta frecuencia que también funciona como copulativo y como auxiliar del perfecto.",
              "Ein häufiges unregelmäßiges Verb, das auch als Kopula und als Perfekt-Hilfsverb dient."
            )
          },
          {
            id: "intransitive-verbs",
            title: L("不及物动词", "Intransitive verbs", "Onovergankelijke werkwoorden", "Verbos intransitivos", "Intransitive Verben"),
            detail: L(
              "常与固定介词搭配，需要作为词组记忆。",
              "Often combine with a fixed preposition and should be memorized as a phrase.",
              "Combineren vaak met een vast voorzetsel en moeten als geheel onthouden worden.",
              "A menudo se combinan con una preposición fija y deben memorizarse como una frase.",
              "Verbinden sich oft mit einer festen Präposition und sollten als Wendung gelernt werden."
            )
          }
        ]
      },
      {
        id: "pronouns",
        partId: "morphology",
        title: L("代词", "Pronouns", "Voornaamwoorden", "Pronombres", "Pronomen"),
        pageRange: "51-64",
        summary: L(
          "代词要按句法功能学习：主格、宾格、物主、反身、事物、指示、不定。",
          "Pronouns should be learned by syntactic function: subject, object, possessive, reflexive, thing, demonstrative, and indefinite.",
          "Voornaamwoorden moet je leren op basis van hun syntactische functie: onderwerp, lijdend/meewerkend voorwerp, bezittelijk, wederkerend, zaaksaanduidend, aanwijzend en onbepaald.",
          "Los pronombres deben aprenderse según su función sintáctica: sujeto, objeto, posesivo, reflexivo, de cosa, demostrativo e indefinido.",
          "Pronomen sollten nach ihrer syntaktischen Funktion gelernt werden: Subjekt, Objekt, Possessiv, Reflexiv, Sache, Demonstrativ und Indefinit."
        ),
        goals: LA(
          ["区分主格和宾格", "理解重读型/弱读型", "掌握 er/daar/hier 与介词的关系"],
          [
            "Distinguish subject from object forms",
            "Understand stressed vs. unstressed forms",
            "Master the relationship between er/daar/hier and prepositions"
          ],
          [
            "Onderwerp- en voorwerpsvorm onderscheiden",
            "Beklemtoonde en onbeklemtoonde vormen begrijpen",
            "De relatie tussen er/daar/hier en voorzetsels beheersen"
          ],
          [
            "Distinguir las formas de sujeto y de objeto",
            "Comprender las formas tónicas y átonas",
            "Dominar la relación entre er/daar/hier y las preposiciones"
          ],
          [
            "Subjekt- und Objektform unterscheiden",
            "Betonte und unbetonte Formen verstehen",
            "Die Beziehung zwischen er/daar/hier und Präpositionen beherrschen"
          ]
        ),
        pitfalls: LA(
          ["混用 hen/hun", "混用 ons/onze", "不知道 er 可以代替事物并和介词结合"],
          [
            "Mixing up hen/hun",
            "Mixing up ons/onze",
            "Not knowing that er can replace a thing and combine with a preposition"
          ],
          [
            "hen/hun verwarren",
            "ons/onze verwarren",
            "Niet weten dat er een zaak kan vervangen en met een voorzetsel gecombineerd kan worden"
          ],
          [
            "Confundir hen/hun",
            "Confundir ons/onze",
            "No saber que er puede sustituir a una cosa y combinarse con una preposición"
          ],
          [
            "hen/hun verwechseln",
            "ons/onze verwechseln",
            "Nicht wissen, dass er eine Sache ersetzen und sich mit einer Präposition verbinden kann"
          ]
        ),
        nodes: [
          {
            id: "personal-possessive-reflexive",
            title: L(
              "人称、物主和反身代词",
              "Personal, possessive, and reflexive pronouns",
              "Persoonlijke, bezittelijke en wederkerende voornaamwoorden",
              "Pronombres personales, posesivos y reflexivos",
              "Personal-, Possessiv- und Reflexivpronomen"
            ),
            detail: L(
              "按句法功能和重读/弱读形式学习。",
              "Learn by syntactic function and by stressed/unstressed form.",
              "Leer ze op basis van syntactische functie en beklemtoonde/onbeklemtoonde vorm.",
              "Apréndelos según su función sintáctica y su forma tónica o átona.",
              "Lerne sie nach syntaktischer Funktion und betonter/unbetonter Form."
            ),
            children: [
              {
                id: "subject-object-pronouns",
                title: L(
                  "主格与宾格区别",
                  "Subject vs. object forms",
                  "Verschil tussen onderwerp- en voorwerpsvorm",
                  "Diferencia entre forma de sujeto y de objeto",
                  "Unterschied zwischen Subjekt- und Objektform"
                ),
                detail: L(
                  "主格作主语，宾格作宾语或介词宾语。",
                  "Subject forms act as the subject; object forms act as the object or the object of a preposition.",
                  "De onderwerpsvorm is het onderwerp; de voorwerpsvorm is het voorwerp of het voorzetselvoorwerp.",
                  "La forma de sujeto funciona como sujeto; la de objeto, como objeto o complemento preposicional.",
                  "Die Subjektform ist das Subjekt; die Objektform ist das Objekt oder Präpositionalobjekt."
                )
              },
              {
                id: "strong-weak-pronouns",
                title: L(
                  "重读型和弱读型",
                  "Stressed and unstressed forms",
                  "Beklemtoonde en onbeklemtoonde vormen",
                  "Formas tónicas y átonas",
                  "Betonte und unbetonte Formen"
                ),
                detail: L(
                  "jij/je、zij/ze 等形式有语气和重音差别。",
                  "Pairs like jij/je and zij/ze differ in tone and stress.",
                  "Paren zoals jij/je en zij/ze verschillen in toon en klemtoon.",
                  "Pares como jij/je y zij/ze difieren en tono y acento.",
                  "Paare wie jij/je und zij/ze unterscheiden sich in Ton und Betonung."
                )
              },
              {
                id: "ons-onze",
                title: L("ons 和 onze", "ons and onze", "ons en onze", "ons y onze", "ons und onze"),
                detail: L(
                  "物主代词形式受后面名词词性和数影响。",
                  "The possessive form depends on the gender and number of the following noun.",
                  "De bezittelijke vorm hangt af van het geslacht en getal van het volgende zelfstandig naamwoord.",
                  "La forma posesiva depende del género y número del sustantivo que sigue.",
                  "Die Possessivform hängt vom Genus und Numerus des folgenden Nomens ab."
                )
              },
              {
                id: "hen-hun",
                title: L("hen 和 hun", "hen and hun", "hen en hun", "hen y hun", "hen und hun"),
                detail: L(
                  "正式语法中 hen/hun 用法不同，口语里常混用。",
                  "In formal grammar hen and hun differ in use, though they are often mixed up in speech.",
                  "In de formele grammatica verschilt het gebruik van hen en hun, al worden ze in de spreektaal vaak verward.",
                  "En la gramática formal hen y hun tienen usos distintos, aunque en el habla suelen confundirse.",
                  "In der formellen Grammatik unterscheiden sich hen und hun im Gebrauch, werden in der gesprochenen Sprache aber oft verwechselt."
                )
              },
              {
                id: "men",
                title: L("人称代词 men", "The pronoun men", "Het voornaamwoord men", "El pronombre men", "Das Pronomen men"),
                detail: L(
                  "表示泛指的人，相当于“人们/有人/大家”。",
                  "Refers to people in general, similar to 'one/people/everyone'.",
                  "Verwijst naar mensen in het algemeen, vergelijkbaar met 'men/mensen/iedereen'.",
                  "Se refiere a la gente en general, similar a 'uno/la gente/todos'.",
                  "Bezeichnet Menschen im Allgemeinen, vergleichbar mit 'man/die Leute/alle'."
                )
              },
              {
                id: "possessive-as-noun",
                title: L(
                  "物主代词名词化",
                  "Nominalized possessives",
                  "Genominaliseerd bezittelijk voornaamwoord",
                  "Posesivos sustantivados",
                  "Substantivierte Possessivpronomen"
                ),
                detail: L(
                  "物主代词可独立作名词性成分。",
                  "Possessive pronouns can stand alone as a noun-like element.",
                  "Bezittelijke voornaamwoorden kunnen zelfstandig als naamwoordelijk element optreden.",
                  "Los pronombres posesivos pueden funcionar solos como elemento nominal.",
                  "Possessivpronomen können eigenständig als nominales Element auftreten."
                )
              },
              {
                id: "reflexive-zelf",
                title: L(
                  "反身代词 + zelf",
                  "Reflexive pronoun + zelf",
                  "Wederkerend voornaamwoord + zelf",
                  "Pronombre reflexivo + zelf",
                  "Reflexivpronomen + zelf"
                ),
                detail: L(
                  "zelf 用来强调“自己”。",
                  "zelf is used to emphasize 'self'.",
                  "zelf wordt gebruikt om 'zelf' te benadrukken.",
                  "zelf se usa para enfatizar 'uno mismo'.",
                  "zelf wird verwendet, um 'selbst' zu betonen."
                )
              }
            ]
          },
          {
            id: "thing-pronouns",
            title: L(
              "事物代词",
              "Thing pronouns",
              "Zaaksaanduidende voornaamwoorden",
              "Pronombres de cosa",
              "Sachpronomen"
            ),
            detail: L(
              "尤其关注 het、er、daar、hier 与介词连用。",
              "Pay special attention to het, er, daar, hier used with prepositions.",
              "Let vooral op het, er, daar, hier in combinatie met voorzetsels.",
              "Presta especial atención a het, er, daar, hier combinados con preposiciones.",
              "Achte besonders auf het, er, daar, hier in Verbindung mit Präpositionen."
            ),
            children: [
              {
                id: "thing-subject",
                title: L(
                  "主格事物代词",
                  "Subject thing-pronoun",
                  "Onderwerpsvorm zaaksaanduidend voornaamwoord",
                  "Pronombre de cosa en función de sujeto",
                  "Sachpronomen als Subjekt"
                ),
                detail: L(
                  "作主语或形式主语时使用。",
                  "Used as the subject or the formal (dummy) subject.",
                  "Gebruikt als onderwerp of als schijnonderwerp.",
                  "Se usa como sujeto o como sujeto formal (aparente).",
                  "Wird als Subjekt oder als formales (Schein-)Subjekt verwendet."
                )
              },
              {
                id: "thing-object-no-prep",
                title: L(
                  "不与介词连用的宾格事物代词",
                  "Object thing-pronoun without a preposition",
                  "Voorwerpsvorm zonder voorzetsel",
                  "Pronombre de cosa como objeto sin preposición",
                  "Sachpronomen als Objekt ohne Präposition"
                ),
                detail: L(
                  "直接作宾语时使用。",
                  "Used when directly acting as the object.",
                  "Gebruikt wanneer het direct als voorwerp optreedt.",
                  "Se usa cuando funciona directamente como objeto.",
                  "Wird verwendet, wenn es direkt als Objekt fungiert."
                )
              },
              {
                id: "thing-object-with-prep",
                title: L(
                  "与介词连用的宾格事物代词",
                  "Object thing-pronoun with a preposition",
                  "Voorwerpsvorm met voorzetsel",
                  "Pronombre de cosa como objeto con preposición",
                  "Sachpronomen als Objekt mit Präposition"
                ),
                detail: L(
                  "常转化为 er/daar/hier + 介词结构。",
                  "Usually transforms into an er/daar/hier + preposition structure.",
                  "Wordt meestal omgezet in een er/daar/hier + voorzetselconstructie.",
                  "Suele transformarse en una estructura er/daar/hier + preposición.",
                  "Wird meist zu einer er/daar/hier + Präposition-Struktur umgeformt."
                )
              }
            ]
          },
          {
            id: "demonstratives",
            title: L("指示代词", "Demonstrative pronouns", "Aanwijzende voornaamwoorden", "Pronombres demostrativos", "Demonstrativpronomen"),
            detail: L(
              "deze/die/dit/dat 与距离、de/het 词相关。",
              "deze/die/dit/dat relate to distance and to de-words/het-words.",
              "deze/die/dit/dat hangen samen met afstand en met de-woorden/het-woorden.",
              "deze/die/dit/dat se relacionan con la distancia y con las palabras de/het.",
              "deze/die/dit/dat hängen mit Entfernung und mit de-/het-Wörtern zusammen."
            )
          },
          {
            id: "indefinite-pronouns",
            title: L("不定代词", "Indefinite pronouns", "Onbepaalde voornaamwoorden", "Pronombres indefinidos", "Indefinitpronomen"),
            detail: L(
              "iemand/niemand/iets/niets/alles 等表达不确定对象。",
              "iemand/niemand/iets/niets/alles, etc., express an unspecified referent.",
              "iemand/niemand/iets/niets/alles enzovoort drukken een onbepaald object uit.",
              "iemand/niemand/iets/niets/alles, etc., expresan un referente no específico.",
              "iemand/niemand/iets/niets/alles usw. drücken einen unbestimmten Bezug aus."
            ),
            children: [
              {
                id: "indefinite-person",
                title: L(
                  "指代人的不定代词",
                  "Indefinite pronouns for people",
                  "Onbepaalde voornaamwoorden voor personen",
                  "Pronombres indefinidos de persona",
                  "Indefinitpronomen für Personen"
                ),
                detail: L(
                  "iemand, niemand, iedereen 等。",
                  "iemand, niemand, iedereen, etc.",
                  "iemand, niemand, iedereen, enzovoort.",
                  "iemand, niemand, iedereen, etc.",
                  "iemand, niemand, iedereen usw."
                )
              },
              {
                id: "indefinite-thing-no-prep",
                title: L(
                  "不与介词连用、指代事物",
                  "Indefinite thing-pronouns without a preposition",
                  "Zonder voorzetsel, verwijst naar een zaak",
                  "Sin preposición, referido a cosas",
                  "Ohne Präposition, bezieht sich auf Sachen"
                ),
                detail: L(
                  "iets, niets, alles 等直接作事物成分。",
                  "iets, niets, alles, etc., directly function as the thing element.",
                  "iets, niets, alles enzovoort treden direct als zaakselement op.",
                  "iets, niets, alles, etc., funcionan directamente como elemento de cosa.",
                  "iets, niets, alles usw. treten direkt als Sachelement auf."
                )
              },
              {
                id: "indefinite-thing-with-prep",
                title: L(
                  "与介词连用、指代事物",
                  "Indefinite thing-pronouns with a preposition",
                  "Met voorzetsel, verwijst naar een zaak",
                  "Con preposición, referido a cosas",
                  "Mit Präposition, bezieht sich auf Sachen"
                ),
                detail: L(
                  "常转化为 ergens/nergens/overal 等或 er + 介词结构。",
                  "Often transform into ergens/nergens/overal, etc., or an er + preposition structure.",
                  "Wordt vaak omgezet in ergens/nergens/overal enzovoort of een er + voorzetselconstructie.",
                  "Suelen transformarse en ergens/nergens/overal, etc., o en una estructura er + preposición.",
                  "Wird oft zu ergens/nergens/overal usw. oder einer er + Präposition-Struktur umgeformt."
                )
              }
            ]
          }
        ]
      },
      {
        id: "prepositions",
        partId: "morphology",
        title: L("介词", "Prepositions", "Voorzetsels", "Preposiciones", "Präpositionen"),
        pageRange: "69-73",
        summary: L(
          "介词要按地点、时间、方向和固定搭配学习，不能完全按中文逐字对应。",
          "Prepositions should be learned by place, time, direction, and fixed collocations — they don't map word-for-word from Chinese.",
          "Voorzetsels moet je leren aan de hand van plaats, tijd, richting en vaste combinaties — ze komen niet woord voor woord overeen met het Chinees.",
          "Las preposiciones deben aprenderse según lugar, tiempo, dirección y combinaciones fijas: no corresponden palabra por palabra con el chino.",
          "Präpositionen sollten nach Ort, Zeit, Richtung und festen Kollokationen gelernt werden — sie entsprechen nicht Wort für Wort dem Chinesischen."
        ),
        goals: LA(
          ["掌握地点/时间/方向常用介词", "积累动词 + 介词搭配", "能解释 naar/in/op/aan/met 等高频介词"],
          [
            "Master the common prepositions for place/time/direction",
            "Build up verb + preposition collocations",
            "Be able to explain high-frequency prepositions like naar/in/op/aan/met"
          ],
          [
            "De gangbare voorzetsels voor plaats/tijd/richting beheersen",
            "Combinaties van werkwoord + voorzetsel opbouwen",
            "Frequente voorzetsels als naar/in/op/aan/met kunnen uitleggen"
          ],
          [
            "Dominar las preposiciones habituales de lugar/tiempo/dirección",
            "Acumular combinaciones de verbo + preposición",
            "Poder explicar preposiciones de alta frecuencia como naar/in/op/aan/met"
          ],
          [
            "Die gängigen Präpositionen für Ort/Zeit/Richtung beherrschen",
            "Verb-Präposition-Kombinationen aufbauen",
            "Hochfrequente Präpositionen wie naar/in/op/aan/met erklären können"
          ]
        ),
        pitfalls: LA(
          ["用中文“在/到/对”一一映射", "忽略不及物动词的固定介词", "不知道介词宾语可变成 er + 介词"],
          [
            "Mapping Chinese '在/到/对' one-to-one onto Dutch prepositions",
            "Ignoring the fixed preposition of an intransitive verb",
            "Not knowing a prepositional object can become er + preposition"
          ],
          [
            "Chinese '在/到/对' één-op-één op Nederlandse voorzetsels toepassen",
            "Het vaste voorzetsel bij een onovergankelijk werkwoord negeren",
            "Niet weten dat een voorzetselvoorwerp kan veranderen in er + voorzetsel"
          ],
          [
            "Aplicar de forma literal el chino '在/到/对' a las preposiciones",
            "Ignorar la preposición fija de un verbo intransitivo",
            "No saber que un objeto preposicional puede convertirse en er + preposición"
          ],
          [
            "Chinesisches '在/到/对' eins zu eins auf Präpositionen übertragen",
            "Die feste Präposition eines intransitiven Verbs übersehen",
            "Nicht wissen, dass ein Präpositionalobjekt zu er + Präposition werden kann"
          ]
        ),
        nodes: [
          {
            id: "place-prepositions",
            title: L("地点介词", "Place prepositions", "Voorzetsels van plaats", "Preposiciones de lugar", "Ortspräpositionen"),
            detail: L(
              "in/op/aan/bij 等表达位置关系。",
              "in/op/aan/bij, etc., express spatial relationships.",
              "in/op/aan/bij enzovoort drukken een plaatsrelatie uit.",
              "in/op/aan/bij, etc., expresan relaciones espaciales.",
              "in/op/aan/bij usw. drücken eine räumliche Beziehung aus."
            )
          },
          {
            id: "time-prepositions",
            title: L("时间介词", "Time prepositions", "Voorzetsels van tijd", "Preposiciones de tiempo", "Zeitpräpositionen"),
            detail: L(
              "om/op/in/sinds/tot 等表达时间点或时间段。",
              "om/op/in/sinds/tot, etc., express a point or period in time.",
              "om/op/in/sinds/tot enzovoort drukken een tijdstip of tijdsduur uit.",
              "om/op/in/sinds/tot, etc., expresan un punto o un período de tiempo.",
              "om/op/in/sinds/tot usw. drücken einen Zeitpunkt oder Zeitraum aus."
            )
          },
          {
            id: "direction-prepositions",
            title: L("方向介词", "Direction prepositions", "Voorzetsels van richting", "Preposiciones de dirección", "Richtungspräpositionen"),
            detail: L(
              "naar/uit/door/langs 等表达运动方向。",
              "naar/uit/door/langs, etc., express direction of movement.",
              "naar/uit/door/langs enzovoort drukken een bewegingsrichting uit.",
              "naar/uit/door/langs, etc., expresan dirección de movimiento.",
              "naar/uit/door/langs usw. drücken eine Bewegungsrichtung aus."
            )
          },
          {
            id: "verb-preposition",
            title: L("动词搭配介词", "Verb + preposition collocations", "Werkwoord + voorzetsel", "Colocaciones verbo + preposición", "Verb-Präposition-Kombinationen"),
            detail: L(
              "wachten op, denken aan, praten met 等需整体记忆。",
              "wachten op, denken aan, praten met, etc., need to be memorized as whole units.",
              "wachten op, denken aan, praten met enzovoort moeten als geheel onthouden worden.",
              "wachten op, denken aan, praten met, etc., deben memorizarse como un todo.",
              "wachten op, denken aan, praten met usw. müssen als Ganzes gelernt werden."
            )
          },
          {
            id: "fixed-prepositions",
            title: L("固定搭配", "Fixed collocations", "Vaste combinaties", "Combinaciones fijas", "Feste Kollokationen"),
            detail: L(
              "介词短语常形成固定表达，学习时要收集例句。",
              "Prepositional phrases often form fixed expressions; collect example sentences while learning.",
              "Voorzetseluitdrukkingen vormen vaak vaste uitdrukkingen; verzamel voorbeeldzinnen tijdens het leren.",
              "Las frases preposicionales suelen formar expresiones fijas; recopila oraciones de ejemplo al aprender.",
              "Präpositionalphrasen bilden oft feste Ausdrücke; sammle beim Lernen Beispielsätze."
            )
          }
        ]
      },
      {
        id: "numerals",
        partId: "morphology",
        title: L("数词", "Numerals", "Telwoorden", "Numerales", "Zahlwörter"),
        pageRange: "75-84",
        summary: L(
          "数词不仅是数字，还包括序数、年份日期、钱数、分数小数和复数用法。",
          "Numerals cover more than just numbers — also ordinals, years and dates, money, fractions/decimals, and plural usage.",
          "Telwoorden omvatten meer dan alleen cijfers — ook rangtelwoorden, jaartallen en data, geldbedragen, breuken/decimalen en meervoudsgebruik.",
          "Los numerales abarcan más que solo cifras: también ordinales, años y fechas, cantidades de dinero, fracciones/decimales y su uso en plural.",
          "Zahlwörter umfassen mehr als nur Ziffern — auch Ordnungszahlen, Jahreszahlen und Daten, Geldbeträge, Brüche/Dezimalzahlen und den Pluralgebrauch."
        ),
        goals: LA(
          ["能读写基数词和序数词", "能表达日期、年份和价格", "理解数词在名词前后的形式"],
          [
            "Be able to read and write cardinal and ordinal numbers",
            "Be able to express dates, years, and prices",
            "Understand the form of numerals before and after nouns"
          ],
          [
            "Hoofdtelwoorden en rangtelwoorden kunnen lezen en schrijven",
            "Data, jaartallen en prijzen kunnen uitdrukken",
            "De vorm van telwoorden voor en na zelfstandige naamwoorden begrijpen"
          ],
          [
            "Poder leer y escribir los cardinales y ordinales",
            "Poder expresar fechas, años y precios",
            "Comprender la forma de los numerales antes y después del sustantivo"
          ],
          [
            "Kardinal- und Ordinalzahlen lesen und schreiben können",
            "Daten, Jahreszahlen und Preise ausdrücken können",
            "Die Form der Zahlwörter vor und nach dem Nomen verstehen"
          ]
        ),
        pitfalls: LA(
          ["年份按中文逐位读", "序数词和基数词混淆", "小数和钱数读法受母语影响"],
          [
            "Reading years digit-by-digit as in Chinese",
            "Confusing ordinal and cardinal numbers",
            "Reading decimals and money influenced by native-language habits"
          ],
          [
            "Jaartallen cijfer voor cijfer uitspreken zoals in het Chinees",
            "Rangtelwoorden en hoofdtelwoorden verwarren",
            "Decimalen en geldbedragen uitspreken beïnvloed door de moedertaal"
          ],
          [
            "Leer los años cifra por cifra como en chino",
            "Confundir los ordinales con los cardinales",
            "Leer los decimales y las cantidades de dinero influido por la lengua materna"
          ],
          [
            "Jahreszahlen ziffernweise wie im Chinesischen lesen",
            "Ordinal- und Kardinalzahlen verwechseln",
            "Dezimalzahlen und Geldbeträge durch die Muttersprache beeinflusst lesen"
          ]
        ),
        nodes: [
          {
            id: "cardinal",
            title: L("基数词", "Cardinal numbers", "Hoofdtelwoorden", "Numerales cardinales", "Kardinalzahlen"),
            detail: L(
              "een, twee, drie... 用于数量。",
              "een, twee, drie... used for quantity.",
              "een, twee, drie... gebruikt voor hoeveelheid.",
              "een, twee, drie... se usan para cantidad.",
              "een, twee, drie... werden für Mengen verwendet."
            )
          },
          {
            id: "ordinal",
            title: L("序数词", "Ordinal numbers", "Rangtelwoorden", "Numerales ordinales", "Ordinalzahlen"),
            detail: L(
              "eerste, tweede, derde... 用于顺序。",
              "eerste, tweede, derde... used for order/sequence.",
              "eerste, tweede, derde... gebruikt voor volgorde.",
              "eerste, tweede, derde... se usan para el orden.",
              "eerste, tweede, derde... werden für die Reihenfolge verwendet."
            )
          },
          {
            id: "date-year",
            title: L("年份和日期", "Years and dates", "Jaartallen en data", "Años y fechas", "Jahreszahlen und Daten"),
            detail: L(
              "需要掌握荷兰语特定读法。",
              "Requires mastering Dutch-specific ways of saying them.",
              "Vereist het beheersen van de specifieke Nederlandse uitspraak.",
              "Requiere dominar las formas específicas de decirlos en neerlandés.",
              "Erfordert das Beherrschen der spezifischen niederländischen Aussprache."
            )
          },
          {
            id: "money",
            title: L("钱数", "Money", "Geldbedragen", "Cantidades de dinero", "Geldbeträge"),
            detail: L(
              "欧元、小数和口语读法要结合场景练。",
              "Euros, decimals, and colloquial ways of saying amounts should be practiced in context.",
              "Euro's, decimalen en informele uitspraak moeten in context worden geoefend.",
              "Los euros, los decimales y las formas coloquiales de decirlos deben practicarse en contexto.",
              "Euro, Dezimalstellen und umgangssprachliche Aussprache sollten im Kontext geübt werden."
            )
          },
          {
            id: "fractions-decimals",
            title: L("分数和小数", "Fractions and decimals", "Breuken en decimalen", "Fracciones y decimales", "Brüche und Dezimalzahlen"),
            detail: L(
              "分母、逗号、小数位读法和中文不同。",
              "The denominator, the comma, and how decimal places are read differ from Chinese.",
              "De noemer, de komma en de manier waarop decimalen worden uitgesproken verschillen van het Chinees.",
              "El denominador, la coma y la forma de leer los decimales difieren del chino.",
              "Der Nenner, das Komma und die Aussprache der Nachkommastellen unterscheiden sich vom Chinesischen."
            )
          },
          {
            id: "numeral-plural",
            title: L("数词复数用法", "Plural use of numerals", "Meervoudsgebruik van telwoorden", "Uso plural de los numerales", "Pluralgebrauch von Zahlwörtern"),
            detail: L(
              "某些数词可名词化或复数化。",
              "Some numerals can be nominalized or pluralized.",
              "Sommige telwoorden kunnen genominaliseerd of in het meervoud gebruikt worden.",
              "Algunos numerales pueden sustantivarse o pluralizarse.",
              "Manche Zahlwörter können substantiviert oder pluralisiert werden."
            )
          }
        ]
      }
    ]
  },
  {
    id: "syntax",
    title: L("第二部分 句法", "Part 2: Syntax", "Deel 2: Zinsbouw", "Parte 2: Sintaxis", "Teil 2: Syntax"),
    pageRange: "85-119",
    theme: L(
      "从句子结构出发：句型、主从句和词序。",
      "Starting from sentence structure: sentence types, main/subordinate clauses, and word order.",
      "Vanuit de zinsstructuur: zinstypes, hoofd- en bijzinnen, en woordvolgorde.",
      "Partiendo de la estructura de la oración: tipos de oración, oraciones principales y subordinadas, y orden de palabras.",
      "Ausgehend von der Satzstruktur: Satztypen, Haupt- und Nebensätze und Wortstellung."
    ),
    chapters: [
      {
        id: "sentence-types",
        partId: "syntax",
        title: L("主要句子类型", "Main sentence types", "Belangrijkste zinstypes", "Tipos principales de oración", "Wichtigste Satztypen"),
        pageRange: "85-95",
        summary: L(
          "掌握陈述、疑问、否定、被动、感叹、祈使六类句子，尤其注意动词位置和否定词。",
          "Master the six sentence types — declarative, interrogative, negative, passive, exclamatory, and imperative — paying special attention to verb position and negators.",
          "Beheers de zes zinstypes — mededelend, vragend, ontkennend, lijdend, uitroepend en gebiedend — met speciale aandacht voor werkwoordspositie en ontkenningswoorden.",
          "Domina los seis tipos de oración: declarativa, interrogativa, negativa, pasiva, exclamativa e imperativa, prestando especial atención a la posición del verbo y a las palabras de negación.",
          "Meistere die sechs Satztypen — Aussage-, Frage-, Verneinungs-, Passiv-, Ausrufe- und Befehlssatz — mit besonderem Augenmerk auf Verbstellung und Verneinungswörter."
        ),
        goals: LA(
          ["能识别句子类型", "会构造疑问句和否定句", "理解 geen/niet 区别"],
          [
            "Be able to identify sentence types",
            "Be able to construct questions and negative sentences",
            "Understand the difference between geen and niet"
          ],
          [
            "Zinstypes kunnen herkennen",
            "Vraagzinnen en ontkennende zinnen kunnen vormen",
            "Het verschil tussen geen en niet begrijpen"
          ],
          [
            "Poder identificar los tipos de oración",
            "Poder construir oraciones interrogativas y negativas",
            "Comprender la diferencia entre geen y niet"
          ],
          [
            "Satztypen erkennen können",
            "Fragesätze und Verneinungssätze bilden können",
            "Den Unterschied zwischen geen und niet verstehen"
          ]
        ),
        pitfalls: LA(
          ["疑问句不倒装", "geen 和 niet 混用", "被动句照搬中文语序"],
          [
            "Not inverting word order in questions",
            "Mixing up geen and niet",
            "Copying Chinese word order in passive sentences"
          ],
          [
            "Geen inversie toepassen in vraagzinnen",
            "geen en niet verwarren",
            "Chinese woordvolgorde overnemen in lijdende zinnen"
          ],
          [
            "No invertir el orden en las preguntas",
            "Confundir geen y niet",
            "Copiar el orden de palabras chino en las oraciones pasivas"
          ],
          [
            "Keine Inversion in Fragesätzen vornehmen",
            "geen und niet verwechseln",
            "Chinesische Wortstellung in Passivsätzen übernehmen"
          ]
        ),
        nodes: [
          {
            id: "declarative",
            title: L("陈述句", "Declarative sentences", "Mededelende zinnen", "Oraciones declarativas", "Aussagesätze"),
            detail: L(
              "主句中变位动词通常在第二位。",
              "The conjugated verb in a main clause is usually in second position.",
              "Het vervoegde werkwoord in een hoofdzin staat meestal op de tweede plaats.",
              "El verbo conjugado en la oración principal suele ocupar la segunda posición.",
              "Das konjugierte Verb im Hauptsatz steht meist an zweiter Stelle."
            )
          },
          {
            id: "questions",
            title: L("疑问句", "Questions", "Vraagzinnen", "Preguntas", "Fragesätze"),
            detail: L(
              "一般疑问句动词提前；特殊疑问句疑问词开头。",
              "In yes/no questions the verb moves to the front; in wh-questions, a question word comes first.",
              "In ja/nee-vragen komt het werkwoord vooraan; in vraagwoordvragen begint de zin met het vraagwoord.",
              "En las preguntas de sí/no el verbo se adelanta; en las preguntas con pronombre interrogativo, este va al principio.",
              "In Ja/Nein-Fragen rückt das Verb an den Anfang; in W-Fragen steht das Fragewort zuerst."
            )
          },
          {
            id: "negation",
            title: L("否定句", "Negative sentences", "Ontkennende zinnen", "Oraciones negativas", "Verneinungssätze"),
            detail: L(
              "geen 否定不定名词，niet 否定其他成分。",
              "geen negates an indefinite noun; niet negates other elements.",
              "geen ontkent een onbepaald zelfstandig naamwoord; niet ontkent andere zinsdelen.",
              "geen niega un sustantivo indefinido; niet niega otros elementos.",
              "geen verneint ein unbestimmtes Nomen; niet verneint andere Satzteile."
            ),
            children: [
              {
                id: "geen",
                title: L(
                  "通过 geen 构成否定句",
                  "Negation with geen",
                  "Ontkenning met geen",
                  "Negación con geen",
                  "Verneinung mit geen"
                ),
                detail: L(
                  "geen boek, geen tijd；常否定不定名词或数量概念。",
                  "geen boek, geen tijd; usually negates an indefinite noun or a quantity concept.",
                  "geen boek, geen tijd; ontkent meestal een onbepaald zelfstandig naamwoord of een hoeveelheidsbegrip.",
                  "geen boek, geen tijd; suele negar un sustantivo indefinido o un concepto de cantidad.",
                  "geen boek, geen tijd; verneint meist ein unbestimmtes Nomen oder einen Mengenbegriff."
                )
              },
              {
                id: "niet",
                title: L(
                  "通过 niet 构成否定句",
                  "Negation with niet",
                  "Ontkenning met niet",
                  "Negación con niet",
                  "Verneinung mit niet"
                ),
                detail: L(
                  "niet groot, niet vandaag, niet naar school；常否定非名词性成分或特指成分。",
                  "niet groot, niet vandaag, niet naar school; usually negates a non-noun element or a specific referent.",
                  "niet groot, niet vandaag, niet naar school; ontkent meestal een niet-naamwoordelijk element of iets specifieks.",
                  "niet groot, niet vandaag, niet naar school; suele negar un elemento no nominal o algo específico.",
                  "niet groot, niet vandaag, niet naar school; verneint meist ein nicht-nominales Element oder etwas Bestimmtes."
                )
              },
              {
                id: "geen-vs-niet",
                title: L(
                  "geen 和 niet 的区别",
                  "geen vs. niet",
                  "Verschil tussen geen en niet",
                  "Diferencia entre geen y niet",
                  "Unterschied zwischen geen und niet"
                ),
                detail: L(
                  "判断核心是看被否定对象：不定名词倾向 geen，其他成分多用 niet。",
                  "The key is what's being negated: indefinite nouns tend to take geen, other elements usually take niet.",
                  "De kern is waarnaar de ontkenning verwijst: onbepaalde zelfstandige naamwoorden nemen geen, andere zinsdelen meestal niet.",
                  "La clave está en qué se niega: los sustantivos indefinidos tienden a usar geen, otros elementos suelen usar niet.",
                  "Entscheidend ist, was verneint wird: unbestimmte Nomen nehmen eher geen, andere Satzteile meist niet."
                )
              },
              {
                id: "other-negative-words",
                title: L(
                  "其它带否定含义的词",
                  "Other negative words",
                  "Andere woorden met ontkennende betekenis",
                  "Otras palabras con significado negativo",
                  "Andere Wörter mit verneinender Bedeutung"
                ),
                detail: L(
                  "niemand, niets, nooit, nergens 等本身带否定意义。",
                  "niemand, niets, nooit, nergens, etc., already carry negative meaning.",
                  "niemand, niets, nooit, nergens enzovoort hebben zelf al een ontkennende betekenis.",
                  "niemand, niets, nooit, nergens, etc., ya llevan un significado negativo.",
                  "niemand, niets, nooit, nergens usw. tragen selbst schon eine verneinende Bedeutung."
                )
              }
            ]
          },
          {
            id: "passive",
            title: L("被动句", "Passive sentences", "Lijdende zinnen", "Oraciones pasivas", "Passivsätze"),
            detail: L(
              "常由 worden/zijn + 过去分词构成。",
              "Usually formed with worden/zijn + past participle.",
              "Meestal gevormd met worden/zijn + voltooid deelwoord.",
              "Suelen formarse con worden/zijn + participio pasado.",
              "Werden meist mit worden/zijn + Partizip Perfekt gebildet."
            ),
            children: [
              {
                id: "passive-general",
                title: L(
                  "被动句的一般结构",
                  "General structure of the passive",
                  "Algemene structuur van de lijdende vorm",
                  "Estructura general de la pasiva",
                  "Allgemeine Struktur des Passivs"
                ),
                detail: L(
                  "动作承受者作主语，配合 worden/zijn + 过去分词。",
                  "The recipient of the action becomes the subject, combined with worden/zijn + past participle.",
                  "Degene die de handeling ondergaat wordt het onderwerp, gecombineerd met worden/zijn + voltooid deelwoord.",
                  "El receptor de la acción se convierte en sujeto, combinado con worden/zijn + participio pasado.",
                  "Der Empfänger der Handlung wird zum Subjekt, kombiniert mit worden/zijn + Partizip Perfekt."
                )
              },
              {
                id: "passive-er",
                title: L(
                  "用副词 Er 构成的被动句",
                  "Passive with the adverb er",
                  "Lijdende vorm met het bijwoord er",
                  "Pasiva con el adverbio er",
                  "Passiv mit dem Adverb er"
                ),
                detail: L(
                  "Er wordt... 可用于不强调具体主语的被动表达。",
                  "Er wordt... can be used for a passive expression that doesn't emphasize a specific subject.",
                  "Er wordt... kan gebruikt worden voor een lijdende uitdrukking waarbij geen specifiek onderwerp benadrukt wordt.",
                  "Er wordt... puede usarse para una expresión pasiva que no enfatiza un sujeto específico.",
                  "Er wordt... kann für einen Passivausdruck verwendet werden, bei dem kein bestimmtes Subjekt betont wird."
                )
              }
            ]
          },
          {
            id: "exclamation",
            title: L("感叹句", "Exclamatory sentences", "Uitroepende zinnen", "Oraciones exclamativas", "Ausrufesätze"),
            detail: L(
              "可省略，也可保留完整句子结构。",
              "Can be elliptical or retain a full sentence structure.",
              "Kunnen elliptisch zijn of een volledige zinsstructuur behouden.",
              "Pueden ser elípticas o conservar una estructura oracional completa.",
              "Können elliptisch sein oder eine vollständige Satzstruktur behalten."
            ),
            children: [
              {
                id: "elliptical-exclamation",
                title: L(
                  "省略感叹句",
                  "Elliptical exclamations",
                  "Elliptische uitroepen",
                  "Exclamaciones elípticas",
                  "Elliptische Ausrufe"
                ),
                detail: L(
                  "省略部分句子成分，突出情绪表达。",
                  "Omit some sentence elements to emphasize emotional expression.",
                  "Laten bepaalde zinsdelen weg om de emotionele uiting te benadrukken.",
                  "Omiten algunos elementos de la oración para resaltar la expresión emocional.",
                  "Lassen bestimmte Satzteile aus, um den emotionalen Ausdruck zu betonen."
                )
              },
              {
                id: "complete-exclamation",
                title: L(
                  "完整感叹句",
                  "Complete exclamations",
                  "Volledige uitroepen",
                  "Exclamaciones completas",
                  "Vollständige Ausrufe"
                ),
                detail: L(
                  "保留较完整的句子结构表达感叹。",
                  "Retain a relatively complete sentence structure to express exclamation.",
                  "Behouden een relatief volledige zinsstructuur om een uitroep uit te drukken.",
                  "Conservan una estructura oracional relativamente completa para expresar exclamación.",
                  "Behalten eine relativ vollständige Satzstruktur, um einen Ausruf auszudrücken."
                )
              }
            ]
          },
          {
            id: "imperative",
            title: L("祈使句", "Imperative sentences", "Gebiedende zinnen", "Oraciones imperativas", "Befehlssätze"),
            detail: L(
              "常省略主语，用于命令、请求或建议。",
              "Usually omit the subject; used for commands, requests, or suggestions.",
              "Laten meestal het onderwerp weg; gebruikt voor bevelen, verzoeken of suggesties.",
              "Suelen omitir el sujeto; se usan para órdenes, peticiones o sugerencias.",
              "Lassen meist das Subjekt weg; werden für Befehle, Bitten oder Vorschläge verwendet."
            )
          }
        ]
      },
      {
        id: "main-subordinate",
        partId: "syntax",
        title: L("主句和从句", "Main and subordinate clauses", "Hoofdzin en bijzin", "Oración principal y subordinada", "Haupt- und Nebensatz"),
        pageRange: "99-107",
        summary: L(
          "主从句的核心是连接词和动词位置：从句中变位动词常后置。",
          "The core of main and subordinate clauses is the conjunction and verb position: the conjugated verb in a subordinate clause is usually placed at the end.",
          "De kern van hoofd- en bijzinnen is het voegwoord en de werkwoordspositie: het vervoegde werkwoord in een bijzin staat meestal achteraan.",
          "El núcleo de las oraciones principales y subordinadas es la conjunción y la posición del verbo: el verbo conjugado en la subordinada suele ir al final.",
          "Der Kern von Haupt- und Nebensätzen sind die Konjunktion und die Verbstellung: Das konjugierte Verb im Nebensatz steht meist am Ende."
        ),
        goals: LA(
          ["理解主句和从句的区别", "能识别时间/条件/原因/主语/宾语/定语从句", "掌握从句动词后置"],
          [
            "Understand the difference between main and subordinate clauses",
            "Be able to identify time/condition/reason/subject/object/relative clauses",
            "Master the verb-final position in subordinate clauses"
          ],
          [
            "Het verschil tussen hoofdzin en bijzin begrijpen",
            "Tijd-, voorwaarde-, reden-, onderwerp-, voorwerp- en betrekkelijke bijzinnen kunnen herkennen",
            "De werkwoordseindpositie in bijzinnen beheersen"
          ],
          [
            "Comprender la diferencia entre oración principal y subordinada",
            "Poder identificar subordinadas de tiempo/condición/causa/sujeto/objeto/relativas",
            "Dominar la posición final del verbo en las subordinadas"
          ],
          [
            "Den Unterschied zwischen Haupt- und Nebensatz verstehen",
            "Zeit-, Bedingungs-, Grund-, Subjekt-, Objekt- und Relativsätze erkennen können",
            "Die Verb-Endstellung im Nebensatz beherrschen"
          ]
        ),
        pitfalls: LA(
          ["从句仍按主句语序写", "连接词后忘记动词放末尾", "定语从句关系词选择不清"],
          [
            "Writing subordinate clauses with main-clause word order",
            "Forgetting to put the verb at the end after a conjunction",
            "Being unclear about which relative word to choose in a relative clause"
          ],
          [
            "Bijzinnen nog steeds met hoofdzinvolgorde schrijven",
            "Vergeten het werkwoord na het voegwoord achteraan te zetten",
            "Onduidelijkheid over de keuze van het betrekkelijk voornaamwoord in een bijzin"
          ],
          [
            "Escribir la subordinada con el orden de la oración principal",
            "Olvidar poner el verbo al final tras la conjunción",
            "No tener claro qué pronombre relativo elegir en una subordinada relativa"
          ],
          [
            "Nebensätze weiterhin mit Hauptsatzwortstellung schreiben",
            "Vergessen, das Verb nach der Konjunktion ans Ende zu setzen",
            "Unklarheit bei der Wahl des Relativworts im Relativsatz"
          ]
        ),
        nodes: [
          {
            id: "main-clause",
            title: L("主句", "Main clause", "Hoofdzin", "Oración principal", "Hauptsatz"),
            detail: L(
              "可以独立成句，动词第二位是关键。",
              "Can stand alone as a sentence; the key is the verb in second position.",
              "Kan zelfstandig een zin vormen; de werkwoordspositie op de tweede plaats is essentieel.",
              "Puede constituir una oración por sí sola; la clave es el verbo en segunda posición.",
              "Kann eigenständig einen Satz bilden; entscheidend ist die zweite Verbstellung."
            )
          },
          {
            id: "subordinate-clause",
            title: L("从句", "Subordinate clause", "Bijzin", "Oración subordinada", "Nebensatz"),
            detail: L(
              "依附主句，常由连接词引导，动词趋向句末。",
              "Depends on the main clause, usually introduced by a conjunction, with the verb tending toward the end.",
              "Hangt af van de hoofdzin, wordt meestal ingeleid door een voegwoord, en het werkwoord staat meestal achteraan.",
              "Depende de la principal, suele estar introducida por una conjunción, y el verbo tiende a ir al final.",
              "Hängt vom Hauptsatz ab, wird meist von einer Konjunktion eingeleitet, wobei das Verb tendenziell am Ende steht."
            )
          },
          {
            id: "time-clause",
            title: L("时间状语从句", "Time clause", "Bijzin van tijd", "Subordinada temporal", "Temporalsatz"),
            detail: L("toen, als, wanneer 等。", "toen, als, wanneer, etc.", "toen, als, wanneer, enzovoort.", "toen, als, wanneer, etc.", "toen, als, wanneer usw.")
          },
          {
            id: "condition-clause",
            title: L("条件状语从句", "Conditional clause", "Bijzin van voorwaarde", "Subordinada condicional", "Konditionalsatz"),
            detail: L(
              "als/indien 引导条件。",
              "als/indien introduce a condition.",
              "als/indien leiden een voorwaarde in.",
              "als/indien introducen una condición.",
              "als/indien leiten eine Bedingung ein."
            )
          },
          {
            id: "reason-clause",
            title: L("原因状语从句", "Reason clause", "Bijzin van reden", "Subordinada causal", "Kausalsatz"),
            detail: L(
              "omdat 等说明原因。",
              "omdat, etc., explain a reason.",
              "omdat enzovoort geven een reden aan.",
              "omdat, etc., explican una razón.",
              "omdat usw. erklären einen Grund."
            )
          },
          {
            id: "subject-object-clause",
            title: L("主语/宾语从句", "Subject/object clause", "Onderwerps-/voorwerpszin", "Subordinada de sujeto/objeto", "Subjekt-/Objektsatz"),
            detail: L(
              "整个从句充当主语或宾语。",
              "The entire clause functions as the subject or object.",
              "De hele bijzin functioneert als onderwerp of voorwerp.",
              "Toda la subordinada funciona como sujeto u objeto.",
              "Der gesamte Nebensatz fungiert als Subjekt oder Objekt."
            )
          },
          {
            id: "relative-clause",
            title: L("定语从句", "Relative clause", "Betrekkelijke bijzin", "Subordinada relativa", "Relativsatz"),
            detail: L(
              "修饰名词，常涉及 die/dat/waar 等。",
              "Modifies a noun, often involving die/dat/waar, etc.",
              "Bepaalt een zelfstandig naamwoord, vaak met die/dat/waar enzovoort.",
              "Modifica a un sustantivo, a menudo con die/dat/waar, etc.",
              "Bestimmt ein Nomen näher, oft mit die/dat/waar usw."
            )
          }
        ]
      },
      {
        id: "word-order",
        partId: "syntax",
        title: L("句子的词序", "Word order", "Woordvolgorde", "Orden de las palabras", "Wortstellung"),
        pageRange: "111-119",
        summary: L(
          "荷兰语词序是中文学习者最需要反复训练的部分：主语、宾语、状语、反身代词、可分前缀都有位置规则。",
          "Dutch word order is the part Chinese learners most need to practice repeatedly: subject, object, adverbial, reflexive pronoun, and separable prefix all follow positional rules.",
          "Nederlandse woordvolgorde is het onderdeel dat Chinese leerders het meest moeten blijven oefenen: onderwerp, voorwerp, bijwoordelijke bepaling, wederkerend voornaamwoord en scheidbaar voorzetsel volgen allemaal positieregels.",
          "El orden de palabras en neerlandés es lo que más deben practicar repetidamente los hablantes de chino: sujeto, objeto, complemento circunstancial, pronombre reflexivo y prefijo separable siguen reglas de posición.",
          "Die niederländische Wortstellung ist der Teil, den chinesische Lernende am meisten wiederholt üben müssen: Subjekt, Objekt, Adverbial, Reflexivpronomen und trennbares Präfix folgen alle Positionsregeln."
        ),
        goals: LA(
          ["能找主语、宾语、状语", "掌握动词第二位和从句动词后置", "知道多个状语和双宾语的排列"],
          [
            "Be able to find the subject, object, and adverbial",
            "Master verb-second position and verb-final position in subordinate clauses",
            "Know how multiple adverbials and double objects are arranged"
          ],
          [
            "Het onderwerp, het voorwerp en de bijwoordelijke bepaling kunnen vinden",
            "De werkwoord-tweede regel en de werkwoordseindpositie in bijzinnen beheersen",
            "Weten hoe meerdere bijwoordelijke bepalingen en dubbele voorwerpen gerangschikt worden"
          ],
          [
            "Poder identificar el sujeto, el objeto y el complemento circunstancial",
            "Dominar el verbo en segunda posición y el verbo final en la subordinada",
            "Saber cómo se ordenan varios complementos circunstanciales y objetos dobles"
          ],
          [
            "Subjekt, Objekt und Adverbial finden können",
            "Die Verb-Zweit-Regel und die Verb-End-Regel im Nebensatz beherrschen",
            "Wissen, wie mehrere Adverbialien und doppelte Objekte angeordnet werden"
          ]
        ),
        pitfalls: LA(
          ["把中文语序直接搬到荷兰语", "可分动词前缀没放句末", "时间/方式/地点状语顺序混乱"],
          [
            "Directly transplanting Chinese word order into Dutch",
            "Not placing the separable-verb prefix at the end of the clause",
            "Getting the order of time/manner/place adverbials mixed up"
          ],
          [
            "Chinese woordvolgorde direct overnemen in het Nederlands",
            "Het voorzetsel van een scheidbaar werkwoord niet aan het einde van de zin zetten",
            "De volgorde van bijwoordelijke bepalingen van tijd/wijze/plaats verwarren"
          ],
          [
            "Trasladar directamente el orden chino al neerlandés",
            "No colocar el prefijo del verbo separable al final de la oración",
            "Confundir el orden de los complementos de tiempo/modo/lugar"
          ],
          [
            "Chinesische Wortstellung direkt ins Niederländische übertragen",
            "Das Präfix eines trennbaren Verbs nicht ans Satzende setzen",
            "Die Reihenfolge von Zeit-/Art-/Ortsadverbialien verwechseln"
          ]
        ),
        nodes: [
          {
            id: "sentence-elements",
            title: L("句子成分", "Sentence elements", "Zinsdelen", "Elementos de la oración", "Satzglieder"),
            detail: L(
              "主语、宾语、状语、谓语是分析词序的基础。",
              "Subject, object, adverbial, and predicate are the basis for analyzing word order.",
              "Onderwerp, voorwerp, bijwoordelijke bepaling en gezegde zijn de basis voor het analyseren van woordvolgorde.",
              "Sujeto, objeto, complemento circunstancial y predicado son la base para analizar el orden de las palabras.",
              "Subjekt, Objekt, Adverbial und Prädikat sind die Grundlage für die Analyse der Wortstellung."
            )
          },
          {
            id: "core-elements",
            title: L(
              "主要句子成分的基本概念",
              "Basic concepts of the main sentence elements",
              "Basisbegrippen van de belangrijkste zinsdelen",
              "Conceptos básicos de los elementos principales de la oración",
              "Grundbegriffe der wichtigsten Satzglieder"
            ),
            detail: L(
              "先能找成分，才能判断词序。",
              "You must first be able to identify the elements before you can judge word order.",
              "Je moet eerst de zinsdelen kunnen herkennen voordat je de woordvolgorde kunt beoordelen.",
              "Primero hay que poder identificar los elementos antes de poder juzgar el orden de las palabras.",
              "Man muss die Satzglieder erst erkennen können, bevor man die Wortstellung beurteilen kann."
            ),
            children: [
              {
                id: "subject",
                title: L("主语", "Subject", "Onderwerp", "Sujeto", "Subjekt"),
                detail: L(
                  "句子谈论的对象，通常决定动词变位。",
                  "What the sentence is about; usually determines verb conjugation.",
                  "Waarover de zin gaat; bepaalt meestal de werkwoordsvervoeging.",
                  "De lo que trata la oración; suele determinar la conjugación del verbo.",
                  "Worüber der Satz spricht; bestimmt meist die Verbkonjugation."
                )
              },
              {
                id: "object",
                title: L("宾语", "Object", "Voorwerp", "Objeto", "Objekt"),
                detail: L(
                  "动作影响的对象，可分直接宾语和间接宾语。",
                  "What the action affects; can be a direct or indirect object.",
                  "Waarop de handeling betrekking heeft; kan een lijdend of meewerkend voorwerp zijn.",
                  "Aquello a lo que afecta la acción; puede ser objeto directo o indirecto.",
                  "Worauf sich die Handlung bezieht; kann direktes oder indirektes Objekt sein."
                )
              },
              {
                id: "attribute",
                title: L("定语", "Attribute", "Bepaling (bijvoeglijk gebruik)", "Atributo", "Attribut"),
                detail: L(
                  "修饰名词，常由形容词、短语或从句承担。",
                  "Modifies a noun, often realized by an adjective, phrase, or clause.",
                  "Bepaalt een zelfstandig naamwoord, vaak door een bijvoeglijk naamwoord, een zinsdeel of een bijzin.",
                  "Modifica a un sustantivo, a menudo mediante un adjetivo, un sintagma o una subordinada.",
                  "Bestimmt ein Nomen näher, oft durch ein Adjektiv, eine Wortgruppe oder einen Nebensatz."
                )
              },
              {
                id: "adverbial",
                title: L("状语", "Adverbial", "Bijwoordelijke bepaling", "Complemento circunstancial", "Adverbial"),
                detail: L(
                  "说明时间、地点、方式、原因等。",
                  "Expresses time, place, manner, reason, etc.",
                  "Geeft tijd, plaats, wijze, reden enzovoort aan.",
                  "Expresa tiempo, lugar, modo, causa, etc.",
                  "Drückt Zeit, Ort, Art, Grund usw. aus."
                )
              }
            ]
          },
          {
            id: "general-word-order",
            title: L(
              "词序的一般规律",
              "General rules of word order",
              "Algemene regels van woordvolgorde",
              "Reglas generales del orden de palabras",
              "Allgemeine Regeln der Wortstellung"
            ),
            detail: L(
              "主句和从句的动词位置不同。",
              "The verb position differs between main and subordinate clauses.",
              "De werkwoordspositie verschilt tussen hoofdzin en bijzin.",
              "La posición del verbo difiere entre la oración principal y la subordinada.",
              "Die Verbstellung unterscheidet sich zwischen Haupt- und Nebensatz."
            ),
            children: [
              {
                id: "main-clause-order",
                title: L(
                  "主句词序的一般规律",
                  "General word order in main clauses",
                  "Algemene woordvolgorde in hoofdzinnen",
                  "Orden general de palabras en la oración principal",
                  "Allgemeine Wortstellung im Hauptsatz"
                ),
                detail: L(
                  "主句中变位动词通常位于第二位。",
                  "The conjugated verb in a main clause is usually in second position.",
                  "Het vervoegde werkwoord in een hoofdzin staat meestal op de tweede plaats.",
                  "El verbo conjugado en la oración principal suele estar en segunda posición.",
                  "Das konjugierte Verb im Hauptsatz steht meist an zweiter Stelle."
                )
              },
              {
                id: "subordinate-clause-order",
                title: L(
                  "从句词序的一般规律",
                  "General word order in subordinate clauses",
                  "Algemene woordvolgorde in bijzinnen",
                  "Orden general de palabras en la subordinada",
                  "Allgemeine Wortstellung im Nebensatz"
                ),
                detail: L(
                  "从句中变位动词常位于句末。",
                  "The conjugated verb in a subordinate clause is usually at the end of the clause.",
                  "Het vervoegde werkwoord in een bijzin staat meestal aan het einde van de zin.",
                  "El verbo conjugado en la subordinada suele ir al final de la oración.",
                  "Das konjugierte Verb im Nebensatz steht meist am Satzende."
                )
              }
            ]
          },
          {
            id: "time-adverbs",
            title: L(
              "时间状语位置",
              "Position of time adverbials",
              "Plaats van bijwoordelijke bepalingen van tijd",
              "Posición de los complementos de tiempo",
              "Position von Zeitadverbialien"
            ),
            detail: L(
              "单个或多个时间状语出现时要注意层级。",
              "Pay attention to hierarchy when one or several time adverbials appear.",
              "Let op de hiërarchie wanneer één of meerdere tijdsbepalingen voorkomen.",
              "Presta atención a la jerarquía cuando aparecen uno o varios complementos de tiempo.",
              "Achte auf die Hierarchie, wenn ein oder mehrere Zeitadverbialien auftreten."
            )
          },
          {
            id: "time-place-adverbs",
            title: L(
              "时间状语和地点状语的位置",
              "Position of time and place adverbials together",
              "Plaats van tijd- en plaatsbepalingen samen",
              "Posición conjunta de los complementos de tiempo y lugar",
              "Position von Zeit- und Ortsadverbialien zusammen"
            ),
            detail: L(
              "时间和地点同时出现时要注意信息焦点和常规顺序。",
              "When time and place appear together, pay attention to information focus and the usual order.",
              "Wanneer tijd en plaats samen voorkomen, let op de informatiefocus en de gebruikelijke volgorde.",
              "Cuando el tiempo y el lugar aparecen juntos, presta atención al foco informativo y al orden habitual.",
              "Wenn Zeit und Ort gemeinsam auftreten, achte auf den Informationsfokus und die übliche Reihenfolge."
            )
          },
          {
            id: "manner-adverbs",
            title: L(
              "方式状语位置",
              "Position of manner adverbials",
              "Plaats van bijwoordelijke bepalingen van wijze",
              "Posición de los complementos de modo",
              "Position von Artadverbialien"
            ),
            detail: L(
              "方式状语常靠近动词相关结构。",
              "Manner adverbials are usually placed near verb-related structures.",
              "Bepalingen van wijze staan meestal dicht bij werkwoordsgerelateerde structuren.",
              "Los complementos de modo suelen colocarse cerca de las estructuras relacionadas con el verbo.",
              "Artadverbialien stehen meist nahe an verbbezogenen Strukturen."
            )
          },
          {
            id: "objects",
            title: L("直接/间接宾语", "Direct/indirect objects", "Lijdend/meewerkend voorwerp", "Objeto directo/indirecto", "Direktes/indirektes Objekt"),
            detail: L(
              "双宾语位置和是否带介词有关。",
              "The position of double objects relates to whether a preposition is used.",
              "De plaats van dubbele voorwerpen hangt samen met het al dan niet gebruiken van een voorzetsel.",
              "La posición de los objetos dobles depende de si se usa una preposición.",
              "Die Position doppelter Objekte hängt davon ab, ob eine Präposition verwendet wird."
            )
          },
          {
            id: "separable-prefix-position",
            title: L(
              "可分动词前缀位置",
              "Position of the separable-verb prefix",
              "Plaats van het voorzetsel van scheidbare werkwoorden",
              "Posición del prefijo del verbo separable",
              "Position des Präfixes trennbarer Verben"
            ),
            detail: L(
              "主句中常放句末。",
              "Usually placed at the end of the clause in a main clause.",
              "Wordt in een hoofdzin meestal aan het einde geplaatst.",
              "Suele colocarse al final de la oración principal.",
              "Wird im Hauptsatz meist ans Satzende gestellt."
            )
          },
          {
            id: "reflexive-position",
            title: L(
              "反身代词位置",
              "Position of the reflexive pronoun",
              "Plaats van het wederkerend voornaamwoord",
              "Posición del pronombre reflexivo",
              "Position des Reflexivpronomens"
            ),
            detail: L(
              "通常紧跟相关动词或主语之后。",
              "Usually placed right after the related verb or subject.",
              "Staat meestal direct na het bijbehorende werkwoord of onderwerp.",
              "Suele colocarse justo después del verbo relacionado o del sujeto.",
              "Steht meist direkt nach dem zugehörigen Verb oder Subjekt."
            )
          }
        ]
      }
    ]
  },
  {
    id: "tenses",
    title: L("第三部分 时态", "Part 3: Tenses", "Deel 3: Werkwoordstijden", "Parte 3: Tiempos verbales", "Teil 3: Zeitformen"),
    pageRange: "121-136",
    theme: L(
      "从时间表达出发：现在、过去、完成和将来。",
      "Starting from time expression: present, past, perfect, and future.",
      "Vanuit tijdsuitdrukking: heden, verleden, voltooid en toekomst.",
      "Partiendo de la expresión temporal: presente, pasado, perfecto y futuro.",
      "Ausgehend vom Ausdruck der Zeit: Gegenwart, Vergangenheit, Perfekt und Zukunft."
    ),
    chapters: [
      {
        id: "present-tense",
        partId: "tenses",
        title: L("现在时态", "Present tense", "Tegenwoordige tijd", "Tiempo presente", "Präsens"),
        pageRange: "121-123",
        summary: L(
          "现在时既表达现在事实，也可表达习惯、普遍真理和部分将来安排。",
          "The present tense expresses present facts, but also habits, general truths, and some planned future events.",
          "De tegenwoordige tijd drukt niet alleen huidige feiten uit, maar ook gewoonten, algemene waarheden en sommige geplande toekomstige gebeurtenissen.",
          "El presente expresa hechos actuales, pero también hábitos, verdades generales y algunos planes futuros.",
          "Das Präsens drückt nicht nur gegenwärtige Tatsachen aus, sondern auch Gewohnheiten, allgemeine Wahrheiten und manche geplanten zukünftigen Ereignisse."
        ),
        goals: LA(
          ["掌握一般现在时构成", "理解现在进行时表达", "知道荷兰语现在时可表达将来"],
          [
            "Master the formation of the simple present",
            "Understand present progressive expressions",
            "Know that the Dutch present tense can express the future"
          ],
          [
            "De vorming van de onvoltooid tegenwoordige tijd beheersen",
            "Uitdrukkingen in de tegenwoordige tijd met een voortdurend aspect begrijpen",
            "Weten dat de Nederlandse tegenwoordige tijd de toekomst kan uitdrukken"
          ],
          [
            "Dominar la formación del presente simple",
            "Comprender las expresiones de presente continuo",
            "Saber que el presente neerlandés puede expresar el futuro"
          ],
          [
            "Die Bildung des einfachen Präsens beherrschen",
            "Ausdrücke des Verlaufspräsens verstehen",
            "Wissen, dass das niederländische Präsens die Zukunft ausdrücken kann"
          ]
        ),
        pitfalls: LA(
          ["忽略人称变位", "把英语进行时习惯套到荷兰语", "所有将来都强行用 zullen"],
          [
            "Ignoring person conjugation",
            "Applying English progressive-tense habits to Dutch",
            "Forcing zullen for every future situation"
          ],
          [
            "De persoonsvervoeging negeren",
            "Engelse gewoontes met de progressive vorm toepassen op het Nederlands",
            "Voor elke toekomst koste wat kost zullen gebruiken"
          ],
          [
            "Ignorar la conjugación personal",
            "Aplicar los hábitos del presente continuo del inglés al neerlandés",
            "Forzar zullen para todo futuro"
          ],
          [
            "Die Personenkonjugation ignorieren",
            "Englische Verlaufsform-Gewohnheiten aufs Niederländische übertragen",
            "Für jede Zukunft zwanghaft zullen verwenden"
          ]
        ),
        nodes: [
          {
            id: "simple-present",
            title: L("一般现在时", "Simple present", "Onvoltooid tegenwoordige tijd", "Presente simple", "Einfaches Präsens"),
            detail: L(
              "表达现在事实、习惯、普遍情况，也可表达部分将来安排。",
              "Expresses present facts, habits, and general situations; can also express some planned future events.",
              "Drukt huidige feiten, gewoonten en algemene situaties uit; kan ook sommige geplande toekomstige gebeurtenissen uitdrukken.",
              "Expresa hechos actuales, hábitos y situaciones generales; también puede expresar algunos planes futuros.",
              "Drückt gegenwärtige Tatsachen, Gewohnheiten und allgemeine Situationen aus; kann auch manche geplanten zukünftigen Ereignisse ausdrücken."
            ),
            children: [
              {
                id: "simple-present-form",
                title: L(
                  "一般现在时的构成规律",
                  "Formation of the simple present",
                  "Vorming van de onvoltooid tegenwoordige tijd",
                  "Formación del presente simple",
                  "Bildung des einfachen Präsens"
                ),
                detail: L(
                  "ik 词干；jij/hij/zij/het 常词干 + t；复数用原形。",
                  "ik takes the stem; jij/hij/zij/het usually take stem + t; plural forms use the infinitive.",
                  "ik krijgt de stam; jij/hij/zij/het krijgen meestal stam + t; meervoudsvormen gebruiken de infinitief.",
                  "ik toma la raíz; jij/hij/zij/het suelen tomar raíz + t; las formas plurales usan el infinitivo.",
                  "ik erhält den Stamm; jij/hij/zij/het erhalten meist Stamm + t; Pluralformen verwenden den Infinitiv."
                )
              },
              {
                id: "simple-present-use",
                title: L(
                  "一般现在时的用法",
                  "Uses of the simple present",
                  "Gebruik van de onvoltooid tegenwoordige tijd",
                  "Usos del presente simple",
                  "Gebrauch des einfachen Präsens"
                ),
                detail: L(
                  "事实、习惯、现在状态，也可表示已安排将来。",
                  "Facts, habits, current states, and also already-arranged future plans.",
                  "Feiten, gewoonten, huidige toestanden, en ook al geregelde toekomstplannen.",
                  "Hechos, hábitos, estados actuales, y también planes futuros ya organizados.",
                  "Tatsachen, Gewohnheiten, gegenwärtige Zustände und auch bereits feststehende Zukunftspläne."
                )
              }
            ]
          },
          {
            id: "present-progressive",
            title: L("现在进行时", "Present progressive", "Tegenwoordige tijd met voortdurend aspect", "Presente continuo", "Verlaufsform der Gegenwart"),
            detail: L(
              "表达正在进行的动作。",
              "Expresses an action currently in progress.",
              "Drukt een handeling uit die momenteel plaatsvindt.",
              "Expresa una acción que está teniendo lugar en este momento.",
              "Drückt eine Handlung aus, die gerade im Gange ist."
            ),
            children: [
              {
                id: "present-progressive-form",
                title: L(
                  "现在进行时的构成规律",
                  "Formation of the present progressive",
                  "Vorming van de tegenwoordige tijd met voortdurend aspect",
                  "Formación del presente continuo",
                  "Bildung der Verlaufsform der Gegenwart"
                ),
                detail: L(
                  "常用 aan het + infinitief 等结构。",
                  "Commonly formed with aan het + infinitief and similar structures.",
                  "Wordt vaak gevormd met aan het + infinitief en soortgelijke structuren.",
                  "Se forma comúnmente con aan het + infinitivo y estructuras similares.",
                  "Wird häufig mit aan het + Infinitiv und ähnlichen Strukturen gebildet."
                )
              },
              {
                id: "present-progressive-use",
                title: L(
                  "现在进行时的用法",
                  "Uses of the present progressive",
                  "Gebruik van de tegenwoordige tijd met voortdurend aspect",
                  "Usos del presente continuo",
                  "Gebrauch der Verlaufsform der Gegenwart"
                ),
                detail: L(
                  "强调动作此刻或某段时间内正在进行。",
                  "Emphasizes that an action is happening right now or during a certain period.",
                  "Benadrukt dat een handeling nu of gedurende een bepaalde periode plaatsvindt.",
                  "Enfatiza que una acción está ocurriendo en este momento o durante un período determinado.",
                  "Betont, dass eine Handlung gerade jetzt oder in einem bestimmten Zeitraum stattfindet."
                )
              }
            ]
          }
        ]
      },
      {
        id: "past-tense",
        partId: "tenses",
        title: L("过去时态", "Past tense", "Verleden tijd", "Tiempo pasado", "Vergangenheitsformen"),
        pageRange: "125-131",
        summary: L(
          "过去表达包括一般过去、过去进行、现在完成和过去完成；要区分叙述过去和结果相关。",
          "Past expressions include simple past, past progressive, present perfect, and past perfect; distinguish narrated past events from those relevant to a present result.",
          "Uitdrukkingen van het verleden omvatten de onvoltooid verleden tijd, de verleden tijd met voortdurend aspect, de voltooid tegenwoordige tijd en de voltooid verleden tijd; onderscheid vertelde gebeurtenissen van gebeurtenissen die relevant zijn voor een resultaat in het heden.",
          "Las expresiones de pasado incluyen el pasado simple, el pasado continuo, el pretérito perfecto y el pluscuamperfecto; distingue los hechos narrados de los relevantes para un resultado presente.",
          "Vergangenheitsausdrücke umfassen Präteritum, Verlaufsform der Vergangenheit, Perfekt und Plusquamperfekt; unterscheide erzählte Vergangenheit von Ereignissen mit Bezug zu einem gegenwärtigen Ergebnis."
        ),
        goals: LA(
          ["掌握一般过去式构成", "理解完成时 hebben/zijn + 过去分词", "知道过去完成表达更早的过去"],
          [
            "Master the formation of the simple past",
            "Understand the perfect tense with hebben/zijn + past participle",
            "Know that the past perfect expresses an even earlier past"
          ],
          [
            "De vorming van de onvoltooid verleden tijd beheersen",
            "De voltooide tijd met hebben/zijn + voltooid deelwoord begrijpen",
            "Weten dat de voltooid verleden tijd een nog eerder verleden uitdrukt"
          ],
          [
            "Dominar la formación del pasado simple",
            "Comprender el perfecto con hebben/zijn + participio pasado",
            "Saber que el pluscuamperfecto expresa un pasado aún anterior"
          ],
          [
            "Die Bildung des Präteritums beherrschen",
            "Das Perfekt mit hebben/zijn + Partizip Perfekt verstehen",
            "Wissen, dass das Plusquamperfekt eine noch frühere Vergangenheit ausdrückt"
          ]
        ),
        pitfalls: LA(
          ["过去式和完成时乱用", "过去分词拼写错误", "不知道何时用 zijn 作助动词"],
          [
            "Mixing up simple past and perfect tense",
            "Spelling errors in the past participle",
            "Not knowing when to use zijn as the auxiliary"
          ],
          [
            "De onvoltooid verleden tijd en de voltooide tijd door elkaar gebruiken",
            "Spelfouten in het voltooid deelwoord",
            "Niet weten wanneer zijn als hulpwerkwoord gebruikt moet worden"
          ],
          [
            "Confundir el pasado simple con el perfecto",
            "Errores ortográficos en el participio pasado",
            "No saber cuándo usar zijn como auxiliar"
          ],
          [
            "Präteritum und Perfekt durcheinanderbringen",
            "Rechtschreibfehler im Partizip Perfekt",
            "Nicht wissen, wann zijn als Hilfsverb verwendet wird"
          ]
        ),
        nodes: [
          {
            id: "simple-past",
            title: L("一般过去时", "Simple past", "Onvoltooid verleden tijd", "Pasado simple", "Präteritum"),
            detail: L(
              "用于叙述过去发生的动作或状态。",
              "Used to narrate actions or states that happened in the past.",
              "Gebruikt om handelingen of toestanden uit het verleden te vertellen.",
              "Se usa para narrar acciones o estados que ocurrieron en el pasado.",
              "Wird verwendet, um Handlungen oder Zustände aus der Vergangenheit zu erzählen."
            ),
            children: [
              {
                id: "simple-past-form",
                title: L(
                  "一般过去时的构成规律",
                  "Formation of the simple past",
                  "Vorming van de onvoltooid verleden tijd",
                  "Formación del pasado simple",
                  "Bildung des Präteritums"
                ),
                detail: L(
                  "弱变化和强变化并存；高频不规则动词要单独记。",
                  "Weak and strong conjugations coexist; high-frequency irregular verbs must be memorized individually.",
                  "Zwakke en sterke werkwoorden bestaan naast elkaar; frequente onregelmatige werkwoorden moeten apart onthouden worden.",
                  "Coexisten conjugaciones débiles y fuertes; los verbos irregulares de alta frecuencia deben memorizarse por separado.",
                  "Schwache und starke Konjugation bestehen nebeneinander; häufige unregelmäßige Verben müssen einzeln gelernt werden."
                )
              },
              {
                id: "simple-past-use",
                title: L(
                  "一般过去时的用法",
                  "Uses of the simple past",
                  "Gebruik van de onvoltooid verleden tijd",
                  "Usos del pasado simple",
                  "Gebrauch des Präteritums"
                ),
                detail: L(
                  "常用于叙述、故事、过去背景。",
                  "Commonly used for narration, stories, and past background.",
                  "Vaak gebruikt voor vertellingen, verhalen en achtergrond in het verleden.",
                  "Se usa comúnmente para narraciones, historias y contexto pasado.",
                  "Wird häufig für Erzählungen, Geschichten und Hintergrund in der Vergangenheit verwendet."
                )
              }
            ]
          },
          {
            id: "past-progressive",
            title: L("过去进行时", "Past progressive", "Verleden tijd met voortdurend aspect", "Pasado continuo", "Verlaufsform der Vergangenheit"),
            detail: L(
              "表达过去某时正在进行的动作。",
              "Expresses an action that was in progress at some point in the past.",
              "Drukt een handeling uit die op een bepaald moment in het verleden aan de gang was.",
              "Expresa una acción que estaba en curso en algún momento del pasado.",
              "Drückt eine Handlung aus, die zu einem bestimmten Zeitpunkt in der Vergangenheit im Gange war."
            ),
            children: [
              {
                id: "past-progressive-form",
                title: L(
                  "过去进行时的构成规律",
                  "Formation of the past progressive",
                  "Vorming van de verleden tijd met voortdurend aspect",
                  "Formación del pasado continuo",
                  "Bildung der Verlaufsform der Vergangenheit"
                ),
                detail: L(
                  "用过去时态的进行结构表达过去正在发生。",
                  "Uses a progressive structure in the past tense to express something happening in the past.",
                  "Gebruikt een voortdurende structuur in de verleden tijd om iets uit te drukken dat in het verleden gebeurde.",
                  "Usa una estructura continua en pasado para expresar algo que ocurría en el pasado.",
                  "Verwendet eine Verlaufsstruktur in der Vergangenheit, um etwas auszudrücken, das in der Vergangenheit geschah."
                )
              },
              {
                id: "past-progressive-use",
                title: L(
                  "过去进行时的用法",
                  "Uses of the past progressive",
                  "Gebruik van de verleden tijd met voortdurend aspect",
                  "Usos del pasado continuo",
                  "Gebrauch der Verlaufsform der Vergangenheit"
                ),
                detail: L(
                  "强调过去某一时刻或阶段的持续动作。",
                  "Emphasizes an ongoing action at a certain past moment or period.",
                  "Benadrukt een voortdurende handeling op een bepaald moment of gedurende een bepaalde periode in het verleden.",
                  "Enfatiza una acción continua en un momento o período pasado determinado.",
                  "Betont eine andauernde Handlung zu einem bestimmten vergangenen Zeitpunkt oder Zeitraum."
                )
              }
            ]
          },
          {
            id: "present-perfect",
            title: L("现在完成时", "Present perfect", "Voltooid tegenwoordige tijd", "Pretérito perfecto", "Perfekt"),
            detail: L(
              "hebben/zijn + 过去分词，强调经历、结果或完成。",
              "hebben/zijn + past participle; emphasizes experience, result, or completion.",
              "hebben/zijn + voltooid deelwoord; benadrukt ervaring, resultaat of afronding.",
              "hebben/zijn + participio pasado; enfatiza experiencia, resultado o finalización.",
              "hebben/zijn + Partizip Perfekt; betont Erfahrung, Ergebnis oder Abschluss."
            ),
            children: [
              {
                id: "present-perfect-form",
                title: L(
                  "现在完成时的构成规律",
                  "Formation of the present perfect",
                  "Vorming van de voltooid tegenwoordige tijd",
                  "Formación del pretérito perfecto",
                  "Bildung des Perfekts"
                ),
                detail: L(
                  "hebben/zijn + 过去分词；助动词选择和动词意义有关。",
                  "hebben/zijn + past participle; the choice of auxiliary depends on the verb's meaning.",
                  "hebben/zijn + voltooid deelwoord; de keuze van het hulpwerkwoord hangt af van de betekenis van het werkwoord.",
                  "hebben/zijn + participio pasado; la elección del auxiliar depende del significado del verbo.",
                  "hebben/zijn + Partizip Perfekt; die Wahl des Hilfsverbs hängt von der Bedeutung des Verbs ab."
                )
              },
              {
                id: "present-perfect-use",
                title: L(
                  "现在完成时的用法",
                  "Uses of the present perfect",
                  "Gebruik van de voltooid tegenwoordige tijd",
                  "Usos del pretérito perfecto",
                  "Gebrauch des Perfekts"
                ),
                detail: L(
                  "表示动作已经完成、与现在有关，或表达经历。",
                  "Indicates a completed action relevant to the present, or expresses an experience.",
                  "Geeft aan dat een handeling al voltooid is en relevant is voor het heden, of drukt een ervaring uit.",
                  "Indica una acción ya completada relevante para el presente, o expresa una experiencia.",
                  "Zeigt eine abgeschlossene Handlung mit Bezug zur Gegenwart an oder drückt eine Erfahrung aus."
                )
              }
            ]
          },
          {
            id: "past-perfect",
            title: L("过去完成时", "Past perfect", "Voltooid verleden tijd", "Pluscuamperfecto", "Plusquamperfekt"),
            detail: L(
              "had/was + 过去分词，表达过去之前已完成。",
              "had/was + past participle; expresses something already completed before a point in the past.",
              "had/was + voltooid deelwoord; drukt uit dat iets al voltooid was voor een moment in het verleden.",
              "had/was + participio pasado; expresa algo ya completado antes de un punto del pasado.",
              "had/was + Partizip Perfekt; drückt aus, dass etwas vor einem Zeitpunkt in der Vergangenheit bereits abgeschlossen war."
            ),
            children: [
              {
                id: "past-perfect-form",
                title: L(
                  "过去完成时的构成规律",
                  "Formation of the past perfect",
                  "Vorming van de voltooid verleden tijd",
                  "Formación del pluscuamperfecto",
                  "Bildung des Plusquamperfekts"
                ),
                detail: L("had/was + 过去分词。", "had/was + past participle.", "had/was + voltooid deelwoord.", "had/was + participio pasado.", "had/was + Partizip Perfekt.")
              },
              {
                id: "past-perfect-use",
                title: L(
                  "过去完成时的用法",
                  "Uses of the past perfect",
                  "Gebruik van de voltooid verleden tijd",
                  "Usos del pluscuamperfecto",
                  "Gebrauch des Plusquamperfekts"
                ),
                detail: L(
                  "说明某个过去时间点之前已经发生的动作。",
                  "Explains an action that had already happened before a certain point in the past.",
                  "Verduidelijkt een handeling die al had plaatsgevonden voor een bepaald moment in het verleden.",
                  "Explica una acción que ya había ocurrido antes de un punto determinado del pasado.",
                  "Erklärt eine Handlung, die vor einem bestimmten Zeitpunkt in der Vergangenheit bereits geschehen war."
                )
              }
            ]
          }
        ]
      },
      {
        id: "future-tense",
        partId: "tenses",
        title: L("将来时态", "Future tense", "Toekomende tijd", "Tiempo futuro", "Zukunftsformen"),
        pageRange: "133-136",
        summary: L(
          "荷兰语将来可用现在时、gaan 或 zullen 表达，三者语气和场景不同。",
          "The Dutch future can be expressed with the present tense, gaan, or zullen — each with a different tone and use case.",
          "De Nederlandse toekomst kan worden uitgedrukt met de tegenwoordige tijd, gaan of zullen — elk met een andere toon en toepassing.",
          "El futuro en neerlandés puede expresarse con el presente, gaan o zullen, cada uno con un tono y un uso diferentes.",
          "Die niederländische Zukunft kann mit dem Präsens, gaan oder zullen ausgedrückt werden — jede mit einem anderen Ton und Anwendungsfall."
        ),
        goals: LA(
          ["知道现在时也能表示将来", "掌握 gaan + 原形", "掌握 zullen + 原形"],
          [
            "Know that the present tense can also express the future",
            "Master gaan + infinitive",
            "Master zullen + infinitive"
          ],
          [
            "Weten dat de tegenwoordige tijd ook de toekomst kan uitdrukken",
            "gaan + infinitief beheersen",
            "zullen + infinitief beheersen"
          ],
          [
            "Saber que el presente también puede expresar el futuro",
            "Dominar gaan + infinitivo",
            "Dominar zullen + infinitivo"
          ],
          [
            "Wissen, dass das Präsens auch die Zukunft ausdrücken kann",
            "gaan + Infinitiv beherrschen",
            "zullen + Infinitiv beherrschen"
          ]
        ),
        pitfalls: LA(
          ["所有将来都用 zullen", "gaan 和 zullen 语气差别不清", "忘记助动词后动词用原形"],
          [
            "Using zullen for every future situation",
            "Being unclear about the tonal difference between gaan and zullen",
            "Forgetting that the verb after the auxiliary takes the infinitive form"
          ],
          [
            "Voor elke toekomst zullen gebruiken",
            "Het verschil in toon tussen gaan en zullen niet duidelijk hebben",
            "Vergeten dat het werkwoord na het hulpwerkwoord de infinitiefvorm krijgt"
          ],
          [
            "Usar zullen para todo futuro",
            "No tener claro la diferencia de tono entre gaan y zullen",
            "Olvidar que el verbo después del auxiliar toma la forma de infinitivo"
          ],
          [
            "Für jede Zukunft zullen verwenden",
            "Den Tonunterschied zwischen gaan und zullen nicht klar haben",
            "Vergessen, dass das Verb nach dem Hilfsverb die Infinitivform annimmt"
          ]
        ),
        nodes: [
          {
            id: "future-present",
            title: L("用现在时表示将来", "Using the present tense for the future", "De tegenwoordige tijd gebruiken voor de toekomst", "Usar el presente para el futuro", "Das Präsens für die Zukunft verwenden"),
            detail: L(
              "有明确时间安排时常用现在时。",
              "The present tense is commonly used when there is a clear time arrangement.",
              "De tegenwoordige tijd wordt vaak gebruikt bij een duidelijke tijdsafspraak.",
              "El presente se usa comúnmente cuando hay una organización temporal clara.",
              "Das Präsens wird häufig verwendet, wenn ein klarer Zeitplan besteht."
            )
          },
          {
            id: "future-gaan",
            title: L(
              "使用助动词 gaan 构成将来时",
              "Forming the future with the auxiliary gaan",
              "De toekomst vormen met het hulpwerkwoord gaan",
              "Formar el futuro con el auxiliar gaan",
              "Die Zukunft mit dem Hilfsverb gaan bilden"
            ),
            detail: L(
              "强调计划、趋势、即将发生。",
              "Emphasizes plans, trends, or something about to happen.",
              "Benadrukt plannen, tendensen of iets dat op het punt staat te gebeuren.",
              "Enfatiza planes, tendencias o algo que está por suceder.",
              "Betont Pläne, Tendenzen oder etwas, das gerade geschehen wird."
            ),
            children: [
              {
                id: "future-gaan-form",
                title: L(
                  "gaan 将来时态的构成规律",
                  "Formation of the gaan future",
                  "Vorming van de toekomst met gaan",
                  "Formación del futuro con gaan",
                  "Bildung der Zukunft mit gaan"
                ),
                detail: L(
                  "gaan 按人称变位，后接动词原形。",
                  "gaan is conjugated by person and followed by the infinitive.",
                  "gaan wordt vervoegd naar persoon, gevolgd door de infinitief.",
                  "gaan se conjuga según la persona y va seguido del infinitivo.",
                  "gaan wird nach Person konjugiert, gefolgt vom Infinitiv."
                )
              },
              {
                id: "future-gaan-use",
                title: L(
                  "gaan 将来时态的用法",
                  "Uses of the gaan future",
                  "Gebruik van de toekomst met gaan",
                  "Usos del futuro con gaan",
                  "Gebrauch der Zukunft mit gaan"
                ),
                detail: L(
                  "表达计划、打算、趋势或即将发生。",
                  "Expresses plans, intentions, trends, or something imminent.",
                  "Drukt plannen, voornemens, tendensen of iets dat op handen is uit.",
                  "Expresa planes, intenciones, tendencias o algo inminente.",
                  "Drückt Pläne, Absichten, Tendenzen oder etwas Bevorstehendes aus."
                )
              }
            ]
          },
          {
            id: "future-zullen",
            title: L(
              "使用助动词 zullen 构成将来时",
              "Forming the future with the auxiliary zullen",
              "De toekomst vormen met het hulpwerkwoord zullen",
              "Formar el futuro con el auxiliar zullen",
              "Die Zukunft mit dem Hilfsverb zullen bilden"
            ),
            detail: L(
              "较书面，可表达预测、承诺、推测。",
              "More formal/written; can express predictions, promises, or speculation.",
              "Formeler/schriftelijker; kan voorspellingen, beloften of veronderstellingen uitdrukken.",
              "Más formal/escrito; puede expresar predicciones, promesas o suposiciones.",
              "Eher formell/schriftlich; kann Vorhersagen, Versprechen oder Vermutungen ausdrücken."
            ),
            children: [
              {
                id: "future-zullen-form",
                title: L(
                  "zullen 将来时态的构成规律",
                  "Formation of the zullen future",
                  "Vorming van de toekomst met zullen",
                  "Formación del futuro con zullen",
                  "Bildung der Zukunft mit zullen"
                ),
                detail: L(
                  "zullen 按人称变位，后接动词原形。",
                  "zullen is conjugated by person and followed by the infinitive.",
                  "zullen wordt vervoegd naar persoon, gevolgd door de infinitief.",
                  "zullen se conjuga según la persona y va seguido del infinitivo.",
                  "zullen wird nach Person konjugiert, gefolgt vom Infinitiv."
                )
              },
              {
                id: "future-zullen-use",
                title: L(
                  "zullen 将来时态的用法",
                  "Uses of the zullen future",
                  "Gebruik van de toekomst met zullen",
                  "Usos del futuro con zullen",
                  "Gebrauch der Zukunft mit zullen"
                ),
                detail: L(
                  "表达预测、承诺、推测、较正式的将来。",
                  "Expresses predictions, promises, speculation, and a more formal future.",
                  "Drukt voorspellingen, beloften, veronderstellingen en een formelere toekomst uit.",
                  "Expresa predicciones, promesas, suposiciones y un futuro más formal.",
                  "Drückt Vorhersagen, Versprechen, Vermutungen und eine formellere Zukunft aus."
                )
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "spelling",
    title: L("第四部分 拼写", "Part 4: Spelling", "Deel 4: Spelling", "Parte 4: Ortografía", "Teil 4: Rechtschreibung"),
    pageRange: "137-154",
    theme: L(
      "从声音和书写出发：音节、拼读、变形中的拼写难点。",
      "Starting from sound and writing: syllables, phonics, and spelling difficulties in inflection.",
      "Vanuit klank en schrift: lettergrepen, uitspraakregels en spellingmoeilijkheden bij verbuiging.",
      "Partiendo del sonido y la escritura: sílabas, reglas de lectura y dificultades ortográficas en la flexión.",
      "Ausgehend von Klang und Schrift: Silben, Ausspracheregeln und Rechtschreibschwierigkeiten bei der Flexion."
    ),
    chapters: [
      {
        id: "sound-spelling",
        partId: "spelling",
        title: L(
          "读音与拼写基本规则",
          "Basic rules of pronunciation and spelling",
          "Basisregels van uitspraak en spelling",
          "Reglas básicas de pronunciación y ortografía",
          "Grundregeln von Aussprache und Rechtschreibung"
        ),
        pageRange: "137-141",
        summary: L(
          "拼写规则要和音节、长短元音、辅音组合一起学，才能解释为什么变形时要双写或去字母。",
          "Spelling rules must be learned together with syllables, long/short vowels, and consonant clusters to explain why letters are doubled or dropped during inflection.",
          "Spellingregels moeten samen met lettergrepen, lange/korte klinkers en medeklinkercombinaties worden geleerd om te verklaren waarom letters bij verbuiging worden verdubbeld of weggelaten.",
          "Las reglas ortográficas deben aprenderse junto con las sílabas, las vocales largas/cortas y los grupos consonánticos para explicar por qué se duplican o eliminan letras al flexionar.",
          "Rechtschreibregeln müssen zusammen mit Silben, langen/kurzen Vokalen und Konsonantengruppen gelernt werden, um zu erklären, warum bei der Flexion Buchstaben verdoppelt oder weggelassen werden."
        ),
        goals: LA(
          ["理解元音、辅音和音节", "掌握基础拼读规则", "能把读音和拼写变化联系起来"],
          [
            "Understand vowels, consonants, and syllables",
            "Master basic phonics rules",
            "Be able to connect pronunciation with spelling changes"
          ],
          [
            "Klinkers, medeklinkers en lettergrepen begrijpen",
            "Basisregels van uitspraak beheersen",
            "Uitspraak en spellingveranderingen met elkaar kunnen verbinden"
          ],
          [
            "Comprender las vocales, las consonantes y las sílabas",
            "Dominar las reglas básicas de pronunciación",
            "Poder relacionar la pronunciación con los cambios ortográficos"
          ],
          [
            "Vokale, Konsonanten und Silben verstehen",
            "Grundlegende Ausspracheregeln beherrschen",
            "Aussprache und Rechtschreibänderungen miteinander verbinden können"
          ]
        ),
        pitfalls: LA(
          ["只按字母逐个读", "不区分长短元音", "变形时不知道为什么双写辅音"],
          [
            "Reading letter by letter only",
            "Not distinguishing long and short vowels",
            "Not knowing why a consonant is doubled during inflection"
          ],
          [
            "Alleen letter voor letter lezen",
            "Geen onderscheid maken tussen lange en korte klinkers",
            "Niet weten waarom een medeklinker bij verbuiging verdubbeld wordt"
          ],
          [
            "Leer solo letra por letra",
            "No distinguir entre vocales largas y cortas",
            "No saber por qué se duplica una consonante al flexionar"
          ],
          [
            "Nur Buchstabe für Buchstabe lesen",
            "Lange und kurze Vokale nicht unterscheiden",
            "Nicht wissen, warum bei der Flexion ein Konsonant verdoppelt wird"
          ]
        ),
        nodes: [
          {
            id: "vowels-consonants",
            title: L("元音和辅音", "Vowels and consonants", "Klinkers en medeklinkers", "Vocales y consonantes", "Vokale und Konsonanten"),
            detail: L(
              "荷兰语元音长度和拼写关系密切。",
              "Dutch vowel length is closely tied to spelling.",
              "De lengte van Nederlandse klinkers is nauw verbonden met de spelling.",
              "La duración de las vocales neerlandesas está estrechamente ligada a la ortografía.",
              "Die Länge niederländischer Vokale ist eng mit der Rechtschreibung verknüpft."
            )
          },
          {
            id: "syllables",
            title: L("音节", "Syllables", "Lettergrepen", "Sílabas", "Silben"),
            detail: L(
              "开音节/闭音节影响元音长短和拼写。",
              "Open/closed syllables affect vowel length and spelling.",
              "Open/gesloten lettergrepen beïnvloeden de klinkerlengte en de spelling.",
              "Las sílabas abiertas/cerradas afectan a la duración vocálica y a la ortografía.",
              "Offene/geschlossene Silben beeinflussen die Vokallänge und die Rechtschreibung."
            )
          },
          {
            id: "reading-rules",
            title: L("拼读规则", "Phonics rules", "Uitspraakregels", "Reglas de lectura", "Ausspracheregeln"),
            detail: L(
              "用规则帮助读新词和解释变形拼写。",
              "Use rules to help read new words and explain inflectional spelling.",
              "Gebruik regels om nieuwe woorden te lezen en verbuigingsspelling te verklaren.",
              "Usa las reglas para ayudar a leer palabras nuevas y explicar la ortografía flexiva.",
              "Nutze Regeln, um neue Wörter zu lesen und Flexionsrechtschreibung zu erklären."
            )
          }
        ]
      },
      {
        id: "spelling-difficulties",
        partId: "spelling",
        title: L(
          "容易混淆的拼写难点",
          "Commonly confused spelling difficulties",
          "Veelvoorkomende spellingmoeilijkheden",
          "Dificultades ortográficas que se confunden con frecuencia",
          "Häufig verwechselte Rechtschreibschwierigkeiten"
        ),
        pageRange: "143-154",
        summary: L(
          "名词复数、动词变形、形容词变形都会触发拼写调整；这部分要和词法一起复习。",
          "Noun plurals, verb inflection, and adjective inflection all trigger spelling adjustments; review this section together with morphology.",
          "Meervoud van zelfstandige naamwoorden, werkwoordsvervoeging en verbuiging van bijvoeglijke naamwoorden veroorzaken allemaal spellingaanpassingen; herhaal dit deel samen met de morfologie.",
          "El plural de los sustantivos, la conjugación verbal y la flexión de los adjetivos provocan ajustes ortográficos; repasa esta parte junto con la morfología.",
          "Plural von Nomen, Verbflexion und Adjektivflexion lösen alle Rechtschreibanpassungen aus; wiederhole diesen Teil zusammen mit der Morphologie."
        ),
        goals: LA(
          ["掌握名词复数拼写变化", "掌握动词现在时/过去式/过去分词拼写", "掌握形容词 -e 和比较级拼写"],
          [
            "Master spelling changes in noun plurals",
            "Master spelling of the verb present tense/past tense/past participle",
            "Master spelling of the adjective -e ending and comparatives"
          ],
          [
            "Spellingveranderingen bij het meervoud van zelfstandige naamwoorden beheersen",
            "Spelling van de werkwoordsvormen in tegenwoordige tijd/verleden tijd/voltooid deelwoord beheersen",
            "Spelling van de bijvoeglijke -e en de vergrotende trap beheersen"
          ],
          [
            "Dominar los cambios ortográficos en el plural de los sustantivos",
            "Dominar la ortografía del verbo en presente/pasado/participio pasado",
            "Dominar la ortografía de la terminación -e del adjetivo y el comparativo"
          ],
          [
            "Rechtschreibänderungen im Nomenplural beherrschen",
            "Die Rechtschreibung von Verben im Präsens/Präteritum/Partizip Perfekt beherrschen",
            "Die Rechtschreibung der Adjektiv-Endung -e und des Komparativs beherrschen"
          ]
        ),
        pitfalls: LA(
          ["忘记双写辅音", "长元音变短元音", "过去分词 -d/-t 判断混乱"],
          [
            "Forgetting to double the consonant",
            "Long vowels turning into short vowels",
            "Confusion over judging -d/-t in past participles"
          ],
          [
            "Vergeten de medeklinker te verdubbelen",
            "Lange klinkers die korte klinkers worden",
            "Verwarring over het bepalen van -d/-t in het voltooid deelwoord"
          ],
          [
            "Olvidar duplicar la consonante",
            "Vocales largas que se convierten en cortas",
            "Confusión al determinar -d/-t en el participio pasado"
          ],
          [
            "Vergessen, den Konsonanten zu verdoppeln",
            "Lange Vokale, die zu kurzen werden",
            "Verwechslung bei der Bestimmung von -d/-t im Partizip Perfekt"
          ]
        ),
        nodes: [
          {
            id: "noun-plural-spelling",
            title: L("名词复数拼写", "Noun plural spelling", "Spelling van het meervoud", "Ortografía del plural del sustantivo", "Rechtschreibung des Nomenplurals"),
            detail: L(
              "加 -en/-s 时可能改变元音或辅音。",
              "Adding -en/-s may change the vowel or consonant.",
              "Bij het toevoegen van -en/-s kan de klinker of medeklinker veranderen.",
              "Al añadir -en/-s puede cambiar la vocal o la consonante.",
              "Beim Anhängen von -en/-s kann sich der Vokal oder Konsonant ändern."
            )
          },
          {
            id: "verb-spelling",
            title: L("动词变形拼写", "Verb inflection spelling", "Spelling van werkwoordsvervoeging", "Ortografía de la conjugación verbal", "Rechtschreibung der Verbflexion"),
            detail: L(
              "现在时、过去式、过去分词各有拼写难点。",
              "The present tense, past tense, and past participle each have their own spelling difficulties.",
              "De tegenwoordige tijd, de verleden tijd en het voltooid deelwoord hebben elk hun eigen spellingmoeilijkheden.",
              "El presente, el pasado y el participio pasado tienen cada uno sus propias dificultades ortográficas.",
              "Präsens, Präteritum und Partizip Perfekt haben jeweils eigene Rechtschreibschwierigkeiten."
            ),
            children: [
              {
                id: "present-spelling",
                title: L(
                  "现在时人称变化",
                  "Present-tense person conjugation",
                  "Persoonsvervoeging in de tegenwoordige tijd",
                  "Conjugación personal en presente",
                  "Personenkonjugation im Präsens"
                ),
                detail: L(
                  "词干、-t、倒装都影响拼写。",
                  "The stem, -t, and inversion all affect spelling.",
                  "De stam, -t en inversie beïnvloeden allemaal de spelling.",
                  "La raíz, la -t y la inversión afectan a la ortografía.",
                  "Der Stamm, das -t und die Inversion beeinflussen alle die Rechtschreibung."
                )
              },
              {
                id: "past-spelling",
                title: L("过去式", "Past tense", "Verleden tijd", "Pasado", "Präteritum"),
                detail: L(
                  "弱变化 -de/-te 与强变化需区分。",
                  "Weak conjugation (-de/-te) must be distinguished from strong conjugation.",
                  "Zwakke werkwoorden (-de/-te) moeten onderscheiden worden van sterke werkwoorden.",
                  "Hay que distinguir la conjugación débil (-de/-te) de la fuerte.",
                  "Schwache Konjugation (-de/-te) muss von starker Konjugation unterschieden werden."
                )
              },
              {
                id: "participle-spelling",
                title: L("过去分词", "Past participle", "Voltooid deelwoord", "Participio pasado", "Partizip Perfekt"),
                detail: L(
                  "ge-、-d/-t、可分动词和不可分前缀都要判断。",
                  "You must judge the ge- prefix, -d/-t ending, and separable vs. inseparable prefixes.",
                  "Je moet ge-, -d/-t en scheidbare versus onscheidbare voorzetsels beoordelen.",
                  "Hay que evaluar el prefijo ge-, la terminación -d/-t y los prefijos separables frente a los inseparables.",
                  "Man muss ge-, -d/-t sowie trennbare und untrennbare Präfixe beurteilen."
                )
              }
            ]
          },
          {
            id: "adjective-spelling",
            title: L("形容词变形拼写", "Adjective inflection spelling", "Spelling van bijvoeglijke verbuiging", "Ortografía de la flexión del adjetivo", "Rechtschreibung der Adjektivflexion"),
            detail: L(
              "定语 -e 和比较级可能触发拼写变化。",
              "The attributive -e ending and comparatives may trigger spelling changes.",
              "De attributieve -e en de vergrotende trap kunnen spellingveranderingen veroorzaken.",
              "La terminación atributiva -e y el comparativo pueden provocar cambios ortográficos.",
              "Die attributive Endung -e und der Komparativ können Rechtschreibänderungen auslösen."
            )
          }
        ]
      }
    ]
  }
];

export const grammarGuideChapters = grammarGuideParts.flatMap((part) => part.chapters);
