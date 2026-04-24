/**
 * Copilot Authentication
 *
 * Handles the GitHub OAuth device flow to get a token that can be
 * exchanged for a Copilot API token. The Copilot token is short-lived
 * (~30 min) and auto-refreshed in the background.
 *
 * Flow:
 *   1. Check for saved GitHub token in ~/.clawrouter/github_token
 *   2. If missing, run OAuth device flow (user visits github.com/login/device)
 *   3. Exchange GitHub token for Copilot token via internal API
 *   4. Refresh Copilot token every 25 minutes
 *
 * The Copilot client ID (Iv1.b507a08c87ecfe98) is the same one used by
 * the official Copilot Neovim/Vim plugins.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const CONFIG_DIR = join(homedir(), ".clawrouter");
const TOKEN_FILE = join(CONFIG_DIR, "github_token");

const COPILOT_CLIENT_ID = "Iv1.b507a08c87ecfe98";
const COPILOT_SCOPE = "read:user";

const TOKEN_EXCHANGE_URL = "https://api.github.com/copilot_internal/v2/token";
const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

const EDITOR_VERSION = "vscode/1.100.0";
const PLUGIN_VERSION = "copilot.vim/1.16.0";
const USER_AGENT = "GithubCopilot/1.155.0";

/** Refresh Copilot token every 25 minutes (they expire at ~30 min) */
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

let currentCopilotToken: string | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load saved GitHub token from disk or environment.
 * Priority: COPILOT_GITHUB_TOKEN env > GH_TOKEN env > gh auth token > saved file
 */
function loadGitHubToken(): string | null {
  // 1. Explicit env var
  const envToken = process.env["COPILOT_GITHUB_TOKEN"] || process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"];
  if (envToken) return envToken;

  // 2. Try gh CLI
  try {
    const ghToken = execSync("gh auth token 2>/dev/null", { encoding: "utf-8" }).trim();
    if (ghToken && ghToken.length > 10) return ghToken;
  } catch {
    // gh not installed or not authenticated
  }

  // 3. Saved file
  if (existsSync(TOKEN_FILE)) {
    try {
      const saved = readFileSync(TOKEN_FILE, "utf-8").trim();
      if (saved) return saved;
    } catch {
      // Corrupt file
    }
  }

  return null;
}

function saveGitHubToken(token: string): void {
  ensureConfigDir();
  writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
}

/**
 * Run the GitHub OAuth device flow to get a new token.
 * Prints a URL and code for the user to visit.
 */
async function deviceFlow(): Promise<string> {
  console.log("[ClawRouter] Starting GitHub authentication...");

  const codeResp = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "user-agent": USER_AGENT,
    },
    body: JSON.stringify({
      client_id: COPILOT_CLIENT_ID,
      scope: COPILOT_SCOPE,
    }),
  });

  if (!codeResp.ok) {
    throw new Error(`Device code request failed: ${codeResp.status}`);
  }

  const codeData = await codeResp.json() as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval: number;
  };

  console.log("");
  console.log(`  Visit: ${codeData.verification_uri}`);
  console.log(`  Enter code: ${codeData.user_code}`);
  console.log("");
  console.log("[ClawRouter] Waiting for authentication...");

  const interval = (codeData.interval || 5) * 1000;

  while (true) {
    await new Promise((r) => setTimeout(r, interval));

    const tokenResp = await fetch(ACCESS_TOKEN_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "user-agent": USER_AGENT,
      },
      body: JSON.stringify({
        client_id: COPILOT_CLIENT_ID,
        device_code: codeData.device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const tokenData = await tokenResp.json() as {
      access_token?: string;
      error?: string;
    };

    if (tokenData.access_token) {
      console.log("[ClawRouter] Authentication successful!");
      return tokenData.access_token;
    }

    if (tokenData.error === "authorization_pending") {
      continue;
    }

    if (tokenData.error === "slow_down") {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (tokenData.error === "expired_token") {
      throw new Error("Authentication timed out. Please try again.");
    }

    throw new Error(`Authentication failed: ${tokenData.error}`);
  }
}

/**
 * Exchange a GitHub token for a short-lived Copilot API token.
 */
async function exchangeForCopilotToken(githubToken: string): Promise<string> {
  const resp = await fetch(TOKEN_EXCHANGE_URL, {
    headers: {
      "authorization": `token ${githubToken}`,
      "editor-version": EDITOR_VERSION,
      "editor-plugin-version": PLUGIN_VERSION,
      "user-agent": USER_AGENT,
    },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Copilot token exchange failed (${resp.status}): ${body}`);
  }

  const data = await resp.json() as { token?: string; expires_at?: number };
  if (!data.token) {
    throw new Error("Copilot token exchange returned no token");
  }

  return data.token;
}

/**
 * Get a valid Copilot API token.
 * Handles the full flow: load/create GitHub token → exchange → cache → refresh.
 */
export async function getCopilotToken(): Promise<string> {
  if (currentCopilotToken) return currentCopilotToken;

  // Get or create GitHub token
  let githubToken = loadGitHubToken();
  if (!githubToken) {
    githubToken = await deviceFlow();
    saveGitHubToken(githubToken);
  }

  // Exchange for Copilot token
  try {
    currentCopilotToken = await exchangeForCopilotToken(githubToken);
  } catch (err) {
    // Token might be expired/revoked — try device flow
    console.log(`[ClawRouter] Token exchange failed, re-authenticating...`);
    githubToken = await deviceFlow();
    saveGitHubToken(githubToken);
    currentCopilotToken = await exchangeForCopilotToken(githubToken);
  }

  return currentCopilotToken;
}

/**
 * Start the background token refresh loop.
 */
export function startTokenRefresh(): void {
  if (refreshTimer) return;

  refreshTimer = setInterval(async () => {
    try {
      const githubToken = loadGitHubToken();
      if (githubToken) {
        currentCopilotToken = await exchangeForCopilotToken(githubToken);
        console.log("[ClawRouter] Copilot token refreshed");
      }
    } catch (err) {
      console.error(`[ClawRouter] Token refresh failed: ${err instanceof Error ? err.message : String(err)}`);
      currentCopilotToken = null;
    }
  }, REFRESH_INTERVAL_MS);
}

/**
 * Stop the background token refresh.
 */
export function stopTokenRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Get the current Copilot token without triggering auth flow.
 * Returns null if not authenticated.
 */
export function getCurrentToken(): string | null {
  return currentCopilotToken;
}
