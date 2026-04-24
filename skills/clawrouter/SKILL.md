---
name: clawrouter
description: Standalone copilot model router — routes every coding request to the best model for the task. Picks the right model across Claude, Gemini, GPT, DeepSeek, and Grok based on task complexity.
homepage: https://github.com/BlockRunAI/ClawRouter
metadata: { "emoji": "🦀" }
---

# ClawRouter — Copilot Model Router

Standalone proxy that picks the right copilot model for each coding task. Runs as an OpenAI-compatible endpoint — point any editor or tool at it.

## Install & Run

```bash
npm install -g clawrouter
clawrouter
```

On first run, you'll authenticate via GitHub (visit a URL, enter a code). After that, the token is saved and refreshed automatically.

Then point your editor/copilot at `http://127.0.0.1:8402/v1` with model `auto`.

## How Routing Works

ClawRouter classifies each coding request into one of four tiers and routes to the best model:

- **SIMPLE** — inline completions, quick lookups → Grok Code Fast ($0.20/M, fast)
- **MEDIUM** — code generation, refactoring, explanations → Claude Sonnet 4.6 ($3/M, strong coding)
- **COMPLEX** — multi-file edits, architecture, debugging → Claude Opus 4.6 ($15/M, best quality)
- **REASONING** — algorithm design, complex debugging, proofs → Gemini 3.1 Pro ($2/M, 1M context)

Agentic tasks (multi-step autonomous coding) are auto-detected and routed to models optimized for tool use and long-running workflows.

Rules handle ~80% of requests in <1ms. Only ambiguous queries use the LLM classifier.

## Example Output

```
[ClawRouter] SIMPLE    → grok-code-fast-1 (confidence=0.92)
[ClawRouter] COMPLEX   → claude-opus-4.6 (confidence=0.88)
[ClawRouter] REASONING → gemini-3.1-pro (confidence=0.91)
```

## Stats

```bash
curl http://127.0.0.1:8402/stats
```

Shows task distribution, models used, and cost vs sending everything to Opus:

```
  Requests routed: 312
  Actual cost: $4.18       If all Opus: $47.62
  You saved:   $43.44 (91%)

  Task distribution:
    Quick      ████████████         52% (162 reqs)
    Standard   ██████               28% (87 reqs)
    Complex    ███                  13% (41 reqs)
    Reasoning  █                     7% (22 reqs)
```
