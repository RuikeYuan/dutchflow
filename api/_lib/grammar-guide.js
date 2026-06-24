const grammarTopics = [
  {
    id: "noun-gender-articles",
    title: "名词词性与冠词",
    partsOfSpeech: ["noun"],
    keywords: ["de", "het", "een", "article", "冠词", "词性", "gender", "名词", "阴性", "阳性", "中性"],
    reference: "《荷兰语语法自学教程》第一部分第一章、第二章",
    notes: [
      "荷兰语名词有词性，常和 de/het 冠词一起记忆；中文没有冠词，这是中文学习者的常见难点。",
      "不定冠词 een 用于单数可数名词；复数和不可数名词通常不用 een。",
      "解释名词时要提醒学习者把冠词、复数、常见搭配一起学。"
    ]
  },
  {
    id: "noun-plural-diminutive",
    title: "名词复数与变小词",
    partsOfSpeech: ["noun"],
    keywords: ["plural", "复数", "meervoud", "je", "tje", "变小词", "diminutive"],
    reference: "《荷兰语语法自学教程》第一部分第一章",
    notes: [
      "名词复数常见形式包括 -en 和 -s，同时会牵涉拼写变化。",
      "变小词通常表达小、亲切或具体化，常见后缀包括 -je/-tje/-pje/-etje 等。",
      "讲解时应给出单数、复数、变小词三列对照。"
    ]
  },
  {
    id: "adjective-inflection",
    title: "形容词作定语的变形",
    partsOfSpeech: ["adj", "adjective"],
    keywords: ["adjective", "形容词", "-e", "bijvoeglijk", "attributive", "定语", "predicative", "表语"],
    reference: "《荷兰语语法自学教程》第一部分第三章",
    notes: [
      "形容词作定语修饰名词时常会加 -e，但和 het-词、不定冠词、单复数有关。",
      "形容词作表语时通常不加 -e，例如 het huis is groot。",
      "中文没有这种定语变形，回答时要明确区分“名词前”和“系动词后”。"
    ]
  },
  {
    id: "adjective-comparison",
    title: "形容词比较级和最高级",
    partsOfSpeech: ["adj", "adjective"],
    keywords: ["比较级", "最高级", "meer", "meest", "comparative", "superlative", "er", "st"],
    reference: "《荷兰语语法自学教程》第一部分第三章",
    notes: [
      "比较级常用 -er，最高级常用 -st，也有 meer/meest + 原级的形式。",
      "讲解时要同时说明拼写变化和例句语境。"
    ]
  },
  {
    id: "verb-present-conjugation",
    title: "动词现在时人称变化",
    partsOfSpeech: ["verb"],
    keywords: ["present", "现在时", "tegenwoordige", "conjugation", "变位", "ik", "jij", "hij", "wij", "gaat", "ga"],
    reference: "《荷兰语语法自学教程》第一部分第五章、第三部分第一章",
    notes: [
      "一般现在时要按人称变位；中文动词不按人称变化，所以这是中文学习者高频错误。",
      "常见规则是 ik 用词干，jij/hij/zij/het 常用词干 + t，复数用动词原形。",
      "倒装或疑问句中 jij 后的 -t 可能脱落，例如 ga jij。"
    ]
  },
  {
    id: "verb-tenses",
    title: "动词时态与过去分词",
    partsOfSpeech: ["verb"],
    keywords: ["past", "perfect", "过去时", "完成时", "过去分词", "voltooid", "imperfectum", "ge"],
    reference: "《荷兰语语法自学教程》第三部分、第四部分第二章",
    notes: [
      "解释动词时可以给出现在时、过去时、完成时三种最实用形式。",
      "完成时通常由 hebben/zijn + 过去分词构成，选择哪个助动词和动词语义有关。",
      "过去分词拼写和 ge-、-d/-t、可分动词等有关。"
    ]
  },
  {
    id: "separable-verbs",
    title: "可分动词",
    partsOfSpeech: ["verb"],
    keywords: ["separable", "可分", "prefix", "前缀", "op", "aan", "uit", "mee", "af"],
    reference: "《荷兰语语法自学教程》第一部分第五章、第二部分第三章",
    notes: [
      "可分动词在主句中前缀常放到句末，完成时时 ge 常夹在前缀和动词之间。",
      "中文学习者容易只记动词主体，忽略前缀位置；回答时要用完整句展示。"
    ]
  },
  {
    id: "modal-verbs",
    title: "情态动词",
    partsOfSpeech: ["verb"],
    keywords: ["modal", "情态", "kunnen", "moeten", "mogen", "willen", "zullen"],
    reference: "《荷兰语语法自学教程》第一部分第五章",
    notes: [
      "情态动词后面常接动词原形，表达能力、必要、允许、意愿或将来。",
      "讲解时要说明情态动词本身也要按人称变化。"
    ]
  },
  {
    id: "pronouns",
    title: "人称、物主、反身和事物代词",
    partsOfSpeech: ["pron", "pronoun"],
    keywords: ["pronoun", "代词", "me", "mij", "je", "jij", "ze", "zij", "hen", "hun", "ons", "onze", "er", "daar", "hier"],
    reference: "《荷兰语语法自学教程》第一部分第六章",
    notes: [
      "人称代词有主格/宾格、重读/弱读区别；中文学习者常忽略这种形式差异。",
      "ons/onze、hen/hun、er/daar/hier 与介词搭配是常见难点。",
      "回答时要给“在句中作什么成分”的判断。"
    ]
  },
  {
    id: "prepositions",
    title: "介词及固定搭配",
    partsOfSpeech: ["prep", "preposition"],
    keywords: ["preposition", "介词", "aan", "op", "in", "naar", "met", "van", "voor", "bij", "tot"],
    reference: "《荷兰语语法自学教程》第一部分第七章",
    notes: [
      "介词常不能按中文逐字翻译，要结合固定搭配和空间/方向/抽象意义学习。",
      "讲解介词时要给出 2-3 个常用搭配和容易误用的中文直译。"
    ]
  },
  {
    id: "negation-geen-niet",
    title: "否定句：geen 与 niet",
    partsOfSpeech: [],
    keywords: ["geen", "niet", "否定", "negation", "negative"],
    reference: "《荷兰语语法自学教程》第二部分第一章",
    notes: [
      "geen 常否定不定名词或数量概念；niet 常否定动词、形容词、副词、介词短语或特定成分。",
      "中文只用“不/没”容易迁移错误，回答时要指出被否定的对象。"
    ]
  },
  {
    id: "word-order",
    title: "荷兰语语序",
    partsOfSpeech: [],
    keywords: ["word order", "语序", "inversion", "倒装", "subordinate", "从句", "主句", "句子成分", "position"],
    reference: "《荷兰语语法自学教程》第二部分第二章、第三章",
    notes: [
      "主句动词通常在第二位；疑问句和前置状语会触发倒装。",
      "从句中变位动词常放在句末。",
      "中文语序较灵活，学习者需要特别看动词位置、状语位置和可分前缀位置。"
    ]
  },
  {
    id: "sentence-types",
    title: "句子类型",
    partsOfSpeech: [],
    keywords: ["question", "疑问句", "陈述句", "被动", "passive", "imperative", "祈使句", "感叹句"],
    reference: "《荷兰语语法自学教程》第二部分第一章",
    notes: [
      "解释句子时可判断它是陈述句、一般疑问句、特殊疑问句、否定句、被动句或祈使句。",
      "疑问句重点看动词和主语的位置。"
    ]
  },
  {
    id: "spelling",
    title: "拼写与读音规则",
    partsOfSpeech: [],
    keywords: ["spelling", "拼写", "vowel", "元音", "consonant", "辅音", "double", "音节", "读音"],
    reference: "《荷兰语语法自学教程》第四部分",
    notes: [
      "名词复数、动词变形、形容词变形都会触发拼写变化。",
      "解释拼写时要把音节、长短元音、双写/去双写等规则说清楚。"
    ]
  }
];

function normalize(value) {
  return String(value ?? "").toLowerCase();
}

export function getGrammarGuideContext({ partOfSpeech = "", question = "", sentence = "", word = "" } = {}) {
  const haystack = normalize([partOfSpeech, question, sentence, word].join(" "));
  const scored = grammarTopics
    .map((topic) => {
      let score = 0;
      if (topic.partsOfSpeech.includes(partOfSpeech)) score += 8;
      for (const keyword of topic.keywords) {
        if (haystack.includes(normalize(keyword))) score += 4;
      }
      return { ...topic, score };
    })
    .filter((topic) => topic.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.length ? scored : grammarTopics.filter((topic) => topic.id === "word-order" || topic.id === "sentence-types");
}

export function formatGrammarGuideContext(context) {
  return context
    .map((topic) => {
      const notes = topic.notes.map((note) => `- ${note}`).join("\n");
      return `${topic.title}（参考：${topic.reference}）\n${notes}`;
    })
    .join("\n\n");
}
