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
    cacheTtlMs: 3_600_000,
  },

  scoring: {
    tokenCountThresholds: { simple: 50, complex: 500 },

    // Keywords: English + Romanian (without diacritics)
    codeKeywords: [
      "function", "class", "import", "def", "SELECT", "async", "await",
      "const", "let", "var", "return", "```",
      // Romanian
      "functie", "clasa", "importa", "defineste", "interogare",
      "asincron", "constanta", "variabila", "returneaza",
    ],
    reasoningKeywords: [
      "prove", "theorem", "derive", "step by step", "chain of thought",
      "formally", "mathematical", "proof", "logically",
      // Romanian
      "demonstreaza", "teorema", "deriva", "pas cu pas",
      "formal", "matematic", "demonstratie", "logic",
    ],
    simpleKeywords: [
      "what is", "define", "translate", "hello", "yes or no",
      "capital of", "how old", "who is", "when was",
      // Romanian
      "ce este", "defineste", "traduce", "salut", "da sau nu",
      "capitala", "cat de vechi", "cine este", "cand a fost",
    ],
    technicalKeywords: [
      "algorithm", "optimize", "architecture", "distributed",
      "kubernetes", "microservice", "database", "infrastructure",
      // Romanian
      "algoritm", "optimizeaza", "arhitectura", "distribuit",
      "microserviciu", "baza de date", "infrastructura",
    ],
    creativeKeywords: [
      "story", "poem", "compose", "brainstorm", "creative", "imagine", "write a",
      // Romanian
      "poveste", "poem", "compune", "brainstorming", "creativ", "imagineaza", "scrie",
    ],

    imperativeVerbs: [
      "build", "create", "implement", "design", "develop", "construct",
      "generate", "deploy", "configure", "set up",
      // Romanian
      "construieste", "creeaza", "implementeaza", "proiecteaza", "dezvolta",
      "genereaza", "deploieaza", "configureaza", "seteaza",
    ],
    constraintIndicators: [
      "under", "at most", "at least", "within", "no more than",
      "o(", "maximum", "minimum", "limit", "budget",
      // Romanian
      "sub", "cel mult", "cel putin", "in limita", "nu mai mult de",
      "maxim", "minim", "limita", "buget",
    ],
    outputFormatKeywords: [
      "json", "yaml", "xml", "table", "csv", "markdown", "schema", "format as", "structured",
      // Romanian
      "tabel", "formateaza ca", "structurat",
    ],
    referenceKeywords: [
      "above", "below", "previous", "following", "the docs", "the api",
      "the code", "earlier", "attached",
      // Romanian
      "mai sus", "mai jos", "anterior", "urmator", "documentatia", "codul", "atasat",
    ],
    negationKeywords: [
      "don't", "do not", "avoid", "never", "without", "except", "exclude", "no longer",
      // Romanian
      "nu face", "evita", "niciodata", "fara", "cu exceptia", "exclude", "nu mai",
    ],
    domainSpecificKeywords: [
      "quantum", "fpga", "vlsi", "risc-v", "asic", "photonics",
      "genomics", "proteomics", "topological", "homomorphic",
      "zero-knowledge", "lattice-based",
      // Romanian
      "cuantic", "fotonica", "genomica", "proteomica", "topologic", "homomorf",
    ],

    agenticTaskKeywords: [
      // File operations
      "read file", "read the file", "look at", "check the", "open the",
      "edit", "modify", "update the", "change the", "write to", "create file",
      // Execution
      "execute", "deploy", "install", "npm", "pip", "compile",
      // Multi-step
      "after that", "and also", "once done", "step 1", "step 2",
      // Iterative
      "fix", "debug", "until it works", "keep trying", "iterate",
      "make sure", "verify", "confirm",
      // Romanian
      "citeste fisierul", "uita-te la", "verifica", "deschide",
      "editeaza", "modifica", "actualizeaza", "schimba",
      "executa", "deploieaza", "instaleaza", "compileaza",
      "dupa aceea", "odata terminat", "pasul 1", "pasul 2",
      "repara", "debugheaza", "pana functioneaza", "asigura-te", "confirma",
    ],

    dimensionWeights: {
      tokenCount: 0.06,
      codePresence: 0.20,
      reasoningMarkers: 0.15,
      technicalTerms: 0.12,
      creativeMarkers: 0.02,
      simpleIndicators: 0.02,
      multiStepPatterns: 0.12,
      questionComplexity: 0.04,
      imperativeVerbs: 0.05,
      constraintCount: 0.04,
      outputFormat: 0.03,
      referenceComplexity: 0.03,
      negationComplexity: 0.01,
      domainSpecificity: 0.02,
      agenticTask: 0.09,
    },

    tierBoundaries: {
      simpleMedium: 0.0,
      mediumComplex: 0.18,
      complexReasoning: 0.4,
    },

    confidenceSteepness: 12,
    confidenceThreshold: 0.7,
  },

  // Tier model assignments — only models verified against api.githubcopilot.com/models
  // Multipliers: 0x (gpt-4.1, gpt-5-mini, gpt-4o), 0.33x (haiku), 1x (sonnet, gpt-5.4), 3x (opus)
  tiers: {
    SIMPLE: {
      primary: "gpt-4o",
      fallback: ["gpt-4.1", "gpt-5-mini", "claude-haiku-4.5"],
    },
    MEDIUM: {
      primary: "claude-sonnet-4.6",
      fallback: ["gpt-5.4", "gpt-4.1", "gpt-4o"],
    },
    COMPLEX: {
      primary: "claude-opus-4.6",
      fallback: ["gpt-5.4", "claude-sonnet-4.6", "gpt-5.2"],
    },
    REASONING: {
      primary: "gpt-5.4",
      fallback: ["claude-sonnet-4.6", "gpt-5.2", "gpt-5-mini"],
    },
  },

  agenticTiers: {
    SIMPLE: {
      primary: "claude-haiku-4.5",
      fallback: ["gpt-4o", "gpt-5-mini", "gpt-4.1"],
    },
    MEDIUM: {
      primary: "claude-sonnet-4.6",
      fallback: ["gpt-5.3-codex", "gpt-4.1", "gpt-4o"],
    },
    COMPLEX: {
      primary: "claude-opus-4.6",
      fallback: ["gpt-5.4", "gpt-5.3-codex", "claude-sonnet-4.6"],
    },
    REASONING: {
      primary: "gpt-5.4",
      fallback: ["claude-sonnet-4.6", "gpt-5.2", "gpt-5-mini"],
    },
  },

  overrides: {
    maxTokensForceComplex: 100_000,
    structuredOutputMinTier: "MEDIUM",
    ambiguousDefaultTier: "MEDIUM",
    agenticMode: false,
  },
};
