import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { resolve } from "node:path"
import fs from "node:fs/promises"
import {
  loadConfig,
  resetConfig,
  resolveModelWithProvider,
} from "../lib/config"

describe("DeepSeek max_tokens validation", () => {
  const testConfigPath = resolve(process.cwd(), "config.json")
  const backupConfigPath = resolve(process.cwd(), "config.json.backup")

  beforeEach(async () => {
    resetConfig()
    delete process.env.DEEPSEEK_API_KEY
    try {
      await fs.copyFile(testConfigPath, backupConfigPath)
    } catch {
      // No config exists
    }
  })

  afterEach(async () => {
    try {
      await fs.copyFile(backupConfigPath, testConfigPath)
      await fs.unlink(backupConfigPath)
    } catch {
      // No backup
    }
    resetConfig()
  })

  it("should cap max_tokens to 8192 when value exceeds valid range", async () => {
    // Setup config
    const testConfig = {
      defaultProvider: "github-copilot",
      providers: {
        deepseek: {
          enabled: true,
          baseUrl: "https://api.deepseek.com/v1",
          authToken: "test-deepseek-key"
        }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))
    await loadConfig(true)

    // Mock fetch to capture the request body
    let capturedBody: any = null
    const originalFetch = globalThis.fetch
    globalThis.fetch = async (url: string | URL, options?: any) => {
      if (typeof url === 'string' && url.includes('deepseek')) {
        capturedBody = JSON.parse(options?.body || '{}')
        return new Response(JSON.stringify({
          id: "test",
          choices: [{ message: { role: "assistant", content: "test" } }]
        }), { status: 200 })
      }
      return originalFetch(url as any, options)
    }

    const { createChatCompletions } = await import("../services/copilot/create-chat-completions")

    // Call with max_tokens > 8192 (should trigger the error without fix)
    await createChatCompletions({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 10000  // Exceeds DeepSeek's max of 8192
    }, "deepseek")

    // Restore fetch
    globalThis.fetch = originalFetch

    // Verify max_tokens was capped to 8192
    expect(capturedBody).not.toBeNull()
    expect(capturedBody.max_tokens).toBe(8192)
  })
})
