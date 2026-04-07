import type { Context } from "hono"
import { state } from "../../lib/state"
import type { Model, ModelsResponse } from "../../services/copilot/get-models"

export async function handleModels(c: Context) {
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
