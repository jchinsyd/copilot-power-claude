import { githubApiHeaders, GITHUB_CLIENT_ID } from "../../lib/api-config"

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export const getDeviceCode = async (): Promise<DeviceCodeResponse> => {
  const response = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      ...githubApiHeaders({}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: "read:user",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to get device code")
  }

  return (await response.json()) as DeviceCodeResponse
}
