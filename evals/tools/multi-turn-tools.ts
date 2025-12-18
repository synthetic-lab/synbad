import { ChatMessage } from "../../source/chat-completion.ts";
import * as assert from "../../source/asserts.ts";

export function test({ tool_calls }: ChatMessage) {
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 1);
  assert.strictEqual(tool_calls[0].type, "function");
  assert.strictEqual(tool_calls[0].function.name, "get_weather");
  const args = JSON.parse(tool_calls[0].function.arguments);
  assert.match(args.location.toLowerCase(), /las vegas/);
}

export const json = {
  "messages": [
    {
      role: "user",
      content: "What's the weather in Paris?"
    },
    {
      role: "assistant",
      tool_calls: [
        {
          id: "gw1",
          type: "function",
          function: {
            name: "get_weather",
            arguments: JSON.stringify({
              location: "Paris, France",
            }),
          },
        },
      ],
    },
    {
      role: "tool",
      tool_call_id: "gw1",
      content: "The weather in Paris is 24 degrees Celsius",
    },
    {
      role: "assistant",
      content: "I've looked up the weather in Paris, and it's a comfy 24 degrees Celsius today.",
    },
    {
      role: "user",
      content: "I meant Paris, Texas",
    },
    {
      role: "assistant",
      tool_calls: [
        {
          id: "gw2",
          type: "function",
          function: {
            name: "get_weather",
            arguments: JSON.stringify({
              location: "Paris, Texas",
            }),
          },
        },
      ],
    },
    {
      role: "tool",
      tool_call_id: "gw2",
      content: "The weather in Paris, Texas is 34 degrees Celsius",
    },
    {
      role: "assistant",
      content: "I've looked up the weather in Paris, Texas and it's a scorching 24 degrees Celsius today.",
    },
    {
      role: "user",
      content: "How about Las Vegas",
    },
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "parallel_tool_calls": true,
  "tool_choice": "auto",
}
