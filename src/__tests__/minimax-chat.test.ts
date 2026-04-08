import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { resolve } from "node:path"
import fs from "node:fs/promises"
import {
  loadConfig,
  resetConfig,
  resolveModelWithProvider,
  isProviderEnabled,
  getProviderBaseUrl,
  getProviderAuthToken,
} from "../lib/config"

describe("MiniMax Chat Completions", () => {
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
  })

  it("should route to MiniMax API when provider is minimax", async () => {
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

    const { provider, model } = resolveModelWithProvider("minimax/Minimax-M2.5")
    expect(provider).toBe("minimax")
    expect(model).toBe("Minimax-M2.5")
    expect(isProviderEnabled("minimax")).toBe(true)
    expect(getProviderBaseUrl("minimax")).toBe("https://api.minimax.io/anthropic")
    expect(getProviderAuthToken("minimax")).toBe("test-minimax-key")
  })
})
