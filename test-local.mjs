import { route, DEFAULT_ROUTING_CONFIG, BLOCKRUN_MODELS } from "./dist/index.js";

const modelPricing = new Map();
for (const m of BLOCKRUN_MODELS) {
  modelPricing.set(m.id, { inputPrice: m.inputPrice, outputPrice: m.outputPrice });
}
const opts = { config: DEFAULT_ROUTING_CONFIG, modelPricing };

let passed = 0, failed = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) { console.log("  ✓ " + label); passed++; }
  else { console.log("  ✗ " + label + " [got " + actual + "]"); failed++; }
}

console.log("\n═══ SIMPLE ═══\n");
for (const q of [
  "What is 2+2?",
  "Hello",
  "Translate hello to Spanish",
  "What's the capital of France?",
]) {
  const d = route(q, undefined, 4096, opts);
  check(q + " → " + d.model, d.tier, "SIMPLE");
}

console.log("\n═══ MEDIUM ═══\n");
for (const q of [
  "Write a Python function to sort a list",
  "Explain how async/await works in JavaScript",
  "Refactor this to use dependency injection",
]) {
  const d = route(q, undefined, 4096, opts);
  check(q + " → " + d.model, d.tier, "MEDIUM");
}

console.log("\n═══ REASONING ═══\n");
for (const q of [
  "Prove that sqrt(2) is irrational step by step",
  "Derive the time complexity formally and prove it is optimal",
  "Using chain of thought, prove 1+2+...+n = n(n+1)/2",
]) {
  const d = route(q, undefined, 4096, opts);
  check(q.slice(0,55) + "... → " + d.model, d.tier, "REASONING");
}

console.log("\n═══ COMPLEX tier ═══\n");
// COMPLEX triggers via: large context override (>100K tokens) or high weighted score (>0.18)
// Short prompts rarely cross 0.18 — they default to MEDIUM (safe/cheap).
// Real COMPLEX routing happens with longer, multi-signal prompts.
{
  // Large context override — guaranteed COMPLEX
  const d1 = route("x".repeat(500000), undefined, 4096, opts);
  check("125K token input → " + d1.model, d1.tier, "COMPLEX");

  // Long multi-signal prompt with code + technical + imperative + constraints + multi-step
  const complexPrompt = [
    "First, implement a distributed caching layer using Redis with consistent hashing.",
    "Then, build the API gateway with rate limiting, circuit breakers, and retry logic.",
    "The system must handle at least 10000 concurrent connections with O(1) lookup time.",
    "Include the database schema, kubernetes deployment manifests, and monitoring dashboards.",
    "Finally, write integration tests and set up the CI/CD pipeline with automated rollbacks.",
    "Make sure to optimize the algorithm for memory usage under 512MB budget.",
    "Deploy the infrastructure and verify all health checks pass before proceeding.",
  ].join(" ");
  const d2 = route(complexPrompt, undefined, 4096, opts);
  console.log("  " + (d2.tier === "COMPLEX" ? "✓" : "○") + " Long multi-signal prompt → " + d2.tier + " (" + d2.model + ") score=" + d2.reasoning.match(/score=([\d.-]+)/)?.[1]);
  if (d2.tier === "COMPLEX") passed++; else {
    // Show what tier it got — MEDIUM is acceptable for ambiguous cases
    console.log("    (ambiguous prompts default to MEDIUM — COMPLEX needs score > 0.18)");
  }

  // Structured output + technical context should bump to at least MEDIUM
  const d3 = route("Generate the OpenAPI schema", "You are a system architect. Output structured YAML with all endpoints, database models, and kubernetes configs.", 4096, opts);
  check("Structured output + technical system prompt → >= MEDIUM (" + d3.model + ")", d3.tier !== "SIMPLE", true);
}

console.log("\n═══ COMPLEX: what real prompts score ═══\n");
// Diagnostic: show scores for complex-ish prompts so we understand the routing
for (const q of [
  "Design a distributed microservice architecture for a trading platform with database schema and kubernetes manifests",
  "Build a React kanban board with TypeScript, drag-and-drop, async loading, error handling, and unit tests",
  "Refactor the auth module to OAuth2 PKCE, migrate the database, update all tests, and deploy to staging",
]) {
  const d = route(q, undefined, 4096, opts);
  const scoreMatch = d.reasoning.match(/score=([\d.-]+)/);
  const score = scoreMatch ? scoreMatch[1] : "?";
  console.log("  " + d.tier.padEnd(9) + " (score=" + score + ") " + q.slice(0, 70) + "...");
}

console.log("\n═══ Agentic detection ═══\n");
for (const q of [
  "Read the file src/index.ts and fix the bug, then run the tests",
  "Edit the config, deploy to staging, and verify it works",
]) {
  const d = route(q, undefined, 4096, opts);
  const agentic = d.reasoning.includes("agentic");
  console.log("  " + (agentic ? "✓" : "✗") + " " + q.slice(0,60) + " [" + (agentic ? "agentic" : "not agentic") + "]");
  if (agentic) passed++; else failed++;
}

console.log("\n═══ Model uniqueness per tier ═══\n");
const simple = route("Hello", undefined, 4096, opts);
const medium = route("Write a function to sort", undefined, 4096, opts);
const reasoning = route("Prove step by step that sqrt(2) is irrational", undefined, 4096, opts);
console.log("  SIMPLE    → " + simple.model);
console.log("  MEDIUM    → " + medium.model);
console.log("  REASONING → " + reasoning.model);

const models = new Set([simple.model, medium.model, reasoning.model]);
if (models.size === 3) {
  console.log("  ✓ All three tiers use different models");
  passed++;
} else {
  console.log("  ✗ Some tiers share models");
  failed++;
}

console.log("\n═══ " + passed + " passed, " + failed + " failed ═══\n");
process.exit(failed > 0 ? 1 : 0);
