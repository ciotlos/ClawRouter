/**
 * Copilot API Configuration
 *
 * All requests go through the GitHub Copilot API.
 * Authentication is handled by copilot-auth.ts (OAuth device flow + token refresh).
 *
 * This module provides the interface expected by proxy.ts while
 * delegating actual token management to the auth module.
 */

import { getCurrentToken } from "./copilot-auth.js";

const COPILOT_API_BASE = "https://api.githubcopilot.com";

export type ProviderConfig = {
  apiKey: string;
  baseUrl?: string;
};

export type ApiKeysConfig = {
  providers: Record<string, ProviderConfig>;
};

/**
 * Build an ApiKeysConfig from the current Copilot token.
 * Called at startup after authentication completes.
 */
export function loadApiKeys(): ApiKeysConfig {
  const token = getCurrentToken();
  if (!token) {
    return { providers: {} };
  }
  return {
    providers: {
      copilot: { apiKey: token, baseUrl: COPILOT_API_BASE },
    },
  };
}

/**
 * Build a live ApiKeysConfig that always uses the latest token.
 * The proxy holds a reference to this and reads .providers.copilot.apiKey
 * on each request, so it always gets the freshest token.
 */
export function createLiveApiKeys(): ApiKeysConfig {
  const config: ApiKeysConfig = {
    providers: {
      copilot: {
        get apiKey() {
          return getCurrentToken() ?? "";
        },
        baseUrl: COPILOT_API_BASE,
      },
    },
  };
  return config;
}

export function getConfiguredProviders(config: ApiKeysConfig): string[] {
  return Object.keys(config.providers).filter((p) => config.providers[p]?.apiKey);
}

export function getApiKey(config: ApiKeysConfig, _provider?: string): string | undefined {
  return config.providers.copilot?.apiKey;
}

export function getProviderFromModel(modelId: string): string {
  return "copilot";
}

export function resolveProviderAccess(
  config: ApiKeysConfig,
  _modelId: string,
): { apiKey: string; baseUrl: string; provider: string; viaOpenRouter: boolean } | undefined {
  const copilot = config.providers.copilot;
  if (!copilot?.apiKey) return undefined;

  return {
    apiKey: copilot.apiKey,
    baseUrl: copilot.baseUrl ?? COPILOT_API_BASE,
    provider: "copilot",
    viaOpenRouter: false,
  };
}

export function isModelAccessible(config: ApiKeysConfig, _modelId: string): boolean {
  return !!config.providers.copilot?.apiKey;
}

export function hasOpenRouter(_config: ApiKeysConfig): boolean {
  return false;
}

export function getAccessibleProviders(config: ApiKeysConfig): string[] {
  return config.providers.copilot?.apiKey ? ["copilot"] : [];
}
