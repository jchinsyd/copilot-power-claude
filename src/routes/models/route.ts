import { Hono } from "hono"

import { forwardError } from "../../lib/error"
import { handleModels } from "./handler"

export const modelRoutes = new Hono()

modelRoutes.get("/", async (c) => {
  try {
    return await handleModels(c)
  } catch (error) {
    return await forwardError(c, error)
  }
})
