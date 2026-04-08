import { defineCommand } from "citty"
import consola from "consola"
import fs from "node:fs/promises"
import { serve, type ServerHandler } from "srvx"

import { PATHS, ensurePaths } from "./lib/paths"
import { initProxyFromEnv } from "./lib/proxy"
import { state } from "./lib/state"
import { loadConfig } from "./lib/config"
import { setupCopilotToken, setupGitHubToken } from "./lib/token"
import { cacheModels, cacheVSCodeVersion } from "./lib/utils"
import { server } from "./server"

interface RunServerOptions {
  port: number
  verbose: boolean
  accountType: string
  manual: boolean
  rateLimit?: number
  rateLimitWait: boolean
  githubToken?: string
  claudeCode: boolean
  showToken: boolean
  proxyEnv: boolean
}

export async function runServer(options: RunServerOptions): Promise<void> {
  if (options.proxyEnv) {
    initProxyFromEnv()
  }

  if (options.verbose) {
    consola.level = 5
    consola.info("Verbose logging enabled")
  }

  // Load config from config.json
  await loadConfig()

  state.accountType = options.accountType
  if (options.accountType !== "individual") {
    consola.info(`Using ${options.accountType} plan GitHub account`)
  }

  state.manualApprove = options.manual
  const envRateLimit = process.env.RATE_LIMIT_MS
  const rateLimitFromEnv = envRateLimit !== undefined ? Number(envRateLimit) : undefined
  state.rateLimitMs = (options.rateLimit ?? rateLimitFromEnv) || undefined
  state.rateLimitWait = options.rateLimitWait
  state.showToken = options.showToken

  await ensurePaths()
  await cacheVSCodeVersion()

  const serverUrl = `http://localhost:${options.port}`

  if (options.githubToken) {
    state.githubToken = options.githubToken
    consola.info("Using provided GitHub token")
    await setupCopilotToken()
  } else {
    const githubToken = (await fs.readFile(PATHS.GITHUB_TOKEN_PATH, "utf8").catch(() => "")).trim()
    if (githubToken) {
      state.githubToken = githubToken
      consola.info("Using stored GitHub token")
    } else {
      consola.info("No GitHub token found. Running authentication...")
      try {
        await setupGitHubToken({ force: true })
        state.githubToken = (await fs.readFile(PATHS.GITHUB_TOKEN_PATH, "utf8")).trim()
      } catch (err) {
        consola.error("Authentication failed:", (err as Error).message)
        consola.info("Server starting without GitHub token. Auth may be retried on next start.")
      }
    }
    if (state.githubToken) {
      await setupCopilotToken()
    }
  }

  // Cache available models after token is set up
  if (state.copilotToken) {
    try {
      await cacheModels()
      const models = state.models as any
      const modelCount = models?.data?.length || 0
      const sortedModels = [...(models?.data || [])].sort((a, b) => a.id.localeCompare(b.id))
      consola.success(`Loaded ${modelCount} available models:`)
      for (const model of sortedModels) {
        consola.log(`  - ${model.id} (${model.name})`)
      }
    } catch (err) {
      consola.warn(`Failed to load models: ${(err as Error).message}`)
    }
  }

  if (options.claudeCode && state.copilotToken) {
    const command = generateClaudeCodeCommand(serverUrl)
    consola.success("Claude Code configuration:")
    consola.log(command)
  }

  consola.success(`Server running at ${serverUrl}`)

  serve({
    fetch: server.fetch as ServerHandler,
    port: options.port,
  })
}

function generateClaudeCodeCommand(baseUrl: string): string {
  return `export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_MODEL="gpt-4o"
export ANTHROPIC_DEFAULT_SONNET_MODEL="gpt-4o"
export ANTHROPIC_SMALL_FAST_MODEL="gpt-4o"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="gpt-4o"
export DISABLE_NON_ESSENTIAL_MODEL_CALLS="1"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"`
}

export const start = defineCommand({
  meta: {
    name: "start",
    description: "Start the Copilot API server",
  },
  args: {
    port: {
      alias: "p",
      type: "string",
      default: "7788",
      description: "Port to listen on",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      default: false,
      description: "Enable verbose logging",
    },
    "account-type": {
      alias: "a",
      type: "string",
      default: "individual",
      description: "Account type to use (individual, business, enterprise)",
    },
    manual: {
      type: "boolean",
      default: false,
      description: "Enable manual request approval",
    },
    "rate-limit": {
      alias: "r",
      type: "string",
      description: "Rate limit in seconds between requests",
    },
    wait: {
      alias: "w",
      type: "boolean",
      default: false,
      description:
        "Wait instead of error when rate limit is hit",
    },
    "github-token": {
      alias: "g",
      type: "string",
      description:
        "Provide GitHub token directly",
    },
    "claude-code": {
      alias: "c",
      type: "boolean",
      default: false,
      description:
        "Generate Claude Code configuration",
    },
    "show-token": {
      type: "boolean",
      default: false,
      description: "Show GitHub and Copilot tokens",
    },
    "proxy-env": {
      type: "boolean",
      default: false,
      description: "Initialize proxy from environment variables",
    },
  },
  run({ args }) {
    const rateLimitRaw = args["rate-limit"]
    const rateLimit =
      rateLimitRaw === undefined ? undefined : Number.parseInt(rateLimitRaw, 10)

    return runServer({
      port: Number.parseInt(args.port, 10),
      verbose: args.verbose,
      accountType: args["account-type"],
      manual: args.manual,
      rateLimit,
      rateLimitWait: args.wait,
      githubToken: args["github-token"],
      claudeCode: args["claude-code"],
      showToken: args["show-token"],
      proxyEnv: args["proxy-env"],
    })
  },
})
