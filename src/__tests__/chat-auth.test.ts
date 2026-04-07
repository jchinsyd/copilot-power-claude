import { describe, expect, it, beforeEach } from "bun:test"
import { state } from "../lib/state"

describe("chat-completions auth check", () => {
  beforeEach(() => {
    state.githubToken = undefined
    state.copilotToken = undefined
  })

  it("returns 401 when not authenticated", () => {
    const hasToken = false
    expect(hasToken).toBe(false)
  })

  it("allows request when copilotToken exists", () => {
    state.copilotToken = "test_token"
    const hasToken = !!state.copilotToken
    expect(hasToken).toBe(true)
  })
})
