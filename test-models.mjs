import { BLOCKRUN_MODELS } from "./dist/index.js";

const BASE = "http://127.0.0.1:8402";

console.log("\n═══ Testing all model IDs against Copilot API ═══\n");

const results = { supported: [], unsupported: [], quota: [], other: [] };

for (const m of BLOCKRUN_MODELS) {
  if (m.id === "auto") continue;

  const r = await fetch(BASE + "/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: m.id,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1,
      stream: false,
    }),
  });

  const text = await r.text();
  const status = r.status;

  if (status === 200) {
    console.log("  ✓ " + m.id + " (200 OK)");
    results.supported.push(m.id);
  } else if (text.includes("not supported")) {
    console.log("  ✗ " + m.id + " (not supported)");
    results.unsupported.push(m.id);
  } else if (status === 429 || text.includes("quota")) {
    console.log("  ○ " + m.id + " (429 quota — model exists but quota exceeded)");
    results.quota.push(m.id);
  } else {
    console.log("  ? " + m.id + " (" + status + ": " + text.slice(0, 80) + ")");
    results.other.push({ id: m.id, status, msg: text.slice(0, 100) });
  }

  await new Promise(r => setTimeout(r, 500));
}

console.log("\n═══ Summary ═══\n");
console.log("Supported (200):     " + results.supported.join(", "));
console.log("Quota (429):         " + results.quota.join(", "));
console.log("Not supported (400): " + results.unsupported.join(", "));
if (results.other.length) {
  console.log("Other errors:");
  for (const o of results.other) console.log("  " + o.id + " → " + o.status + ": " + o.msg);
}
console.log("\nTotal: " + BLOCKRUN_MODELS.length + " models, " + results.supported.length + " supported, " + results.unsupported.length + " unsupported\n");
