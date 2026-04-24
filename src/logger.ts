/**
 * Usage Logger
 *
 * Logs every routed request as a JSON line to a daily log file.
 * Files: ~/.clawpilotrouter/logs/usage-YYYY-MM-DD.jsonl
 *
 * Tracks token usage and which models handled which tiers,
 * so you can see how the router is distributing your copilot workload.
 *
 * Logging never breaks the request flow — all errors are swallowed.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export type UsageEntry = {
  timestamp: string;
  model: string;
  tier: string;
  /** Estimated cost in USD for this request */
  cost: number;
  /** What it would have cost using the baseline model (Opus) */
  baselineCost: number;
  /** Savings ratio 0-1 vs baseline */
  savings: number;
  latencyMs: number;
  reasoning?: string;
};

const LOG_DIR = join(homedir(), ".clawpilotrouter", "logs");
let dirReady = false;

async function ensureDir(): Promise<void> {
  if (dirReady) return;
  await mkdir(LOG_DIR, { recursive: true });
  dirReady = true;
}

/**
 * Log a usage entry as a JSON line.
 */
export async function logUsage(entry: UsageEntry): Promise<void> {
  try {
    await ensureDir();
    const date = entry.timestamp.slice(0, 10); // YYYY-MM-DD
    const file = join(LOG_DIR, `usage-${date}.jsonl`);
    await appendFile(file, JSON.stringify(entry) + "\n");
  } catch {
    // Never break the request flow
  }
}
