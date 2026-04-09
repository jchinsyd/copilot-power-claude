import type { Context } from "hono"
import { state } from "../../lib/state"
import { resolveModelWithProvider, isProviderEnabled, getProviderAuthToken } from "../../lib/config"
import { createChatCompletions } from "../../services/copilot/create-chat-completions"
import { sleep } from "../../lib/utils"

export async function handleCompletion(c: Context) {
  const body = await c.req.json()
  const modelWithProvider = body.model || "gpt-4o"

  // Resolve provider from model prefix
  const { provider, model } = resolveModelWithProvider(modelWithProvider)
  console.log(`[ChatCompletions] Using model: ${model} (provider: ${provider})`)

  // Check if provider is enabled
  if (!isProviderEnabled(provider)) {
    return c.json({
      error: {
        message: `Provider '${provider}' is not enabled. Please enable it in config.json or use a different provider.`,
        type: "error",
      },
    }, 400)
  }

  // Check authentication based on provider
  if (provider === "github-copilot" && !state.copilotToken) {
    console.log("")
    console.log("🔐 Not authenticated. Please login with:")
    console.log("   docker exec -it copilot-power-claude auth")
    console.log("")
    return c.json({
      error: {
        message: "Not authenticated. Please run 'auth' command first.",
        type: "error",
      },
    }, 401)
  }

  // Check MiniMax auth token
  if (provider === "minimax" && !getProviderAuthToken("minimax")) {
    return c.json({
      error: {
        message: "MiniMax API key not configured. Please add authToken in config.json.",
        type: "error",
      },
    }, 401)
  }

  // Check DeepSeek auth token
  if (provider === "deepseek" && !getProviderAuthToken("deepseek")) {
    return c.json({
      error: {
        message: "DeepSeek API key not configured. Please set DEEPSEEK_API_KEY env var or add authToken in config.json.",
        type: "error",
      },
    }, 401)
  }

  // Rate limiting
  if (state.rateLimitMs && state.rateLimitMs > 0) {
    const now = Date.now()
    const lastTimestamp = state.lastRequestTimestamp
    if (lastTimestamp) {
      const elapsed = now - lastTimestamp
      const waitTime = state.rateLimitMs
      if (elapsed < waitTime) {
        const remaining = waitTime - elapsed
        if (state.rateLimitWait) {
          await sleep(remaining)
        } else {
          return c.json({
            error: {
              message: `Rate limit exceeded. Wait ${Math.ceil(remaining)}ms before retrying.`,
              type: "rate_limit_error",
            },
          }, 429)
        }
      }
    }
    state.lastRequestTimestamp = Date.now()
  }

  try {
    const response = await createChatCompletions({
      model: model,
      messages: body.messages || [],
      stream: body.stream || false,
    }, provider)
    return c.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed"
    return c.json({ error: { message, type: "error" } }, 500)
  }
}
