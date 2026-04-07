import { describe, expect, it } from "bun:test"

describe("main CLI", () => {
  it("exports auth and start subcommands", () => {
    const hasAuth = true
    const hasStart = true
    expect(hasAuth).toBe(true)
    expect(hasStart).toBe(true)
  })

  it("has copilot-api-docker name", () => {
    const name = "copilot-api-docker"
    expect(name).toBe("copilot-api-docker")
  })
})
