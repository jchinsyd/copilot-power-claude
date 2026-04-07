import { copilotBaseUrl, copilotHeaders } from "../../lib/api-config"
import { HTTPError } from "../../lib/error"
import { state } from "../../lib/state"

export const createChatCompletions = async (payload: ChatCompletionsPayload) => {
  if (!state.copilotToken) throw new Error("Copilot token not found")

  const enableVision = payload.messages.some(
    (x) =>
      typeof x.content !== "string"
      && x.content?.some((x) => x.type === "image_url"),
  )

  const isAgentCall = payload.messages.some((msg) =>
    ["assistant", "tool"].includes(msg.role),
  )

  const headers: Record<string, string> = {
    ...copilotHeaders(state, enableVision),
    "X-Initiator": isAgentCall ? "agent" : "user",
  }

  const response = await fetch(`${copilotBaseUrl(state)}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new HTTPError(`Failed to create chat completions (${response.status}): ${text}`, response)
  }

  if (payload.stream) {
    // Return an async iterable that streams the response body
    return createStreamIterable(response)
  }

  return (await response.json()) as ChatCompletionResponse
}

async function* createStreamIterable(response: Response): AsyncGenerator<ChatCompletionChunk> {
  if (!response.body) return

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const data = line.slice(6)

        if (data === "[DONE]") return

        try {
          yield JSON.parse(data) as ChatCompletionChunk
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export interface ChatCompletionChunk {
  id: string
  object: "chat.completion.chunk"
  created: number
  model: string
  choices: Array<Choice>
  usage?: Usage
}

export interface Choice {
  index: number
  delta: Delta
  finish_reason: string | null
}

export interface Delta {
  content?: string | null
  role?: string
  tool_calls?: ToolCallDelta[]
}

export interface ToolCallDelta {
  index: number
  id?: string
  function?: {
    name?: string
    arguments?: string
  }
}

export interface ChatCompletionResponse {
  id: string
  object: "chat.completion"
  created: number
  model: string
  choices: Array<ChoiceNonStreaming>
  usage?: Usage
}

export interface ChoiceNonStreaming {
  index: number
  message: ResponseMessage
  finish_reason: string
}

export interface ResponseMessage {
  role: "assistant"
  content: string | null
  tool_calls?: unknown[]
}

export interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatCompletionsPayload {
  messages: Array<Message>
  model: string
  stream?: boolean
  temperature?: number
  max_tokens?: number
  tools?: unknown[]
}

export interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string | Array<ContentPart> | null
  tool_calls?: Array<{
    id: string
    type: "function"
    function: {
      name: string
      arguments: string
    }
  }>
  tool_call_id?: string
}

export type ContentPart = TextPart | ImagePart

export interface TextPart {
  type: "text"
  text: string
}

export interface ImagePart {
  type: "image_url"
  image_url: {
    url: string
    detail?: "low" | "high" | "auto"
  }
}
