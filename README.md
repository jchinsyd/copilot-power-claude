# Copilot Power Claude

## Project Overview
This project is a reverse-engineered proxy for the GitHub Copilot API. This implementation is not affiliated with, endorsed by, or supported by GitHub, and is subject to modification or discontinuation without notice. **This project is provided for educational and personal use only.**

## Advisory 
Automated or scripted usage of Copilot—including but not limited to rapid or bulk requests executed through automated tools—may trigger GitHub's abuse-detection systems. Such activity may result in a warning from GitHub Security, and continued anomalous usage may result in temporary or permanent suspension of Copilot access.

GitHub expressly prohibits the use of their servers for excessive automated bulk activity or any activity that places undue burden on their infrastructure. Violation of these terms may result in legal action or account termination.

Users are advised to review the following policies prior to use:

- [GitHub Acceptable Use Policies](https://docs.github.com/site-policy/acceptable-use-policies/github-acceptable-use-policies#4-spam-and-inauthentic-activity-on-github)
- [GitHub Copilot Terms](https://docs.github.com/site-policy/github-terms/github-terms-for-additional-products-and-features#github-copilot)

This project is provided "as is" for personal, non-commercial use. Use at your own risk and responsibility.


## Quick Start

```bash
# Build and start
docker compose build --no-cache  && docker compose up -d 

# On first run (or when token expires), the server will prompt for GitHub device auth automatically
# Just follow the instructions in the container logs:
docker logs -f copilot-power-claude


### Option 1: set in bash
```bash
export ANTHROPIC_BASE_URL="http://localhost:7788"
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_MODEL="gpt-4o"
export ANTHROPIC_DEFAULT_SONNET_MODEL="gpt-4o"
export ANTHROPIC_SMALL_FAST_MODEL="gpt-4o"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="gpt-4o"
export DISABLE_NON_ESSENTIAL_MODEL_CALLS="1"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"
```

Option 2: create settings.json in .claude (project)
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:7788",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "gpt-4.1",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4.6",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-4.1",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4.6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-4.1",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "deny": [
      "WebSearch"
    ]
  }
}
```

## API Endpoints

### OpenAI-Compatible Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/chat/completions` | OpenAI chat completions (streaming supported) |
| `GET /v1/models` | List available models |
| `POST /v1/embeddings` | Create embeddings |

### Anthropic-Compatible Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/messages` | Anthropic Messages API (streaming supported) |
| `POST /v1/messages?beta=true` | Beta Anthropic Messages API |

Both OpenAI and Anthropic endpoints are mounted at root and `/v1/` paths:
- `/chat/completions` and `/v1/chat/completions`
- `/models` and `/v1/models`
- `/embeddings` and `/v1/embeddings`
- `/v1/messages`

## Supported Features

### Chat Completions
- Streaming via `stream: true`
- Tools/function calling support
- Vision/image support (base64 encoded)
- Temperature and top_p parameters

### Messages (Anthropic)
- Streaming via `stream: true`
- System prompt support
- Tools/function calling support
- Vision/image support
- Thinking blocks

### Embeddings
- `text-embedding-3-small` model support

## Commands

```bash
# Build and start
docker compose down && docker compose build --no-cache  && docker compose up -d 

# Run authentication separately
docker compose run --rm copilot-power-claude auth

# Start server (already running via docker-compose)
# Or start manually:
docker compose run --rm copilot-power-claude start

# Generate Claude Code config
docker compose run --rm copilot-power-claude start --claude-code
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Port to listen on | 7788 |
| `--verbose` | `-v` | Enable verbose logging | - |
| `--github-token` | `-g` | GitHub token directly | - |
| `--claude-code` | `-c` | Generate Claude Code config | - |
| `--account-type` | `-a` | Account type (individual/business/enterprise) | individual |
| `--manual` | - | Enable manual request approval | - |
| `--rate-limit` | `-r` | Rate limit in seconds between requests | - |
| `--wait` | `-w` | Wait instead of error when rate limit hit | - |
| `--show-token` | - | Show GitHub and Copilot tokens | - |
| `--proxy-env` | - | Initialize proxy from environment variables | - |
