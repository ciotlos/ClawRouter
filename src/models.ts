/**
 * Copilot Model Definitions
 *
 * Models available through the GitHub Copilot API.
 * Verified against api.githubcopilot.com/models endpoint.
 *
 * Pricing is in USD per 1M tokens (used for cost tracking / savings display).
 */

import type { ModelDefinitionConfig, ModelProviderConfig } from "./types.js";

/**
 * Model aliases for convenient shorthand access.
 */
export const MODEL_ALIASES: Record<string, string> = {
  sonnet: "claude-sonnet-4.6",
  opus: "claude-opus-4.6",
  haiku: "claude-haiku-4.5",
  gpt: "gpt-4.1",
  gpt5: "gpt-5.4",
  mini: "gpt-5-mini",
  codex: "gpt-5.3-codex",
  "4o": "gpt-4o",
};

/**
 * Resolve a model alias to its full model ID.
 */
export function resolveModelAlias(model: string): string {
  const normalized = model.trim().toLowerCase();
  return MODEL_ALIASES[normalized] ?? model;
}

type CopilotModel = {
  id: string;
  name: string;
  inputPrice: number;
  outputPrice: number;
  contextWindow: number;
  maxOutput: number;
  reasoning?: boolean;
  vision?: boolean;
  agentic?: boolean;
  /** Copilot premium request multiplier (0 = free, 0.33 = bargain, 1 = standard, 3+ = premium) */
  multiplier?: number;
};

/**
 * Models verified against the Copilot API (api.githubcopilot.com/models).
 * Only includes models that actually exist on the endpoint.
 */
export const COPILOT_MODELS: CopilotModel[] = [
  // Smart routing meta-model
  {
    id: "auto",
    name: "ClawPilotRouter Auto",
    inputPrice: 0, outputPrice: 0,
    contextWindow: 200000, maxOutput: 128000,
  },

  // --- OpenAI (0x free tier) ---
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    inputPrice: 2.0, outputPrice: 8.0,
    contextWindow: 128000, maxOutput: 16384,
    vision: true, multiplier: 0,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    inputPrice: 0.25, outputPrice: 2.0,
    contextWindow: 200000, maxOutput: 65536,
    reasoning: true, vision: true, multiplier: 0,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    inputPrice: 2.5, outputPrice: 10.0,
    contextWindow: 128000, maxOutput: 16384,
    vision: true, multiplier: 0,
  },

  // --- OpenAI (1x standard) ---
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    inputPrice: 1.75, outputPrice: 14.0,
    contextWindow: 400000, maxOutput: 128000,
    reasoning: true, vision: true, multiplier: 1,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    inputPrice: 2.0, outputPrice: 16.0,
    contextWindow: 400000, maxOutput: 128000,
    reasoning: true, multiplier: 1,
  },

  // --- OpenAI Codex (agentic) ---
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    inputPrice: 1.75, outputPrice: 14.0,
    contextWindow: 400000, maxOutput: 128000,
    reasoning: true, agentic: true, multiplier: 1,
  },
  {
    id: "gpt-5.3-codex",
    name: "GPT-5.3 Codex",
    inputPrice: 1.75, outputPrice: 14.0,
    contextWindow: 400000, maxOutput: 128000,
    reasoning: true, agentic: true, multiplier: 1,
  },

  // --- Anthropic (0.33x bargain) ---
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    inputPrice: 1.0, outputPrice: 5.0,
    contextWindow: 200000, maxOutput: 8192,
    agentic: true, multiplier: 0.33,
  },

  // --- Anthropic (1x standard) ---
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    inputPrice: 3.0, outputPrice: 15.0,
    contextWindow: 200000, maxOutput: 64000,
    reasoning: true, agentic: true, multiplier: 1,
  },
  {
    id: "claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    inputPrice: 3.0, outputPrice: 15.0,
    contextWindow: 200000, maxOutput: 64000,
    reasoning: true, agentic: true, multiplier: 1,
  },

  // --- Anthropic (3x premium) ---
  {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    inputPrice: 10.0, outputPrice: 50.0,
    contextWindow: 200000, maxOutput: 32000,
    reasoning: true, agentic: true, multiplier: 3,
  },
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6",
    inputPrice: 10.0, outputPrice: 50.0,
    contextWindow: 200000, maxOutput: 32000,
    reasoning: true, agentic: true, multiplier: 3,
  },

  // --- Anthropic (7.5x promotional) ---
  {
    id: "claude-opus-4.7",
    name: "Claude Opus 4.7",
    inputPrice: 15.0, outputPrice: 75.0,
    contextWindow: 200000, maxOutput: 32000,
    reasoning: true, agentic: true, multiplier: 7.5,
  },
];

// Legacy alias
export const BLOCKRUN_MODELS = COPILOT_MODELS;

function toModelDef(m: CopilotModel): ModelDefinitionConfig {
  return {
    id: m.id, name: m.name, api: "openai-completions",
    reasoning: m.reasoning ?? false,
    input: m.vision ? ["text", "image"] : ["text"],
    cost: { input: m.inputPrice, output: m.outputPrice, cacheRead: 0, cacheWrite: 0 },
    contextWindow: m.contextWindow, maxTokens: m.maxOutput,
  };
}

export const OPENCLAW_MODELS: ModelDefinitionConfig[] = COPILOT_MODELS.map(toModelDef);

export function buildProviderModels(baseUrl: string): ModelProviderConfig {
  return { baseUrl: `${baseUrl}/v1`, api: "openai-completions", models: OPENCLAW_MODELS };
}

export function isAgenticModel(modelId: string): boolean {
  return COPILOT_MODELS.find((m) => m.id === modelId)?.agentic ?? false;
}

export function getAgenticModels(): string[] {
  return COPILOT_MODELS.filter((m) => m.agentic).map((m) => m.id);
}

export function getModelContextWindow(modelId: string): number | undefined {
  return COPILOT_MODELS.find((m) => m.id === modelId)?.contextWindow;
}
