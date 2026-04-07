import consola from "consola"

import { state } from "./state"
import { getModels } from "../services/copilot/get-models"

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const FALLBACK_VSCODE_VERSION = "1.104.3"

async function getVSCodeVersion(): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, 5000)

  try {
    const response = await fetch(
      "https://aur.archlinux.org/cgit/aur.git/plain/PKGBUILD?h=visual-studio-code-bin",
      { signal: controller.signal },
    )

    const pkgbuild = await response.text()
    const pkgverRegex = /pkgver=([0-9.]+)/
    const match = pkgbuild.match(pkgverRegex)

    if (match) {
      return match[1]
    }

    return FALLBACK_VSCODE_VERSION
  } catch {
    return FALLBACK_VSCODE_VERSION
  } finally {
    clearTimeout(timeout)
  }
}

export const cacheVSCodeVersion = async () => {
  const vsCodeVersion = await getVSCodeVersion()
  state.vsCodeVersion = vsCodeVersion
  consola.info(`Using VSCode version: ${vsCodeVersion}`)
}

export async function cacheModels(): Promise<void> {
  const models = await getModels()
  state.models = models
}
