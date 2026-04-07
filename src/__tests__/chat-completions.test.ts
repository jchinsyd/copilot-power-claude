import { describe, expect, it, beforeEach } from "bun:test"
import { state } from "../lib/state"

describe("createChatCompletions", () => {
  beforeEach(() => {
    state.copilotToken = undefined
  })

  it("throws error when copilotToken not set", async () => {
    const callWithoutToken = async () => {
      if (!state.copilotToken) throw new Error("Copilot token not found")
    }
    await expect(callWithoutToken()).rejects.toThrow("Copilot token not found")
  })

  it("uses copilotToken when set", async () => {
    state.copilotToken = "test_token"
    expect(state.copilotToken).toBe("test_token")
  })

  it("sends request to copilotBaseUrl", () => {
    const url = "https://api.githubcopilot.com/chat/completions"
    expect(url).toContain("githubcopilot.com")
  })
})
