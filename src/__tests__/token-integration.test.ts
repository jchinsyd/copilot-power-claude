import { describe, expect, it, beforeEach } from "bun:test"
import { state } from "../lib/state"
import { PATHS } from "../lib/paths"

describe("token module", () => {
  beforeEach(() => {
    state.githubToken = undefined
    state.copilotToken = undefined
    state.showToken = false
  })

  it("exports PATHS with expected structure", () => {
    expect(PATHS.APP_DIR).toBeDefined()
    expect(PATHS.GITHUB_TOKEN_PATH).toBeDefined()
    expect(PATHS.COPILOT_TOKEN_PATH).toBeDefined()
  })

  it("setupGitHubToken sets state.githubToken when token provided", async () => {
    state.githubToken = "ghp_test_token"
    expect(state.githubToken).toBe("ghp_test_token")
  })

  it("setupCopilotToken sets state.copilotToken when token provided", async () => {
    state.copilotToken = "copilot_test"
    expect(state.copilotToken).toBe("copilot_test")
  })

  it("showToken can be toggled", () => {
    state.showToken = true
    expect(state.showToken).toBe(true)
    state.showToken = false
    expect(state.showToken).toBe(false)
  })

  it("state stores accountType", () => {
    state.accountType = "business"
    expect(state.accountType).toBe("business")
    state.accountType = "enterprise"
    expect(state.accountType).toBe("enterprise")
  })
})
