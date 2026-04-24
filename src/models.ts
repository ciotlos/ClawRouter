/**
 * Copilot Model Definitions
 *
 * Models available through the GitHub Copilot API.
 * These are the models the router can select from when classifying
 * coding tasks into tiers.
 *
 * Model list based on GitHub Copilot supported models documentation:
 * https://docs.github.com/copilot/reference/ai-models/supported-models
 *
 * Pricing is in USD per 1M tokens (used for cost tracking / savings display).
 */

import type { ModelDefinitionConfig, ModelProviderConfig } from "./types.js";

/**
 * Model aliases for convenient shorthand access.
 * Users can set model to "sonnet" instead of "claude-sonnet-4".
 */
export const MODEL_ALIASES: Record<string, string> = {
  // Claude
  claude: "claude-sonnet-4.6",
  sonnet: "claude-sonnet-4.6",
  opus: "claude-opus-4.6",
  haiku: "claude-haiku-4.5",

  // OpenAI
  gpt: "gpt-4.1",
  gpt5: "gpt-5.4",
  mini: "gpt-5-mini",
  codex: "gpt-5.3-codex",
  o3: "o3",

  // Google
  gemini: "gemini-3.1-pro",
  flash: "gemini-3-flash",

  // xAI
  grok: "grok-code-fast-1",
  "grok-code": "grok-code-fast-1",
};

/**
 * Resolve a model alias to its full model ID.
 * Returns the original model if not an alias.
 */
export function resolveModelAlias(model: string): string {
  const normalized = model.trim().toLowerCase();
  const resolved = MODEL_ALIASES[normalized];
  if (resolved) return resolved;
  return model;
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
  /** Models optimized for agentic workflows (multi-step autonomous tasks) */
  agentic?: boolean;
};

/**
 * Models available through the GitHub Copilot API.
 *
 * IDs match what the Copilot API expects — no provider prefix needed.
 */
export const COPILOT_MODELS: CopilotModel[] = [
  // Smart routing meta-model — proxy replaces with actual model
  {
    id: "auto",
    name: "ClawRouter Auto",
    inputPrice: 0,
    outputPrice: 0,
    contextWindow: 1_050_000,
    maxOutput: 128_000,
  },

  // --- OpenAI ---

  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    inputPrice: 2.0,
    outputPrice: 8.0,
    contextWindow: 128000,
    maxOutput: 16384,
    vision: true,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    inputPrice: 0.25,
    outputPrice: 2.0,
    contextWindow: 200000,
    maxOutput: 65536,
    reasoning: true,
    vision: true,
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    inputPrice: 1.75,
    outputPrice: 14.0,
    contextWindow: 400000,
    maxOutput: 128000,
    reasoning: true,
    vision: true,
  },
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    inputPrice: 1.75,
    outputPrice: 14.0,
    contextWindow: 400000,
    maxOutput: 128000,
    reasoning: true,
    agentic: true,
  },
  {
    id: "gpt-5.3-codex",
    name: "GPT-5.3 Codex",
    inputPrice: 1.75,
    outputPrice: 14.0,
    contextWindow: 400000,
    maxOutput: 128000,
    reasoning: true,
    agentic: true,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    inputPrice: 2.0,
    outputPrice: 16.0,
    contextWindow: 400000,
    maxOutput: 128000,
    reasoning: true,
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    inputPrice: 0.25,
    outputPrice: 2.0,
    contextWindow: 200000,
    maxOutput: 65536,
    agentic: true,
  },
  {
    id: "o3",
    name: "o3",
    inputPrice: 2.0,
    outputPrice: 8.0,
    contextWindow: 200000,
    maxOutput: 100000,
    reasoning: true,
  },

  // --- Anthropic ---

  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    inputPrice: 1.0,
    outputPrice: 5.0,
    contextWindow: 200000,
    maxOutput: 8192,
    agentic: true,
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    inputPrice: 3.0,
    outputPrice: 15.0,
    contextWindow: 200000,
    maxOutput: 64000,
    reasoning: true,
    agentic: true,
  },
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    inputPrice: 3.0,
    outputPrice: 15.0,
    contextWindow: 200000,
    maxOutput: 64000,
    reasoning: true,
    agentic: true,
  },
  {
    id: "claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    inputPrice: 3.0,
    outputPrice: 15.0,
    contextWindow: 200000,
    maxOutput: 64000,
    reasoning: true,
    agentic: true,
  },
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6",
    inputPrice: 10.0,
    outputPrice: 50.0,
    contextWindow: 200000,
    maxOutput: 32000,
    reasoning: true,
    agentic: true,
  },

  // --- Google ---

  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    inputPrice: 1.25,
    outputPrice: 10.0,
    contextWindow: 1050000,
    maxOutput: 65536,
    reasoning: true,
    vision: true,
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    inputPrice: 0.15,
    outputPrice: 0.6,
    contextWindow: 1000000,
    maxOutput: 65536,
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    inputPrice: 2.0,
    outputPrice: 12.0,
    contextWindow: 1050000,
    maxOutput: 65536,
    reasoning: true,
    vision: true,
  },

  // --- xAI ---

  {
    id: "grok-code-fast-1",
    name: "Grok Code Fast",
    inputPrice: 0.2,
    outputPrice: 1.5,
    contextWindow: 131072,
    maxOutput: 16384,
    agentic: true,
  },
];

// Legacy alias — other files reference BLOCKRUN_MODELS
export const BLOCKRUN_MODELS = COPILOT_MODELS;

/**
 * Convert model definition to OpenClaw-compatible format.
 * Kept for compatibility with proxy internals.
 */
function toModelDef(m: CopilotModel): ModelDefinitionConfig {
  return {
    id: m.id,
    name: m.name,
    api: "openai-completions",
    reasoning: m.reasoning ?? false,
    input: m.vision ? ["text", "image"] : ["text"],
    cost: {
      input: m.inputPrice,
      output: m.outputPrice,
      cacheRead: 0,
      cacheWrite: 0,
    },
    contextWindow: m.contextWindow,
    maxTokens: m.maxOutput,
  };
}

/**
 * All models in provider config format.
 */
export const OPENCLAW_MODELS: ModelDefinitionConfig[] = COPILOT_MODELS.map(toModelDef);

/**
 * Build a provider config pointing at the local proxy.
 */
export function buildProviderModels(baseUrl: string): ModelProviderConfig {
  return {
    baseUrl: `${baseUrl}/v1`,
    api: "openai-completions",
    models: OPENCLAW_MODELS,
  };
}

/**
 * Check if a model is optimized for agentic workflows.
 */
export function isAgenticModel(modelId: string): boolean {
  const model = COPILOT_MODELS.find((m) => m.id === modelId);
  return model?.agentic ?? false;
}

/**
 * Get all agentic-capable models.
 */
export function getAgenticModels(): string[] {
  return COPILOT_MODELS.filter((m) => m.agentic).map((m) => m.id);
}

/**
 * Get context window size for a model.
 */
export function getModelContextWindow(modelId: string): number | undefined {
  const model = COPILOT_MODELS.find((m) => m.id === modelId);
  return model?.contextWindow;
}
