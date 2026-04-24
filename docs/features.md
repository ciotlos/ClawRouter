# Features

## Agentic Auto-Detection

ClawPilotRouter detects multi-step coding tasks and routes to models optimized for autonomous execution:

```
"what does this function do"              → grok-code-fast (SIMPLE)
"refactor this to use async/await"        → claude-sonnet-4.6 (MEDIUM)
"fix the bug and make sure tests pass"    → claude-opus-4.6 (COMPLEX, agentic)
```

Detection is based on keyword signals: file operations (`read file`, `edit`, `modify`), execution (`deploy`, `compile`, `npm`), and iteration (`fix`, `debug`, `until it works`). Two or more signals trigger agentic mode.

Agentic tier models are chosen for strong tool use and multi-step autonomy:

| Tier | Agentic Model | Why |
|---|---|---|
| SIMPLE | Claude Haiku 4.5 | Fast, reliable tool use |
| MEDIUM | Claude Sonnet 4.6 | Strong coding + tool use |
| COMPLEX | Claude Opus 4.6 | Best agentic model |
| REASONING | Gemini 3.1 Pro | 1M context for large codebases |

## Context-Length-Aware Routing

The router filters out models that can't handle your context size:

```
150K token request:
  Full chain: [grok-code (131K), deepseek (128K), gemini (1M)]
  Filtered:   [gemini (1M)]
  → Skips models that would fail with context errors
```

## Session Pinning

Multi-turn conversations stay on the same model:

```
Turn 1: "Build a React component"  → claude-opus-4.6
Turn 2: "Add dark mode"            → claude-opus-4.6 (pinned)
Turn 3: "Write tests"              → claude-opus-4.6 (pinned)
```

Sessions are keyed by conversation ID and expire after 1 hour.

## Fallback Chains

When a model fails (rate limit, error), the next model in the tier's fallback chain is tried automatically.

```
claude-opus-4.6 (429 rate limited) → claude-sonnet-4.6 (success)
```

Rate-limited models are deprioritized for subsequent requests.

## Request Deduplication

Duplicate requests (same body within 30s) are deduplicated — the second request waits for the first to complete and reuses the response. Prevents double-billing when editors retry after timeout.

## Model Aliases

Pin a specific model instead of `auto`:

| Alias | Model |
|---|---|
| `sonnet` | Claude Sonnet 4.6 |
| `opus` | Claude Opus 4.6 |
| `haiku` | Claude Haiku 4.5 |
| `gpt` | GPT-4.1 |
| `gpt5` | GPT-5.4 |
| `codex` | GPT-5.3 Codex |
| `flash` | Gemini 3 Flash |
| `gemini` | Gemini 3.1 Pro |
| `grok-code` | Grok Code Fast |

## Usage Stats

Stats are logged locally to `~/.clawpilotrouter/logs/` and available via:

```bash
curl http://127.0.0.1:8402/stats
curl http://127.0.0.1:8402/stats?days=30
```

Shows requests by tier, models used, cost vs baseline (Opus), and daily breakdown.
