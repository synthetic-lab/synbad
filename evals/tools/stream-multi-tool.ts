import { EvalTestParams } from "../../source/evals.ts";
import * as assert from "../../source/asserts.ts";
import { ChatCompletionCreateParams } from "../../source/chat-completion.ts";

export function test({ chatCompletionMessage: message }: EvalTestParams) {
  const { tool_calls } = message;
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls[0].type, "function");
}

export const json = {
  "messages": [
    {
      "role": "user",
      "content": "what does this repo do?"
    },
    {
      "role": "assistant",
      "content": "",
      "tool_calls": [
        {
          "id": " functions.git_status:0",
          "type": "function",
          "function": {
            "name": "git_status",
            "arguments": "{}"
          },
          "index": 0
        },
        {
          "id": " functions.glob_search:1",
          "type": "function",
          "function": {
            "name": "glob_search",
            "arguments": "{\"pattern\":\"README*\"}"
          },
          "index": 0
        },
      ]
    },
    {
      "role": "tool",
      "content": "No git content has changed\n",
      "tool_call_id": " functions.git_status:0"
    },
    {
      "role": "tool",
      "content": "/Users/user/git/unnamed2/README.md",
      "tool_call_id": " functions.glob_search:1"
    },
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "glob_search",
        "description": "Find files by name pattern using glob syntax.",
        "parameters": {
          "properties": {
            "path": {
              "description": "Base directory to search",
              "type": "string"
            },
            "pattern": {
              "description": "Glob pattern (e.g., **/*.rs)",
              "type": "string"
            }
          },
          "required": [
            "pattern"
          ],
          "type": "object"
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "git_status",
        "description": "Get the current git repository status.",
        "parameters": {
          "properties": {},
          "required": [],
          "type": "object"
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "grep_search",
        "description": "Search file contents using pattern matching.",
        "parameters": {
          "properties": {
            "case_sensitive": {
              "default": true,
              "type": "boolean"
            },
            "path": {
              "description": "Directory or file to search",
              "type": "string"
            },
            "pattern": {
              "description": "Search pattern (regex)",
              "type": "string"
            }
          },
          "required": [
            "pattern"
          ],
          "type": "object"
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "file_read",
        "description": "Read file contents",
        "parameters": {
          "properties": {
            "path": {
              "description": "Path to the file",
              "type": "string"
            },
          },
          "required": [
            "path"
          ],
          "type": "object"
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Execute a bash command. Use ONLY when no specialized tool exists.",
        "parameters": {
          "properties": {
            "command": {
              "description": "Command to execute",
              "type": "string"
            },
            "timeout_ms": {
              "description": "Timeout in milliseconds",
              "type": "integer"
            },
            "working_dir": {
              "description": "Working directory",
              "type": "string"
            }
          },
          "required": [
            "command"
          ],
          "type": "object"
        }
      }
    },
  ],
}

