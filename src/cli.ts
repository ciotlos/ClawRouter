#!/usr/bin/env node
/**
 * ClawPilotRouter CLI — Copilot Model Router
 *
 * Usage:
 *   clawpilotrouter              # Start the router (authenticates via GitHub)
 *   clawpilotrouter --version    # Show version
 */

import { startProxy, getProxyPort } from "./proxy.js";
import { createLiveApiKeys, getConfiguredProviders } from "./api-keys.js";
import { getCopilotToken, startTokenRefresh, stopTokenRefresh } from "./copilot-auth.js";
import { VERSION } from "./version.js";

function printHelp(): void {
  console.log(`
ClawPilotRouter v${VERSION} — Copilot Model Router

Routes every coding request to the best model for the task.
Fast completions get a fast model, complex refactors get a strong one.

Usage:
  clawpilotrouter [options]

Options:
  --version, -v     Show version number
  --help, -h        Show this help message
  --port <number>   Port to listen on (default: ${getProxyPort()})

Point your editor/copilot at http://127.0.0.1:<port>/v1 as an
OpenAI-compatible endpoint, using model "auto" for smart routing.

Authentication:
  ClawPilotRouter uses your GitHub account via OAuth device flow.
  On first run, you'll be asked to visit github.com/login/device
  and enter a code. After that, the token is saved and refreshed
  automatically.

  You can also set GH_TOKEN or COPILOT_GITHUB_TOKEN env var
  to skip the interactive flow.

Examples:
  clawpilotrouter                  # Start (authenticates on first run)
  clawpilotrouter --port 9000      # Custom port

Environment Variables:
  COPILOT_GITHUB_TOKEN  GitHub token with copilot scope
  GH_TOKEN              GitHub CLI token (fallback)
  CLAWPILOTROUTER_PORT       Proxy port (default: 8402)
`);
}

function parseArgs(args: string[]): { version: boolean; help: boolean; port?: number } {
  const result = { version: false, help: false, port: undefined as number | undefined };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--version" || arg === "-v") result.version = true;
    else if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg === "--port" && args[i + 1]) { result.port = parseInt(args[i + 1], 10); i++; }
  }
  return result;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.version) { console.log(VERSION); process.exit(0); }
  if (args.help) { printHelp(); process.exit(0); }

  // Authenticate with GitHub Copilot
  console.log("[ClawPilotRouter] Authenticating with GitHub Copilot...");
  try {
    await getCopilotToken();
  } catch (err) {
    console.error(`[ClawPilotRouter] Authentication failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // Start background token refresh
  startTokenRefresh();

  // Create live API keys config (always reads latest token)
  const apiKeys = createLiveApiKeys();
  const configured = getConfiguredProviders(apiKeys);
  console.log(`[ClawPilotRouter] Authenticated (${configured.length} provider)`);

  // Discover available models from the Copilot API
  try {
    const token = apiKeys.providers.copilot?.apiKey;
    if (token) {
      const resp = await fetch("https://api.githubcopilot.com/models", {
        headers: {
          "authorization": `Bearer ${token}`,
          "editor-version": "vscode/1.100.0",
          "editor-plugin-version": "copilot-chat/0.26.0",
          "copilot-integration-id": "vscode-chat",
        },
      });
      if (resp.ok) {
        const data = await resp.json() as { data?: Array<{ id: string }> };
        const apiModels = new Set((data.data ?? []).map((m: { id: string }) => m.id));
        console.log(`[ClawPilotRouter] ${apiModels.size} models available from Copilot API`);
      }
    }
  } catch {
    // Non-critical — model discovery is informational
  }

  const proxy = await startProxy({
    apiKeys,
    port: args.port,
    onReady: (port) => {
      console.log(`[ClawPilotRouter] Copilot router listening on http://127.0.0.1:${port}/v1`);
      console.log(`[ClawPilotRouter] Use model "auto" for smart routing`);
    },
    onError: (error) => console.error(`[ClawPilotRouter] Error: ${error.message}`),
    onRouted: (decision) => {
      const tier = decision.tier.padEnd(9);
      console.log(`[ClawPilotRouter] ${tier} → ${decision.model} (confidence=${decision.confidence.toFixed(2)})`);
    },
  });

  console.log(`[ClawPilotRouter] Ready — Ctrl+C to stop`);

  const shutdown = async (signal: string) => {
    console.log(`\n[ClawPilotRouter] Received ${signal}, shutting down...`);
    stopTokenRefresh();
    try { await proxy.close(); process.exit(0); } catch { process.exit(1); }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  await new Promise(() => {});
}

main().catch((err) => { console.error(`[ClawPilotRouter] Fatal: ${err.message}`); process.exit(1); });
