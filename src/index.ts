/**
 * ClawPilotRouter — Copilot Model Router
 *
 * Routes each coding request to the best model for the task.
 * Runs as a standalone OpenAI-compatible proxy.
 *
 * Usage:
 *   clawpilotrouter                    # Start the router
 *   # Point your editor at http://127.0.0.1:8402/v1, model "auto"
 */

// Core proxy
export { startProxy, getProxyPort } from "./proxy.js";
export type { ProxyOptions, ProxyHandle } from "./proxy.js";

// Router
export { route, DEFAULT_ROUTING_CONFIG, getFallbackChain, getFallbackChainFiltered } from "./router/index.js";
export type { RoutingDecision, RoutingConfig, Tier } from "./router/index.js";

// Models
export {
  OPENCLAW_MODELS, BLOCKRUN_MODELS, buildProviderModels, MODEL_ALIASES,
  resolveModelAlias, isAgenticModel, getAgenticModels, getModelContextWindow,
} from "./models.js";

// API keys
export {
  loadApiKeys, createLiveApiKeys, getConfiguredProviders, getApiKey, getProviderFromModel,
  resolveProviderAccess, getAccessibleProviders, isModelAccessible,
} from "./api-keys.js";
export type { ApiKeysConfig, ProviderConfig } from "./api-keys.js";

// Auth
export { getCopilotToken, startTokenRefresh, stopTokenRefresh, getCurrentToken } from "./copilot-auth.js";

// Utilities
export { logUsage } from "./logger.js";
export type { UsageEntry } from "./logger.js";
export { RequestDeduplicator } from "./dedup.js";
export type { CachedResponse } from "./dedup.js";
export { fetchWithRetry, isRetryable, DEFAULT_RETRY_CONFIG } from "./retry.js";
export type { RetryConfig } from "./retry.js";
export { getStats, formatStatsAscii } from "./stats.js";
export type { DailyStats, AggregatedStats } from "./stats.js";
export { SessionStore, getSessionId, DEFAULT_SESSION_CONFIG } from "./session.js";
export type { SessionEntry, SessionConfig } from "./session.js";
