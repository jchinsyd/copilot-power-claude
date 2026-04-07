import { Hono } from "hono"

import { forwardError } from "../../lib/error"
import { handleEmbeddings } from "./handler"

export const embeddingRoutes = new Hono()

embeddingRoutes.post("/", async (c) => {
  try {
    return await handleEmbeddings(c)
  } catch (error) {
    return await forwardError(c, error)
  }
})
