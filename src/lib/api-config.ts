import { randomUUID } from "node:crypto"

import { state } from "./state"

export const GITHUB_BASE_URL = "https://github.com"
export const GITHUB_API_BASE_URL = "https://api.github.com"
export const GITHUB_CLIENT_ID = "Iv1.b507a08c87ecfe98"

const COPILOT_VERSION = "0.26.7"
const EDITOR_PLUGIN_VERSION = `copilot-chat/${COPILOT_VERSION}`
const USER_AGENT = `GitHubCopilotChat/${COPILOT_VERSION}`
const API_VERSION = "2025-04-01"

export const standardHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
})

export const copilotBaseUrl = (state: { accountType: string }) => {
  const accountType = state.accountType
  if (accountType === "enterprise") {
    return "https://api.enterprise.githubcopilot.com"
  }
  if (accountType === "business") {
    return "https://api.business.githubcopilot.com"
  }
  return "https://api.githubcopilot.com"
}

export const copilotHeaders = (state: { copilotToken?: string; vsCodeVersion?: string }, enableVision = false) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${state.copilotToken}`,
    "copilot-integration-id": "vscode-chat",
    "editor-version": `vscode/${state.vsCodeVersion || "1.104.3"}`,
    "editor-plugin-version": EDITOR_PLUGIN_VERSION,
    "user-agent": USER_AGENT,
    "openai-intent": "conversation-panel",
    "x-github-api-version": API_VERSION,
    "x-request-id": randomUUID(),
    "x-vscode-user-agent-library-version": "electron-fetch",
  }

  if (enableVision) {
    headers["Accept"] = "multipart/form-data"
    headers["copilot-vision-request"] = "true"
  }

  return headers
}

export const githubApiHeaders = (state: { githubToken?: string }) => {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }

  if (state.githubToken) {
    headers["Authorization"] = `Bearer ${state.githubToken}`
  }

  return headers
}
