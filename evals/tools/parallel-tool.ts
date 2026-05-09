import { EvalParams } from "../../source/evals.ts";
import * as assert from "../../source/asserts.ts";

export function test({ chatCompletionMessage: { tool_calls } }: EvalParams) {
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 2);
}

export const json = {
  "messages": [
    {"role": "user", "content": "What's the weather in Paris and London? Respond with both tool calls in a single request."}
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
