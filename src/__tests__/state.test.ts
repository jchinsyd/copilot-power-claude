import { describe, expect, it, beforeEach } from "bun:test"
import { state, type State } from "../lib/state"

describe("state", () => {
  beforeEach(() => {
    state.githubToken = undefined
    state.copilotToken = undefined
    state.accountType = "individual"
    state.manualApprove = false
    state.rateLimitWait = false
    state.showToken = false
  })

  it("has default account type as individual", () => {
    expect(state.accountType).toBe("individual")
  })

  it("can store github token", () => {
    state.githubToken = "ghp_test_token"
    expect(state.githubToken).toBe("ghp_test_token")
  })

  it("can store copilot token", () => {
    state.copilotToken = "copilot_test_token"
    expect(state.copilotToken).toBe("copilot_test_token")
  })

  it("defaults manualApprove to false", () => {
    expect(state.manualApprove).toBe(false)
  })

  it("defaults showToken to false", () => {
    expect(state.showToken).toBe(false)
  })
})
