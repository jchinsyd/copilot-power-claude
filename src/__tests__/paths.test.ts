import { describe, expect, it, beforeAll, afterAll } from "bun:test"
import { PATHS, ensurePaths } from "../lib/paths"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"

describe("paths", () => {
  const testDir = path.join(os.tmpdir(), "copilot-api-test-" + Date.now())
  let originalHome: string

  beforeAll(async () => {
    originalHome = os.homedir()
    await fs.mkdir(testDir, { recursive: true })
  })

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it("PATHS has APP_DIR, GITHUB_TOKEN_PATH, COPILOT_TOKEN_PATH", () => {
    expect(PATHS.APP_DIR).toBeDefined()
    expect(PATHS.GITHUB_TOKEN_PATH).toBeDefined()
    expect(PATHS.COPILOT_TOKEN_PATH).toBeDefined()
  })

  it("COPILOT_TOKEN_PATH is inside APP_DIR", () => {
    expect(PATHS.COPILOT_TOKEN_PATH.startsWith(PATHS.APP_DIR)).toBe(true)
  })

  it("GITHUB_TOKEN_PATH is inside APP_DIR", () => {
    expect(PATHS.GITHUB_TOKEN_PATH.startsWith(PATHS.APP_DIR)).toBe(true)
  })
})
