import { Hono } from "hono"

import { forwardError } from "../../lib/error"
import { handleCompletion } from "./handler"

export const messageRoutes = new Hono()

messageRoutes.post("/", async (c) => {
  try {
    // Get beta query param - accessible in handler via c.req.query("beta")
    return await handleCompletion(c)
  } catch (error) {
    return await forwardError(c, error)
  }
})
