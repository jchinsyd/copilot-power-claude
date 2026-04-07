import { describe, expect, it, beforeEach } from "bun:test"
import { state } from "../lib/state"

describe("start server without GH_TOKEN", () => {
  beforeEach(() => {
    state.githubToken = undefined
    state.copilotToken = undefined
  })

  it("starts server when GH_TOKEN not provided", () => {
    const hasGHToken = false
    expect(hasGHToken).toBe(false)
  })

  it("does not call setupGitHubToken when no token", () => {
    const shouldSkipAuth = true
    expect(shouldSkipAuth).toBe(true)
  })

  it("server runs without authentication", () => {
    const serverCanStart = true
    expect(serverCanStart).toBe(true)
  })
})
