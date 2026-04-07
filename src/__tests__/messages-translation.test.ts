import { describe, expect, it, beforeEach } from "bun:test"
import { state } from "../lib/state"
import {
  translateToOpenAI,
} from "../routes/messages/handler"
import type { AnthropicMessagesPayload } from "../routes/messages/anthropic-types"

describe("Anthropic to OpenAI translation (non-stream-translation)", () => {
  beforeEach(() => {
    state.copilotToken = undefined
  })

  describe("translateToOpenAI", () => {
    it("should translate minimal Anthropic payload to valid OpenAI payload", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello!" }],
        max_tokens: 0,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      expect(openAIPayload.model).toBe("gpt-4o")
      expect(openAIPayload.messages).toHaveLength(1)
      expect(openAIPayload.messages[0].role).toBe("user")
      expect(openAIPayload.messages[0].content).toBe("Hello!")
    })

    it("should translate system prompt to system message", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "gpt-4o",
        system: "You are a helpful assistant.",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 0,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      expect(openAIPayload.messages[0].role).toBe("system")
      expect(openAIPayload.messages[0].content).toBe("You are a helpful assistant.")
    })

    it("should translate model name claude-sonnet-4-* to claude-sonnet-4", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 0,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      expect(openAIPayload.model).toBe("claude-sonnet-4")
    })

    it("should translate model name claude-opus-* to claude-opus-4", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "claude-opus-4-20250514",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 0,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      expect(openAIPayload.model).toBe("claude-opus-4")
    })

    it("should pass through temperature, top_p, max_tokens", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      expect(openAIPayload.temperature).toBe(0.7)
      expect(openAIPayload.top_p).toBe(0.9)
      expect(openAIPayload.max_tokens).toBe(150)
    })

    it("should translate user_id metadata to user field", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 0,
        metadata: { user_id: "user-123" },
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      expect(openAIPayload.user).toBe("user-123")
    })

    it("should translate Anthropic tools to OpenAI tools format", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 0,
        tools: [
          {
            name: "getWeather",
            description: "Gets weather info",
            input_schema: { location: { type: "string" } },
          },
        ],
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      expect(openAIPayload.tools).toHaveLength(1)
      expect(openAIPayload.tools?.[0].type).toBe("function")
      expect(openAIPayload.tools?.[0].function.name).toBe("getWeather")
      expect(openAIPayload.tools?.[0].function.description).toBe("Gets weather info")
      expect(openAIPayload.tools?.[0].function.parameters).toEqual({ location: { type: "string" } })
    })

    it("should handle assistant message with text content", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "gpt-4o",
        messages: [
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello! How can I help?" },
        ],
        max_tokens: 0,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      const assistantMsg = openAIPayload.messages.find((m: any) => m.role === "assistant")
      expect(assistantMsg?.content).toBe("Hello! How can I help?")
    })

    it("should handle assistant message with tool_use blocks", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "gpt-4o",
        messages: [
          { role: "user", content: "What's the weather?" },
          {
            role: "assistant",
            content: [
              { type: "tool_use", id: "tool_123", name: "get_weather", input: { location: "NYC" } },
            ],
          },
        ],
        max_tokens: 0,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      const assistantMsg = openAIPayload.messages.find((m: any) => m.role === "assistant")
      expect(assistantMsg?.tool_calls).toHaveLength(1)
      expect(assistantMsg?.tool_calls?.[0].id).toBe("tool_123")
      expect(assistantMsg?.tool_calls?.[0].function.name).toBe("get_weather")
      expect(assistantMsg?.tool_calls?.[0].function.arguments).toBe('{"location":"NYC"}')
    })

    it("should handle thinking blocks in assistant message", () => {
      const anthropicPayload: AnthropicMessagesPayload = {
        model: "claude-3-5-sonnet-20241022",
        messages: [
          { role: "user", content: "What is 2+2?" },
          {
            role: "assistant",
            content: [
              { type: "thinking", thinking: "Let me think..." },
              { type: "text", text: "2+2 equals 4." },
            ],
          },
        ],
        max_tokens: 100,
      }

      const openAIPayload = translateToOpenAI(anthropicPayload as any)

      const assistantMsg = openAIPayload.messages.find((m: any) => m.role === "assistant")
      expect(assistantMsg?.content).toContain("Let me think...")
      expect(assistantMsg?.content).toContain("2+2 equals 4.")
    })
  })
})