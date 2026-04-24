# Troubleshooting

## Quick Checklist

```bash
# 1. Is the router running?
curl http://127.0.0.1:8402/health

# 2. Are API keys configured?
curl http://127.0.0.1:8402/health | python3 -m json.tool
# Look for "configuredProviders" and "accessibleProviders"

# 3. Check routing is working
# Watch the terminal where clawrouter is running — you'll see:
# [ClawRouter] SIMPLE    → grok-code-fast-1 (confidence=0.92)
```

## Common Issues

### No API keys configured

```
[ClawRouter] Authentication failed
```

ClawRouter authenticates via GitHub OAuth. Run `clawrouter` and follow the device flow prompts. If you're in a non-interactive environment, set `GH_TOKEN` or `COPILOT_GITHUB_TOKEN`.

### Port already in use

ClawRouter automatically detects and reuses an existing proxy on the same port. If you need a different port:

```bash
clawrouter --port 9000
# or
export CLAWROUTER_PORT=9000
```

### Model not accessible

If the Copilot API returns an error for a model, the router tries the next model in the tier's fallback chain.

### Slow responses

The router itself adds <1ms overhead. Slow responses are from the upstream provider. Check:

- Provider status pages for outages
- Rate limits on your API key
- Context size (large prompts take longer)

### Editor can't connect

Make sure your editor is configured to use:
- Base URL: `http://127.0.0.1:8402/v1`
- Model: `auto` (or any specific model/alias)
- API key: any non-empty string (the proxy doesn't check it)

### Streaming not working

ClawRouter converts non-streaming provider responses to SSE format automatically. If your editor requires streaming, make sure `"stream": true` is in the request body (most editors do this by default).

## Logs

Usage logs are stored at `~/.clawrouter/logs/usage-YYYY-MM-DD.jsonl`. Each line is a JSON object with the model used, tier, cost, and latency.

## Health Check

```bash
curl http://127.0.0.1:8402/health
```

Returns configured providers, accessible model count, and proxy status.
