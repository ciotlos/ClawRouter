# Configuration

## Authentication

ClawRouter authenticates via GitHub OAuth device flow on first run. No API keys needed.

```bash
clawrouter
# Visit: https://github.com/login/device
# Enter code: XXXX-XXXX
```

The GitHub token is saved to `~/.clawrouter/github_token` and exchanged for a short-lived Copilot token automatically. The Copilot token refreshes every 25 minutes in the background.

### Environment Variables

You can skip the interactive flow by setting a token:

| Variable | Description |
|---|---|
| `COPILOT_GITHUB_TOKEN` | GitHub token with copilot scope (highest priority) |
| `GH_TOKEN` | GitHub CLI token (fallback) |
| `GITHUB_TOKEN` | GitHub Actions token (fallback) |
| `CLAWROUTER_PORT` | Proxy port (default: 8402) |

## Proxy Settings

| Setting | Default | Env Variable |
|---|---|---|
| Port | 8402 | `CLAWROUTER_PORT` |
| Request timeout | 180s | — |
| Heartbeat interval | 2s | — |

If a proxy is already running on the configured port, ClawRouter reuses it instead of failing.

## Routing Tiers

Default model assignments:

| Tier | Primary | Fallbacks |
|---|---|---|
| SIMPLE | Grok Code Fast | Gemini 3 Flash, GPT-4.1, GPT-5 Mini |
| MEDIUM | Claude Sonnet 4.6 | Grok Code Fast, GPT-4.1, Gemini 3 Flash |
| COMPLEX | Claude Opus 4.6 | Claude Sonnet 4.6, Gemini 3.1 Pro, GPT-5.4 |
| REASONING | Gemini 3.1 Pro | Claude Opus 4.6, GPT-5.4, o3 |

Agentic tasks (auto-detected) use a separate tier config optimized for multi-step tool use.

## Programmatic Usage

Use ClawRouter as a library:

```typescript
import { startProxy, getCopilotToken, createLiveApiKeys, startTokenRefresh } from "clawrouter";

await getCopilotToken();
startTokenRefresh();

const proxy = await startProxy({
  apiKeys: createLiveApiKeys(),
  port: 8402,
  onReady: (port) => console.log(`Router on port ${port}`),
  onRouted: (d) => console.log(`${d.tier} → ${d.model}`),
});
```

## Scoring Weights

The 14-dimension scorer can be customized programmatically. Default weights (tuned for copilot tasks):

| Dimension | Weight | Notes |
|---|---|---|
| `codePresence` | 0.20 | Boosted — primary signal for copilot |
| `reasoningMarkers` | 0.15 | Proofs, formal logic |
| `technicalTerms` | 0.12 | Architecture, algorithms |
| `multiStepPatterns` | 0.12 | Sequential task indicators |
| `agenticTask` | 0.09 | Boosted — file ops, execution, iteration |
| `tokenCount` | 0.06 | Short vs long prompts |
| `imperativeVerbs` | 0.05 | Boosted — build, create, implement |
| `constraintCount` | 0.04 | Complexity constraints |
| `questionComplexity` | 0.04 | Multiple questions |
| `outputFormat` | 0.03 | JSON, YAML, schema |
| `referenceComplexity` | 0.03 | References to docs, code |
| `creativeMarkers` | 0.02 | Reduced — less relevant for copilot |
| `domainSpecificity` | 0.02 | Niche technical domains |
| `simpleIndicators` | 0.02 | Simple Q&A patterns |
| `negationComplexity` | 0.01 | Negation patterns |
