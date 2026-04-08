import type { Context } from "hono"
import { state } from "../../lib/state"
import {
  getDefaultProvider,
  isProviderEnabled,
  loadConfig,
} from "../../lib/config"
import type { Model, ModelsResponse } from "../../services/copilot/get-models"

export async function handleModels(c: Context) {
  // Load config to get provider info
  await loadConfig()

  // Get provider from query param or use default
  const queryProvider = c.req.query("provider")
  const provider = queryProvider || getDefaultProvider()

  // Check if provider is enabled
  if (!isProviderEnabled(provider)) {
    const availableProviders = ["github-copilot"] // Could be derived from config
    return c.json({
      error: {
        message: `Provider '${provider}' is not enabled. Available providers: ${availableProviders.join(", ")}`,
        type: "error",
      },
    }, 400)
  }

  // Handle github-copilot provider
  if (provider === "github-copilot") {
    if (!state.copilotToken) {
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

    if (!state.models) {
      return c.json({
        error: {
          message: "Models not loaded. Please restart the server.",
          type: "error",
        },
      }, 503)
    }

    const modelsResponse = state.models as ModelsResponse

    const models = modelsResponse.data.map((model: Model) => ({
      id: model.id,
      object: "model",
      type: "model",
      created: 0,
      created_at: new Date(0).toISOString(),
      owned_by: model.vendor,
      display_name: model.name,
    }))

    return c.json({
      object: "list",
      data: models,
      has_more: false,
    })
  }

  // Provider is enabled but not yet implemented
  return c.json({
    error: {
      message: `Provider '${provider}' is enabled but models are not available yet.`,
      type: "error",
    },
  }, 501)
}
