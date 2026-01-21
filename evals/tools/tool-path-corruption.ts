import { ChatMessage } from "../../source/chat-completion.ts";
import * as assert from "../../source/asserts.ts";

const PATH = "/development/evals/reasoning/Scratch/reasoning-claude-tool-call.ts";

export function test({ tool_calls }: ChatMessage) {
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 1);
  assert.strictEqual(tool_calls[0].type, "function");
  assert.strictEqual(tool_calls[0].function.name, "read");

  const args = JSON.parse(tool_calls[0].function.arguments);
  assert.stringContains(args.filePath, PATH);
}

export const json = {
  "messages": [
    {
      "role": "user",
      "content": "Read and summarize the file /development/evals/reasoning/Scratch/reasoning-claude-tool-call.ts"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "The read tool",
        "parameters": {
          "type": "object",
          "required": [
            "filePath"
          ],
          "properties": {
            "filePath": {
              "description": "Path to file to read",
              "type": "string"
            }
          }
        },
        "strict": true
      }
    },
  ],
};