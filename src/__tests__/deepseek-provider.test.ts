import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { resolve } from "node:path"
import fs from "node:fs/promises"
import {
  loadConfig,
  resetConfig,
  isProviderEnabled,
  resolveModelWithProvider,
  getProviderBaseUrl,
  getProviderAuthToken,
} from "../lib/config"

describe("DeepSeek Provider", () => {
  const testConfigPath = resolve(process.cwd(), "config.json")
  const backupConfigPath = resolve(process.cwd(), "config.json.backup")

  beforeEach(async () => {
    resetConfig()
    // Clear env vars for testing
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.MINIMAX_API_KEY
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

  it("should detect deepseek provider from env var", async () => {
    process.env.DEEPSEEK_API_KEY = "env-deepseek-key"

    const result = getProviderAuthToken("deepseek")
    expect(result).toBe("env-deepseek-key")
  })

  it("should detect deepseek provider as enabled when configured", async () => {
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

    expect(isProviderEnabled("deepseek")).toBe(true)
  })

  it("should resolve deepseek-chat model to deepseek provider", async () => {
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

    const result = resolveModelWithProvider("deepseek-chat")
    expect(result.provider).toBe("deepseek")
    expect(result.model).toBe("deepseek-chat")
  })

  it("should get DeepSeek base URL from config", async () => {
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

    expect(getProviderBaseUrl("deepseek")).toBe("https://api.deepseek.com/v1")
  })

  it("should get DeepSeek auth token from config", async () => {
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

    expect(getProviderAuthToken("deepseek")).toBe("test-deepseek-key")
  })

  it("should prefer env var over config for DeepSeek auth token", async () => {
    process.env.DEEPSEEK_API_KEY = "env-deepseek-key"

    const testConfig = {
      defaultProvider: "github-copilot",
      providers: {
        deepseek: {
          enabled: true,
          baseUrl: "https://api.deepseek.com/v1",
          authToken: "config-deepseek-key"
        }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))

    await loadConfig(true)

    expect(getProviderAuthToken("deepseek")).toBe("env-deepseek-key")
  })

  it("should cap max_tokens at 8192 for DeepSeek API", async () => {
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

    // Mock fetch to capture the request
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

    // Import the function dynamically to test
    const { createChatCompletions } = await import("../services/copilot/create-chat-completions")

    // Call with max_tokens > 8192
    await createChatCompletions({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 10000  // Should be capped to 8192
    }, "deepseek")

    // Restore fetch
    globalThis.fetch = originalFetch

    // Verify max_tokens was capped
    expect(capturedBody).not.toBeNull()
    expect(capturedBody.max_tokens).toBe(8192)
  })

  it("should not cap max_tokens when within valid range for DeepSeek", async () => {
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

    // Mock fetch to capture the request
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

    // Call with max_tokens within valid range
    await createChatCompletions({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 4096
    }, "deepseek")

    // Restore fetch
    globalThis.fetch = originalFetch

    // Verify max_tokens was not capped
    expect(capturedBody).not.toBeNull()
    expect(capturedBody.max_tokens).toBe(4096)
  })
})