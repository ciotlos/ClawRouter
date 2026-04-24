/**
 * Copilot Authentication
 *
 * Handles the GitHub OAuth device flow to get a token for the Copilot API.
 * The token from the Copilot OAuth app (Iv1.b507a08c87ecfe98) works
 * directly as a Bearer token — no separate exchange step needed.
 *
 * Flow:
 *   1. Check for cached Copilot token (not expired)
 *   2. Check for saved GitHub token from device flow
 *   3. Try to use it directly (the device flow token IS the API token)
 *   4. If no token, run OAuth device flow
 *   5. Save token for reuse across restarts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const CONFIG_DIR = join(homedir(), ".clawpilotrouter");
const TOKEN_FILE = join(CONFIG_DIR, "github_token");
const COPILOT_TOKEN_FILE = join(CONFIG_DIR, "copilot_token");

const COPILOT_CLIENT_ID = "Iv1.b507a08c87ecfe98";
const COPILOT_SCOPE = "read:user";

const TOKEN_EXCHANGE_URL = "https://api.github.com/copilot_internal/v2/token";
const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

const EDITOR_VERSION = "vscode/1.100.0";
const PLUGIN_VERSION = "copilot.vim/1.16.0";
const USER_AGENT = "GithubCopilot/1.155.0";

const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

let currentCopilotToken: string | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/** Load saved GitHub token from env, gh CLI, or disk. */
function loadGitHubToken(): string | null {
  const envToken = process.env["COPILOT_GITHUB_TOKEN"] || process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"];
  if (envToken) return envToken;

  try {
    const ghToken = execSync("gh auth token 2>/dev/null", { encoding: "utf-8" }).trim();
    if (ghToken && ghToken.length > 10) return ghToken;
  } catch { /* gh not installed */ }

  if (existsSync(TOKEN_FILE)) {
    try {
      const saved = readFileSync(TOKEN_FILE, "utf-8").trim();
      if (saved) return saved;
    } catch { /* corrupt */ }
  }

  return null;
}

function saveGitHubToken(token: string): void {
  ensureConfigDir();
  writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
}

/** Save Copilot token with timestamp for reuse across restarts. */
function saveCopilotToken(token: string): void {
  ensureConfigDir();
  const data = JSON.stringify({ token, savedAt: Date.now() });
  writeFileSync(COPILOT_TOKEN_FILE, data, { mode: 0o600 });
}

/** Load cached Copilot token if it's less than 25 minutes old. */
function loadCachedCopilotToken(): string | null {
  if (!existsSync(COPILOT_TOKEN_FILE)) return null;
  try {
    const raw = readFileSync(COPILOT_TOKEN_FILE, "utf-8").trim();
    const { token, savedAt } = JSON.parse(raw) as { token: string; savedAt: number };
    const ageMs = Date.now() - savedAt;
    if (ageMs < REFRESH_INTERVAL_MS && token) {
      return token;
    }
  } catch { /* corrupt */ }
  return null;
}

/** Run the GitHub OAuth device flow. */
async function deviceFlow(): Promise<string> {
  console.log("[ClawPilotRouter] Starting GitHub authentication...");

  const codeResp = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "user-agent": USER_AGENT,
    },
    body: JSON.stringify({ client_id: COPILOT_CLIENT_ID, scope: COPILOT_SCOPE }),
  });

  if (!codeResp.ok) throw new Error(`Device code request failed: ${codeResp.status}`);

  const codeData = await codeResp.json() as {
    device_code: string; user_code: string;
    verification_uri: string; interval: number;
  };

  console.log("");
  console.log(`  Visit: ${codeData.verification_uri}`);
  console.log(`  Enter code: ${codeData.user_code}`);
  console.log("");
  console.log("[ClawPilotRouter] Waiting for authentication...");

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

    const tokenData = await tokenResp.json() as { access_token?: string; error?: string };

    if (tokenData.access_token) {
      console.log("[ClawPilotRouter] Authentication successful!");
      return tokenData.access_token;
    }
    if (tokenData.error === "authorization_pending") continue;
    if (tokenData.error === "slow_down") { await new Promise((r) => setTimeout(r, 5000)); continue; }
    if (tokenData.error === "expired_token") throw new Error("Authentication timed out. Please try again.");
    throw new Error(`Authentication failed: ${tokenData.error}`);
  }
}

/** Try to exchange GitHub token for Copilot token via internal API. */
async function tryTokenExchange(githubToken: string): Promise<string | null> {
  try {
    const resp = await fetch(TOKEN_EXCHANGE_URL, {
      headers: {
        "authorization": `token ${githubToken}`,
        "editor-version": EDITOR_VERSION,
        "editor-plugin-version": PLUGIN_VERSION,
        "user-agent": USER_AGENT,
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Get a valid Copilot API token.
 *
 * Priority:
 *   1. In-memory cached token
 *   2. Disk-cached Copilot token (< 25 min old)
 *   3. Exchange GitHub token via internal API
 *   4. Use GitHub token directly (device flow tokens work as Bearer)
 *   5. Run device flow if nothing else works
 */
export async function getCopilotToken(): Promise<string> {
  if (currentCopilotToken) return currentCopilotToken;

  // Try disk-cached Copilot token
  const cached = loadCachedCopilotToken();
  if (cached) {
    console.log("[ClawPilotRouter] Using cached token");
    currentCopilotToken = cached;
    return cached;
  }

  // Try existing GitHub token
  let githubToken = loadGitHubToken();
  if (githubToken) {
    // Try the internal exchange first
    const exchanged = await tryTokenExchange(githubToken);
    if (exchanged) {
      currentCopilotToken = exchanged;
      saveCopilotToken(exchanged);
      return exchanged;
    }

    // Exchange failed — use the GitHub token directly as Bearer
    // (device flow tokens from the Copilot OAuth app work directly)
    console.log("[ClawPilotRouter] Using saved token directly");
    currentCopilotToken = githubToken;
    saveCopilotToken(githubToken);
    return githubToken;
  }

  // No token at all — run device flow
  githubToken = await deviceFlow();
  saveGitHubToken(githubToken);
  currentCopilotToken = githubToken;
  saveCopilotToken(githubToken);
  return githubToken;
}

export function startTokenRefresh(): void {
  if (refreshTimer) return;

  refreshTimer = setInterval(async () => {
    try {
      const githubToken = loadGitHubToken();
      if (!githubToken) return;

      const exchanged = await tryTokenExchange(githubToken);
      if (exchanged) {
        currentCopilotToken = exchanged;
        saveCopilotToken(exchanged);
        console.log("[ClawPilotRouter] Copilot token refreshed (exchange)");
      } else {
        // Keep using the GitHub token directly
        currentCopilotToken = githubToken;
        saveCopilotToken(githubToken);
      }
    } catch (err) {
      console.error(`[ClawPilotRouter] Token refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, REFRESH_INTERVAL_MS);
}

export function stopTokenRefresh(): void {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

export function getCurrentToken(): string | null {
  return currentCopilotToken;
}

/**
 * Force an immediate token refresh, bypassing the cache.
 * Called when a 403 suggests the current token has expired mid-cycle.
 * Returns true if a new token was obtained.
 */
export async function forceTokenRefresh(): Promise<boolean> {
  const githubToken = loadGitHubToken();
  if (!githubToken) return false;

  try {
    const exchanged = await tryTokenExchange(githubToken);
    if (exchanged) {
      currentCopilotToken = exchanged;
      saveCopilotToken(exchanged);
      console.log("[ClawPilotRouter] Token force-refreshed (exchange)");
      return true;
    }
    // Exchange failed — fall back to raw GitHub token
    currentCopilotToken = githubToken;
    saveCopilotToken(githubToken);
    return true;
  } catch (err) {
    console.error(`[ClawPilotRouter] Force token refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
