#!/usr/bin/env node
/**
 * ClawRouter CLI — Copilot Model Router
 *
 * Usage:
 *   clawrouter              # Start the router (authenticates via GitHub)
 *   clawrouter --version    # Show version
 */

import { startProxy, getProxyPort } from "./proxy.js";
import { createLiveApiKeys, getConfiguredProviders } from "./api-keys.js";
import { getCopilotToken, startTokenRefresh, stopTokenRefresh } from "./copilot-auth.js";
import { VERSION } from "./version.js";

function printHelp(): void {
  console.log(`
ClawRouter v${VERSION} — Copilot Model Router

Routes every coding request to the best model for the task.
Fast completions get a fast model, complex refactors get a strong one.

Usage:
  clawrouter [options]

Options:
  --version, -v     Show version number
  --help, -h        Show this help message
  --port <number>   Port to listen on (default: ${getProxyPort()})

Point your editor/copilot at http://127.0.0.1:<port>/v1 as an
OpenAI-compatible endpoint, using model "auto" for smart routing.

Authentication:
  ClawRouter uses your GitHub account via OAuth device flow.
  On first run, you'll be asked to visit github.com/login/device
  and enter a code. After that, the token is saved and refreshed
  automatically.

  You can also set GH_TOKEN or COPILOT_GITHUB_TOKEN env var
  to skip the interactive flow.

Examples:
  clawrouter                  # Start (authenticates on first run)
  clawrouter --port 9000      # Custom port

Environment Variables:
  COPILOT_GITHUB_TOKEN  GitHub token with copilot scope
  GH_TOKEN              GitHub CLI token (fallback)
  CLAWROUTER_PORT       Proxy port (default: 8402)
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
  console.log("[ClawRouter] Authenticating with GitHub Copilot...");
  try {
    await getCopilotToken();
  } catch (err) {
    console.error(`[ClawRouter] Authentication failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // Start background token refresh
  startTokenRefresh();

  // Create live API keys config (always reads latest token)
  const apiKeys = createLiveApiKeys();
  const configured = getConfiguredProviders(apiKeys);
  console.log(`[ClawRouter] Authenticated (${configured.length} provider)`);

  const proxy = await startProxy({
    apiKeys,
    port: args.port,
    onReady: (port) => {
      console.log(`[ClawRouter] Copilot router listening on http://127.0.0.1:${port}/v1`);
      console.log(`[ClawRouter] Use model "auto" for smart routing`);
    },
    onError: (error) => console.error(`[ClawRouter] Error: ${error.message}`),
    onRouted: (decision) => {
      const tier = decision.tier.padEnd(9);
      console.log(`[ClawRouter] ${tier} → ${decision.model} (confidence=${decision.confidence.toFixed(2)})`);
    },
  });

  console.log(`[ClawRouter] Ready — Ctrl+C to stop`);

  const shutdown = async (signal: string) => {
    console.log(`\n[ClawRouter] Received ${signal}, shutting down...`);
    stopTokenRefresh();
    try { await proxy.close(); process.exit(0); } catch { process.exit(1); }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  await new Promise(() => {});
}

main().catch((err) => { console.error(`[ClawRouter] Fatal: ${err.message}`); process.exit(1); });
