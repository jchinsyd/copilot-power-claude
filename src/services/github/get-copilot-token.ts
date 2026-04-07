import { state } from "../../lib/state"
import { copilotHeaders, GITHUB_API_BASE_URL } from "../../lib/api-config"
import { HTTPError } from "../../lib/error"

export const getCopilotToken = async () => {
  if (!state.githubToken) throw new Error("GitHub token not found")

  const response = await fetch(`${GITHUB_API_BASE_URL}/copilot_internal/v2/token`, {
    headers: {
      ...copilotHeaders(state),
      Authorization: `token ${state.githubToken}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new HTTPError(`Failed to get Copilot token (${response.status}): ${text}`, response)
  }

  return (await response.json()) as CopilotTokenResponse
}

export interface CopilotTokenResponse {
  token: string
  refresh_in: number
  expires_at: number
}
