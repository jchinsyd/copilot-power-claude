import { describe, expect, it, beforeEach, afterEach } from "bun:test"
import { resolve } from "node:path"
import fs from "node:fs/promises"
import {
  loadConfig,
  resetConfig,
  getProviderConfig,
  getDefaultProvider,
  isProviderEnabled,
  resolveModelWithProvider,
  getProviderAuthToken,
  getProviderBaseUrl,
  getProviderEndpoint,
  type ConfigState,
} from "../lib/config"

describe("config", () => {
  const testConfigPath = resolve(process.cwd(), "config.json")
  const backupConfigPath = resolve(process.cwd(), "config.json.backup")

  beforeEach(async () => {
    // Reset config state before each test
    resetConfig()
    // Backup existing config
    try {
      await fs.copyFile(testConfigPath, backupConfigPath)
    } catch {
      // No config exists, that's fine
    }
  })

  afterEach(async () => {
    // Restore backup
    try {
      await fs.copyFile(backupConfigPath, testConfigPath)
      await fs.unlink(backupConfigPath)
    } catch {
      // No backup to restore
    }
  })

  describe("loadConfig", () => {
    it("loads config from config.json", async () => {
      const config = await loadConfig()
      expect(config).not.toBeNull()
      expect(config?.defaultProvider).toBe("github-copilot")
    })
  })

  describe("getDefaultProvider", () => {
    it("returns default provider from config", async () => {
      await loadConfig()
      expect(getDefaultProvider()).toBe("github-copilot")
    })
  })

  describe("isProviderEnabled", () => {
    it("returns true when provider is enabled in config", async () => {
      await loadConfig()
      expect(isProviderEnabled("github-copilot")).toBe(true)
    })

    it("returns false when provider is not in config", async () => {
      await loadConfig()
      expect(isProviderEnabled("nonexistent")).toBe(false)
    })
  })

  describe("resolveModelWithProvider", () => {
    it("extracts provider and model from prefixed model name", async () => {
      await loadConfig()
      const result = resolveModelWithProvider("github-copilot/gpt-4.1")
      expect(result.provider).toBe("github-copilot")
      expect(result.model).toBe("gpt-4.1")
    })

    it("uses default provider when no prefix provided", async () => {
      await loadConfig()
      const result = resolveModelWithProvider("gpt-4o")
      expect(result.provider).toBe("github-copilot")
      expect(result.model).toBe("gpt-4o")
    })

    it("falls back to default provider when prefixed provider is not enabled", async () => {
      await loadConfig()
      const result = resolveModelWithProvider("nonexistent/gpt-4o")
      expect(result.provider).toBe("github-copilot")
      expect(result.model).toBe("gpt-4o")
    })
  })

  describe("getProviderConfig", () => {
    it("returns provider configuration", async () => {
      await loadConfig()
      const config = getProviderConfig("github-copilot")
      expect(config?.enabled).toBe(true)
    })
  })
})