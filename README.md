# ClawRouter — Copilot Model Router

Routes every coding request to the best model for the task. Simple completions get a fast model, complex refactors get a strong one. Runs as a local OpenAI-compatible proxy — point your editor at it and go.

## How It Works

1. You start ClawRouter (one command)
2. Point your copilot/editor at `http://127.0.0.1:8402/v1` with model `auto`
3. ClawRouter classifies each request across **14 weighted dimensions** in <1ms
4. Routes to the best copilot model for the task (4 tiers)
5. Falls back through alternatives if a provider errors

| Tier | What it handles | Default Model | Multiplier |
|---|---|---|---|
| **SIMPLE** | Inline completions, lookups, short answers | Grok Code Fast | 0.33x |
| **MEDIUM** | Code generation, refactoring, explanations | Claude Sonnet 4.6 | 1x |
| **COMPLEX** | Multi-file edits, architecture, debugging | Claude Opus 4.6 | 3x |
| **REASONING** | Algorithm design, proofs, complex debugging | Gemini 3.1 Pro | 1x |

## Quick Start

```bash
npm install -g clawrouter

# Start the router — authenticates via GitHub on first run
clawrouter
```

On first run, you'll see:

```
Visit: https://github.com/login/device
Enter code: XXXX-XXXX
```

Open the link, enter the code, and you're done. The token is saved to `~/.clawrouter/github_token` and refreshed automatically. No API keys to manage.

Then configure your editor to use `http://127.0.0.1:8402/v1` as the API endpoint with model `auto`.

That's it. The router uses Claude Sonnet 4 for standard coding tasks and Claude Opus 4 for complex ones. Simple completions go to fast, cheap models. Reasoning tasks go to models with large context windows.

## Usage Stats

ClawRouter logs every routed request locally. Check your stats via the `/stats` endpoint:

```bash
curl http://127.0.0.1:8402/stats | python3 -m json.tool
```

Example output from the CLI:

```
╔════════════════════════════════════════════════════════════╗
║              ClawRouter — Copilot Stats                    ║
╠════════════════════════════════════════════════════════════╣
║  Period: last 7 days                                       ║
║  Requests routed: 312                                      ║
║  Actual cost: $4.18                                        ║
║  If all Opus: $47.62                                       ║
║  You saved:   $43.44 (91%)                                 ║
║  Avg cost:    $0.0134/req                                  ║
╠════════════════════════════════════════════════════════════╣
║  Task distribution:                                        ║
║    Quick      ████████████         52% (162 reqs)          ║
║    Standard   ██████               28% (87 reqs)           ║
║    Complex    ███                  13% (41 reqs)           ║
║    Reasoning  █                     7% (22 reqs)           ║
╠════════════════════════════════════════════════════════════╣
║  Models used:                                              ║
║    grok-code-fast-1                 148 reqs  $0.31        ║
║    claude-sonnet-4.6                 92 reqs  $1.84        ║
║    claude-opus-4.6                   41 reqs  $1.62        ║
║    gemini-3.1-pro                    22 reqs  $0.38        ║
║    gpt-4.1                            9 reqs  $0.12        ║
╚════════════════════════════════════════════════════════════╝
```

The "If all Opus" line shows what it would cost to send every request to Claude Opus 4 — the premium baseline. The difference is what smart routing saves you.

## Agentic Auto-Detection

ClawRouter detects multi-step coding tasks and routes to models optimized for autonomous execution:

```
"what does this function do"           → grok-code-fast (SIMPLE)
"refactor this module to use async"    → claude-sonnet-4.6 (MEDIUM)
"fix the bug and run the tests"        → claude-opus-4.6 (COMPLEX, agentic)
```

No config needed — agentic detection works automatically based on keyword signals like file operations, execution commands, and iterative patterns.

## Session Pinning

Multi-turn conversations stay on the same model to prevent mid-task switching:

```
Turn 1: "Build a React component"  → claude-opus-4.6
Turn 2: "Add dark mode support"    → claude-opus-4.6 (pinned)
Turn 3: "Now add tests"            → claude-opus-4.6 (pinned)
```

Sessions persist for 1 hour of inactivity.

## Model Aliases

Pin a specific model instead of using `auto`:

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

## CLI Options

```bash
clawrouter                  # Start (authenticates on first run)
clawrouter --port 9000      # Custom port
clawrouter --version        # Show version
clawrouter --help           # Show help
```

Port can also be set via `CLAWROUTER_PORT` environment variable.

## Authentication

On first run, ClawRouter authenticates via GitHub OAuth device flow — you visit a URL and enter a code. The token is saved to `~/.clawrouter/github_token` and refreshed automatically.

For non-interactive environments, set `GH_TOKEN` or `COPILOT_GITHUB_TOKEN` as an environment variable.

## License

MIT
