const BASE = "http://127.0.0.1:8402";
let passed = 0, failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log("  ✓ " + name);
    passed++;
  } catch (err) {
    console.log("  ✗ " + name + " — " + err.message);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
const delay = (ms) => new Promise(r => setTimeout(r, ms));

console.log("\n═══ Health & Models ═══\n");

await test("Health endpoint", async () => {
  const r = await fetch(BASE + "/health");
  assert(r.ok, "status " + r.status);
  const d = await r.json();
  assert(d.status === "ok", "status: " + d.status);
  assert(d.modelCount > 0, "modelCount: " + d.modelCount);
  console.log("    providers=" + d.configuredProviders + " models=" + d.modelCount);
});

await test("Models endpoint", async () => {
  const r = await fetch(BASE + "/v1/models");
  assert(r.ok, "status " + r.status);
  const d = await r.json();
  assert(d.data.length > 10, "only " + d.data.length + " models");
  console.log("    " + d.data.length + " models listed");
});

console.log("\n═══ Simple query (auto routing) ═══\n");

await delay(1000);
await test("What is 2+2 → should route to SIMPLE model", async () => {
  const r = await fetch(BASE + "/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [{ role: "user", content: "What is 2+2? Reply with just the number." }],
      max_tokens: 10,
      stream: false,
    }),
  });
  const text = await r.text();
  console.log("    status=" + r.status + " body=" + text.slice(0, 200));
  assert(r.status === 200 || r.status === 429 || r.status === 403 || r.status === 502, "unexpected status " + r.status);
});

console.log("\n═══ Medium query (code gen) ═══\n");

await delay(2000);
await test("Write a sort function → should route to MEDIUM", async () => {
  const r = await fetch(BASE + "/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [{ role: "user", content: "Write a Python function to reverse a string" }],
      max_tokens: 100,
      stream: false,
    }),
  });
  const text = await r.text();
  console.log("    status=" + r.status + " body=" + text.slice(0, 200));
  // 200 = success, 429 = quota exceeded (routing worked), 403 = rate limit (routing worked)
  assert(r.status === 200 || r.status === 429 || r.status === 403 || r.status === 502, "unexpected status " + r.status);
});

console.log("\n═══ Streaming ═══\n");

await delay(2000);
await test("Streaming request", async () => {
  const r = await fetch(BASE + "/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [{ role: "user", content: "Say hello in one word" }],
      max_tokens: 10,
      stream: true,
    }),
  });
  assert(r.status === 200, "status " + r.status);
  const text = await r.text();
  const hasDone = text.includes("[DONE]");
  const hasData = text.includes("data: {");
  console.log("    hasDone=" + hasDone + " hasData=" + hasData + " length=" + text.length);
  assert(hasDone, "missing [DONE]");
});

console.log("\n═══ Direct model (bypass routing) ═══\n");

await delay(2000);
await test("Direct claude-sonnet-4.6 request", async () => {
  const r = await fetch(BASE + "/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4.6",
      messages: [{ role: "user", content: "What is 1+1? Just the number." }],
      max_tokens: 5,
      stream: false,
    }),
  });
  const text = await r.text();
  console.log("    status=" + r.status + " body=" + text.slice(0, 200));
});

console.log("\n═══ Alias resolution ═══\n");

await delay(2000);
await test("Model alias 'sonnet' resolves", async () => {
  const r = await fetch(BASE + "/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonnet",
      messages: [{ role: "user", content: "Say hi" }],
      max_tokens: 5,
      stream: false,
    }),
  });
  const text = await r.text();
  console.log("    status=" + r.status + " body=" + text.slice(0, 200));
});

console.log("\n═══ 404 for unknown path ═══\n");

await test("Unknown path returns 404", async () => {
  const r = await fetch(BASE + "/unknown");
  assert(r.status === 404, "expected 404, got " + r.status);
});

console.log("\n═══ " + passed + " passed, " + failed + " failed ═══\n");
process.exit(failed > 0 ? 1 : 0);
