import { ChatResponse } from "../../source/chat-completion.ts";
import * as assert from "../../source/asserts.ts";

export function test(response: ChatResponse) {
  const { tool_calls } = response.choices[0].message;
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 1);
  assert.strictEqual(tool_calls[0].type, "function");
  assert.strictEqual(tool_calls[0].function.name, "get_weather");
  const args = JSON.parse(tool_calls[0].function.arguments);
  assert.match(args.location.toLowerCase(), /paris/);
}

export const json = {
  "messages": [
    {"role": "user", "content": "What's the weather in Paris?"}
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
