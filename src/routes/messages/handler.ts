import type { Context } from "hono"
import { streamSSE } from "hono/streaming"
import { state } from "../../lib/state"
import { resolveModelWithProvider, isProviderEnabled, getProviderAuthToken } from "../../lib/config"
import {
  createChatCompletions,
  type ChatCompletionChunk,
  type Message,
} from "../../services/copilot/create-chat-completions"

import {
  type AnthropicMessage,
  type AnthropicMessagesPayload,
  type AnthropicResponse,
  type AnthropicTextBlock,
  type AnthropicToolUseBlock,
  type AnthropicStreamState,
} from "./anthropic-types"
import { translateChunkToAnthropicEvents } from "./stream-translation"

export async function handleCompletion(c: Context) {
  // Load config and resolve provider
  const { loadConfig, resolveModelWithProvider, isProviderEnabled } = await import("../../lib/config")
  await loadConfig()

  const anthropicPayload = await c.req.json<AnthropicMessagesPayload>()
  const modelWithProvider = anthropicPayload.model || "gpt-4o"

  // Resolve provider from model prefix
  const { provider, model: resolvedModel } = resolveModelWithProvider(modelWithProvider)
  console.log(`[Messages] Using model: ${resolvedModel} (provider: ${provider})`)

  // Check if provider is enabled
  if (!isProviderEnabled(provider)) {
    return c.json({
      error: {
        message: `Provider '${provider}' is not enabled. Please enable it in config.json or use a different provider.`,
        type: "error",
      },
    }, 400)
  }

  // Check authentication based on provider
  if (provider === "github-copilot" && !state.copilotToken) {
    console.log("")
    console.log("🔐 Not authenticated. Please login with:")
    console.log("   docker exec -it copilot-power-claude auth")
    console.log("")
    return c.json({
      error: {
        message: "Not authenticated. Please run 'auth' command first.",
        type: "error",
      },
    }, 401)
  }

  // Check MiniMax auth token
  if (provider === "minimax" && !getProviderAuthToken("minimax")) {
    return c.json({
      error: {
        message: "MiniMax API key not configured. Please add authToken in config.json.",
        type: "error",
      },
    }, 401)
  }

  const openAIPayload = translateToOpenAI(anthropicPayload, resolveModelWithProvider(modelWithProvider).model)

  const response = await createChatCompletions(openAIPayload, provider)

  if (!anthropicPayload.stream) {
    const anthropicResponse = translateToAnthropic(response as any)
    return c.json(anthropicResponse)
  }

  // Handle streaming
  return streamSSE(c, async (stream) => {
    const streamState: AnthropicStreamState = {
      messageStartSent: false,
      contentBlockIndex: 0,
      contentBlockOpen: false,
      toolCalls: {},
    }

    for await (const chunk of response as AsyncIterable<ChatCompletionChunk>) {
      const events = translateChunkToAnthropicEvents(chunk, streamState)

      for (const event of events) {
        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
        })
      }
    }
  })
}

export function translateToOpenAI(payload: AnthropicMessagesPayload, resolvedModel?: string) {
  return {
    model: translateModelName(resolvedModel || payload.model),
    messages: translateAnthropicMessagesToOpenAI(payload.messages, payload.system),
    max_tokens: payload.max_tokens,
    stop: payload.stop_sequences,
    stream: payload.stream,
    temperature: payload.temperature,
    top_p: payload.top_p,
    user: payload.metadata?.user_id,
    tools: payload.tools ? translateAnthropicToolsToOpenAI(payload.tools) : undefined,
  }
}

function translateModelName(model: string): string {
  if (model.startsWith("claude-sonnet-4-")) {
    return model.replace(/^claude-sonnet-4-.*/, "claude-sonnet-4")
  } else if (model.startsWith("claude-opus-")) {
    return model.replace(/^claude-opus-4-.*/, "claude-opus-4")
  }
  return model
}

function translateAnthropicMessagesToOpenAI(
  anthropicMessages: Array<AnthropicMessage>,
  system: string | Array<AnthropicTextBlock> | undefined,
): Message[] {
  const systemMessages = handleSystemPrompt(system)

  const otherMessages = anthropicMessages.flatMap((message) =>
    message.role === "user" ? handleUserMessage(message) : handleAssistantMessage(message),
  )

  return [...systemMessages, ...otherMessages]
}

function handleSystemPrompt(
  system: string | Array<AnthropicTextBlock> | undefined,
): Message[] {
  if (!system) return []

  if (typeof system === "string") {
    return [{ role: "system", content: system }]
  }

  const systemText = system.map((block) => block.text).join("\n\n")
  return [{ role: "system", content: systemText }]
}

function handleUserMessage(message: AnthropicMessage): Message[] {
  const content = (message as any).content

  if (typeof content === "string") {
    return [{ role: "user", content }]
  }

  if (Array.isArray(content)) {
    // Filter out tool_result blocks and map the rest
    const nonToolResults = content.filter((block: any) => block.type !== "tool_result")
    if (nonToolResults.length > 0) {
      return [{
        role: "user",
        content: nonToolResults.map((block: any) =>
          block.type === "text" ? block.text :
          block.type === "image" ? { type: "image_url", image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } } :
          block.type === "thinking" ? block.thinking : block.content
        ).join("\n\n"),
      }]
    }
  }

  return [{ role: "user", content: typeof content === "string" ? content : String(content) }]
}

function handleAssistantMessage(message: AnthropicMessage): Message[] {
  const content = (message as any).content

  if (typeof content === "string") {
    return [{ role: "assistant", content }]
  }

  if (!Array.isArray(content)) {
    return [{ role: "assistant", content: String(content) }]
  }

  const toolUseBlocks = content.filter((block: any): block is { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
    block.type === "tool_use"
  )

  const textBlocks = content.filter((block: any): block is AnthropicTextBlock =>
    block.type === "text" || block.type === "thinking"
  )

  const allTextContent = textBlocks.map((b: any) => b.text || b.thinking).join("\n\n")

  if (toolUseBlocks.length > 0) {
    return [{
      role: "assistant",
      content: allTextContent || null,
      tool_calls: toolUseBlocks.map((toolUse: any) => ({
        id: toolUse.id,
        type: "function",
        function: {
          name: toolUse.name,
          arguments: JSON.stringify(toolUse.input),
        },
      })),
    }]
  }

  return [{ role: "assistant", content: allTextContent || null }]
}

function translateAnthropicToolsToOpenAI(anthropicTools: Array<{ name: string; description?: string; input_schema: Record<string, unknown> }>) {
  return anthropicTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }))
}

function translateToAnthropic(response: any): AnthropicResponse {
  const allTextBlocks: AnthropicTextBlock[] = []
  const allToolUseBlocks: AnthropicToolUseBlock[] = []
  let stopReason: "stop" | "length" | "tool_calls" | "content_filter" | null = null

  for (const choice of response.choices || []) {
    const message = choice.message || {}

    // Extract text content
    if (typeof message.content === "string") {
      allTextBlocks.push({ type: "text", text: message.content })
    } else if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "text") {
          allTextBlocks.push({ type: "text", text: part.text })
        } else if (part.type === "image_url") {
          // Images in response - skip for now
        }
      }
    }

    // Extract tool calls
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      for (const toolCall of message.tool_calls) {
        allToolUseBlocks.push({
          type: "tool_use",
          id: toolCall.id,
          name: toolCall.function.name,
          input: typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments,
        })
      }
    }

    if (choice.finish_reason) {
      stopReason = choice.finish_reason
    }
  }

  const mappedStopReason = mapOpenAIStopReasonToAnthropic(stopReason)

  return {
    id: response.id,
    type: "message",
    role: "assistant",
    model: response.model,
    content: [...allTextBlocks, ...allToolUseBlocks],
    stop_reason: mappedStopReason,
    stop_sequence: null,
    usage: {
      input_tokens: response.usage?.prompt_tokens || 0,
      output_tokens: response.usage?.completion_tokens || 0,
    },
  }
}

function mapOpenAIStopReasonToAnthropic(
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | null,
): AnthropicResponse["stop_reason"] {
  if (finishReason === null) return null

  const stopReasonMap = {
    stop: "end_turn",
    length: "max_tokens",
    tool_calls: "tool_use",
    content_filter: "end_turn",
  } as const

  return stopReasonMap[finishReason] || null
}