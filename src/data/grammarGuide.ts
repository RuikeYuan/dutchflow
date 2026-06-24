export type GrammarNode = {
  id: string;
  title: string;
  detail?: string;
  children?: GrammarNode[];
};

export type GrammarChapter = {
  id: string;
  partId: string;
  title: string;
  pageRange: string;
  summary: string;
  goals: string[];
  pitfalls: string[];
  nodes: GrammarNode[];
};

export type GrammarPart = {
  id: string;
  title: string;
  pageRange: string;
  theme: string;
  chapters: GrammarChapter[];
};

export const grammarGuideParts: GrammarPart[] = [
  {
    id: "morphology",
    title: "第一部分 词法",
    pageRange: "1-84",
    theme: "从单词本身出发：词性、变形、搭配和形式变化。",
    chapters: [
      {
        id: "nouns",
        partId: "morphology",
        title: "名词",
        pageRange: "1-8",
        summary: "学习名词时，把词性、de/het、可数性、复数和变小词作为一个整体记忆。",
        goals: ["能判断名词学习时要记录哪些信息", "能识别复数和变小词的基本形式", "理解中文没有名词词性的迁移难点"],
        pitfalls: ["只背中文意思，不背 de/het", "把不可数名词按中文习惯随意加复数", "看到 -je 只理解为“小”，忽略亲切或具体化语气"],
        nodes: [
          {
            id: "noun-gender",
            title: "名词词性",
            detail: "荷兰语名词有阴、阳、中性；实际学习中最重要的是和 de/het 一起记。",
            children: [
              { id: "noun-gender-patterns", title: "可观察规律", detail: "-heid、-ing 常见为 de-词；-ment、-isme 常见为 het-词。" },
              { id: "noun-gender-plural", title: "复数词性", detail: "复数名词通常用 de。" }
            ]
          },
          {
            id: "noun-countability",
            title: "可数与不可数",
            detail: "决定能否用 een、能否自然变复数。",
            children: [
              { id: "countable", title: "可数名词", detail: "可与 een 连用，通常有复数形式。" },
              { id: "uncountable", title: "不可数名词", detail: "表示物质、抽象概念时常不可数。" }
            ]
          },
          {
            id: "noun-plural",
            title: "复数形式",
            detail: "重点关注 -en、-s 以及拼写变化。",
            children: [
              { id: "plural-en", title: "-en", detail: "常见复数后缀，可能触发元音/辅音拼写调整。" },
              { id: "plural-s", title: "-s", detail: "常见于部分外来词、元音结尾词等。" }
            ]
          },
          { id: "noun-diminutive", title: "变小词", detail: "常见 -je/-tje/-pje/-etje；表达小、亲切、具体化。" },
          { id: "gerund", title: "动名词", detail: "动词名词化后可像名词一样在句中使用。" }
        ]
      },
      {
        id: "articles",
        partId: "morphology",
        title: "冠词",
        pageRange: "11-14",
        summary: "冠词是中文学习者的核心难点：要区分定冠词 de/het、不定冠词 een，以及不用冠词的场景。",
        goals: ["理解定冠词和不定冠词的语义差别", "能把冠词和名词一起记", "能初步判断什么时候不用冠词"],
        pitfalls: ["按中文习惯漏掉冠词", "把 de/het 当成可随意互换", "复数名词前误用 een"],
        nodes: [
          {
            id: "definite-articles",
            title: "定冠词",
            detail: "de/het 用于特指、已知、类别或固定表达。",
            children: [
              { id: "de-words", title: "de-词", detail: "通性名词和复数名词常用 de。" },
              { id: "het-words", title: "het-词", detail: "中性单数名词用 het。" }
            ]
          },
          { id: "indefinite-article", title: "不定冠词 een", detail: "用于单数可数名词，表示一个、某个、非特指。" },
          { id: "zero-article", title: "不用冠词", detail: "复数泛指、不可数、部分固定搭配中可能不用冠词。" }
        ]
      },
      {
        id: "adjectives",
        partId: "morphology",
        title: "形容词",
        pageRange: "15-21",
        summary: "形容词重点是定语加 -e、比较级、最高级，以及形容词名词化。",
        goals: ["区分定语和表语位置", "掌握 -e 变形的判断路径", "能形成比较级/最高级"],
        pitfalls: ["把表语形容词也加 -e", "忽略 het + 单数 + 不定语境时的特殊情况", "只记 groter，不理解拼写变化"],
        nodes: [
          {
            id: "adj-attributive",
            title: "作定语时的变形",
            detail: "名词前的形容词常加 -e，但受冠词、词性、单复数影响。",
            children: [
              { id: "adj-before-noun", title: "名词前", detail: "een groot huis / het grote huis / de grote tafel。" },
              { id: "adj-predicate", title: "作表语", detail: "在 zijn/worden 等后通常不加 -e：het huis is groot。" }
            ]
          },
          { id: "adj-comparative", title: "比较级", detail: "常用 -er，也可用 meer + 原级。" },
          { id: "adj-superlative", title: "最高级", detail: "常用 -st，也可用 meest + 原级。" },
          { id: "adj-as-noun", title: "形容词名词化", detail: "形容词可转为指人/事物的名词性表达。" }
        ]
      },
      {
        id: "adverbs",
        partId: "morphology",
        title: "副词",
        pageRange: "25-27",
        summary: "副词说明时间、地点、方式、程度；er 是中文学习者最需要单独攻克的特殊副词。",
        goals: ["识别副词在句中修饰什么", "理解 er 的存在、地点、数量和代词性用法", "知道副词位置会影响句子自然度"],
        pitfalls: ["把 er 逐字翻译成中文", "忽略 er 和介词结合的代词功能", "把方式副词放错位置"],
        nodes: [
          { id: "adverb-concept", title: "副词概念", detail: "修饰动词、形容词、整个句子或其他副词。" },
          {
            id: "er",
            title: "特殊副词 er",
            detail: "可表示存在、地点、数量，也能和介词构成 erop/eraan 等。",
            children: [
              { id: "er-existential", title: "存在 er", detail: "Er is... / Er zijn... 表示有、存在。" },
              { id: "er-preposition", title: "er + 介词", detail: "把事物宾语和介词结合：eraan, ervoor, ermee。" }
            ]
          }
        ]
      },
      {
        id: "verbs",
        partId: "morphology",
        title: "动词",
        pageRange: "29-46",
        summary: "动词是荷兰语句子的发动机：原形、变位、分词、过去式、助动词、情态动词和 zijn 都要分层掌握。",
        goals: ["能找出句子的主要动词形", "掌握现在时人称变化", "理解助动词、情态动词和不及物动词搭配"],
        pitfalls: ["中文动词不变形导致漏 -t", "混淆 gaan/zullen/hebben/zijn 的功能", "可分动词只记主体不记前缀"],
        nodes: [
          {
            id: "verb-forms",
            title: "动词形态",
            detail: "原形、主要动词形、现在分词、过去式、过去分词。",
            children: [
              { id: "infinitive", title: "动词原形", detail: "常以 -en 结尾，也用于情态动词后。" },
              { id: "finite-verb", title: "主要动词形", detail: "随人称、时态、语序变化，是句法核心。" },
              { id: "participles", title: "分词", detail: "现在分词和过去分词用于进行、完成、形容词化等结构。" }
            ]
          },
          { id: "auxiliary-verbs", title: "助动词", detail: "hebben/zijn/worden/gaan/zullen 等帮助构成时态、被动、将来。" },
          { id: "modal-verbs", title: "情态动词", detail: "kunnen/moeten/mogen/willen/zullen 后接动词原形。" },
          { id: "zijn", title: "动词 zijn", detail: "高频不规则动词，也是系动词和完成时助动词。" },
          { id: "intransitive-verbs", title: "不及物动词", detail: "常与固定介词搭配，需要作为词组记忆。" }
        ]
      },
      {
        id: "pronouns",
        partId: "morphology",
        title: "代词",
        pageRange: "51-64",
        summary: "代词要按句法功能学习：主格、宾格、物主、反身、事物、指示、不定。",
        goals: ["区分主格和宾格", "理解重读型/弱读型", "掌握 er/daar/hier 与介词的关系"],
        pitfalls: ["混用 hen/hun", "混用 ons/onze", "不知道 er 可以代替事物并和介词结合"],
        nodes: [
          { id: "personal-pronouns", title: "人称代词", detail: "主格作主语，宾格作宾语或介词宾语。" },
          { id: "possessive-pronouns", title: "物主代词", detail: "注意 ons/onze 和名词词性/数有关。" },
          { id: "reflexive-pronouns", title: "反身代词", detail: "zich/me/je 等可与 zelf 强调自己。" },
          { id: "thing-pronouns", title: "事物代词", detail: "尤其关注 het、er、daar、hier 与介词连用。" },
          { id: "demonstratives", title: "指示代词", detail: "deze/die/dit/dat 与距离、de/het 词相关。" },
          { id: "indefinite-pronouns", title: "不定代词", detail: "iemand/niemand/iets/niets/alles 等表达不确定对象。" }
        ]
      },
      {
        id: "prepositions",
        partId: "morphology",
        title: "介词",
        pageRange: "69-73",
        summary: "介词要按地点、时间、方向和固定搭配学习，不能完全按中文逐字对应。",
        goals: ["掌握地点/时间/方向常用介词", "积累动词 + 介词搭配", "能解释 naar/in/op/aan/met 等高频介词"],
        pitfalls: ["用中文“在/到/对”一一映射", "忽略不及物动词的固定介词", "不知道介词宾语可变成 er + 介词"],
        nodes: [
          { id: "place-prepositions", title: "地点介词", detail: "in/op/aan/bij 等表达位置关系。" },
          { id: "time-prepositions", title: "时间介词", detail: "om/op/in/sinds/tot 等表达时间点或时间段。" },
          { id: "direction-prepositions", title: "方向介词", detail: "naar/uit/door/langs 等表达运动方向。" },
          { id: "verb-preposition", title: "动词搭配介词", detail: "wachten op, denken aan, praten met 等需整体记忆。" },
          { id: "fixed-prepositions", title: "固定搭配", detail: "介词短语常形成固定表达，学习时要收集例句。" }
        ]
      },
      {
        id: "numerals",
        partId: "morphology",
        title: "数词",
        pageRange: "75-84",
        summary: "数词不仅是数字，还包括序数、年份日期、钱数、分数小数和复数用法。",
        goals: ["能读写基数词和序数词", "能表达日期、年份和价格", "理解数词在名词前后的形式"],
        pitfalls: ["年份按中文逐位读", "序数词和基数词混淆", "小数和钱数读法受母语影响"],
        nodes: [
          { id: "cardinal", title: "基数词", detail: "een, twee, drie... 用于数量。" },
          { id: "ordinal", title: "序数词", detail: "eerste, tweede, derde... 用于顺序。" },
          { id: "date-year", title: "年份和日期", detail: "需要掌握荷兰语特定读法。" },
          { id: "money", title: "钱数", detail: "欧元、小数和口语读法要结合场景练。" },
          { id: "fractions-decimals", title: "分数和小数", detail: "分母、逗号、小数位读法和中文不同。" },
          { id: "numeral-plural", title: "数词复数用法", detail: "某些数词可名词化或复数化。" }
        ]
      }
    ]
  },
  {
    id: "syntax",
    title: "第二部分 句法",
    pageRange: "85-119",
    theme: "从句子结构出发：句型、主从句和词序。",
    chapters: [
      {
        id: "sentence-types",
        partId: "syntax",
        title: "主要句子类型",
        pageRange: "85-95",
        summary: "掌握陈述、疑问、否定、被动、感叹、祈使六类句子，尤其注意动词位置和否定词。",
        goals: ["能识别句子类型", "会构造疑问句和否定句", "理解 geen/niet 区别"],
        pitfalls: ["疑问句不倒装", "geen 和 niet 混用", "被动句照搬中文语序"],
        nodes: [
          { id: "declarative", title: "陈述句", detail: "主句中变位动词通常在第二位。" },
          { id: "questions", title: "疑问句", detail: "一般疑问句动词提前；特殊疑问句疑问词开头。" },
          {
            id: "negation",
            title: "否定句",
            detail: "geen 否定不定名词，niet 否定其他成分。",
            children: [
              { id: "geen", title: "geen", detail: "geen boek, geen tijd。" },
              { id: "niet", title: "niet", detail: "niet groot, niet vandaag, niet naar school。" }
            ]
          },
          { id: "passive", title: "被动句", detail: "常由 worden/zijn + 过去分词构成。" },
          { id: "exclamation", title: "感叹句", detail: "可省略，也可保留完整句子结构。" },
          { id: "imperative", title: "祈使句", detail: "常省略主语，用于命令、请求或建议。" }
        ]
      },
      {
        id: "main-subordinate",
        partId: "syntax",
        title: "主句和从句",
        pageRange: "99-107",
        summary: "主从句的核心是连接词和动词位置：从句中变位动词常后置。",
        goals: ["理解主句和从句的区别", "能识别时间/条件/原因/主语/宾语/定语从句", "掌握从句动词后置"],
        pitfalls: ["从句仍按主句语序写", "连接词后忘记动词放末尾", "定语从句关系词选择不清"],
        nodes: [
          { id: "main-clause", title: "主句", detail: "可以独立成句，动词第二位是关键。" },
          { id: "subordinate-clause", title: "从句", detail: "依附主句，常由连接词引导，动词趋向句末。" },
          { id: "time-clause", title: "时间状语从句", detail: "toen, als, wanneer 等。" },
          { id: "condition-clause", title: "条件状语从句", detail: "als/indien 引导条件。" },
          { id: "reason-clause", title: "原因状语从句", detail: "omdat 等说明原因。" },
          { id: "subject-object-clause", title: "主语/宾语从句", detail: "整个从句充当主语或宾语。" },
          { id: "relative-clause", title: "定语从句", detail: "修饰名词，常涉及 die/dat/waar 等。" }
        ]
      },
      {
        id: "word-order",
        partId: "syntax",
        title: "句子的词序",
        pageRange: "111-119",
        summary: "荷兰语词序是中文学习者最需要反复训练的部分：主语、宾语、状语、反身代词、可分前缀都有位置规则。",
        goals: ["能找主语、宾语、状语", "掌握动词第二位和从句动词后置", "知道多个状语和双宾语的排列"],
        pitfalls: ["把中文语序直接搬到荷兰语", "可分动词前缀没放句末", "时间/方式/地点状语顺序混乱"],
        nodes: [
          { id: "sentence-elements", title: "句子成分", detail: "主语、宾语、状语、谓语是分析词序的基础。" },
          { id: "time-adverbs", title: "时间状语位置", detail: "单个或多个时间状语出现时要注意层级。" },
          { id: "manner-adverbs", title: "方式状语位置", detail: "方式状语常靠近动词相关结构。" },
          { id: "objects", title: "直接/间接宾语", detail: "双宾语位置和是否带介词有关。" },
          { id: "separable-prefix-position", title: "可分动词前缀位置", detail: "主句中常放句末。" },
          { id: "reflexive-position", title: "反身代词位置", detail: "通常紧跟相关动词或主语之后。" }
        ]
      }
    ]
  },
  {
    id: "tenses",
    title: "第三部分 时态",
    pageRange: "121-136",
    theme: "从时间表达出发：现在、过去、完成和将来。",
    chapters: [
      {
        id: "present-tense",
        partId: "tenses",
        title: "现在时态",
        pageRange: "121-123",
        summary: "现在时既表达现在事实，也可表达习惯、普遍真理和部分将来安排。",
        goals: ["掌握一般现在时构成", "理解现在进行时表达", "知道荷兰语现在时可表达将来"],
        pitfalls: ["忽略人称变位", "把英语进行时习惯套到荷兰语", "所有将来都强行用 zullen"],
        nodes: [
          { id: "simple-present-form", title: "一般现在时构成", detail: "ik 词干；jij/hij/zij/het 常词干 + t；复数用原形。" },
          { id: "simple-present-use", title: "一般现在时用法", detail: "事实、习惯、现在状态，也可表示已安排将来。" },
          { id: "present-progressive", title: "现在进行时", detail: "常用 aan het + infinitief 等结构表达正在进行。" }
        ]
      },
      {
        id: "past-tense",
        partId: "tenses",
        title: "过去时态",
        pageRange: "125-131",
        summary: "过去表达包括一般过去、过去进行、现在完成和过去完成；要区分叙述过去和结果相关。",
        goals: ["掌握一般过去式构成", "理解完成时 hebben/zijn + 过去分词", "知道过去完成表达更早的过去"],
        pitfalls: ["过去式和完成时乱用", "过去分词拼写错误", "不知道何时用 zijn 作助动词"],
        nodes: [
          { id: "simple-past", title: "一般过去时", detail: "弱变化和强变化并存；高频不规则动词要单独记。" },
          { id: "past-progressive", title: "过去进行时", detail: "表达过去某时正在进行的动作。" },
          { id: "present-perfect", title: "现在完成时", detail: "hebben/zijn + 过去分词，强调经历、结果或完成。" },
          { id: "past-perfect", title: "过去完成时", detail: "had/was + 过去分词，表达过去之前已完成。" }
        ]
      },
      {
        id: "future-tense",
        partId: "tenses",
        title: "将来时态",
        pageRange: "133-136",
        summary: "荷兰语将来可用现在时、gaan 或 zullen 表达，三者语气和场景不同。",
        goals: ["知道现在时也能表示将来", "掌握 gaan + 原形", "掌握 zullen + 原形"],
        pitfalls: ["所有将来都用 zullen", "gaan 和 zullen 语气差别不清", "忘记助动词后动词用原形"],
        nodes: [
          { id: "future-present", title: "用现在时表示将来", detail: "有明确时间安排时常用现在时。" },
          { id: "future-gaan", title: "gaan 将来", detail: "强调计划、趋势、即将发生。" },
          { id: "future-zullen", title: "zullen 将来", detail: "较书面，可表达预测、承诺、推测。" }
        ]
      }
    ]
  },
  {
    id: "spelling",
    title: "第四部分 拼写",
    pageRange: "137-154",
    theme: "从声音和书写出发：音节、拼读、变形中的拼写难点。",
    chapters: [
      {
        id: "sound-spelling",
        partId: "spelling",
        title: "读音与拼写基本规则",
        pageRange: "137-141",
        summary: "拼写规则要和音节、长短元音、辅音组合一起学，才能解释为什么变形时要双写或去字母。",
        goals: ["理解元音、辅音和音节", "掌握基础拼读规则", "能把读音和拼写变化联系起来"],
        pitfalls: ["只按字母逐个读", "不区分长短元音", "变形时不知道为什么双写辅音"],
        nodes: [
          { id: "vowels-consonants", title: "元音和辅音", detail: "荷兰语元音长度和拼写关系密切。" },
          { id: "syllables", title: "音节", detail: "开音节/闭音节影响元音长短和拼写。" },
          { id: "reading-rules", title: "拼读规则", detail: "用规则帮助读新词和解释变形拼写。" }
        ]
      },
      {
        id: "spelling-difficulties",
        partId: "spelling",
        title: "容易混淆的拼写难点",
        pageRange: "143-154",
        summary: "名词复数、动词变形、形容词变形都会触发拼写调整；这部分要和词法一起复习。",
        goals: ["掌握名词复数拼写变化", "掌握动词现在时/过去式/过去分词拼写", "掌握形容词 -e 和比较级拼写"],
        pitfalls: ["忘记双写辅音", "长元音变短元音", "过去分词 -d/-t 判断混乱"],
        nodes: [
          { id: "noun-plural-spelling", title: "名词复数拼写", detail: "加 -en/-s 时可能改变元音或辅音。" },
          {
            id: "verb-spelling",
            title: "动词变形拼写",
            detail: "现在时、过去式、过去分词各有拼写难点。",
            children: [
              { id: "present-spelling", title: "现在时人称变化", detail: "词干、-t、倒装都影响拼写。" },
              { id: "past-spelling", title: "过去式", detail: "弱变化 -de/-te 与强变化需区分。" },
              { id: "participle-spelling", title: "过去分词", detail: "ge-、-d/-t、可分动词和不可分前缀都要判断。" }
            ]
          },
          { id: "adjective-spelling", title: "形容词变形拼写", detail: "定语 -e 和比较级可能触发拼写变化。" }
        ]
      }
    ]
  }
];

export const grammarGuideChapters = grammarGuideParts.flatMap((part) => part.chapters);
