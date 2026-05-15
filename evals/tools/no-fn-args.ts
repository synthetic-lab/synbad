import { EvalTestParams } from "../../source/evals.ts";
import * as assert from "../../source/asserts.ts";
import { ChatCompletionCreateParams } from "../../source/chat-completion.ts";

export function test({ chatCompletionMessage: { tool_calls } }: EvalTestParams) {
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 1);
  assert.strictEqual(tool_calls[0].type, "function");
}

export const json: ChatCompletionCreateParams = {
  "messages": [
    {
      "role": "user",
      "content": "read the todos",
    },
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_todo_items",
        "description": "Retrieves the current list of todo items, including their names and completion statuses.",
        "parameters": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {},
          "additionalProperties": false
        }
      }
    },
  ],
  "tool_choice": "auto",
}
