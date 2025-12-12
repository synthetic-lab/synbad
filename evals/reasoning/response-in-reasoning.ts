import * as assert from "../../source/asserts.ts";
import { ChatResponse, getReasoning } from "../../source/chat-completion.ts";

export function test(response: ChatResponse) {
  const reasoning = getReasoning(response.choices[0].message);
  assert.isNotNullish(reasoning);
  const content = response.choices[0].message.content;
  assert.or(
    () => assert.isNotNullish(content),
    () => assert.isNotEmptyArray(response.choices[0].message.tool_calls),
  );
}

export const json = {
  "messages": [
    {
      "role": "system",
      "content": "When I ask you to add a feature or resolve a problem: ALWAYS start the project explorer sub-agent to build complete understanding"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Hello"
        }
      ]
    }
  ],
  "temperature": 1,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "task",
        "description": "Launch a new agent to handle complex, multi-step tasks autonomously.\n\nAvailable agent types and the tools they have access to:\n- general: General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.\n- explore: Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. \"src/components/**/*.tsx\"), search code for keywords (eg. \"API endpoints\"), or answer questions about the codebase (eg. \"how do API endpoints work?\"). When calling this agent, specify the desired thoroughness level: \"quick\" for basic searches, \"medium\" for moderate exploration, or \"very thorough\" for comprehensive analysis across multiple locations and naming conventions.\n- code-reviewer: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.\n\nWhen using the Task tool, you must specify a subagent_type parameter to select which agent type to use.\n\nWhen to use the Task tool:\n- When you are instructed to execute custom slash commands. Use the Task tool with the slash command invocation as the entire prompt. The slash command can take arguments. For example: Task(description=\"Check the file\", prompt=\"/check-file path/to/file.py\")\n\nWhen NOT to use the Task tool:\n- If you want to read a specific file path, use the Read or Glob tool instead of the Task tool, to find the match more quickly\n- If you are searching for a specific class definition like \"class Foo\", use the Glob tool instead, to find the match more quickly\n- If you are searching for code within a specific file or set of 2-3 files, use the Read tool instead of the Task tool, to find the match more quickly\n- Other tasks that are not related to the agent descriptions above\n\n\nUsage notes:\n1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses\n2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.\n3. Each agent invocation is stateless unless you provide a session_id. Your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.\n4. The agent's outputs should generally be trusted\n5. Clearly tell the agent whether you expect it to write code or just to do research (search, file reads, web fetches, etc.), since it is not aware of the user's intent\n6. If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first. Use your judgement.\n\n",
        "parameters": {
          "type": "object",
          "properties": {
            "description": {
              "description": "A short (3-5 words) description of the task",
              "type": "string"
            },
            "prompt": {
              "description": "The task for the agent to perform",
              "type": "string"
            },
            "subagent_type": {
              "description": "The type of specialized agent to use for this task",
              "type": "string"
            },
            "session_id": {
              "description": "Existing Task session to continue",
              "type": "string"
            }
          },
          "required": [
            "description",
            "prompt",
            "subagent_type"
          ]
        }
      }
    },
  ],
  "tool_choice": "auto"
}
