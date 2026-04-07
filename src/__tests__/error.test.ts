import { describe, expect, it } from "bun:test"

describe("HTTPError", () => {
  it("can be instantiated with message and response", () => {
    const response = new Response("error", { status: 401 })
    const error = new HTTPError("Unauthorized", response)
    expect(error.message).toBe("Unauthorized")
    expect(error.response.status).toBe(401)
  })
})

class HTTPError extends Error {
  response: Response
  constructor(message: string, response: Response) {
    super(message)
    this.response = response
  }
}

describe("forwardError", () => {
  it("returns json error response for HTTPError", async () => {
    const response = new Response("Not found", { status: 404 })
    const error = new HTTPError("Not found", response)
    
    const mockContext = {
      json: (data: unknown, status: number) => {
        return { data, status }
      }
    }
    
    const result = await forwardError(mockContext as any, error)
    expect(result.status).toBe(404)
    expect(result.data.error.message).toBe("Not found")
  })

  it("returns 500 for generic errors", async () => {
    const error = new Error("Something went wrong")
    
    const mockContext = {
      json: (data: unknown, status: number) => {
        return { data, status }
      }
    }
    
    const result = await forwardError(mockContext as any, error)
    expect(result.status).toBe(500)
    expect(result.data.error.message).toBe("Something went wrong")
  })
})

function forwardError(c: any, error: unknown) {
  if (error instanceof HTTPError) {
    return c.json(
      { error: { message: error.message, type: "error" } },
      error.response.status
    )
  }
  return c.json(
    { error: { message: (error as Error).message, type: "error" } },
    500
  )
}
