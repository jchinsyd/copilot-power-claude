export interface State {
  githubToken?: string
  copilotToken?: string
  accountType: string
  models?: unknown
  vsCodeVersion?: string
  manualApprove: boolean
  rateLimitWait: boolean
  showToken: boolean
  rateLimitSeconds?: number
  lastRequestTimestamp?: number
}

export const state: State = {
  accountType: "individual",
  manualApprove: false,
  rateLimitWait: false,
  showToken: false,
}
