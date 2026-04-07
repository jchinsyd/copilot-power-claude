import { githubApiHeaders } from "../../lib/api-config"
import { state } from "../../lib/state"

export const getGitHubUser = async () => {
  const response = await fetch("https://api.github.com/user", {
    headers: githubApiHeaders(state),
  })

  if (!response.ok) {
    throw new Error("Failed to get GitHub user")
  }

  return (await response.json()) as GitHubUser
}

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name?: string
}
