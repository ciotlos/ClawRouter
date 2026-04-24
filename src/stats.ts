/**
 * Usage Statistics — Copilot Router
 *
 * Reads usage log files and aggregates statistics.
 * Shows how the router distributed your copilot workload:
 * which tiers handled what, which models were used, and
 * how much you saved vs sending everything to a single premium model.
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { UsageEntry } from "./logger.js";

const LOG_DIR = join(homedir(), ".clawpilotrouter", "logs");

export type DailyStats = {
  date: string;
  totalRequests: number;
  totalCost: number;
  totalBaselineCost: number;
  totalSavings: number;
  avgLatencyMs: number;
  byTier: Record<string, { count: number; cost: number }>;
  byModel: Record<string, { count: number; cost: number }>;
};

export type AggregatedStats = {
  period: string;
  totalRequests: number;
  totalCost: number;
  totalBaselineCost: number;
  totalSavings: number;
  savingsPercentage: number;
  avgLatencyMs: number;
  avgCostPerRequest: number;
  byTier: Record<string, { count: number; cost: number; percentage: number }>;
  byModel: Record<string, { count: number; cost: number; percentage: number }>;
  dailyBreakdown: DailyStats[];
};

/**
 * Parse a JSONL log file into usage entries.
 */
async function parseLogFile(filePath: string): Promise<UsageEntry[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    return lines.map((line) => {
      const entry = JSON.parse(line) as Partial<UsageEntry>;
      return {
        timestamp: entry.timestamp || new Date().toISOString(),
        model: entry.model || "unknown",
        tier: entry.tier || "UNKNOWN",
        cost: entry.cost || 0,
        baselineCost: entry.baselineCost || entry.cost || 0,
        savings: entry.savings || 0,
        latencyMs: entry.latencyMs || 0,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get list of available log files sorted by date (newest first).
 */
async function getLogFiles(): Promise<string[]> {
  try {
    const files = await readdir(LOG_DIR);
    return files
      .filter((f) => f.startsWith("usage-") && f.endsWith(".jsonl"))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Aggregate stats for a single day.
 */
function aggregateDay(date: string, entries: UsageEntry[]): DailyStats {
  const byTier: Record<string, { count: number; cost: number }> = {};
  const byModel: Record<string, { count: number; cost: number }> = {};
  let totalLatency = 0;

  for (const entry of entries) {
    if (!byTier[entry.tier]) byTier[entry.tier] = { count: 0, cost: 0 };
    byTier[entry.tier].count++;
    byTier[entry.tier].cost += entry.cost;

    if (!byModel[entry.model]) byModel[entry.model] = { count: 0, cost: 0 };
    byModel[entry.model].count++;
    byModel[entry.model].cost += entry.cost;

    totalLatency += entry.latencyMs;
  }

  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
  const totalBaselineCost = entries.reduce((sum, e) => sum + e.baselineCost, 0);

  return {
    date,
    totalRequests: entries.length,
    totalCost,
    totalBaselineCost,
    totalSavings: totalBaselineCost - totalCost,
    avgLatencyMs: entries.length > 0 ? totalLatency / entries.length : 0,
    byTier,
    byModel,
  };
}

/**
 * Get aggregated statistics for the last N days.
 */
export async function getStats(days: number = 7): Promise<AggregatedStats> {
  const logFiles = await getLogFiles();
  const filesToRead = logFiles.slice(0, days);

  const dailyBreakdown: DailyStats[] = [];
  const allByTier: Record<string, { count: number; cost: number }> = {};
  const allByModel: Record<string, { count: number; cost: number }> = {};
  let totalRequests = 0;
  let totalCost = 0;
  let totalBaselineCost = 0;
  let totalLatency = 0;

  for (const file of filesToRead) {
    const date = file.replace("usage-", "").replace(".jsonl", "");
    const filePath = join(LOG_DIR, file);
    const entries = await parseLogFile(filePath);

    if (entries.length === 0) continue;

    const dayStats = aggregateDay(date, entries);
    dailyBreakdown.push(dayStats);

    totalRequests += dayStats.totalRequests;
    totalCost += dayStats.totalCost;
    totalBaselineCost += dayStats.totalBaselineCost;
    totalLatency += dayStats.avgLatencyMs * dayStats.totalRequests;

    for (const [tier, stats] of Object.entries(dayStats.byTier)) {
      if (!allByTier[tier]) allByTier[tier] = { count: 0, cost: 0 };
      allByTier[tier].count += stats.count;
      allByTier[tier].cost += stats.cost;
    }

    for (const [model, stats] of Object.entries(dayStats.byModel)) {
      if (!allByModel[model]) allByModel[model] = { count: 0, cost: 0 };
      allByModel[model].count += stats.count;
      allByModel[model].cost += stats.cost;
    }
  }

  const byTierWithPercentage: Record<string, { count: number; cost: number; percentage: number }> = {};
  for (const [tier, stats] of Object.entries(allByTier)) {
    byTierWithPercentage[tier] = {
      ...stats,
      percentage: totalRequests > 0 ? (stats.count / totalRequests) * 100 : 0,
    };
  }

  const byModelWithPercentage: Record<string, { count: number; cost: number; percentage: number }> = {};
  for (const [model, stats] of Object.entries(allByModel)) {
    byModelWithPercentage[model] = {
      ...stats,
      percentage: totalRequests > 0 ? (stats.count / totalRequests) * 100 : 0,
    };
  }

  const totalSavings = totalBaselineCost - totalCost;
  const savingsPercentage = totalBaselineCost > 0 ? (totalSavings / totalBaselineCost) * 100 : 0;

  return {
    period: days === 1 ? "today" : `last ${days} days`,
    totalRequests,
    totalCost,
    totalBaselineCost,
    totalSavings,
    savingsPercentage,
    avgLatencyMs: totalRequests > 0 ? totalLatency / totalRequests : 0,
    avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
    byTier: byTierWithPercentage,
    byModel: byModelWithPercentage,
    dailyBreakdown: dailyBreakdown.reverse(),
  };
}

/**
 * Format stats for terminal display.
 *
 * Shows copilot-friendly metrics:
 * - Requests routed by tier (how your coding tasks break down)
 * - Which models handled what (where your tokens went)
 * - Cost vs sending everything to Opus (what you saved)
 */
export function formatStatsAscii(stats: AggregatedStats): string {
  const lines: string[] = [];

  lines.push("╔════════════════════════════════════════════════════════════╗");
  lines.push("║              ClawPilotRouter — Copilot Stats                    ║");
  lines.push("╠════════════════════════════════════════════════════════════╣");

  lines.push(`║  Period: ${stats.period.padEnd(49)}║`);
  lines.push(`║  Requests routed: ${stats.totalRequests.toString().padEnd(40)}║`);

  // Cost breakdown — show actual vs "if you used Opus for everything"
  const actualStr = `$${stats.totalCost.toFixed(2)}`;
  const baselineStr = `$${stats.totalBaselineCost.toFixed(2)}`;
  const savedStr = `$${stats.totalSavings.toFixed(2)}`;
  const pctStr = `${stats.savingsPercentage.toFixed(0)}%`;

  lines.push(`║  Actual cost: ${actualStr.padEnd(44)}║`);
  lines.push(`║  If all Opus: ${baselineStr.padEnd(44)}║`);
  lines.push(`║  You saved:   ${savedStr} (${pctStr})`.padEnd(61) + "║");

  if (stats.totalRequests > 0) {
    const avgStr = `$${stats.avgCostPerRequest.toFixed(4)}/req`;
    lines.push(`║  Avg cost:    ${avgStr.padEnd(44)}║`);
  }

  // Tier breakdown — shows how your coding tasks distribute
  lines.push("╠════════════════════════════════════════════════════════════╣");
  lines.push("║  Task distribution:                                        ║");

  const tierLabels: Record<string, string> = {
    SIMPLE: "Quick",
    MEDIUM: "Standard",
    COMPLEX: "Complex",
    REASONING: "Reasoning",
  };

  const tierOrder = ["SIMPLE", "MEDIUM", "COMPLEX", "REASONING"];
  for (const tier of tierOrder) {
    const data = stats.byTier[tier];
    if (data) {
      const label = (tierLabels[tier] || tier).padEnd(10);
      const bar = "█".repeat(Math.min(20, Math.round(data.percentage / 5)));
      const line = `║    ${label} ${bar.padEnd(20)} ${data.percentage.toFixed(0).padStart(3)}% (${data.count} reqs)`;
      lines.push(line.padEnd(61) + "║");
    }
  }

  // Model breakdown — where your tokens actually went
  lines.push("╠════════════════════════════════════════════════════════════╣");
  lines.push("║  Models used:                                              ║");

  const sortedModels = Object.entries(stats.byModel)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  for (const [model, data] of sortedModels) {
    const shortModel = model.length > 28 ? model.slice(0, 25) + "..." : model;
    const line = `║    ${shortModel.padEnd(28)} ${data.count.toString().padStart(4)} reqs  $${data.cost.toFixed(2)}`;
    lines.push(line.padEnd(61) + "║");
  }

  // Daily breakdown
  if (stats.dailyBreakdown.length > 1) {
    lines.push("╠════════════════════════════════════════════════════════════╣");
    lines.push("║  Daily:                                                    ║");
    lines.push("║    Date         Reqs     Cost     Saved                    ║");

    for (const day of stats.dailyBreakdown.slice(-7)) {
      const saved = day.totalBaselineCost - day.totalCost;
      const line = `║    ${day.date}   ${day.totalRequests.toString().padStart(5)}   $${day.totalCost.toFixed(2).padStart(7)}  $${saved.toFixed(2)}`;
      lines.push(line.padEnd(61) + "║");
    }
  }

  lines.push("╚════════════════════════════════════════════════════════════╝");

  return lines.join("\n");
}
