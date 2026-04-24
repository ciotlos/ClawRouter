/**
 * Default Routing Config — Copilot Model Router
 *
 * All routing parameters as a TypeScript constant.
 * Operators override via openclaw.yaml plugin config.
 *
 * Scoring uses 14 weighted dimensions with sigmoid confidence calibration.
 * Weights are tuned for copilot/coding tasks — code presence and agentic
 * signals are boosted, creative markers are reduced.
 */

import type { RoutingConfig } from "./types.js";

export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  version: "2.0",

  classifier: {
    llmModel: "gemini-3-flash",
    llmMaxTokens: 10,
    llmTemperature: 0,
    promptTruncationChars: 500,
    cacheTtlMs: 3_600_000, // 1 hour
  },

  scoring: {
    tokenCountThresholds: { simple: 50, complex: 500 },

    // Multilingual keywords: English + Chinese (中文) + Japanese (日本語) + Russian (Русский) + German (Deutsch)
    codeKeywords: [
      // English
      "function",
      "class",
      "import",
      "def",
      "SELECT",
      "async",
      "await",
      "const",
      "let",
      "var",
      "return",
      "```",
      // Chinese
      "函数",
      "类",
      "导入",
      "定义",
      "查询",
      "异步",
      "等待",
      "常量",
      "变量",
      "返回",
      // Japanese
      "関数",
      "クラス",
      "インポート",
      "非同期",
      "定数",
      "変数",
      // Russian
      "функция",
      "класс",
      "импорт",
      "определ",
      "запрос",
      "асинхронный",
      "ожидать",
      "константа",
      "переменная",
      "вернуть",
      // German
      "funktion",
      "klasse",
      "importieren",
      "definieren",
      "abfrage",
      "asynchron",
      "erwarten",
      "konstante",
      "variable",
      "zurückgeben",
    ],
    reasoningKeywords: [
      // English
      "prove",
      "theorem",
      "derive",
      "step by step",
      "chain of thought",
      "formally",
      "mathematical",
      "proof",
      "logically",
      // Chinese
      "证明",
      "定理",
      "推导",
      "逐步",
      "思维链",
      "形式化",
      "数学",
      "逻辑",
      // Japanese
      "証明",
      "定理",
      "導出",
      "ステップバイステップ",
      "論理的",
      // Russian
      "доказать",
      "докажи",
      "доказательств",
      "теорема",
      "вывести",
      "шаг за шагом",
      "пошагово",
      "поэтапно",
      "цепочка рассуждений",
      "рассуждени",
      "формально",
      "математически",
      "логически",
      // German
      "beweisen",
      "beweis",
      "theorem",
      "ableiten",
      "schritt für schritt",
      "gedankenkette",
      "formal",
      "mathematisch",
      "logisch",
    ],
    simpleKeywords: [
      // English
      "what is",
      "define",
      "translate",
      "hello",
      "yes or no",
      "capital of",
      "how old",
      "who is",
      "when was",
      // Chinese
      "什么是",
      "定义",
      "翻译",
      "你好",
      "是否",
      "首都",
      "多大",
      "谁是",
      "何时",
      // Japanese
      "とは",
      "定義",
      "翻訳",
      "こんにちは",
      "はいかいいえ",
      "首都",
      "誰",
      // Russian
      "что такое",
      "определение",
      "перевести",
      "переведи",
      "привет",
      "да или нет",
      "столица",
      "сколько лет",
      "кто такой",
      "когда",
      "объясни",
      // German
      "was ist",
      "definiere",
      "übersetze",
      "hallo",
      "ja oder nein",
      "hauptstadt",
      "wie alt",
      "wer ist",
      "wann",
      "erkläre",
    ],
    technicalKeywords: [
      // English
      "algorithm",
      "optimize",
      "architecture",
      "distributed",
      "kubernetes",
      "microservice",
      "database",
      "infrastructure",
      // Chinese
      "算法",
      "优化",
      "架构",
      "分布式",
      "微服务",
      "数据库",
      "基础设施",
      // Japanese
      "アルゴリズム",
      "最適化",
      "アーキテクチャ",
      "分散",
      "マイクロサービス",
      "データベース",
      // Russian
      "алгоритм",
      "оптимизировать",
      "оптимизаци",
      "оптимизируй",
      "архитектура",
      "распределённый",
      "микросервис",
      "база данных",
      "инфраструктура",
      // German
      "algorithmus",
      "optimieren",
      "architektur",
      "verteilt",
      "kubernetes",
      "mikroservice",
      "datenbank",
      "infrastruktur",
    ],
    creativeKeywords: [
      // English
      "story",
      "poem",
      "compose",
      "brainstorm",
      "creative",
      "imagine",
      "write a",
      // Chinese
      "故事",
      "诗",
      "创作",
      "头脑风暴",
      "创意",
      "想象",
      "写一个",
      // Japanese
      "物語",
      "詩",
      "作曲",
      "ブレインストーム",
      "創造的",
      "想像",
      // Russian
      "история",
      "рассказ",
      "стихотворение",
      "сочинить",
      "сочини",
      "мозговой штурм",
      "творческий",
      "представить",
      "придумай",
      "напиши",
      // German
      "geschichte",
      "gedicht",
      "komponieren",
      "brainstorming",
      "kreativ",
      "vorstellen",
      "schreibe",
      "erzählung",
    ],

    // New dimension keyword lists (multilingual)
    imperativeVerbs: [
      // English
      "build",
      "create",
      "implement",
      "design",
      "develop",
      "construct",
      "generate",
      "deploy",
      "configure",
      "set up",
      // Chinese
      "构建",
      "创建",
      "实现",
      "设计",
      "开发",
      "生成",
      "部署",
      "配置",
      "设置",
      // Japanese
      "構築",
      "作成",
      "実装",
      "設計",
      "開発",
      "生成",
      "デプロイ",
      "設定",
      // Russian
      "построить",
      "построй",
      "создать",
      "создай",
      "реализовать",
      "реализуй",
      "спроектировать",
      "разработать",
      "разработай",
      "сконструировать",
      "сгенерировать",
      "сгенерируй",
      "развернуть",
      "разверни",
      "настроить",
      "настрой",
      // German
      "erstellen",
      "bauen",
      "implementieren",
      "entwerfen",
      "entwickeln",
      "konstruieren",
      "generieren",
      "bereitstellen",
      "konfigurieren",
      "einrichten",
    ],
    constraintIndicators: [
      // English
      "under",
      "at most",
      "at least",
      "within",
      "no more than",
      "o(",
      "maximum",
      "minimum",
      "limit",
      "budget",
      // Chinese
      "不超过",
      "至少",
      "最多",
      "在内",
      "最大",
      "最小",
      "限制",
      "预算",
      // Japanese
      "以下",
      "最大",
      "最小",
      "制限",
      "予算",
      // Russian
      "не более",
      "не менее",
      "как минимум",
      "в пределах",
      "максимум",
      "минимум",
      "ограничение",
      "бюджет",
      // German
      "höchstens",
      "mindestens",
      "innerhalb",
      "nicht mehr als",
      "maximal",
      "minimal",
      "grenze",
      "budget",
    ],
    outputFormatKeywords: [
      // English
      "json",
      "yaml",
      "xml",
      "table",
      "csv",
      "markdown",
      "schema",
      "format as",
      "structured",
      // Chinese
      "表格",
      "格式化为",
      "结构化",
      // Japanese
      "テーブル",
      "フォーマット",
      "構造化",
      // Russian
      "таблица",
      "форматировать как",
      "структурированный",
      // German
      "tabelle",
      "formatieren als",
      "strukturiert",
    ],
    referenceKeywords: [
      // English
      "above",
      "below",
      "previous",
      "following",
      "the docs",
      "the api",
      "the code",
      "earlier",
      "attached",
      // Chinese
      "上面",
      "下面",
      "之前",
      "接下来",
      "文档",
      "代码",
      "附件",
      // Japanese
      "上記",
      "下記",
      "前の",
      "次の",
      "ドキュメント",
      "コード",
      // Russian
      "выше",
      "ниже",
      "предыдущий",
      "следующий",
      "документация",
      "код",
      "ранее",
      "вложение",
      // German
      "oben",
      "unten",
      "vorherige",
      "folgende",
      "dokumentation",
      "der code",
      "früher",
      "anhang",
    ],
    negationKeywords: [
      // English
      "don't",
      "do not",
      "avoid",
      "never",
      "without",
      "except",
      "exclude",
      "no longer",
      // Chinese
      "不要",
      "避免",
      "从不",
      "没有",
      "除了",
      "排除",
      // Japanese
      "しないで",
      "避ける",
      "決して",
      "なしで",
      "除く",
      // Russian
      "не делай",
      "не надо",
      "нельзя",
      "избегать",
      "никогда",
      "без",
      "кроме",
      "исключить",
      "больше не",
      // German
      "nicht",
      "vermeide",
      "niemals",
      "ohne",
      "außer",
      "ausschließen",
      "nicht mehr",
    ],
    domainSpecificKeywords: [
      // English
      "quantum",
      "fpga",
      "vlsi",
      "risc-v",
      "asic",
      "photonics",
      "genomics",
      "proteomics",
      "topological",
      "homomorphic",
      "zero-knowledge",
      "lattice-based",
      // Chinese
      "量子",
      "光子学",
      "基因组学",
      "蛋白质组学",
      "拓扑",
      "同态",
      "零知识",
      "格密码",
      // Japanese
      "量子",
      "フォトニクス",
      "ゲノミクス",
      "トポロジカル",
      // Russian
      "квантовый",
      "фотоника",
      "геномика",
      "протеомика",
      "топологический",
      "гомоморфный",
      "с нулевым разглашением",
      "на основе решёток",
      // German
      "quanten",
      "photonik",
      "genomik",
      "proteomik",
      "topologisch",
      "homomorph",
      "zero-knowledge",
      "gitterbasiert",
    ],

    // Agentic task keywords - file ops, execution, multi-step, iterative work
    // Pruned: removed overly common words like "then", "first", "run", "test", "build"
    agenticTaskKeywords: [
      // English - File operations (clearly agentic)
      "read file",
      "read the file",
      "look at",
      "check the",
      "open the",
      "edit",
      "modify",
      "update the",
      "change the",
      "write to",
      "create file",
      // English - Execution (specific commands only)
      "execute",
      "deploy",
      "install",
      "npm",
      "pip",
      "compile",
      // English - Multi-step patterns (specific only)
      "after that",
      "and also",
      "once done",
      "step 1",
      "step 2",
      // English - Iterative work
      "fix",
      "debug",
      "until it works",
      "keep trying",
      "iterate",
      "make sure",
      "verify",
      "confirm",
      // Chinese (keep specific ones)
      "读取文件",
      "查看",
      "打开",
      "编辑",
      "修改",
      "更新",
      "创建",
      "执行",
      "部署",
      "安装",
      "第一步",
      "第二步",
      "修复",
      "调试",
      "直到",
      "确认",
      "验证",
    ],

    // Dimension weights (sum to 1.0) — tuned for copilot routing
    dimensionWeights: {
      tokenCount: 0.06,
      codePresence: 0.20, // Boosted — code signals are primary for copilot routing
      reasoningMarkers: 0.15,
      technicalTerms: 0.12,
      creativeMarkers: 0.02, // Reduced — less relevant for copilot
      simpleIndicators: 0.02,
      multiStepPatterns: 0.12,
      questionComplexity: 0.04,
      imperativeVerbs: 0.05, // Boosted — "build", "implement", "create" are core copilot verbs
      constraintCount: 0.04,
      outputFormat: 0.03,
      referenceComplexity: 0.03,
      negationComplexity: 0.01,
      domainSpecificity: 0.02,
      agenticTask: 0.09, // Boosted — agentic coding tasks need strong model selection
    },

    // Tier boundaries on weighted score axis
    tierBoundaries: {
      simpleMedium: 0.0,
      mediumComplex: 0.18,
      complexReasoning: 0.4, // Raised from 0.25 - requires strong reasoning signals
    },

    // Sigmoid steepness for confidence calibration
    confidenceSteepness: 12,
    // Below this confidence → ambiguous (null tier)
    confidenceThreshold: 0.7,
  },

  // Copilot-optimized tiers — balanced for quality AND premium request budget
  // Multipliers: 0x (free), 0.33x (bargain), 1x (standard), 3x (premium), 7.5x+ (extreme)
  tiers: {
    SIMPLE: {
      primary: "grok-code-fast-1", // Fast code completions — 0.33x multiplier
      fallback: ["gemini-3-flash", "gpt-4.1", "gpt-5-mini"], // All 0x-0.33x
    },
    MEDIUM: {
      primary: "claude-sonnet-4.6", // Strong coding — 1x multiplier (sweet spot)
      fallback: [
        "grok-code-fast-1",
        "gpt-4.1",
        "gemini-3-flash",
      ],
    },
    COMPLEX: {
      primary: "gpt-5.4", // Strong reasoning at 1x multiplier — real step up from Sonnet
      fallback: ["claude-sonnet-4.6", "gemini-3.1-pro", "claude-opus-4.6"], // Opus 4.6 at 3x as last resort
    },
    REASONING: {
      primary: "gemini-3.1-pro", // 1M context, strong reasoning — 1x multiplier
      fallback: ["gpt-5.4", "claude-sonnet-4.6", "o3"],
    },
  },

  // Agentic copilot tiers — models that excel at multi-step autonomous coding tasks
  // Agentic tasks justify higher multipliers since they do more work per request
  agenticTiers: {
    SIMPLE: {
      primary: "claude-haiku-4.5", // Quick agentic file reads — 0.33x multiplier
      fallback: ["grok-code-fast-1", "gpt-5-mini", "gpt-4.1"],
    },
    MEDIUM: {
      primary: "claude-sonnet-4.6", // Agentic code edits — 1x multiplier
      fallback: ["gpt-5.3-codex", "grok-code-fast-1", "gemini-3-flash"],
    },
    COMPLEX: {
      primary: "gpt-5.4", // Strong reasoning for agentic multi-step work — 1x multiplier
      fallback: ["claude-sonnet-4.6", "gpt-5.3-codex", "claude-opus-4.6"],
    },
    REASONING: {
      primary: "gemini-3.1-pro", // 1M context for large codebase reasoning
      fallback: ["gpt-5.4", "claude-sonnet-4.6", "o3"],
    },
  },

  overrides: {
    maxTokensForceComplex: 100_000,
    structuredOutputMinTier: "MEDIUM",
    ambiguousDefaultTier: "MEDIUM",
    agenticMode: false,
  },
};
