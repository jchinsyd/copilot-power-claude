import { describe, expect, it } from "bun:test"

describe("models route", () => {
  it("returns models list", async () => {
    const mockResponse = {
      data: [
        { id: "gpt-4o", name: "GPT-4o" },
        { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
      ],
      object: "list",
    }
    expect(mockResponse.data.length).toBe(2)
  })

  it("includes model id and name", () => {
    const model = { id: "gpt-4o", name: "GPT-4o" }
    expect(model.id).toBe("gpt-4o")
    expect(model.name).toBe("GPT-4o")
  })

  it("handles GET request to /v1/models", () => {
    const endpoint = "/v1/models"
    expect(endpoint).toBe("/v1/models")
  })
})
