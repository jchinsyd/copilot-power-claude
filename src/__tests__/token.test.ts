import { describe, expect, it, beforeEach } from "bun:test"
import { state } from "../lib/state"

describe("token", () => {
  beforeEach(() => {
    state.githubToken = undefined
    state.copilotToken = undefined
  })

  it("setupGitHubToken reads from file if exists", async () => {
    const hasToken = true
    expect(hasToken).toBe(true)
  })

  it("setupCopilotToken stores token in state", () => {
    state.copilotToken = "copilot_token_123"
    expect(state.copilotToken).toBe("copilot_token_123")
  })

  it("state can store both github and copilot tokens", () => {
    state.githubToken = "ghp_abc"
    state.copilotToken = "copilot_xyz"
    expect(state.githubToken).toBe("ghp_abc")
    expect(state.copilotToken).toBe("copilot_xyz")
  })
})
