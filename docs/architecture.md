# Architecture

How ClawPilotRouter routes your copilot requests.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Your Editor / Copilot                     │
│              (OpenAI-compatible API client)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                    POST /v1/chat/completions
                       model: "auto"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              ClawPilotRouter Proxy (localhost:8402)              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │   Dedup     │→ │   Router    │→ │   Model           │   │
│  │   Cache     │  │  (14-dim)   │  │   Selection       │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │  Fallback   │  │   Session   │  │   SSE Heartbeat   │   │
│  │   Chain     │  │   Pinning   │  │   (streaming)     │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Copilot API                             │
│           (api.githubcopilot.com)                           │
│                                                             │
│   Claude · GPT · Gemini · Grok · DeepSeek · Kimi           │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

1. Editor sends request with `model: "auto"`
2. Dedup cache checks for duplicate in-flight requests
3. Router scores the prompt across 14 dimensions (<1ms)
4. Tier is assigned: SIMPLE / MEDIUM / COMPLEX / REASONING
5. Best model for that tier is selected
6. Request is forwarded to the Copilot API with your token
7. If a model errors, fallback chain tries alternatives
8. Response is streamed back as SSE

## Routing Engine

The router scores each request across 14 weighted dimensions:

| Dimension | Weight | What it detects |
|---|---|---|
| Code presence | 0.20 | `function`, `class`, `import`, code blocks |
| Reasoning markers | 0.15 | `prove`, `theorem`, `step by step` |
| Technical terms | 0.12 | `algorithm`, `kubernetes`, `distributed` |
| Multi-step patterns | 0.12 | `first...then`, `step 1`, numbered lists |
| Agentic task | 0.09 | `edit`, `fix`, `deploy`, `read file` |
| Token count | 0.06 | Short (<50 tokens) vs long (>500) |
| Imperative verbs | 0.05 | `build`, `create`, `implement` |
| Constraint count | 0.04 | `at most`, `O(n)`, `maximum` |
| Question complexity | 0.04 | Multiple question marks |
| Output format | 0.03 | `json`, `yaml`, `schema` |
| Reference complexity | 0.03 | `the docs`, `the api`, `above` |
| Creative markers | 0.02 | `story`, `poem`, `brainstorm` |
| Domain specificity | 0.02 | `quantum`, `fpga`, `genomics` |
| Simple indicators | 0.02 | `what is`, `define`, `translate` |
| Negation complexity | 0.01 | `don't`, `avoid`, `without` |

Weights are tuned for copilot/coding tasks — code presence and agentic signals are boosted.

The weighted score maps to a tier via configurable boundaries, with sigmoid confidence calibration. If confidence is below 0.7, the request defaults to MEDIUM.

## Fallback Chain

Each tier has a primary model and fallbacks. When the primary fails (rate limit, error), the next model in the chain is tried:

```
COMPLEX request → claude-opus-4.6 (429 rate limited)
               → claude-sonnet-4.6 (success)
```

Max 3 fallback attempts per request.

## Session Pinning

Multi-turn conversations are pinned to the model chosen for the first turn. This prevents jarring mid-task model switches. Sessions are keyed by conversation ID and expire after 1 hour of inactivity.

## Source Structure

```
src/
├── cli.ts            # Standalone CLI entry point
├── index.ts          # Library exports
├── proxy.ts          # HTTP proxy, request handling, SSE
├── models.ts         # 30+ model definitions with pricing
├── api-keys.ts       # Copilot API key loading (env var, config file)
├── dedup.ts          # Request deduplication (SHA-256 cache)
├── logger.ts         # JSON usage logging to ~/.clawpilotrouter/logs/
├── stats.ts          # Usage statistics aggregation
├── retry.ts          # Fetch retry with exponential backoff
├── session.ts        # Conversation session pinning
├── version.ts        # Version constant
└── router/
    ├── index.ts      # route() entry point
    ├── rules.ts      # 14-dimension weighted scorer
    ├── selector.ts   # Tier → model selection + fallback
    ├── config.ts     # Default routing configuration
    ├── llm-classifier.ts  # LLM fallback classifier (ambiguous cases)
    └── types.ts      # TypeScript type definitions
```
