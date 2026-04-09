import fs from "node:fs/promises"
import { resolve } from "node:path"

export interface ProviderConfig {
  enabled: boolean
  baseUrl?: string
  endpoint?: string
  authToken?: string
}

export interface ConfigState {
  defaultProvider: string
  providers: Record<string, ProviderConfig>
}

let configState: ConfigState | null = null
let configLoaded = false

const CONFIG_PATH = resolve(process.cwd(), "config.json")

export async function loadConfig(force = false): Promise<ConfigState | null> {
  if (configLoaded && !force) {
    return configState
  }
  try {
    const content = await fs.readFile(CONFIG_PATH, "utf8")
    configState = JSON.parse(content) as ConfigState
    configLoaded = true
    return configState
  } catch (err) {
    console.warn("Failed to load config.json:", (err as Error).message)
    return null
  }
}

export function resetConfig(): void {
  configState = null
  configLoaded = false
}

export function getProviderConfig(provider: string): ProviderConfig | undefined {
  return configState?.providers[provider]
}

export function getDefaultProvider(): string {
  return configState?.defaultProvider || "github-copilot"
}

export function isProviderEnabled(provider: string): boolean {
  const providerConfig = getProviderConfig(provider)
  return providerConfig?.enabled ?? false
}

export function resolveModelWithProvider(model: string): { provider: string; model: string } {
  const defaultProvider = getDefaultProvider()

  // Check if model has provider prefix (e.g., "github-copilot/gpt-4.1")
  if (model.includes("/")) {
    const parts = model.split("/")
    const provider = parts[0]
    const actualModel = parts.slice(1).join("/") // Rejoin in case model name has slashes

    if (provider && actualModel && isProviderEnabled(provider)) {
      return { provider, model: actualModel }
    }
    // Prefix provided but provider not enabled - fall back to default with original model
    return { provider: defaultProvider, model: actualModel }
  }

  // Auto-detect provider based on known model patterns
  const detectedProvider = detectProviderByModel(model)
  if (detectedProvider && isProviderEnabled(detectedProvider)) {
    return { provider: detectedProvider, model }
  }

  // No prefix, use default provider
  return { provider: defaultProvider, model }
}

// Auto-detect provider based on known model name patterns
function detectProviderByModel(model: string): string | null {
  const lowerModel = model.toLowerCase()

  // MiniMax models
  if (lowerModel.includes("minimax")) {
    return "minimax"
  }

  // DeepSeek models
  if (lowerModel.includes("deepseek")) {
    return "deepseek"
  }

  // Add other providers here as needed
  // Example: if (lowerModel.includes("gpt-4")) return "openai"

  return null
}

export function getProviderAuthToken(provider: string): string | undefined {
  // Check env first (preferred for secrets)
  if (provider === "minimax") {
    return process.env.MINIMAX_API_KEY || configState?.providers[provider]?.authToken
  }
  if (provider === "deepseek") {
    return process.env.DEEPSEEK_API_KEY || configState?.providers[provider]?.authToken
  }
  return configState?.providers[provider]?.authToken
}

export function getProviderBaseUrl(provider: string): string | undefined {
  return configState?.providers[provider]?.baseUrl
}

export function getProviderEndpoint(provider: string): string | undefined {
  return configState?.providers[provider]?.endpoint
}