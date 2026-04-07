import type { Context } from "hono"
import { createEmbeddings } from "../../services/copilot/create-embeddings"
import { state } from "../../lib/state"

export async function handleEmbeddings(c: Context) {
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

  const body = await c.req.json()
  
  try {
    const response = await createEmbeddings(body)
    return c.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed"
    return c.json({ error: { message, type: "error" } }, 500)
  }
}
