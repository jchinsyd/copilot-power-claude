import type { Context } from "hono"
import { createEmbeddings } from "../../services/copilot/create-embeddings"
import { state } from "../../lib/state"
import { loadConfig, resolveModelWithProvider, isProviderEnabled } from "../../lib/config"

export async function handleEmbeddings(c: Context) {
  await loadConfig()

  const body = await c.req.json()
  const { provider, model: resolvedModel } = resolveModelWithProvider(body.model)

  // Check if provider is enabled
  if (!isProviderEnabled(provider)) {
    return c.json({
      error: {
        message: `Provider '${provider}' is not enabled. Please enable it in config.json or use a different provider.`,
        type: "invalid_request_error",
      },
    }, 400)
  }

  // For github-copilot, require copilotToken
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

  // Use resolved model without provider prefix
  const payload = { ...body, model: resolvedModel }

  try {
    const response = await createEmbeddings(payload)
    return c.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed"
    return c.json({ error: { message, type: "error" } }, 500)
  }
}
