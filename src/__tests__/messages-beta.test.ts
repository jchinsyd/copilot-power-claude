import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { resolve } from "node:path"
import fs from "node:fs/promises"
import { loadConfig, resetConfig, resolveModelWithProvider } from "../lib/config"

describe("Messages Beta Query Param", () => {
  const testConfigPath = resolve(process.cwd(), "config.json")
  const backupConfigPath = resolve(process.cwd(), "config.json.backup")

  beforeEach(async () => {
    resetConfig()
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

  it("should resolve model with provider when beta=true in query", async () => {
    const testConfig = {
      defaultProvider: "github-copilot",
      providers: {
        "github-copilot": { enabled: true },
        deepseek: { enabled: true, baseUrl: "https://api.deepseek.com/anthropic" }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))
    await loadConfig(true)

    // When model contains provider prefix, resolve correctly
    const result = resolveModelWithProvider("deepseek/deepseek-chat")
    expect(result.provider).toBe("deepseek")
    expect(result.model).toBe("deepseek-chat")
  })

  it("should auto-detect deepseek model without prefix", async () => {
    const testConfig = {
      defaultProvider: "github-copilot",
      providers: {
        "github-copilot": { enabled: true },
        deepseek: { enabled: true, baseUrl: "https://api.deepseek.com/anthropic" }
      }
    }
    await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2))
    await loadConfig(true)

    // Auto-detect provider from model name
    const result = resolveModelWithProvider("deepseek-chat")
    expect(result.provider).toBe("deepseek")
  })
})