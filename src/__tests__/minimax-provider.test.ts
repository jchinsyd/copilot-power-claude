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

describe("MiniMax Provider", () => {
  const testConfigPath = resolve(process.cwd(), "config.json")
  const backupConfigPath = resolve(process.cwd(), "config.json.backup")

  beforeEach(async () => {
    resetConfig()
    // Clear env var for testing
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

  it("should detect minimax provider as enabled when configured", async () => {
    const testConfig = {
      defaultProvider: "minimax",
      providers: {
        minimax: {
          enabled: true,
          baseUrl: "https://api.minimax.io/anthropic",
          authToken: "test-minimax-key"
        }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))

    await loadConfig(true)

    expect(isProviderEnabled("minimax")).toBe(true)
  })

  it("should resolve minimax model with provider prefix", async () => {
    const testConfig = {
      defaultProvider: "minimax",
      providers: {
        minimax: {
          enabled: true,
          baseUrl: "https://api.minimax.io/anthropic",
          authToken: "test-minimax-key"
        }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))

    await loadConfig(true)

    const result = resolveModelWithProvider("minimax/Minimax-M2.5")
    expect(result.provider).toBe("minimax")
    expect(result.model).toBe("Minimax-M2.5")
  })

  it("should get MiniMax base URL from config", async () => {
    const testConfig = {
      defaultProvider: "minimax",
      providers: {
        minimax: {
          enabled: true,
          baseUrl: "https://api.minimax.io/anthropic",
          authToken: "test-minimax-key"
        }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))

    await loadConfig(true)

    expect(getProviderBaseUrl("minimax")).toBe("https://api.minimax.io/anthropic")
  })

  it("should get MiniMax auth token from config", async () => {
    const testConfig = {
      defaultProvider: "minimax",
      providers: {
        minimax: {
          enabled: true,
          baseUrl: "https://api.minimax.io/anthropic",
          authToken: "test-minimax-key"
        }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))

    await loadConfig(true)

    expect(getProviderAuthToken("minimax")).toBe("test-minimax-key")
  })
})
