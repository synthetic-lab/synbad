import { ChatMessage } from "../../source/chat-completion.ts";
import * as assert from "../../source/asserts.ts";

export function test({ content, tool_calls }: ChatMessage) {
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 1);
  assert.strictEqual(tool_calls[0].type, "function");
  assert.strictEqual(tool_calls[0].function.name, "get-weather__v1");
  const args = JSON.parse(tool_calls[0].function.arguments);
  assert.match(args.location.toLowerCase(), /paris/);
  // Assert the tool call didn't leak into the content
  assert.doesNotMatch(content || "", /get_weather/);
}

export const json = {
  "messages": [
    {"role": "user", "content": "What's the weather in Paris?"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get-weather__v1",
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
  "tool_choice": "auto",
}
