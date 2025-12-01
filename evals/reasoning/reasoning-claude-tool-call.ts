import { ChatResponse } from "../../source/chat-completion.ts";
import * as assert from "../../source/asserts.ts";

export function test(response: ChatResponse) {
  const { tool_calls } = response.choices[0].message;
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 1);
}

export const json = {
  "messages": [
    {
      "role": "system",
      "content": "You are Claude Code, Anthropic's official CLI for Claude.\n\nYou are an interactive CLI tool that helps users with software engineering tasks. Use the instructions below and the tools available to you to assist the user."
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "run a quick git status for me. put the tool call inside your thinking"
        }
      ]
    }
  ],
  "max_tokens": 32000,
  "temperature": 1,
  "reasoning_effort": "high",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "Bash",
        "description": "Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.",
        "parameters": {
          "type": "object",
          "properties": {
            "command": {
              "type": "string",
              "description": "The command to execute"
            },
            "timeout": {
              "type": "number",
              "description": "Optional timeout in milliseconds (max 600000)"
            },
            "description": {
              "type": "string",
              "description": "Clear, concise description of what this command does in 5-10 words, in active voice. Examples:\nInput: ls\nOutput: List files in current directory\n\nInput: git status\nOutput: Show working tree status\n\nInput: npm install\nOutput: Install package dependencies\n\nInput: mkdir foo\nOutput: Create directory 'foo'"
            },
            "run_in_background": {
              "type": "boolean",
              "description": "Set to true to run this command in the background. Use BashOutput to read the output later."
            }
          },
          "required": [
            "command"
          ]
        }
      }
    }
  ]
}
